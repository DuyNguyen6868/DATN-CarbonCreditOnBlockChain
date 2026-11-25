"use client";
import Link from "next/link";
import { useState } from "react";
import { api } from "@/lib/api";
import { fmt, date } from "@/components/ui";

/** Tra cứu công khai: một số sê-ri đã được cấp chưa, đang do ai giữ hay đã hủy cho ai. */
export default function LookupPage() {
  const [q, setQ] = useState({ project_id: "", vintage: "", serial: "" });
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  async function search(e) {
    e.preventDefault();
    setError("");
    setResult(null);
    try {
      setResult(await api(`/units/lookup?${new URLSearchParams(q)}`));
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <>
      <h1>Tra cứu tín chỉ theo số sê-ri</h1>
      <form className="row panel" onSubmit={search}>
        <input placeholder="Mã dự án (VD: VN-REDD-0001)" value={q.project_id} onChange={(e) => setQ({ ...q, project_id: e.target.value })} required />
        <input placeholder="Vintage" type="number" value={q.vintage} onChange={(e) => setQ({ ...q, vintage: e.target.value })} required />
        <input placeholder="Số sê-ri" type="number" value={q.serial} onChange={(e) => setQ({ ...q, serial: e.target.value })} required />
        <button>Tra cứu</button>
      </form>
      {error && <p className="error">{error}</p>}
      {result && (
        <div className="panel">
          <p>
            Sê-ri <b>{q.serial}</b> thuộc lô <b>#{result.token_id}</b> của dự án{" "}
            <Link href={`/projects/${result.project_pk}`}>{result.registry_project_id}</Link> ({result.project_name}),
            khối {result.unit_block_start}–{result.unit_block_end} ({fmt(result.unit_count)} tCO₂e).
          </p>
          {result.unit_status === "Retired" ? (
            <p className="error">
              ĐÃ HỦY ngày {date(result.retirement_date)} cho <b>{result.retirement_beneficiary}</b>.{" "}
              <Link href={`/certificates/${result.certificate_id}`}>Xem chứng nhận hủy #{result.certificate_id}</Link>
            </p>
          ) : (
            <p className="ok">
              Còn hiệu lực, đang được giữ bởi <code>{result.unit_owner}</code>
              {result.in_pool ? " (đang khóa trong pool ERC-20)" : ""}.
            </p>
          )}
        </div>
      )}
    </>
  );
}
