const os = require("os");
const path = require("path");
const fs = require("fs");
const request = require("supertest");
const { newDb } = require("pg-mem");
const { ethers } = require("ethers");
const { createDb } = require("../src/db");
const { createApp } = require("../src/app");

/** Ứng dụng + CSDL PostgreSQL giả lập trong bộ nhớ (pg-mem) cho mỗi bộ test. */
async function setup({ admins = [] } = {}) {
  const mem = newDb();
  const { Pool } = mem.adapters.createPg();
  const db = createDb(new Pool());
  await db.migrate();
  const config = {
    jwtSecret: "test-secret",
    adminAddresses: admins.map((a) => a.toLowerCase()),
    uploadDir: fs.mkdtempSync(path.join(os.tmpdir(), "carbon-uploads-")),
  };
  const app = createApp({ db, config });
  return { db, app, config, api: request(app) };
}

/** Đăng nhập bằng ví: lấy nonce, ký thông điệp, đổi lấy JWT. */
async function login(api, wallet, extra = {}) {
  const n = await api.post("/api/auth/nonce").send({ address: wallet.address }).expect(200);
  const signature = await wallet.signMessage(n.body.message);
  const res = await api
    .post("/api/auth/login")
    .send({ address: wallet.address, signature, ...extra })
    .expect(200);
  return res.body.token;
}

async function upload(api, token, name, content) {
  const res = await api
    .post("/api/documents")
    .set("Authorization", `Bearer ${token}`)
    .attach("file", Buffer.from(content), name)
    .expect(201);
  return res.body.sha3_hash;
}

const wallet = () => ethers.Wallet.createRandom();

module.exports = { setup, login, upload, wallet };
