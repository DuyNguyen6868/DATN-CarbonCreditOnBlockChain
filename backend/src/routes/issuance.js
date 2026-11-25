const express = require("express");
const { ah, notFound, forbidden, conflict, badRequest } = require("../errors");
const { requireFields, toPositiveInt, toYear, toHash } = require("../validate");
const { requireAuth, requireRole } = require("../auth");

/**
 * Quy trình yêu cầu cấp tín chỉ:
 *   SUBMITTED --(VVB approve)--> APPROVED --(VVB ký mintBatch, indexer thấy CreditMinted)--> MINTED
 *   SUBMITTED --(VVB reject)--> REJECTED
 * Backend không giữ khóa riêng: giao dịch mint do VVB ký bằng MetaMask; API chỉ trả về tham số mint.
 */
module.exports = function issuanceRoutes({ db }) {
  const r = express.Router();

  async function load(id) {
    const row = await db.one(
      `SELECT r.*, p.project_id AS registry_project_id, p.project_name, p.owner_address
       FROM issuance_requests r JOIN projects p ON p.id = r.project_id WHERE r.id = $1`,
      [Number(id)]
    );
    if (!row) throw notFound("Không có yêu cầu này");
    return row;
  }

  /** Sê-ri đầu đề xuất: ngay sau sê-ri lớn nhất đã cấp của cùng dự án và vintage. */
  async function suggestSerialFrom(projectId, vintage) {
    const row = await db.one(
      "SELECT MAX(unit_block_end) AS last FROM issuances WHERE project_id = $1 AND vintage_year = $2",
      [projectId, vintage]
    );
    return Number(row?.last || 0) + 1;
  }

  function mintParams(req, row) {
    return {
      to: row.owner_address,
      projectId: row.registry_project_id,
      vintage: row.vintage_year,
      serialFrom: Number(row.serial_from),
      quantity: Number(row.quantity),
      documentHash: row.verification_doc_hash,
      uri: `${req.protocol}://${req.get("host")}/api/metadata/requests/${row.id}`,
    };
  }

  r.post(
    "/",
    requireRole("PROJECT_OWNER"),
    ah(async (req, res) => {
      requireFields(req.body, ["project_id", "vintage_year", "quantity", "monitoring_doc_hash"]);
      const project = await db.one("SELECT * FROM projects WHERE id = $1", [Number(req.body.project_id)]);
      if (!project) throw notFound("Không có dự án này");
      if (project.owner_address !== req.user.address) throw forbidden("Chỉ chủ dự án được gửi yêu cầu");
      if (project.project_status === "Withdrawn") throw conflict("Dự án đã rút, không thể yêu cầu cấp");
      const docHash = toHash(req.body.monitoring_doc_hash, "monitoring_doc_hash");
      if (!(await db.one("SELECT id FROM documents WHERE sha3_hash = $1", [docHash])))
        throw badRequest("Báo cáo giám sát chưa được tải lên");

      const row = await db.one(
        `INSERT INTO issuance_requests
           (project_id, requested_by, vintage_year, quantity, reporting_period_start, reporting_period_end, monitoring_doc_hash)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [
          project.id,
          req.user.address,
          toYear(req.body.vintage_year),
          toPositiveInt(req.body.quantity, "quantity"),
          req.body.reporting_period_start || null,
          req.body.reporting_period_end || null,
          docHash,
        ]
      );
      res.status(201).json(row);
    })
  );

  r.get(
    "/",
    requireAuth,
    ah(async (req, res) => {
      const conds = [];
      const params = [];
      if (req.user.role === "PROJECT_OWNER") {
        params.push(req.user.address);
        conds.push(`r.requested_by = $${params.length}`);
      } else if (req.user.role === "BUYER") {
        throw forbidden();
      }
      if (req.query.status) {
        params.push(req.query.status);
        conds.push(`r.status = $${params.length}`);
      }
      const where = conds.length ? `WHERE ${conds.join(" AND ")}` : "";
      res.json(
        await db.many(
          `SELECT r.*, p.project_id AS registry_project_id, p.project_name
           FROM issuance_requests r JOIN projects p ON p.id = r.project_id ${where} ORDER BY r.id DESC`,
          params
        )
      );
    })
  );

  r.get(
    "/:id",
    requireAuth,
    ah(async (req, res) => {
      const row = await load(req.params.id);
      if (req.user.role === "PROJECT_OWNER" && row.requested_by !== req.user.address) throw forbidden();
      if (req.user.role === "BUYER") throw forbidden();
      res.json(row.status === "APPROVED" ? { ...row, mint: mintParams(req, row) } : row);
    })
  );

  r.post(
    "/:id/approve",
    requireRole("VERIFIER"),
    ah(async (req, res) => {
      requireFields(req.body, ["verification_doc_hash", "verification_body"]);
      const row = await load(req.params.id);
      if (row.status !== "SUBMITTED") throw conflict(`Yêu cầu đang ở trạng thái ${row.status}`);
      const vHash = toHash(req.body.verification_doc_hash, "verification_doc_hash");
      if (!(await db.one("SELECT id FROM documents WHERE sha3_hash = $1", [vHash])))
        throw badRequest("Báo cáo thẩm định chưa được tải lên");
      // Chặn sớm phía off-chain; hợp đồng vẫn kiểm tra lại (DocumentAlreadyUsed).
      if (await db.one("SELECT id FROM verifications WHERE document_hash = $1", [vHash]))
        throw conflict("Báo cáo thẩm định này đã được dùng cho một đợt cấp khác");

      const serialFrom =
        req.body.serial_from !== undefined
          ? toPositiveInt(req.body.serial_from, "serial_from")
          : await suggestSerialFrom(row.project_id, row.vintage_year);

      await db.tx(async (t) => {
        await t.query(
          `INSERT INTO verifications (project_id, verification_body, verifier_address, verification_date,
             reporting_period_start, reporting_period_end, document_hash)
           VALUES ($1, $2, $3, CURRENT_DATE, $4, $5, $6)`,
          [
            row.project_id,
            req.body.verification_body,
            req.user.address,
            row.reporting_period_start,
            row.reporting_period_end,
            vHash,
          ]
        );
        await t.query(
          `UPDATE issuance_requests SET status = 'APPROVED', verification_doc_hash = $2, reviewer_address = $3,
             review_note = $4, serial_from = $5, updated_at = NOW() WHERE id = $1`,
          [row.id, vHash, req.user.address, req.body.note || null, serialFrom]
        );
      });
      const fresh = await load(row.id);
      res.json({ ...fresh, mint: mintParams(req, fresh) });
    })
  );

  r.post(
    "/:id/reject",
    requireRole("VERIFIER"),
    ah(async (req, res) => {
      requireFields(req.body, ["note"]);
      const row = await load(req.params.id);
      if (row.status !== "SUBMITTED") throw conflict(`Yêu cầu đang ở trạng thái ${row.status}`);
      await db.query(
        `UPDATE issuance_requests SET status = 'REJECTED', reviewer_address = $2, review_note = $3, updated_at = NOW()
         WHERE id = $1`,
        [row.id, req.user.address, req.body.note]
      );
      res.json(await load(row.id));
    })
  );

  return r;
};
