// Kịch bản demo đầu-cuối trên mạng Hardhat cục bộ: Mint -> Pool -> Giao dịch -> Retire,
// kèm thử 3 tình huống tính toán kép. In ra gas từng bước (dùng cho Chương 5).
const { ethers } = require("hardhat");

const log = (step, rc) => console.log(`${step.padEnd(48)} gas = ${rc ? rc.gasUsed : "-"}`);

async function expectRevert(label, p) {
  try {
    await p;
    console.log(`  [SAI] ${label}: giao dịch không bị chặn`);
  } catch (e) {
    const m = e.shortMessage || e.message;
    console.log(`  [CHẶN] ${label}: ${m.split("\n")[0]}`);
  }
}

async function main() {
  const [admin, vvb, projectOwner, buyer] = await ethers.getSigners();
  const nft = await ethers.deployContract("CarbonCreditNFT", [admin.address]);
  const pool = await ethers.deployContract("CarbonPool", [await nft.getAddress()]);
  await nft.grantRole(await nft.VERIFIER_ROLE(), vvb.address);
  await nft.grantRole(await nft.RETIREMENT_AGENT_ROLE(), await pool.getAddress());

  const doc = ethers.keccak256(ethers.toUtf8Bytes("bao-cao-tham-dinh-VN-REDD-0001-2025.pdf"));
  console.log("== 1. VVB phát hành lô 1000 tCO2e (sê-ri 1..1000) cho chủ dự án");
  let rc = await (await nft.connect(vvb).mintBatch(projectOwner.address, "VN-REDD-0001", 2025, 1, 1000, doc, "ipfs://demo")).wait();
  log("mintBatch", rc);

  console.log("== 2. Chủ dự án nạp lô vào pool, nhận 1000 PCC");
  rc = await (await nft.connect(projectOwner)["safeTransferFrom(address,address,uint256)"](projectOwner.address, await pool.getAddress(), 1)).wait();
  log("safeTransferFrom -> pool (deposit)", rc);

  console.log("== 3. Bán 300 PCC cho doanh nghiệp mua");
  rc = await (await pool.connect(projectOwner).transfer(buyer.address, 300)).wait();
  log("transfer 300 PCC", rc);

  console.log("== 4. Doanh nghiệp hủy 300 tCO2e để bù trừ phát thải");
  rc = await (await pool.connect(buyer).retire(1, 300, "Cong ty TNHH B", "Bu tru phat thai nam 2025")).wait();
  log("pool.retire 300", rc);
  const c = await nft.getCertificate(0);
  console.log(`  Chứng nhận #0: sê-ri ${c.serialFrom}..${c.serialTo}, người hủy ${c.retiree}, thụ hưởng "${c.beneficiary}"`);

  console.log("== 5. Các tình huống tính toán kép");
  await expectRevert("Phát hành kép (sê-ri chồng lấn)",
    nft.connect(vvb).mintBatch(projectOwner.address, "VN-REDD-0001", 2025, 900, 100, ethers.ZeroHash, ""));
  await expectRevert("Phát hành kép (dùng lại báo cáo thẩm định)",
    nft.connect(vvb).mintBatch(projectOwner.address, "VN-OTHER", 2025, 1, 100, doc, ""));
  await expectRevert("Sử dụng kép (hủy lại bằng token đã đốt)",
    pool.connect(buyer).retire(1, 1, "Cong ty TNHH B", ""));
  await expectRevert("Bán kép (chủ cũ bán NFT đang khóa trong pool)",
    nft.connect(projectOwner).transferFrom(await pool.getAddress(), buyer.address, 1));

  console.log(`== Kết thúc: tổng cung PCC = ${await pool.totalSupply()}, còn lại trong lô #1 = ${await nft.remainingOf(1)}`);
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
