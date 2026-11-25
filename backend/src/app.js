const express = require("express");
const cors = require("cors");
const { authMiddleware } = require("./auth");
const { HttpError } = require("./errors");

/** Tạo ứng dụng Express; tách khỏi server.js để kiểm thử với CSDL trong bộ nhớ. */
function createApp({ db, config }) {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: "1mb" }));
  app.use(authMiddleware(config.jwtSecret));

  const deps = { db, config };
  app.get("/api/health", (_req, res) => res.json({ ok: true }));
  app.use("/api/auth", require("./routes/auth")(deps));
  app.use("/api/users", require("./routes/users")(deps));
  app.use("/api/projects", require("./routes/projects")(deps));
  app.use("/api/documents", require("./routes/documents")(deps));
  app.use("/api/issuance-requests", require("./routes/issuance")(deps));
  app.use("/api/dashboard", require("./routes/dashboard")(deps));
  app.use("/api/cadtrust", require("./routes/cadtrust")(deps));
  app.use("/api", require("./routes/registry")(deps));

  app.use((_req, _res, next) => next(new HttpError(404, "Không có endpoint này")));
  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    const status = err.status || 500;
    if (status >= 500) console.error(err);
    res.status(status).json({ error: status >= 500 ? "Lỗi máy chủ" : err.message });
  });
  return app;
}

module.exports = { createApp };
