// Triển khai CarbonCreditNFT + CarbonPool, cấp quyền cho pool và (tùy chọn) cho ví VVB.
// Dùng: npx hardhat run scripts/deploy.js --network <localhost|sepolia>
// Biến môi trường tùy chọn: VERIFIER_ADDRESS (ví VVB được cấp VERIFIER_ROLE).
const fs = require("fs");
const path = require("path");
const { ethers, network } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log(`Mạng: ${network.name} | Ví deploy: ${deployer.address}`);
  // Bộ đồng bộ sự kiện của backend bắt đầu quét từ khối này.
  const startBlock = (await ethers.provider.getBlockNumber()) + 1;

  const nft = await ethers.deployContract("CarbonCreditNFT", [deployer.address]);
  await nft.waitForDeployment();
  const pool = await ethers.deployContract("CarbonPool", [await nft.getAddress()]);
  await pool.waitForDeployment();

  await (await nft.grantRole(await nft.RETIREMENT_AGENT_ROLE(), await pool.getAddress())).wait();
  const verifier = process.env.VERIFIER_ADDRESS || deployer.address;
  await (await nft.grantRole(await nft.VERIFIER_ROLE(), verifier)).wait();

  const out = {
    network: network.name,
    chainId: Number((await ethers.provider.getNetwork()).chainId),
    deployer: deployer.address,
    verifier,
    CarbonCreditNFT: await nft.getAddress(),
    CarbonPool: await pool.getAddress(),
    deployedAtBlock: startBlock,
  };
  const dir = path.join(__dirname, "..", "deployments");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, `${network.name}.json`), JSON.stringify(out, null, 2));
  console.log(out);

  if (network.name === "sepolia") {
    console.log("Verify trên Etherscan:");
    console.log(`  npx hardhat verify --network sepolia ${out.CarbonCreditNFT} ${deployer.address}`);
    console.log(`  npx hardhat verify --network sepolia ${out.CarbonPool} ${out.CarbonCreditNFT}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
