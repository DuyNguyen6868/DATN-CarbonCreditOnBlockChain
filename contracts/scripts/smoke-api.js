// Kiểm thử khói toàn hệ thống đang chạy: Hardhat node + backend (đã deploy và export).
// Đóng vai 4 người dùng (dùng các tài khoản Hardhat), gọi API REST và ký giao dịch như frontend:
// đăng nhập ví -> đăng ký dự án -> gửi yêu cầu -> VVB duyệt + mint -> nạp pool -> bán -> hủy
// -> chờ bộ đồng bộ -> kiểm tra dữ liệu off-chain.
// Dùng: npx hardhat run scripts/smoke-api.js --network localhost   (API_URL mặc định http://localhost:4000/api)
const assert = require("assert/strict");
const { ethers, network } = require("hardhat");
const deployment = require(`../deployments/${network.name}.json`);

const API = process.env.API_URL || "http://localhost:4000/api";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function call(path, { token, method = "GET", body, form } = {}) {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  if (body) headers["Content-Type"] = "application/json";
  const res = await fetch(`${API}${path}`, { method, headers, body: form || (body && JSON.stringify(body)) });
  const data = await res.json();
  if (!res.ok) throw new Error(`${method} ${path} -> ${res.status} ${data.error}`);
  return data;
}

async function login(signer, extra = {}) {
  const address = await signer.getAddress();
  const { message } = await call("/auth/nonce", { method: "POST", body: { address } });
  const signature = await signer.signMessage(message);
  return (await call("/auth/login", { method: "POST", body: { address, signature, ...extra } })).token;
}

async function upload(token, name, text) {
  const form = new FormData();
  form.append("file", new Blob([text]), name);
  return (await call("/documents", { token, method: "POST", form })).sha3_hash;
}

async function waitFor(check, label) {
  for (let i = 0; i < 20; i++) {
    const v = await check();
    if (v) return v;
    await sleep(1000);
  }
  throw new Error(`Hết thời gian chờ: ${label}`);
}

async function main() {
  const [admin, vvb, owner, buyer] = await ethers.getSigners();
  const nft = await ethers.getContractAt("CarbonCreditNFT", deployment.CarbonCreditNFT);
  const pool = await ethers.getContractAt("CarbonPool", deployment.CarbonPool);
  const projectCode = `VN-SMOKE-${Date.now() % 100000}`;

  console.log("1. Đăng nhập bằng ví, ADMIN cấp vai trò VERIFIER (off-chain + on-chain)");
  const adminT = await login(admin);
  const ownerT = await login(owner, { role: "PROJECT_OWNER", organization: "Cong ty Rung Xanh" });
  const buyerT = await login(buyer, { role: "BUYER", organization: "Cong ty B" });
  await login(vvb, { role: "BUYER" });
  await call(`/users/${vvb.address}/role`, { token: adminT, method: "PATCH", body: { role: "VERIFIER" } });
  if (!(await nft.hasRole(await nft.VERIFIER_ROLE(), vvb.address)))
    await (await nft.connect(admin).grantRole(await nft.VERIFIER_ROLE(), vvb.address)).wait();
  const vvbT = await login(vvb);

  console.log("2. Chủ dự án đăng ký dự án và gửi yêu cầu cấp 1000 tCO2e");
  const project = await call("/projects", {
    token: ownerT,
    method: "POST",
    body: { project_id: projectCode, project_name: "Du an kiem thu khoi", program: "VCS", methodology: "VM0007" },
  });
  const mr = await upload(ownerT, "monitoring.pdf", `giam sat ${projectCode}`);
  const req = await call("/issuance-requests", {
    token: ownerT,
    method: "POST",
    body: { project_id: project.id, vintage_year: 2025, quantity: 1000, monitoring_doc_hash: mr },
  });

  console.log("3. VVB duyệt, nhận tham số mint và ký giao dịch mintBatch");
  const vr = await upload(vvbT, "verification.pdf", `tham dinh ${projectCode}`);
  const { mint: m } = await call(`/issuance-requests/${req.id}/approve`, {
    token: vvbT,
    method: "POST",
    body: { verification_doc_hash: vr, verification_body: "VVB A" },
  });
  const rc = await (
    await nft.connect(vvb).mintBatch(m.to, m.projectId, m.vintage, m.serialFrom, m.quantity, m.documentHash, m.uri)
  ).wait();
  const tokenId = nft.interface.parseLog(rc.logs.find((l) => l.fragment?.name === "CreditMinted") || rc.logs[1]).args.tokenId;

  await waitFor(async () => (await call(`/issuance-requests/${req.id}`, { token: ownerT })).status === "MINTED", "MINTED");
  console.log(`   -> yêu cầu #${req.id} đã MINTED, lô #${tokenId}`);

  console.log("4. Nạp lô vào pool, bán 300 PCC cho doanh nghiệp, doanh nghiệp hủy 300 tCO2e");
  await (await nft.connect(owner)["safeTransferFrom(address,address,uint256)"](owner.address, deployment.CarbonPool, tokenId)).wait();
  await (await pool.connect(owner).transfer(buyer.address, 300)).wait();
  await (await pool.connect(buyer).retire(tokenId, 300, "Cong ty B", "Bu tru phat thai 2025")).wait();

  const units = await waitFor(async () => {
    const u = await call(`/units?token_id=${tokenId}`);
    return u.length === 2 ? u : null;
  }, "đồng bộ retire");
  const held = units.find((u) => u.unit_status === "Held");
  const retired = units.find((u) => u.unit_status === "Retired");
  assert.equal(held.in_pool, true);
  assert.equal(Number(held.unit_count), 700);
  assert.equal(Number(retired.unit_block_end) - Number(retired.unit_block_start) + 1, 300);
  assert.equal(Number(await nft.remainingOf(tokenId)), Number(held.unit_count));

  const lookup = await call(`/units/lookup?project_id=${projectCode}&vintage=2025&serial=${m.serialFrom}`);
  assert.equal(lookup.unit_status, "Retired");
  const dash = await call("/dashboard/me", { token: buyerT });
  assert.ok(dash.by_year.some((y) => y.retired_tco2e >= 300));

  console.log("5. Thử phát hành kép qua hợp đồng (dùng lại báo cáo thẩm định)");
  await assert.rejects(
    nft.connect(vvb).mintBatch(owner.address, `${projectCode}-B`, 2025, 1, 10, m.documentHash, ""),
    /DocumentAlreadyUsed/
  );

  console.log("SMOKE TEST: OK", { project: projectCode, tokenId: Number(tokenId), held: 700, retired: 300 });
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
