const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { ethers } = require("ethers");
const { unauthorized, forbidden } = require("./errors");

/** Thông điệp người dùng ký bằng MetaMask (phiên bản rút gọn của Sign-In with Ethereum). */
function loginMessage(address, nonce) {
  return `Đăng nhập Hệ thống quản lý tín chỉ carbon\nVí: ${address.toLowerCase()}\nMã: ${nonce}`;
}

const newNonce = () => crypto.randomBytes(16).toString("hex");

function verifyLogin(address, nonce, signature) {
  try {
    return ethers.verifyMessage(loginMessage(address, nonce), signature).toLowerCase() === address.toLowerCase();
  } catch {
    return false;
  }
}

function signToken(user, secret) {
  return jwt.sign({ sub: user.wallet_address, role: user.role }, secret, { expiresIn: "8h" });
}

/** Gắn req.user nếu có Bearer token hợp lệ; requireAuth/requireRole kiểm tra sau. */
function authMiddleware(secret) {
  return (req, _res, next) => {
    const h = req.headers.authorization || "";
    if (h.startsWith("Bearer ")) {
      try {
        const p = jwt.verify(h.slice(7), secret);
        req.user = { address: p.sub, role: p.role };
      } catch {
        // token sai hoặc hết hạn: coi như chưa đăng nhập
      }
    }
    next();
  };
}

const requireAuth = (req, _res, next) => (req.user ? next() : next(unauthorized()));

const requireRole =
  (...roles) =>
  (req, _res, next) => {
    if (!req.user) return next(unauthorized());
    if (!roles.includes(req.user.role)) return next(forbidden(`Cần vai trò: ${roles.join(" hoặc ")}`));
    next();
  };

module.exports = { loginMessage, newNonce, verifyLogin, signToken, authMiddleware, requireAuth, requireRole };
