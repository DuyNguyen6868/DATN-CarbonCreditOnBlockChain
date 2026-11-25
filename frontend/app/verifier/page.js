"use client";
import { useState } from "react";
import { api, uploadFile, documentUrl } from "@/lib/api";
import { sendTx } from "@/lib/chain";
import { useWallet } from "@/components/WalletProvider";
import { useLoad, Status, ActionButton, fmt, date } from "@/components/ui";

/**
 * Màn hình VVB: xem yêu cầu, tải báo cáo thẩm định, phê duyệt (off-chain) rồi ký mintBatch (on-chain)
 * bằng ví của chính VVB. Từ chối kèm ghi chú.
 */
function RequestRow({ req, onChanged }) {
  const [file, setFile] = useState(null);
  const [body, setBody] = useState("");
  const [note, setNote] = useState("");
  const [detail, setDetail] = useState(null);

  async function approve() {
    if (!file || !body) throw new Error("Cần tệp báo cáo thẩm định và tên tổ chức VVB");
    const doc = await uploadFile(file);
    const res = await api(`/issuance-requests/${req.id}/approve`, {
      method: "POST",
      body: { verification_doc_hash: doc.sha3_hash, verification_body: body, note },
    });
    setDetail(res);
    return { text: "Đã phê duyệt. Bước tiếp theo: ký giao dịch mint." };
  }

  async function mint() {
    const d = detail || (await api(`/issuance-requests/${req.id}`));
    const m = d.mint;
    const out = await sendTx(({ nft }) =>
      nft.mintBatch(m.to, m.projectId, m.vintage, m.serialFrom, m.quantity, m.documentHash, m.uri)
    , `Đã mint lô ${fmt(m.quantity)} tCO₂e, sê-ri ${m.serialFrom}–${m.serialFrom + m.quantity - 1}`);
    setTimeout(onChanged, 6000); // chờ bộ đồng bộ sự kiện cập nhật CSDL
    return out;
  }

  async function reject() {
    if (!note) throw new Error("Nhập lý do từ chối");
    await api(`/issuance-requests/${req.id}/reject`, { method: "POST", body: { note } });
    onChanged();
    return { text: "Đã từ chối" };
  }

  return (
    <div className="panel">
      <p>
        <b>Yêu cầu #{req.id}</b> · {req.registry_project_id} ({req.project_name}) · vintage {req.vintage_year} ·{" "}
        <b>{fmt(req.quantity)} tCO₂e</b> · gửi {date(req.created_at)} · <span className={`badge ${req.status}`}>{req.status}</span>
      </p>
      <p>
        Báo cáo giám sát: <a href={documentUrl(req.monitoring_doc_hash)}>tải về</a> <code>{req.monitoring_doc_hash.slice(0, 18)}…</code>
      </p>
      {req.status === "SUBMITTED" && (
        <div className="stack">
          <label>Tổ chức thẩm định (VVB)<input value={body} onChange={(e) => setBody(e.target.value)} /></label>
          <label>Báo cáo thẩm định<input type="file" onChange={(e) => setFile(e.target.files[0])} /></label>
          <label>Ghi chú<input value={note} onChange={(e) => setNote(e.target.value)} /></label>
          <div className="row">
            <ActionButton label="Phê duyệt" run={approve} />
            <ActionButton label="Từ chối" className="ghost" run={reject} />
          </div>
        </div>
      )}
      {(req.status === "APPROVED" || detail) && (
        <div className="row">
          <ActionButton label="Ký giao dịch mint (MetaMask)" run={mint} />
        </div>
      )}
    </div>
  );
}

export default function VerifierPage() {
  const { user } = useWallet();
  const list = useLoad(() => (user ? api("/issuance-requests") : Promise.resolve([])), [user?.wallet_address]);
  if (user?.role !== "VERIFIER") return <p>Trang này dành cho tổ chức thẩm định (VVB).</p>;

  const open = list.data?.filter((r) => r.status === "SUBMITTED" || r.status === "APPROVED") || [];
  const done = list.data?.filter((r) => r.status === "MINTED" || r.status === "REJECTED") || [];
  return (
    <>
      <h1>Thẩm định và phát hành</h1>
      <Status {...list} />
      {open.map((r) => <RequestRow key={r.id} req={r} onChanged={list.reload} />)}
      {list.data && !open.length && <p className="muted">Không có yêu cầu đang chờ.</p>}
      <h2>Đã xử lý</h2>
      <ul>
        {done.map((r) => (
          <li key={r.id}>
            #{r.id} {r.registry_project_id} – {fmt(r.quantity)} tCO₂e – <span className={`badge ${r.status}`}>{r.status}</span>
            {r.token_id ? ` (lô #${r.token_id})` : ""} {r.review_note && `– ${r.review_note}`}
          </li>
        ))}
      </ul>
    </>
  );
}
