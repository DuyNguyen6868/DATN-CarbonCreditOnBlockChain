const express = require("express");
const { ah, badRequest, unauthorized } = require("../errors");
const { toAddress, requireFields } = require("../validate");
const { loginMessage, newNonce, verifyLogin, signToken, requireAuth } = require("../auth");

/**
 * Đăng nhập bằng ví:
 *  1. POST /auth/nonce {address}            -> {message}  (thông điệp cần ký)
 *  2. MetaMask ký message (personal_sign)
 *  3. POST /auth/login {address, signature, role?, organization?} -> {token, user}
 * Lần đăng nhập đầu tiên tạo tài khoản; người dùng tự chọn PROJECT_OWNER hoặc BUYER.
 * VERIFIER do ADMIN cấp; ADMIN lấy từ biến môi trường ADMIN_ADDRESSES.
 */
module.exports = function authRoutes({ db, config }) {
  const r = express.Router();

  r.post(
    "/nonce",
    ah(async (req, res) => {
      const address = toAddress(req.body.address);
      const nonce = newNonce();
      await db.query("DELETE FROM auth_nonces WHERE wallet_address = $1", [address]);
      await db.query("INSERT INTO auth_nonces (wallet_address, nonce) VALUES ($1, $2)", [address, nonce]);
      res.json({ address, nonce, message: loginMessage(address, nonce) });
    })
  );

  r.post(
    "/login",
    ah(async (req, res) => {
      requireFields(req.body, ["address", "signature"]);
      const address = toAddress(req.body.address);
      const row = await db.one("SELECT nonce FROM auth_nonces WHERE wallet_address = $1", [address]);
      if (!row) throw unauthorized("Chưa lấy mã đăng nhập (nonce)");
      if (!verifyLogin(address, row.nonce, req.body.signature)) throw unauthorized("Chữ ký không hợp lệ");
      // Mỗi nonce chỉ dùng một lần để chống phát lại chữ ký
      await db.query("DELETE FROM auth_nonces WHERE wallet_address = $1", [address]);

      let user = await db.one("SELECT * FROM app_users WHERE wallet_address = $1", [address]);
      if (!user) {
        let role = req.body.role || "BUYER";
        if (config.adminAddresses.includes(address)) role = "ADMIN";
        else if (!["PROJECT_OWNER", "BUYER"].includes(role))
          throw badRequest("Chỉ được tự đăng ký vai trò PROJECT_OWNER hoặc BUYER");
        user = await db.one(
          "INSERT INTO app_users (wallet_address, role, organization, email) VALUES ($1, $2, $3, $4) RETURNING *",
          [address, role, req.body.organization || null, req.body.email || null]
        );
      }
      res.json({ token: signToken(user, config.jwtSecret), user });
    })
  );

  r.get(
    "/me",
    requireAuth,
    ah(async (req, res) => {
      res.json(await db.one("SELECT * FROM app_users WHERE wallet_address = $1", [req.user.address]));
    })
  );

  return r;
};
