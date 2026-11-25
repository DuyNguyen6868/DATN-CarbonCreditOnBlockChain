require("dotenv").config();

module.exports = {
  port: Number(process.env.PORT || 4000),
  databaseUrl: process.env.DATABASE_URL || "postgres://carbon:carbon@localhost:5432/carbon",
  jwtSecret: process.env.JWT_SECRET || "dev-secret-change-me",
  rpcUrl: process.env.RPC_URL || "http://127.0.0.1:8545",
  // Ví được tự động gán vai trò ADMIN khi đăng nhập lần đầu (cơ quan quản lý), phân tách bằng dấu phẩy.
  adminAddresses: (process.env.ADMIN_ADDRESSES || "")
    .split(",")
    .map((a) => a.trim().toLowerCase())
    .filter(Boolean),
  uploadDir: process.env.UPLOAD_DIR || "uploads",
  indexerIntervalMs: Number(process.env.INDEXER_INTERVAL_MS || 5000),
};
