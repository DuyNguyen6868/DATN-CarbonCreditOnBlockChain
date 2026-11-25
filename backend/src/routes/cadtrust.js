const express = require("express");
const { ah, notFound } = require("../errors");

/**
 * API liên thông: xuất dữ liệu một dự án theo cấu trúc trường của CAD Trust (camelCase).
 * Tên trường bám theo mô hình CAD Trust; cần đối chiếu từ điển dữ liệu V2.0 chính thức trước khi
 * trao đổi thật với hệ thống bên ngoài.
 */
module.exports = function cadTrustRoutes({ db }) {
  const r = express.Router();

  r.get(
    "/projects/:id",
    ah(async (req, res) => {
      const p = await db.one("SELECT * FROM projects WHERE id = $1", [Number(req.params.id)]);
      if (!p) throw notFound("Không có dự án này");
      const [locations, stakeholders, verifications, issuances, units] = await Promise.all([
        db.many("SELECT * FROM project_locations WHERE project_id = $1", [p.id]),
        db.many("SELECT * FROM stakeholders WHERE project_id = $1", [p.id]),
        db.many("SELECT * FROM verifications WHERE project_id = $1", [p.id]),
        db.many("SELECT * FROM issuances WHERE project_id = $1", [p.id]),
        db.many(
          "SELECT u.* FROM units u JOIN issuances i ON i.id = u.issuance_id WHERE i.project_id = $1 ORDER BY u.id",
          [p.id]
        ),
      ]);

      res.json({
        project: {
          warehouseProjectId: String(p.id),
          projectId: p.project_id,
          originProjectId: p.origin_project_id,
          registryOfOrigin: p.registry_of_origin,
          currentRegistry: p.current_registry,
          program: p.program,
          projectName: p.project_name,
          projectLink: p.project_link,
          projectDeveloper: p.project_developer,
          sector: p.sector,
          projectType: p.project_type,
          coveredByNDC: p.covered_by_ndc,
          methodology: p.methodology,
          projectStatus: p.project_status,
          projectLocations: locations.map((l) => ({
            country: l.country,
            inCountryRegion: l.in_country_region,
            geographicIdentifier: l.geographic_identifier,
          })),
        },
        stakeholders: stakeholders.map((s) => ({ organization: s.organization, role: s.stakeholder_role })),
        verifications: verifications.map((v) => ({
          verificationBody: v.verification_body,
          verificationDate: v.verification_date,
          verificationPeriodStart: v.reporting_period_start,
          verificationPeriodEnd: v.reporting_period_end,
          documentHash: v.document_hash,
        })),
        issuances: issuances.map((i) => ({
          id: String(i.id),
          vintageYear: i.vintage_year,
          unitCount: Number(i.unit_count),
          onChainTokenId: i.token_id,
          onChainTxHash: i.tx_hash,
        })),
        units: units.map((u) => ({
          issuanceId: String(u.issuance_id),
          unitOwner: u.unit_owner,
          unitBlockStart: String(u.unit_block_start),
          unitBlockEnd: String(u.unit_block_end),
          unitCount: Number(u.unit_count),
          vintageYear: u.vintage_year,
          unitStatus: u.unit_status,
          unitStatusReason: u.unit_status_reason,
          retirementBeneficiary: u.retirement_beneficiary,
          retirementDate: u.retirement_date,
        })),
      });
    })
  );

  return r;
};
