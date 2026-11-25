const express = require("express");
const { ah, notFound, badRequest } = require("../errors");
const { toPositiveInt, toYear } = require("../validate");

/**
 * Tra cứu công khai: đợt cấp, khối tín chỉ (units), chứng nhận hủy, metadata NFT.
 * Dữ liệu là bản sao do indexer đồng bộ từ chuỗi; mỗi bản ghi có tx_hash để đối chiếu trên Etherscan.
 */
module.exports = function registryRoutes({ db }) {
  const r = express.Router();

  r.get(
    "/issuances",
    ah(async (req, res) => {
      const params = [];
      let where = "";
      if (req.query.project_id) {
        params.push(Number(req.query.project_id));
        where = "WHERE i.project_id = $1";
      }
      res.json(
        await db.many(
          `SELECT i.*, p.project_id AS registry_project_id, p.project_name
           FROM issuances i JOIN projects p ON p.id = i.project_id ${where} ORDER BY i.token_id`,
          params
        )
      );
    })
  );

  r.get(
    "/units",
    ah(async (req, res) => {
      const conds = [];
      const params = [];
      const add = (sql, v) => {
        params.push(v);
        conds.push(sql.replace("?", `$${params.length}`));
      };
      if (req.query.owner) add("u.unit_owner = ?", String(req.query.owner).toLowerCase());
      if (req.query.status) add("u.unit_status = ?", req.query.status);
      if (req.query.token_id) add("u.token_id = ?", Number(req.query.token_id));
      if (req.query.project_id) add("i.project_id = ?", Number(req.query.project_id));
      if (req.query.in_pool !== undefined) add("u.in_pool = ?", req.query.in_pool === "true");
      const where = conds.length ? `WHERE ${conds.join(" AND ")}` : "";
      res.json(
        await db.many(
          `SELECT u.*, p.project_id AS registry_project_id, p.project_name
           FROM units u JOIN issuances i ON i.id = u.issuance_id JOIN projects p ON p.id = i.project_id
           ${where} ORDER BY u.token_id, u.unit_block_start`,
          params
        )
      );
    })
  );

  // Tra cứu một số sê-ri cụ thể: thuộc lô nào, đang được ai giữ hay đã hủy cho ai.
  r.get(
    "/units/lookup",
    ah(async (req, res) => {
      if (!req.query.project_id) throw badRequest("Thiếu project_id (mã dự án gốc)");
      const vintage = toYear(req.query.vintage, "vintage");
      const serial = toPositiveInt(req.query.serial, "serial");
      const unit = await db.one(
        `SELECT u.*, p.id AS project_pk, p.project_id AS registry_project_id, p.project_name, i.tx_hash AS issuance_tx
         FROM units u JOIN issuances i ON i.id = u.issuance_id JOIN projects p ON p.id = i.project_id
         WHERE p.project_id = $1 AND u.vintage_year = $2 AND u.unit_block_start <= $3 AND u.unit_block_end >= $3`,
        [req.query.project_id, vintage, serial]
      );
      if (!unit) throw notFound("Số sê-ri này chưa được cấp");
      res.json(unit);
    })
  );

  r.get(
    "/retirements",
    ah(async (req, res) => {
      const conds = [];
      const params = [];
      if (req.query.retiree) {
        params.push(String(req.query.retiree).toLowerCase());
        conds.push(`r.retiree_address = $${params.length}`);
      }
      if (req.query.beneficiary) {
        params.push(req.query.beneficiary);
        conds.push(`r.beneficiary = $${params.length}`);
      }
      const where = conds.length ? `WHERE ${conds.join(" AND ")}` : "";
      res.json(
        await db.many(
          `SELECT r.*, i.vintage_year, p.project_id AS registry_project_id, p.project_name
           FROM retirements r JOIN issuances i ON i.token_id = r.token_id JOIN projects p ON p.id = i.project_id
           ${where} ORDER BY r.certificate_id DESC`,
          params
        )
      );
    })
  );

  r.get(
    "/retirements/:certificateId",
    ah(async (req, res) => {
      const cert = await db.one(
        `SELECT r.*, i.vintage_year, i.document_hash, p.project_id AS registry_project_id, p.project_name,
                p.project_developer, p.methodology
         FROM retirements r JOIN issuances i ON i.token_id = r.token_id JOIN projects p ON p.id = i.project_id
         WHERE r.certificate_id = $1`,
        [Number(req.params.certificateId)]
      );
      if (!cert) throw notFound("Không có chứng nhận này");
      res.json(cert);
    })
  );

  // Metadata ERC-721 (tokenURI trỏ tới đây khi chưa dùng IPFS).
  r.get(
    "/metadata/requests/:id",
    ah(async (req, res) => {
      const row = await db.one(
        `SELECT r.*, p.project_id AS registry_project_id, p.project_name, p.methodology, p.program
         FROM issuance_requests r JOIN projects p ON p.id = r.project_id WHERE r.id = $1`,
        [Number(req.params.id)]
      );
      if (!row) throw notFound();
      res.json({
        name: `${row.registry_project_id} – vintage ${row.vintage_year} – ${row.quantity} tCO2e`,
        description: `Lô tín chỉ carbon của dự án ${row.project_name}`,
        attributes: [
          { trait_type: "Project ID", value: row.registry_project_id },
          { trait_type: "Program", value: row.program },
          { trait_type: "Methodology", value: row.methodology },
          { trait_type: "Vintage", value: row.vintage_year },
          { trait_type: "Quantity (tCO2e)", value: Number(row.quantity) },
          { trait_type: "Verification report hash", value: row.verification_doc_hash },
        ],
      });
    })
  );

  r.get(
    "/stats",
    ah(async (_req, res) => {
      const [p, i, u] = await Promise.all([
        db.one("SELECT COUNT(*) AS n FROM projects"),
        db.one("SELECT COUNT(*) AS n, COALESCE(SUM(unit_count), 0) AS total FROM issuances"),
        db.one("SELECT COALESCE(SUM(unit_count), 0) AS total FROM units WHERE unit_status = 'Retired'"),
      ]);
      res.json({
        projects: Number(p.n),
        batches: Number(i.n),
        issued_tco2e: Number(i.total),
        retired_tco2e: Number(u.total),
      });
    })
  );

  return r;
};
