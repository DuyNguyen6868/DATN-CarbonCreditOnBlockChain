const fs = require("fs");
const path = require("path");

/**
 * Bọc một pg.Pool (hoặc Pool của pg-mem khi kiểm thử) thành các hàm tiện dùng.
 */
function createDb(pool) {
  const query = (text, params) => pool.query(text, params);

  async function one(text, params) {
    const { rows } = await pool.query(text, params);
    return rows[0] || null;
  }

  async function many(text, params) {
    const { rows } = await pool.query(text, params);
    return rows;
  }

  /** Chạy fn(client) trong một giao dịch CSDL; lỗi thì rollback. */
  async function tx(fn) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const helpers = {
        query: (t, p) => client.query(t, p),
        one: async (t, p) => (await client.query(t, p)).rows[0] || null,
        many: async (t, p) => (await client.query(t, p)).rows,
      };
      const result = await fn(helpers);
      await client.query("COMMIT");
      return result;
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  }

  async function migrate() {
    const sql = fs.readFileSync(path.join(__dirname, "..", "db", "schema.sql"), "utf8");
    await pool.query(sql);
  }

  return { pool, query, one, many, tx, migrate };
}

module.exports = { createDb };
