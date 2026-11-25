const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");
const { ethers } = require("ethers");
const config = require("./config");
const { createDb } = require("./db");
const { createApp } = require("./app");
const { createIndexer } = require("./indexer");

async function main() {
  // DATABASE_URL=memory: dùng PostgreSQL giả lập trong bộ nhớ (pg-mem) để demo nhanh, mất dữ liệu khi tắt.
  let pool;
  if (config.databaseUrl === "memory") {
    pool = new (require("pg-mem").newDb().adapters.createPg().Pool)();
    console.warn("Đang dùng CSDL trong bộ nhớ (pg-mem), dữ liệu sẽ mất khi tắt server.");
  } else {
    pool = new Pool({ connectionString: config.databaseUrl });
  }
  const db = createDb(pool);
  await db.migrate();

  const app = createApp({ db, config });
  app.listen(config.port, () => console.log(`API chạy tại http://localhost:${config.port}/api`));

  // contracts.json do `npm run export` trong thư mục contracts sinh ra sau khi deploy.
  const contractsFile = path.join(__dirname, "contracts.json");
  if (!fs.existsSync(contractsFile)) {
    console.warn("Chưa có src/contracts.json: bộ đồng bộ sự kiện không chạy.");
    return;
  }
  const { deployment, abi } = JSON.parse(fs.readFileSync(contractsFile, "utf8"));
  if (!deployment) {
    console.warn("contracts.json chưa có địa chỉ hợp đồng (chưa deploy): bộ đồng bộ sự kiện không chạy.");
    return;
  }
  const provider = new ethers.JsonRpcProvider(config.rpcUrl);
  const nft = new ethers.Contract(deployment.CarbonCreditNFT, abi.CarbonCreditNFT, provider);
  const indexer = createIndexer({
    db,
    nft,
    poolAddress: deployment.CarbonPool,
    startBlock: deployment.deployedAtBlock || 0,
  });
  indexer.start(config.indexerIntervalMs);
  console.log(`Đồng bộ sự kiện từ ${deployment.CarbonCreditNFT} qua ${config.rpcUrl}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
