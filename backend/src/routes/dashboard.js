const express = require("express");
const { ah, badRequest } = require("../errors");
const { requireFields, toYear, toAddress } = require("../validate");
const { requireAuth } = require("../auth");

/**
 * Dashboard doanh nghiệp: so sánh lượng tín chỉ đã hủy (bù trừ) với lượng phát thải
 * và hạn ngạch doanh nghiệp tự khai báo theo năm (dữ liệu mô phỏng).
 */
module.exports = function dashboardRoutes({ db }) {
  const r = express.Router();

  async function summary(address) {
    const [held, retiredByYear, declarations] = await Promise.all([
      db.many(
        `SELECT u.*, p.project_id AS registry_project_id, p.project_name
         FROM units u JOIN issuances i ON i.id = u.issuance_id JOIN projects p ON p.id = i.project_id
         WHERE u.unit_owner = $1 AND u.unit_status = 'Held' ORDER BY u.token_id`,
        [address]
      ),
      db.many(
        `SELECT EXTRACT(YEAR FROM retired_at) AS year, SUM(amount) AS retired
         FROM retirements WHERE retiree_address = $1 GROUP BY EXTRACT(YEAR FROM retired_at)`,
        [address]
      ),
      db.many("SELECT * FROM emission_declarations WHERE wallet_address = $1 ORDER BY year", [address]),
    ]);

    const years = new Set([...declarations.map((d) => d.year), ...retiredByYear.map((x) => Number(x.year))]);
    const byYear = [...years]
      .sort()
      .map((year) => {
        const d = declarations.find((x) => x.year === year);
        const retired = Number(retiredByYear.find((x) => Number(x.year) === year)?.retired || 0);
        const emissions = Number(d?.emissions_tco2e || 0);
        const allowance = Number(d?.allowance_tco2e || 0);
        // Phần vượt hạn ngạch cần bù trừ bằng tín chỉ đã hủy
        const excess = Math.max(emissions - allowance, 0);
        return {
          year,
          emissions_tco2e: emissions,
          allowance_tco2e: allowance,
          excess_tco2e: excess,
          retired_tco2e: retired,
          remaining_to_offset: Math.max(excess - retired, 0),
          compliant: retired >= excess,
        };
      });

    return {
      address,
      held_units: held,
      held_tco2e: held.reduce((s, u) => s + Number(u.unit_count), 0),
      by_year: byYear,
    };
  }

  r.get(
    "/me",
    requireAuth,
    ah(async (req, res) => res.json(await summary(req.user.address)))
  );

  // Công khai theo tinh thần minh bạch: ai cũng xem được tình trạng bù trừ của một ví.
  r.get(
    "/:address",
    ah(async (req, res) => res.json(await summary(toAddress(req.params.address))))
  );

  r.put(
    "/emissions",
    requireAuth,
    ah(async (req, res) => {
      requireFields(req.body, ["year", "emissions_tco2e"]);
      const year = toYear(req.body.year, "year");
      const emissions = Number(req.body.emissions_tco2e);
      const allowance = Number(req.body.allowance_tco2e || 0);
      if (!(emissions >= 0) || !(allowance >= 0)) throw badRequest("Phát thải và hạn ngạch phải là số không âm");
      await db.query("DELETE FROM emission_declarations WHERE wallet_address = $1 AND year = $2", [
        req.user.address,
        year,
      ]);
      const row = await db.one(
        `INSERT INTO emission_declarations (wallet_address, year, emissions_tco2e, allowance_tco2e)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [req.user.address, year, emissions, allowance]
      );
      res.json(row);
    })
  );

  return r;
};
