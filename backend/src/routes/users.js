const express = require("express");
const { ah, badRequest, notFound } = require("../errors");
const { toAddress } = require("../validate");
const { requireRole } = require("../auth");

const ROLES = ["ADMIN", "VERIFIER", "PROJECT_OWNER", "BUYER"];

/** Cơ quan quản lý (ADMIN) xem danh sách tài khoản và phân quyền. */
module.exports = function userRoutes({ db }) {
  const r = express.Router();

  r.get(
    "/",
    requireRole("ADMIN"),
    ah(async (_req, res) => {
      res.json(await db.many("SELECT * FROM app_users ORDER BY created_at"));
    })
  );

  // Đổi vai trò ở đây chỉ có hiệu lực off-chain. Với VERIFIER, ADMIN còn phải gọi
  // grantRole(VERIFIER_ROLE, address) trên hợp đồng (giao diện quản trị làm cả hai bước).
  r.patch(
    "/:address/role",
    requireRole("ADMIN"),
    ah(async (req, res) => {
      const address = toAddress(req.params.address);
      if (!ROLES.includes(req.body.role)) throw badRequest(`role phải thuộc ${ROLES.join(", ")}`);
      const user = await db.one("UPDATE app_users SET role = $2 WHERE wallet_address = $1 RETURNING *", [
        address,
        req.body.role,
      ]);
      if (!user) throw notFound("Không có tài khoản này");
      res.json(user);
    })
  );

  return r;
};
