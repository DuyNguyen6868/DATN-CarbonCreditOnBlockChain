const { ethers } = require("ethers");

const ZERO = ethers.ZeroAddress.toLowerCase();

/**
 * Bộ đồng bộ sự kiện on-chain -> CSDL off-chain.
 *
 * Đọc các sự kiện CreditMinted, Transfer, CreditRetired của CarbonCreditNFT theo từng đoạn khối,
 * ghi vào issuances / units / retirements. Mỗi sự kiện được ghi vào chain_events với khóa
 * (tx_hash, log_index) nên chạy lại nhiều lần cũng không bị ghi trùng (idempotent).
 * Dữ liệu on-chain là gốc: nếu CSDL hỏng, xóa các bảng đồng bộ và đặt sync_state về khối deploy
 * để dựng lại.
 */
function createIndexer({ db, nft, poolAddress, startBlock = 0, chunkSize = 2000, logger = console }) {
  const pool = (poolAddress || "").toLowerCase();

  // ---------- Xử lý từng loại sự kiện (dùng chung cho đồng bộ thật và kiểm thử) ----------

  async function onMinted(t, a, meta) {
    const project = await t.one("SELECT id FROM projects WHERE project_id = $1", [a.projectId]);
    if (!project) {
      logger.warn(`[indexer] CreditMinted cho dự án chưa đăng ký off-chain: ${a.projectId}`);
      return;
    }
    const docHash = a.documentHash.toLowerCase();
    const verification = await t.one("SELECT id FROM verifications WHERE document_hash = $1", [docHash]);
    const issuance = await t.one(
      `INSERT INTO issuances (project_id, verification_id, token_id, vintage_year, unit_block_start, unit_block_end,
         unit_count, document_hash, verifier_address, tx_hash, issued_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [
        project.id,
        verification?.id || null,
        Number(a.tokenId),
        Number(a.vintage),
        Number(a.serialFrom),
        Number(a.serialTo),
        Number(a.quantity),
        docHash,
        a.verifier.toLowerCase(),
        meta.txHash,
        meta.timestamp,
      ]
    );
    await t.query(
      `INSERT INTO units (issuance_id, token_id, unit_owner, unit_block_start, unit_block_end, unit_count,
         vintage_year, unit_status, in_pool)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'Held', $8)`,
      [
        issuance.id,
        issuance.token_id,
        a.to.toLowerCase(),
        issuance.unit_block_start,
        issuance.unit_block_end,
        issuance.unit_count,
        issuance.vintage_year,
        a.to.toLowerCase() === pool,
      ]
    );
    await t.query(
      `UPDATE issuance_requests SET status = 'MINTED', token_id = $2, updated_at = NOW()
       WHERE verification_doc_hash = $1 AND status = 'APPROVED'`,
      [docHash, issuance.token_id]
    );
  }

  async function onTransfer(t, a) {
    const from = a.from.toLowerCase();
    const to = a.to.toLowerCase();
    // Mint đã xử lý ở CreditMinted; burn (hủy hết) đã xử lý ở CreditRetired.
    if (from === ZERO || to === ZERO) return;
    await t.query(
      `UPDATE units SET unit_owner = $2, in_pool = $3, updated_at = NOW()
       WHERE token_id = $1 AND unit_status = 'Held'`,
      [Number(a.tokenId), to, to === pool]
    );
  }

  async function onRetired(t, a, meta) {
    const tokenId = Number(a.tokenId);
    const amount = Number(a.amount);
    const held = await t.one("SELECT * FROM units WHERE token_id = $1 AND unit_status = 'Held'", [tokenId]);
    if (!held) {
      logger.warn(`[indexer] CreditRetired cho lô #${tokenId} chưa có trong CSDL`);
      return;
    }
    await t.query(
      `INSERT INTO retirements (certificate_id, token_id, retiree_address, amount, serial_from, serial_to,
         beneficiary, reason, tx_hash, retired_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        Number(a.certificateId),
        tokenId,
        a.retiree.toLowerCase(),
        amount,
        Number(a.serialFrom),
        Number(a.serialTo),
        a.beneficiary,
        a.reason,
        meta.txHash,
        meta.timestamp,
      ]
    );
    // Tách khối: phần đã hủy thành dòng Retired mới
    await t.query(
      `INSERT INTO units (issuance_id, token_id, unit_owner, unit_block_start, unit_block_end, unit_count,
         vintage_year, unit_status, unit_status_reason, retirement_beneficiary, retirement_date, certificate_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'Retired', $8, $9, $10, $11)`,
      [
        held.issuance_id,
        tokenId,
        a.retiree.toLowerCase(),
        Number(a.serialFrom),
        Number(a.serialTo),
        amount,
        held.vintage_year,
        a.reason || null,
        a.beneficiary,
        meta.timestamp,
        Number(a.certificateId),
      ]
    );
    // Phần còn lại dời sê-ri đầu lên; hết thì xóa dòng Held
    if (Number(held.unit_count) === amount) {
      await t.query("DELETE FROM units WHERE id = $1", [held.id]);
    } else {
      await t.query(
        `UPDATE units SET unit_block_start = $2, unit_count = $3, updated_at = NOW() WHERE id = $1`,
        [held.id, Number(a.serialTo) + 1, Number(held.unit_count) - amount]
      );
    }
  }

  const handlers = { CreditMinted: onMinted, Transfer: onTransfer, CreditRetired: onRetired };

  /**
   * Ghi một sự kiện đã giải mã. `args` là object tên tham số -> giá trị; `meta` gồm
   * txHash, logIndex, blockNumber, timestamp. Trả về false nếu sự kiện đã được xử lý trước đó.
   */
  async function applyEvent(eventName, args, meta) {
    const handler = handlers[eventName];
    if (!handler) return false;
    return db.tx(async (t) => {
      const seen = await t.one("SELECT 1 AS x FROM chain_events WHERE tx_hash = $1 AND log_index = $2", [
        meta.txHash,
        meta.logIndex,
      ]);
      if (seen) return false;
      await t.query(
        `INSERT INTO chain_events (tx_hash, log_index, block_number, contract_name, event_name, payload)
         VALUES ($1, $2, $3, 'CarbonCreditNFT', $4, $5)`,
        [meta.txHash, meta.logIndex, meta.blockNumber, eventName, JSON.stringify(args, (_k, v) => (typeof v === "bigint" ? v.toString() : v))]
      );
      await handler(t, args, meta);
      return true;
    });
  }

  // ---------- Đồng bộ với chuỗi ----------

  async function lastSyncedBlock() {
    const row = await db.one("SELECT last_block FROM sync_state WHERE id = 1");
    return row ? Number(row.last_block) : startBlock - 1;
  }

  async function saveSyncedBlock(n) {
    await db.query("DELETE FROM sync_state WHERE id = 1");
    await db.query("INSERT INTO sync_state (id, last_block) VALUES (1, $1)", [n]);
  }

  const toArgs = (log) => {
    const out = {};
    log.fragment.inputs.forEach((input, i) => (out[input.name] = log.args[i]));
    return out;
  };

  /** Đồng bộ từ khối kế tiếp tới khối mới nhất. Trả về số sự kiện mới đã ghi. */
  async function syncOnce() {
    const latest = await nft.runner.provider.getBlockNumber();
    let from = (await lastSyncedBlock()) + 1;
    let applied = 0;
    const blockTime = new Map();

    while (from <= latest) {
      const to = Math.min(from + chunkSize - 1, latest);
      const logs = (await nft.queryFilter("*", from, to))
        .filter((l) => l.fragment && handlers[l.fragment.name])
        .sort((x, y) => x.blockNumber - y.blockNumber || x.index - y.index);

      for (const log of logs) {
        if (!blockTime.has(log.blockNumber)) {
          const b = await nft.runner.provider.getBlock(log.blockNumber);
          blockTime.set(log.blockNumber, new Date(b.timestamp * 1000));
        }
        const ok = await applyEvent(log.fragment.name, toArgs(log), {
          txHash: log.transactionHash,
          logIndex: log.index,
          blockNumber: log.blockNumber,
          timestamp: blockTime.get(log.blockNumber),
        });
        if (ok) applied++;
      }
      await saveSyncedBlock(to);
      from = to + 1;
    }
    return applied;
  }

  /** Chạy syncOnce định kỳ; trả về hàm dừng. */
  function start(intervalMs) {
    let stopped = false;
    let timer;
    const tick = async () => {
      try {
        const n = await syncOnce();
        if (n) logger.log(`[indexer] đã đồng bộ ${n} sự kiện`);
      } catch (e) {
        logger.error("[indexer] lỗi đồng bộ:", e.message);
      }
      if (!stopped) timer = setTimeout(tick, intervalMs);
    };
    tick();
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }

  return { applyEvent, syncOnce, start };
}

module.exports = { createIndexer };
