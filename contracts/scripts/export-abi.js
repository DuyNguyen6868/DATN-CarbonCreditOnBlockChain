// Xuất ABI + địa chỉ hợp đồng sang backend và frontend sau khi compile/deploy.
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const net = process.argv[2] || "localhost";
const deploymentFile = path.join(root, "deployments", `${net}.json`);
const deployment = fs.existsSync(deploymentFile) ? JSON.parse(fs.readFileSync(deploymentFile)) : null;

const abi = (name) =>
  JSON.parse(fs.readFileSync(path.join(root, "artifacts", "contracts", `${name}.sol`, `${name}.json`))).abi;

const out = { network: net, deployment, abi: { CarbonCreditNFT: abi("CarbonCreditNFT"), CarbonPool: abi("CarbonPool") } };
for (const target of ["../backend/src/contracts.json", "../frontend/lib/contracts.json"]) {
  const file = path.join(root, target);
  if (!fs.existsSync(path.dirname(file))) continue;
  fs.writeFileSync(file, JSON.stringify(out, null, 2));
  console.log("Đã ghi", path.relative(root, file));
}
