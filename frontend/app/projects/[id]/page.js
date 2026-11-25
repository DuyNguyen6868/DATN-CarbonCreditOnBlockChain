"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api, documentUrl } from "@/lib/api";
import { txUrl } from "@/lib/chain";
import { useLoad, Status, fmt, date } from "@/components/ui";

export default function ProjectPage() {
  const { id } = useParams();
  const p = useLoad(() => api(`/projects/${id}`), [id]);
  const units = useLoad(() => api(`/units?project_id=${id}`), [id]);

  if (!p.data) return <Status {...p} />;
  const d = p.data;
  return (
    <>
      <h1>{d.project_name}</h1>
      <div className="panel">
        <p><b>Mã dự án:</b> {d.project_id} · <b>Chương trình:</b> {d.program || "—"} · <b>Phương pháp luận:</b> {d.methodology || "—"}</p>
        <p><b>Lĩnh vực:</b> {d.sector || "—"} · <b>Trạng thái:</b> <span className="badge">{d.project_status}</span></p>
        <p><b>Vị trí:</b> {d.locations.map((l) => `${l.in_country_region || ""}, ${l.country}`).join("; ") || "—"}</p>
        <p><b>Các bên liên quan:</b> {d.stakeholders.map((s) => `${s.organization} (${s.stakeholder_role})`).join("; ") || "—"}</p>
        {d.description && <p>{d.description}</p>}
        <p><a href={`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api"}/cadtrust/projects/${d.id}`} target="_blank" rel="noreferrer">Xuất dữ liệu theo CAD Trust (JSON)</a></p>
      </div>

      <h2>Các đợt thẩm định</h2>
      <div className="table-wrap">
        <table>
          <thead><tr><th>VVB</th><th>Ngày</th><th>Báo cáo thẩm định</th></tr></thead>
          <tbody>
            {d.verifications.map((v) => (
              <tr key={v.id}>
                <td>{v.verification_body}</td>
                <td>{date(v.verification_date)}</td>
                <td><a href={documentUrl(v.document_hash)}><code>{v.document_hash.slice(0, 18)}…</code></a></td>
              </tr>
            ))}
            {!d.verifications.length && <tr><td colSpan={3} className="muted">Chưa có.</td></tr>}
          </tbody>
        </table>
      </div>

      <h2>Khối tín chỉ</h2>
      <Status {...units} />
      {units.data && (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Lô (NFT)</th><th>Vintage</th><th>Sê-ri</th><th>Số lượng</th><th>Trạng thái</th><th>Chủ sở hữu / thụ hưởng</th></tr></thead>
            <tbody>
              {units.data.map((u) => (
                <tr key={u.id}>
                  <td>#{u.token_id}</td>
                  <td>{u.vintage_year}</td>
                  <td>{u.unit_block_start}–{u.unit_block_end}</td>
                  <td>{fmt(u.unit_count)}</td>
                  <td><span className={`badge ${u.unit_status}`}>{u.unit_status}{u.in_pool ? " (pool)" : ""}</span></td>
                  <td>
                    {u.unit_status === "Retired" ? (
                      <Link href={`/certificates/${u.certificate_id}`}>{u.retirement_beneficiary}</Link>
                    ) : (
                      <code>{u.unit_owner}</code>
                    )}
                  </td>
                </tr>
              ))}
              {!units.data.length && <tr><td colSpan={6} className="muted">Chưa cấp tín chỉ.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      <h2>Đợt cấp</h2>
      <ul>
        {d.issuances.map((i) => (
          <li key={i.id}>
            Lô #{i.token_id}: {fmt(i.unit_count)} tCO₂e, vintage {i.vintage_year}, sê-ri {i.unit_block_start}–{i.unit_block_end}
            {txUrl(i.tx_hash) && <> · <a href={txUrl(i.tx_hash)} target="_blank" rel="noreferrer">giao dịch mint</a></>}
          </li>
        ))}
      </ul>
    </>
  );
}
