const express = require("express");
const { ah, notFound, forbidden, conflict, badRequest } = require("../errors");
const { requireFields } = require("../validate");
const { requireRole } = require("../auth");

const EDITABLE = [
  "project_name",
  "program",
  "project_link",
  "project_developer",
  "sector",
  "project_type",
  "covered_by_ndc",
  "methodology",
  "description",
];
const STATUSES = ["Listed", "Validated", "Registered", "Completed", "Withdrawn"];

module.exports = function projectRoutes({ db }) {
  const r = express.Router();

  // Công khai: danh sách dự án, lọc theo trạng thái/chủ dự án, kèm tổng tín chỉ đã cấp và đã hủy.
  r.get(
    "/",
    ah(async (req, res) => {
      const conds = [];
      const params = [];
      if (req.query.status) {
        params.push(req.query.status);
        conds.push(`p.project_status = $${params.length}`);
      }
      if (req.query.owner) {
        params.push(String(req.query.owner).toLowerCase());
        conds.push(`p.owner_address = $${params.length}`);
      }
      const where = conds.length ? `WHERE ${conds.join(" AND ")}` : "";
      const projects = await db.many(`SELECT p.* FROM projects p ${where} ORDER BY p.id DESC`, params);
      const totals = await db.many(
        `SELECT i.project_id, u.unit_status, SUM(u.unit_count) AS total
         FROM units u JOIN issuances i ON u.issuance_id = i.id
         GROUP BY i.project_id, u.unit_status`
      );
      for (const p of projects) {
        const t = totals.filter((x) => x.project_id === p.id);
        p.held = Number(t.find((x) => x.unit_status === "Held")?.total || 0);
        p.retired = Number(t.find((x) => x.unit_status === "Retired")?.total || 0);
        p.issued = p.held + p.retired;
      }
      res.json(projects);
    })
  );

  r.get(
    "/:id",
    ah(async (req, res) => {
      const p = await db.one("SELECT * FROM projects WHERE id = $1", [Number(req.params.id)]);
      if (!p) throw notFound("Không có dự án này");
      const [locations, stakeholders, verifications, issuances] = await Promise.all([
        db.many("SELECT * FROM project_locations WHERE project_id = $1", [p.id]),
        db.many("SELECT * FROM stakeholders WHERE project_id = $1", [p.id]),
        db.many("SELECT * FROM verifications WHERE project_id = $1 ORDER BY verification_date", [p.id]),
        db.many("SELECT * FROM issuances WHERE project_id = $1 ORDER BY token_id", [p.id]),
      ]);
      res.json({ ...p, locations, stakeholders, verifications, issuances });
    })
  );

  r.post(
    "/",
    requireRole("PROJECT_OWNER"),
    ah(async (req, res) => {
      requireFields(req.body, ["project_id", "project_name"]);
      const exists = await db.one("SELECT id FROM projects WHERE project_id = $1", [req.body.project_id]);
      if (exists) throw conflict("Mã dự án đã tồn tại");

      const project = await db.tx(async (t) => {
        const cols = ["project_id", "owner_address", ...EDITABLE];
        const vals = [req.body.project_id, req.user.address, ...EDITABLE.map((c) => req.body[c] ?? null)];
        const placeholders = cols.map((_, i) => `$${i + 1}`).join(", ");
        const p = await t.one(`INSERT INTO projects (${cols.join(", ")}) VALUES (${placeholders}) RETURNING *`, vals);
        for (const l of req.body.locations || []) {
          await t.query(
            `INSERT INTO project_locations (project_id, country, in_country_region, geographic_identifier)
             VALUES ($1, $2, $3, $4)`,
            [p.id, l.country || "Viet Nam", l.in_country_region || null, l.geographic_identifier || null]
          );
        }
        for (const s of req.body.stakeholders || []) {
          await t.query("INSERT INTO stakeholders (project_id, organization, stakeholder_role) VALUES ($1, $2, $3)", [
            p.id,
            s.organization,
            s.stakeholder_role,
          ]);
        }
        return p;
      });
      res.status(201).json(project);
    })
  );

  r.patch(
    "/:id",
    requireRole("PROJECT_OWNER", "ADMIN"),
    ah(async (req, res) => {
      const p = await db.one("SELECT * FROM projects WHERE id = $1", [Number(req.params.id)]);
      if (!p) throw notFound("Không có dự án này");
      if (req.user.role === "PROJECT_OWNER" && p.owner_address !== req.user.address)
        throw forbidden("Chỉ chủ dự án được sửa");

      const fields = EDITABLE.filter((c) => req.body[c] !== undefined);
      // Chỉ cơ quan quản lý đổi trạng thái dự án (Listed -> Registered ...)
      if (req.body.project_status !== undefined) {
        if (req.user.role !== "ADMIN") throw forbidden("Chỉ ADMIN đổi trạng thái dự án");
        if (!STATUSES.includes(req.body.project_status)) throw badRequest("Trạng thái dự án không hợp lệ");
        fields.push("project_status");
      }
      if (!fields.length) return res.json(p);
      const sets = fields.map((c, i) => `${c} = $${i + 2}`).join(", ");
      const updated = await db.one(`UPDATE projects SET ${sets}, updated_at = NOW() WHERE id = $1 RETURNING *`, [
        p.id,
        ...fields.map((c) => req.body[c]),
      ]);
      res.json(updated);
    })
  );

  return r;
};
