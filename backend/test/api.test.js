const { test, describe, before } = require("node:test");
const assert = require("node:assert/strict");
const { ethers } = require("ethers");
const { setup, login, upload, wallet } = require("./helpers");
const { createIndexer } = require("../src/indexer");

// Mã API-xx dùng lại ở bảng kiểm thử Chương 5.
describe("API: xác thực và phân quyền", () => {
  let ctx;
  const admin = wallet();
  before(async () => (ctx = await setup({ admins: [admin.address] })));

  test("API-01: đăng nhập bằng chữ ký ví, tài khoản mới tự chọn vai trò", async () => {
    const owner = wallet();
    const token = await login(ctx.api, owner, { role: "PROJECT_OWNER", organization: "Cong ty Rung Xanh" });
    const me = await ctx.api.get("/api/auth/me").set("Authorization", `Bearer ${token}`).expect(200);
    assert.equal(me.body.role, "PROJECT_OWNER");
    assert.equal(me.body.wallet_address, owner.address.toLowerCase());
  });

  test("API-02: chữ ký sai hoặc dùng lại nonce bị từ chối", async () => {
    const w = wallet();
    const other = wallet();
    const n = await ctx.api.post("/api/auth/nonce").send({ address: w.address }).expect(200);
    const badSig = await other.signMessage(n.body.message);
    await ctx.api.post("/api/auth/login").send({ address: w.address, signature: badSig }).expect(401);

    const goodSig = await w.signMessage(n.body.message);
    await ctx.api.post("/api/auth/login").send({ address: w.address, signature: goodSig }).expect(200);
    // Phát lại chữ ký cũ sau khi nonce đã bị xóa
    await ctx.api.post("/api/auth/login").send({ address: w.address, signature: goodSig }).expect(401);
  });

  test("API-03: không tự đăng ký được vai trò VERIFIER; ADMIN cấp được", async () => {
    const vvb = wallet();
    const n = await ctx.api.post("/api/auth/nonce").send({ address: vvb.address });
    const sig = await vvb.signMessage(n.body.message);
    await ctx.api.post("/api/auth/login").send({ address: vvb.address, signature: sig, role: "VERIFIER" }).expect(400);

    await login(ctx.api, vvb, { role: "BUYER" });
    const adminToken = await login(ctx.api, admin);
    const r = await ctx.api
      .patch(`/api/users/${vvb.address}/role`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ role: "VERIFIER" })
      .expect(200);
    assert.equal(r.body.role, "VERIFIER");
  });

  test("API-04: endpoint quản trị từ chối người không phải ADMIN và người chưa đăng nhập", async () => {
    const buyerToken = await login(ctx.api, wallet(), { role: "BUYER" });
    await ctx.api.get("/api/users").set("Authorization", `Bearer ${buyerToken}`).expect(403);
    await ctx.api.get("/api/users").expect(401);
    await ctx.api.get("/api/users").set("Authorization", "Bearer token-gia").expect(401);
  });
});

describe("API: quy trình phát hành, đồng bộ sự kiện và hủy tín chỉ", () => {
  let ctx, indexer;
  const admin = wallet();
  const owner = wallet();
  const vvb = wallet();
  const buyer = wallet();
  const POOL = ethers.Wallet.createRandom().address;
  let ownerToken, vvbToken, buyerToken, projectId, requestId, mint;
  let logIndex = 0;
  const meta = () => ({
    txHash: ethers.hexlify(ethers.randomBytes(32)),
    logIndex: logIndex++,
    blockNumber: 1,
    timestamp: new Date("2026-11-20T00:00:00Z"),
  });

  before(async () => {
    ctx = await setup({ admins: [admin.address] });
    indexer = createIndexer({ db: ctx.db, nft: null, poolAddress: POOL, logger: { warn() {}, log() {} } });
    ownerToken = await login(ctx.api, owner, { role: "PROJECT_OWNER" });
    buyerToken = await login(ctx.api, buyer, { role: "BUYER", organization: "Cong ty B" });
    await login(ctx.api, vvb, { role: "BUYER" });
    const adminToken = await login(ctx.api, admin);
    await ctx.api
      .patch(`/api/users/${vvb.address}/role`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ role: "VERIFIER" });
    vvbToken = await login(ctx.api, vvb); // đăng nhập lại để JWT mang vai trò mới
  });

  test("API-05: chủ dự án đăng ký dự án; trùng mã dự án bị từ chối", async () => {
    const body = {
      project_id: "VN-REDD-0001",
      project_name: "Bảo vệ rừng Tây Nguyên",
      program: "VCS",
      methodology: "VM0007",
      sector: "Forestry",
      locations: [{ in_country_region: "Đắk Lắk" }],
      stakeholders: [{ organization: "Cong ty Rung Xanh", stakeholder_role: "Project Developer" }],
    };
    const r = await ctx.api.post("/api/projects").set("Authorization", `Bearer ${ownerToken}`).send(body).expect(201);
    projectId = r.body.id;
    await ctx.api.post("/api/projects").set("Authorization", `Bearer ${ownerToken}`).send(body).expect(409);
    await ctx.api.post("/api/projects").set("Authorization", `Bearer ${buyerToken}`).send(body).expect(403);
    const detail = await ctx.api.get(`/api/projects/${projectId}`).expect(200);
    assert.equal(detail.body.locations[0].in_country_region, "Đắk Lắk");
  });

  test("API-06: gửi yêu cầu cấp tín chỉ cần báo cáo giám sát đã tải lên", async () => {
    await ctx.api
      .post("/api/issuance-requests")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ project_id: projectId, vintage_year: 2025, quantity: 1000, monitoring_doc_hash: ethers.ZeroHash })
      .expect(400);
    const mrHash = await upload(ctx.api, ownerToken, "monitoring-2025.pdf", "bao cao giam sat 2025");
    const r = await ctx.api
      .post("/api/issuance-requests")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ project_id: projectId, vintage_year: 2025, quantity: 1000, monitoring_doc_hash: mrHash })
      .expect(201);
    requestId = r.body.id;
    assert.equal(r.body.status, "SUBMITTED");
  });

  test("API-07: chỉ VVB duyệt được; duyệt xong trả về tham số mint với sê-ri đề xuất", async () => {
    const vHash = await upload(ctx.api, vvbToken, "verification-2025.pdf", "bao cao tham dinh 2025");
    await ctx.api
      .post(`/api/issuance-requests/${requestId}/approve`)
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ verification_doc_hash: vHash, verification_body: "VVB A" })
      .expect(403);
    const r = await ctx.api
      .post(`/api/issuance-requests/${requestId}/approve`)
      .set("Authorization", `Bearer ${vvbToken}`)
      .send({ verification_doc_hash: vHash, verification_body: "VVB A" })
      .expect(200);
    assert.equal(r.body.status, "APPROVED");
    mint = r.body.mint;
    assert.deepEqual(
      { to: mint.to, projectId: mint.projectId, serialFrom: mint.serialFrom, quantity: mint.quantity },
      { to: owner.address.toLowerCase(), projectId: "VN-REDD-0001", serialFrom: 1, quantity: 1000 }
    );
    assert.equal(mint.documentHash, vHash);
    // Duyệt lần hai bị chặn
    await ctx.api
      .post(`/api/issuance-requests/${requestId}/approve`)
      .set("Authorization", `Bearer ${vvbToken}`)
      .send({ verification_doc_hash: vHash, verification_body: "VVB A" })
      .expect(409);
  });

  test("API-08 (phát hành kép, off-chain): báo cáo thẩm định đã dùng không duyệt được yêu cầu khác", async () => {
    const mr2 = await upload(ctx.api, ownerToken, "monitoring-2025b.pdf", "bao cao giam sat 2025 lan 2");
    const r = await ctx.api
      .post("/api/issuance-requests")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ project_id: projectId, vintage_year: 2025, quantity: 10, monitoring_doc_hash: mr2 })
      .expect(201);
    await ctx.api
      .post(`/api/issuance-requests/${r.body.id}/approve`)
      .set("Authorization", `Bearer ${vvbToken}`)
      .send({ verification_doc_hash: mint.documentHash, verification_body: "VVB A" })
      .expect(409);
    const rej = await ctx.api
      .post(`/api/issuance-requests/${r.body.id}/reject`)
      .set("Authorization", `Bearer ${vvbToken}`)
      .send({ note: "Trùng kỳ giám sát" })
      .expect(200);
    assert.equal(rej.body.status, "REJECTED");
  });

  test("API-09: sự kiện CreditMinted tạo đợt cấp, khối tín chỉ và chuyển yêu cầu sang MINTED", async () => {
    await indexer.applyEvent(
      "CreditMinted",
      {
        tokenId: 1n,
        to: owner.address,
        verifier: vvb.address,
        projectId: "VN-REDD-0001",
        vintage: 2025n,
        serialFrom: 1n,
        serialTo: 1000n,
        quantity: 1000n,
        documentHash: mint.documentHash,
      },
      meta()
    );
    const req = await ctx.api
      .get(`/api/issuance-requests/${requestId}`)
      .set("Authorization", `Bearer ${ownerToken}`)
      .expect(200);
    assert.equal(req.body.status, "MINTED");
    assert.equal(req.body.token_id, 1);
    const units = await ctx.api.get("/api/units?token_id=1").expect(200);
    assert.equal(units.body.length, 1);
    assert.equal(units.body[0].unit_status, "Held");
    assert.equal(units.body[0].unit_owner, owner.address.toLowerCase());
  });

  test("API-10: sự kiện trùng (cùng tx_hash, log_index) không bị ghi hai lần", async () => {
    const m = meta();
    const args = { from: owner.address, to: POOL, tokenId: 1n };
    assert.equal(await indexer.applyEvent("Transfer", args, m), true);
    assert.equal(await indexer.applyEvent("Transfer", args, m), false);
    const units = await ctx.api.get("/api/units?token_id=1").expect(200);
    assert.equal(units.body[0].unit_owner, POOL.toLowerCase());
    assert.equal(units.body[0].in_pool, true);
  });

  test("API-11: sự kiện CreditRetired tách khối và tạo chứng nhận tra cứu được", async () => {
    await indexer.applyEvent(
      "CreditRetired",
      {
        certificateId: 0n,
        tokenId: 1n,
        retiree: buyer.address,
        amount: 300n,
        serialFrom: 1n,
        serialTo: 300n,
        beneficiary: "Cong ty B",
        reason: "Bu tru phat thai 2026",
      },
      meta()
    );
    const units = await ctx.api.get("/api/units?token_id=1").expect(200);
    const held = units.body.find((u) => u.unit_status === "Held");
    const retired = units.body.find((u) => u.unit_status === "Retired");
    assert.equal(Number(held.unit_block_start), 301);
    assert.equal(Number(held.unit_count), 700);
    assert.equal(Number(retired.unit_block_end), 300);
    assert.equal(retired.retirement_beneficiary, "Cong ty B");

    const cert = await ctx.api.get("/api/retirements/0").expect(200);
    assert.equal(cert.body.registry_project_id, "VN-REDD-0001");
    assert.equal(Number(cert.body.amount), 300);
  });

  test("API-12: tra cứu theo số sê-ri cho biết sê-ri đã hủy hay còn hiệu lực", async () => {
    const a = await ctx.api.get("/api/units/lookup?project_id=VN-REDD-0001&vintage=2025&serial=150").expect(200);
    assert.equal(a.body.unit_status, "Retired");
    const b = await ctx.api.get("/api/units/lookup?project_id=VN-REDD-0001&vintage=2025&serial=900").expect(200);
    assert.equal(b.body.unit_status, "Held");
    await ctx.api.get("/api/units/lookup?project_id=VN-REDD-0001&vintage=2025&serial=5000").expect(404);
  });

  test("API-13: dashboard so sánh tín chỉ đã hủy với phần phát thải vượt hạn ngạch", async () => {
    await ctx.api
      .put("/api/dashboard/emissions")
      .set("Authorization", `Bearer ${buyerToken}`)
      .send({ year: 2026, emissions_tco2e: 5000, allowance_tco2e: 4500 })
      .expect(200);
    const d = await ctx.api.get("/api/dashboard/me").set("Authorization", `Bearer ${buyerToken}`).expect(200);
    const y = d.body.by_year.find((x) => x.year === 2026);
    assert.deepEqual(
      { excess: y.excess_tco2e, retired: y.retired_tco2e, left: y.remaining_to_offset, ok: y.compliant },
      { excess: 500, retired: 300, left: 200, ok: false }
    );
  });

  test("API-14: hủy hết phần còn lại thì không còn khối Held; thống kê và danh sách dự án khớp", async () => {
    await indexer.applyEvent(
      "CreditRetired",
      {
        certificateId: 1n,
        tokenId: 1n,
        retiree: buyer.address,
        amount: 700n,
        serialFrom: 301n,
        serialTo: 1000n,
        beneficiary: "Cong ty B",
        reason: "",
      },
      meta()
    );
    const held = await ctx.api.get("/api/units?token_id=1&status=Held").expect(200);
    assert.equal(held.body.length, 0);
    const stats = await ctx.api.get("/api/stats").expect(200);
    assert.deepEqual(stats.body, { projects: 1, batches: 1, issued_tco2e: 1000, retired_tco2e: 1000 });
    const list = await ctx.api.get("/api/projects").expect(200);
    assert.equal(list.body[0].retired, 1000);
  });

  test("API-15: xuất dữ liệu dự án theo cấu trúc CAD Trust", async () => {
    const r = await ctx.api.get(`/api/cadtrust/projects/${projectId}`).expect(200);
    assert.equal(r.body.project.projectId, "VN-REDD-0001");
    assert.equal(r.body.issuances[0].unitCount, 1000);
    assert.equal(r.body.units.filter((u) => u.unitStatus === "Retired").length, 2);
    assert.equal(r.body.verifications.length, 1);
  });

  test("API-16: metadata NFT và tài liệu công khai cho phép đối chiếu mã băm", async () => {
    const m = await ctx.api.get(`/api/metadata/requests/${requestId}`).expect(200);
    assert.match(m.body.name, /VN-REDD-0001/);
    const doc = await ctx.api.get(`/api/documents/${mint.documentHash}`).expect(200);
    assert.equal(doc.body.file_name, "verification-2025.pdf");
    assert.equal(ethers.keccak256(Buffer.from("bao cao tham dinh 2025")), mint.documentHash);
  });
});
