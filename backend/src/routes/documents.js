const fs = require("fs");
const path = require("path");
const express = require("express");
const multer = require("multer");
const { ethers } = require("ethers");
const { ah, badRequest, notFound } = require("../errors");
const { requireAuth } = require("../auth");

/**
 * Tải hồ sơ (PDD, báo cáo giám sát, báo cáo thẩm định). Tệp lưu ở thư mục uploads/
 * (có thể thay bằng IPFS/S3); CSDL chỉ lưu đường dẫn và mã băm keccak256 của nội dung.
 * Mã băm này là giá trị VVB đưa vào hàm mintBatch (documentHash) để neo hồ sơ lên chuỗi.
 */
module.exports = function documentRoutes({ db, config }) {
  const r = express.Router();
  const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

  r.post(
    "/",
    requireAuth,
    upload.single("file"),
    ah(async (req, res) => {
      if (!req.file) throw badRequest("Thiếu tệp (trường 'file')");
      const hash = ethers.keccak256(req.file.buffer).toLowerCase();
      const existing = await db.one("SELECT * FROM documents WHERE sha3_hash = $1", [hash]);
      if (existing) return res.json(existing);

      fs.mkdirSync(config.uploadDir, { recursive: true });
      const storagePath = path.join(config.uploadDir, `${hash}${path.extname(req.file.originalname)}`);
      fs.writeFileSync(storagePath, req.file.buffer);
      const doc = await db.one(
        `INSERT INTO documents (sha3_hash, file_name, storage_path, uploaded_by)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [hash, req.file.originalname, storagePath, req.user.address]
      );
      res.status(201).json(doc);
    })
  );

  // Công khai: ai cũng có thể tải hồ sơ về và tự băm lại để đối chiếu với documentHash trên chuỗi.
  r.get(
    "/:hash",
    ah(async (req, res) => {
      const doc = await db.one("SELECT * FROM documents WHERE sha3_hash = $1", [req.params.hash.toLowerCase()]);
      if (!doc) throw notFound("Không có tài liệu này");
      if (req.query.download !== undefined && fs.existsSync(doc.storage_path))
        return res.download(doc.storage_path, doc.file_name);
      res.json(doc);
    })
  );

  return r;
};
