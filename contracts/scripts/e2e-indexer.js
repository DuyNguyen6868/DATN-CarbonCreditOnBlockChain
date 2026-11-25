// Kiểm thử tích hợp on-chain -> off-chain: deploy hợp đồng trên mạng Hardhat, chạy luồng
// Mint -> Pool -> Retire, rồi cho bộ đồng bộ của backend đọc sự kiện thật vào CSDL (pg-mem).
// Dùng: npx hardhat run scripts/e2e-indexer.js   (cần `npm install` trong ../backend trước)
const path = require("path");
const assert = require("assert/strict");
const { ethers } = require("hardhat");

const backend = path.join(__dirname, "..", "..", "backend");
const { newDb } = require(path.join(backend, "node_modules", "pg-mem"));
const { createDb } = require(path.join(backend, "src", "db"));
const { createIndexer } = require(path.join(backend, "src", "indexer"));

async function main() {
  const [admin, vvb, owner, buyer] = await ethers.getSigners();
  const startBlock = (await ethers.provider.getBlockNumber()) + 1;
  const nft = await ethers.deployContract("CarbonCreditNFT", [admin.address]);
  const pool = await ethers.deployContract("CarbonPool", [await nft.getAddress()]);
  await nft.grantRole(await nft.VERIFIER_ROLE(), vvb.address);
  await nft.grantRole(await nft.RETIREMENT_AGENT_ROLE(), await pool.getAddress());

  // CSDL off-chain đã có dự án (chủ dự án đăng ký qua API trước khi xin cấp)
  const { Pool } = newDb().adapters.createPg();
  const db = createDb(new Pool());
  await db.migrate();
  await db.query("INSERT INTO app_users (wallet_address, role) VALUES ($1, 'PROJECT_OWNER')", [
    owner.address.toLowerCase(),
  ]);
  await db.query("INSERT INTO projects (project_id, project_name, owner_address) VALUES ($1, $2, $3)", [
    "VN-REDD-0001",
    "Du an thu nghiem",
    owner.address.toLowerCase(),
  ]);
  const indexer = createIndexer({
    db,
    nft,
    poolAddress: await pool.getAddress(),
    startBlock,
    chunkSize: 5,
    logger: { warn: console.warn, log() {}, error: console.error },
  });

  const doc = ethers.keccak256(ethers.toUtf8Bytes("report"));
  await nft.connect(vvb).mintBatch(owner.address, "VN-REDD-0001", 2025, 1, 1000, doc, "ipfs://x");
  await nft.connect(owner)["safeTransferFrom(address,address,uint256)"](owner.address, await pool.getAddress(), 1);
  await pool.connect(owner).transfer(buyer.address, 400);
  await pool.connect(buyer).retire(1, 400, "Cong ty B", "Bu tru 2025");

  const n1 = await indexer.syncOnce();
  const n2 = await indexer.syncOnce(); // chạy lại không ghi thêm gì
  const units = await db.many("SELECT * FROM units ORDER BY unit_block_start");
  const cert = await db.one("SELECT * FROM retirements WHERE certificate_id = 0");

  assert.equal(n1, 4, "CreditMinted + Transfer(mint) + Transfer(vào pool) + CreditRetired");
  assert.equal(n2, 0);
  assert.equal(units.length, 2);
  assert.deepEqual(
    units.map((u) => [u.unit_status, Number(u.unit_block_start), Number(u.unit_block_end), u.in_pool]),
    [
      ["Retired", 1, 400, false],
      ["Held", 401, 1000, true],
    ]
  );
  assert.equal(cert.retiree_address, buyer.address.toLowerCase());
  assert.equal(Number(cert.amount), 400);

  // Bất biến chéo: phần còn lại on-chain == khối Held off-chain
  assert.equal(Number(await nft.remainingOf(1)), Number(units[1].unit_count));
  console.log("E2E indexer: OK", { applied: n1, units: units.length, certificate: Number(cert.certificate_id) });
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
