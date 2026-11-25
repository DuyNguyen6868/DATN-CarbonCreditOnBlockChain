const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

// Mã test case (TC-xx) dùng lại ở bảng kiểm thử Chương 5.
const PROJECT = "VN-REDD-0001";
const VINTAGE = 2025;
const docHash = (s) => ethers.keccak256(ethers.toUtf8Bytes(s));
const URI = "ipfs://bafy-demo/metadata.json";

async function deployFixture() {
  const [admin, verifier, owner, buyer, other] = await ethers.getSigners();
  const NFT = await ethers.getContractFactory("CarbonCreditNFT");
  const nft = await NFT.deploy(admin.address);
  const Pool = await ethers.getContractFactory("CarbonPool");
  const pool = await Pool.deploy(await nft.getAddress());

  await nft.connect(admin).grantRole(await nft.VERIFIER_ROLE(), verifier.address);
  await nft.connect(admin).grantRole(await nft.RETIREMENT_AGENT_ROLE(), await pool.getAddress());
  return { nft, pool, admin, verifier, owner, buyer, other };
}

async function mintedFixture() {
  const ctx = await deployFixture();
  // Lô #1: sê-ri 1..1000 của dự án VN-REDD-0001, vintage 2025
  await ctx.nft
    .connect(ctx.verifier)
    .mintBatch(ctx.owner.address, PROJECT, VINTAGE, 1, 1000, docHash("report-1"), URI);
  return ctx;
}

describe("CarbonCreditNFT – phát hành (Minting)", function () {
  it("TC-01: VVB mint lô tín chỉ, lưu đúng thông tin và phát sự kiện CreditMinted", async function () {
    const { nft, verifier, owner } = await loadFixture(deployFixture);
    await expect(
      nft.connect(verifier).mintBatch(owner.address, PROJECT, VINTAGE, 1, 1000, docHash("report-1"), URI)
    )
      .to.emit(nft, "CreditMinted")
      .withArgs(1, owner.address, verifier.address, PROJECT, VINTAGE, 1, 1000, 1000, docHash("report-1"));

    expect(await nft.ownerOf(1)).to.equal(owner.address);
    expect(await nft.tokenURI(1)).to.equal(URI);
    const b = await nft.getBatch(1);
    expect(b.projectId).to.equal(PROJECT);
    expect(b.quantity).to.equal(1000n);
    expect(b.retired).to.equal(0n);
    expect(await nft.remainingOf(1)).to.equal(1000n);
    expect(await nft.totalBatches()).to.equal(1n);
  });

  it("TC-02: tài khoản không có VERIFIER_ROLE không mint được", async function () {
    const { nft, owner, other } = await loadFixture(deployFixture);
    await expect(
      nft.connect(other).mintBatch(owner.address, PROJECT, VINTAGE, 1, 10, docHash("x"), URI)
    ).to.be.revertedWithCustomError(nft, "AccessControlUnauthorizedAccount");
  });

  it("TC-03 (phát hành kép): chặn dãy sê-ri chồng lấn trong cùng dự án và vintage", async function () {
    const { nft, verifier, owner } = await loadFixture(mintedFixture);
    await expect(
      nft.connect(verifier).mintBatch(owner.address, PROJECT, VINTAGE, 500, 100, docHash("report-2"), URI)
    )
      .to.be.revertedWithCustomError(nft, "SerialOverlap")
      .withArgs(500, 1001);
  });

  it("TC-04: cho phép lô kế tiếp không chồng lấn, và cùng dãy sê-ri ở vintage khác", async function () {
    const { nft, verifier, owner } = await loadFixture(mintedFixture);
    await nft.connect(verifier).mintBatch(owner.address, PROJECT, VINTAGE, 1001, 500, docHash("report-2"), URI);
    await nft.connect(verifier).mintBatch(owner.address, PROJECT, 2026, 1, 500, docHash("report-3"), URI);
    expect(await nft.totalBatches()).to.equal(3n);
    expect(await nft.nextAvailableSerial(await nft.seriesKey(PROJECT, VINTAGE))).to.equal(1501n);
  });

  it("TC-05 (phát hành kép): chặn dùng lại cùng một báo cáo thẩm định", async function () {
    const { nft, verifier, owner } = await loadFixture(mintedFixture);
    await expect(
      nft.connect(verifier).mintBatch(owner.address, "VN-OTHER", VINTAGE, 1, 100, docHash("report-1"), URI)
    ).to.be.revertedWithCustomError(nft, "DocumentAlreadyUsed");
  });

  it("TC-06: từ chối số lượng 0 và sê-ri 0", async function () {
    const { nft, verifier, owner } = await loadFixture(deployFixture);
    await expect(
      nft.connect(verifier).mintBatch(owner.address, PROJECT, VINTAGE, 1, 0, docHash("a"), URI)
    ).to.be.revertedWithCustomError(nft, "InvalidQuantity");
    await expect(
      nft.connect(verifier).mintBatch(owner.address, PROJECT, VINTAGE, 0, 10, docHash("b"), URI)
    ).to.be.revertedWithCustomError(nft, "SerialOverlap");
  });
});

describe("CarbonCreditNFT – chuyển nhượng và hủy (Retirement)", function () {
  it("TC-07: chủ sở hữu chuyển nhượng NFT lô tín chỉ", async function () {
    const { nft, owner, buyer } = await loadFixture(mintedFixture);
    await nft.connect(owner).transferFrom(owner.address, buyer.address, 1);
    expect(await nft.ownerOf(1)).to.equal(buyer.address);
  });

  it("TC-08: hủy một phần lô, cấp chứng nhận với dãy sê-ri đúng", async function () {
    const { nft, owner } = await loadFixture(mintedFixture);
    await expect(nft.connect(owner).retire(1, 300, "Cong ty A", "Bu tru phat thai 2025"))
      .to.emit(nft, "CreditRetired")
      .withArgs(0, 1, owner.address, 300, 1, 300, "Cong ty A", "Bu tru phat thai 2025");

    // Lần hủy thứ hai tiếp nối dãy sê-ri, không trùng phần đã hủy
    await nft.connect(owner).retire(1, 200, "Cong ty B", "");
    const c = await nft.getCertificate(1);
    expect(c.serialFrom).to.equal(301n);
    expect(c.serialTo).to.equal(500n);
    expect(await nft.remainingOf(1)).to.equal(500n);
    expect(await nft.totalCertificates()).to.equal(2n);
    expect(await nft.ownerOf(1)).to.equal(owner.address);
  });

  it("TC-09 (sử dụng kép): hủy hết lô thì NFT bị đốt, không chuyển nhượng hay hủy lại được", async function () {
    const { nft, owner, buyer } = await loadFixture(mintedFixture);
    await nft.connect(owner).retire(1, 1000, "Cong ty A", "");
    await expect(nft.ownerOf(1)).to.be.revertedWithCustomError(nft, "ERC721NonexistentToken");
    await expect(
      nft.connect(owner).transferFrom(owner.address, buyer.address, 1)
    ).to.be.revertedWithCustomError(nft, "ERC721NonexistentToken");
    await expect(nft.connect(owner).retire(1, 1, "Cong ty A", "")).to.be.revertedWithCustomError(
      nft,
      "ERC721NonexistentToken"
    );
    // Thông tin lô vẫn tra cứu được để kiểm chứng
    expect((await nft.getBatch(1)).retired).to.equal(1000n);
  });

  it("TC-10: không hủy quá số còn lại, không hủy 0, bắt buộc có người thụ hưởng", async function () {
    const { nft, owner } = await loadFixture(mintedFixture);
    await expect(nft.connect(owner).retire(1, 1001, "A", ""))
      .to.be.revertedWithCustomError(nft, "ExceedsRemaining")
      .withArgs(1001, 1000);
    await expect(nft.connect(owner).retire(1, 0, "A", "")).to.be.revertedWithCustomError(nft, "InvalidQuantity");
    await expect(nft.connect(owner).retire(1, 1, "", "")).to.be.revertedWithCustomError(nft, "EmptyBeneficiary");
  });

  it("TC-11: người không sở hữu không hủy được; người được approve thì hủy được", async function () {
    const { nft, owner, other } = await loadFixture(mintedFixture);
    await expect(nft.connect(other).retire(1, 1, "A", "")).to.be.revertedWithCustomError(
      nft,
      "NotOwnerNorApproved"
    );
    await nft.connect(owner).approve(other.address, 1);
    await nft.connect(other).retire(1, 1, "A", "");
    expect((await nft.getCertificate(0)).retiree).to.equal(other.address);
  });

  it("TC-12: retireFor chỉ dành cho RETIREMENT_AGENT_ROLE đang giữ NFT", async function () {
    const { nft, admin, owner, other } = await loadFixture(mintedFixture);
    await expect(
      nft.connect(other).retireFor(other.address, 1, 1, "A", "")
    ).to.be.revertedWithCustomError(nft, "AccessControlUnauthorizedAccount");
    await nft.connect(admin).grantRole(await nft.RETIREMENT_AGENT_ROLE(), other.address);
    await expect(
      nft.connect(other).retireFor(other.address, 1, 1, "A", "")
    ).to.be.revertedWithCustomError(nft, "NotOwnerNorApproved");
    expect(await nft.ownerOf(1)).to.equal(owner.address);
  });

  it("TC-13: getBatch của lô không tồn tại bị từ chối", async function () {
    const { nft } = await loadFixture(deployFixture);
    await expect(nft.getBatch(99)).to.be.revertedWithCustomError(nft, "NonexistentBatch");
  });

  it("TC-14: cơ quan quản lý tạm dừng thì chặn mint, chuyển nhượng và hủy", async function () {
    const { nft, admin, verifier, owner, buyer, other } = await loadFixture(mintedFixture);
    await expect(nft.connect(other).pause()).to.be.revertedWithCustomError(
      nft,
      "AccessControlUnauthorizedAccount"
    );
    await nft.connect(admin).pause();
    await expect(
      nft.connect(verifier).mintBatch(owner.address, PROJECT, VINTAGE, 2000, 1, docHash("p"), URI)
    ).to.be.revertedWithCustomError(nft, "EnforcedPause");
    await expect(
      nft.connect(owner).transferFrom(owner.address, buyer.address, 1)
    ).to.be.revertedWithCustomError(nft, "EnforcedPause");
    await expect(nft.connect(owner).retire(1, 1, "A", "")).to.be.revertedWithCustomError(nft, "EnforcedPause");
    await nft.connect(admin).unpause();
    await nft.connect(owner).transferFrom(owner.address, buyer.address, 1);
    expect(await nft.ownerOf(1)).to.equal(buyer.address);
  });

  it("TC-15: hỗ trợ các interface ERC-721 và AccessControl", async function () {
    const { nft } = await loadFixture(deployFixture);
    expect(await nft.supportsInterface("0x80ac58cd")).to.equal(true); // ERC-721
    expect(await nft.supportsInterface("0x7965db0b")).to.equal(true); // IAccessControl
    expect(await nft.supportsInterface("0xffffffff")).to.equal(false);
  });
});

describe("CarbonPool – giao dịch từng phần (ERC-20)", function () {
  async function pooledFixture() {
    const ctx = await mintedFixture();
    await ctx.nft.connect(ctx.owner).approve(await ctx.pool.getAddress(), 1);
    await ctx.pool.connect(ctx.owner).deposit(1);
    return ctx;
  }

  it("TC-16: nạp NFT vào pool nhận đúng số token, NFT bị khóa trong pool", async function () {
    const { nft, pool, owner } = await loadFixture(mintedFixture);
    await nft.connect(owner).approve(await pool.getAddress(), 1);
    await expect(pool.connect(owner).deposit(1)).to.emit(pool, "Deposited").withArgs(owner.address, 1, 1000);
    expect(await pool.balanceOf(owner.address)).to.equal(1000n);
    expect(await pool.decimals()).to.equal(0n);
    expect(await nft.ownerOf(1)).to.equal(await pool.getAddress());
    expect(await pool.pooledTokenIds()).to.deep.equal([1n]);
  });

  it("TC-17: nạp bằng safeTransferFrom trực tiếp; lô đã hủy một phần chỉ nhận phần còn lại", async function () {
    const { nft, pool, owner } = await loadFixture(mintedFixture);
    await nft.connect(owner).retire(1, 400, "A", "");
    await nft
      .connect(owner)
      ["safeTransferFrom(address,address,uint256)"](owner.address, await pool.getAddress(), 1);
    expect(await pool.balanceOf(owner.address)).to.equal(600n);
  });

  it("TC-18: pool từ chối NFT không phải của hợp đồng tín chỉ", async function () {
    const { pool, other } = await loadFixture(deployFixture);
    await expect(
      pool.connect(other).onERC721Received(other.address, other.address, 1, "0x")
    ).to.be.revertedWithCustomError(pool, "UnsupportedNFT");
  });

  it("TC-19: chuyển token ERC-20 từng phần cho người mua", async function () {
    const { pool, owner, buyer } = await loadFixture(pooledFixture);
    await pool.connect(owner).transfer(buyer.address, 250);
    expect(await pool.balanceOf(buyer.address)).to.equal(250n);
    expect(await pool.balanceOf(owner.address)).to.equal(750n);
  });

  it("TC-20 (sử dụng kép): người mua hủy từ pool, chứng nhận ghi người mua và dãy sê-ri", async function () {
    const { nft, pool, owner, buyer } = await loadFixture(pooledFixture);
    await pool.connect(owner).transfer(buyer.address, 250);
    await expect(pool.connect(buyer).retire(1, 250, "Cong ty B", "Bu tru 2025"))
      .to.emit(pool, "RetiredFromPool")
      .withArgs(buyer.address, 1, 250, 0)
      .and.to.emit(nft, "CreditRetired")
      .withArgs(0, 1, buyer.address, 250, 1, 250, "Cong ty B", "Bu tru 2025");
    expect(await pool.balanceOf(buyer.address)).to.equal(0n);
    // Token đã đốt không dùng lại được
    await expect(pool.connect(buyer).retire(1, 1, "Cong ty B", "")).to.be.revertedWithCustomError(
      pool,
      "ERC20InsufficientBalance"
    );
  });

  it("TC-21: bất biến totalSupply = tổng phần còn lại của các lô trong pool", async function () {
    const { nft, pool, verifier, owner, buyer } = await loadFixture(pooledFixture);
    await nft.connect(verifier).mintBatch(owner.address, PROJECT, VINTAGE, 1001, 300, docHash("r2"), URI);
    await nft.connect(owner).approve(await pool.getAddress(), 2);
    await pool.connect(owner).deposit(2);
    await pool.connect(owner).transfer(buyer.address, 500);
    await pool.connect(buyer).retire(1, 120, "B", "");
    await pool.connect(owner).retire(2, 300, "A", ""); // hủy hết lô 2 -> NFT bị đốt, rời pool

    let sum = 0n;
    for (const id of await pool.pooledTokenIds()) sum += await nft.remainingOf(id);
    expect(await pool.totalSupply()).to.equal(sum);
    expect(await pool.pooledTokenIds()).to.deep.equal([1n]);
    expect(await pool.isPooled(2)).to.equal(false);
  });

  it("TC-22: đổi lại (redeem) lô cần đốt đủ token bằng phần còn lại", async function () {
    const { nft, pool, owner, buyer } = await loadFixture(pooledFixture);
    await pool.connect(owner).retire(1, 100, "A", "");
    await pool.connect(owner).transfer(buyer.address, 899);
    await expect(pool.connect(buyer).redeem(1)).to.be.revertedWithCustomError(pool, "ERC20InsufficientBalance");
    await pool.connect(owner).transfer(buyer.address, 1);
    await expect(pool.connect(buyer).redeem(1)).to.emit(pool, "Redeemed").withArgs(buyer.address, 1, 900);
    expect(await nft.ownerOf(1)).to.equal(buyer.address);
    expect(await pool.totalSupply()).to.equal(0n);
    expect(await pool.isPooled(1)).to.equal(false);
  });

  it("TC-23: thao tác với lô không nằm trong pool bị từ chối", async function () {
    const { pool, owner } = await loadFixture(mintedFixture);
    await expect(pool.connect(owner).redeem(1)).to.be.revertedWithCustomError(pool, "NotInPool");
    await expect(pool.connect(owner).retire(1, 1, "A", "")).to.be.revertedWithCustomError(pool, "NotInPool");
  });

  it("TC-24 (bán kép): NFT trong pool không thể bị chủ cũ bán riêng", async function () {
    const { nft, pool, owner, buyer } = await loadFixture(pooledFixture);
    await expect(
      nft.connect(owner).transferFrom(await pool.getAddress(), buyer.address, 1)
    ).to.be.revertedWithCustomError(nft, "ERC721InsufficientApproval");
    await expect(nft.connect(owner).retire(1, 1, "A", "")).to.be.revertedWithCustomError(
      nft,
      "NotOwnerNorApproved"
    );
  });

  it("TC-25: hủy từ pool quá phần còn lại của lô bị từ chối, số dư không đổi", async function () {
    const { nft, pool, verifier, owner } = await loadFixture(pooledFixture);
    await nft.connect(verifier).mintBatch(owner.address, PROJECT, VINTAGE, 1001, 50, docHash("r2"), URI);
    await nft.connect(owner).approve(await pool.getAddress(), 2);
    await pool.connect(owner).deposit(2);
    await expect(pool.connect(owner).retire(2, 51, "A", "")).to.be.revertedWithCustomError(
      nft,
      "ExceedsRemaining"
    );
    expect(await pool.balanceOf(owner.address)).to.equal(1050n);
  });

  it("TC-26: nạp lô đã hủy hết (không còn tồn tại) bị từ chối", async function () {
    const { nft, pool, owner } = await loadFixture(mintedFixture);
    await nft.connect(owner).retire(1, 1000, "A", "");
    await expect(pool.connect(owner).deposit(1)).to.be.revertedWithCustomError(nft, "ERC721NonexistentToken");
  });
});
