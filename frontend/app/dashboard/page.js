"use client";
import { useState } from "react";
import { api } from "@/lib/api";
import { useWallet } from "@/components/WalletProvider";
import { useLoad, Status, fmt } from "@/components/ui";

/** So sánh tín chỉ đã hủy với phần phát thải vượt hạn ngạch theo từng năm (dữ liệu khai báo mô phỏng). */
export default function DashboardPage() {
  const { user } = useWallet();
  const d = useLoad(() => (user ? api("/dashboard/me") : Promise.resolve(null)), [user?.wallet_address]);
  const [f, setF] = useState({ year: new Date().getFullYear(), emissions_tco2e: "", allowance_tco2e: "" });
  const [msg, setMsg] = useState("");

  if (!user) return <p>Kết nối ví để xem dashboard.</p>;

  async function save(e) {
    e.preventDefault();
    setMsg("");
    try {
      await api("/dashboard/emissions", { method: "PUT", body: f });
      setMsg("Đã lưu");
      d.reload();
    } catch (err) {
      setMsg(err.message);
    }
  }

  return (
    <>
      <h1>Dashboard bù trừ phát thải</h1>
      <Status {...d} />
      {d.data && (
        <>
          <div className="grid">
            <div className="stat"><b>{fmt(d.data.held_tco2e)}</b><span>tCO₂e đang giữ dưới dạng lô NFT</span></div>
          </div>
          <h2>Theo năm</h2>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Năm</th><th>Phát thải</th><th>Hạn ngạch</th><th>Vượt hạn ngạch</th><th>Đã hủy (bù trừ)</th><th>Còn thiếu</th><th>Tình trạng</th></tr>
              </thead>
              <tbody>
                {d.data.by_year.map((y) => (
                  <tr key={y.year}>
                    <td>{y.year}</td>
                    <td>{fmt(y.emissions_tco2e)}</td>
                    <td>{fmt(y.allowance_tco2e)}</td>
                    <td>{fmt(y.excess_tco2e)}</td>
                    <td>{fmt(y.retired_tco2e)}</td>
                    <td>{fmt(y.remaining_to_offset)}</td>
                    <td className={y.compliant ? "ok" : "error"}>{y.compliant ? "Đã bù đủ" : "Chưa đủ"}</td>
                  </tr>
                ))}
                {!d.data.by_year.length && <tr><td colSpan={7} className="muted">Chưa có số liệu.</td></tr>}
              </tbody>
            </table>
          </div>
        </>
      )}

      <form className="panel stack" onSubmit={save} style={{ marginTop: 24 }}>
        <h2 style={{ marginTop: 0 }}>Khai báo phát thải và hạn ngạch</h2>
        <label>Năm<input type="number" value={f.year} onChange={(e) => setF({ ...f, year: e.target.value })} required /></label>
        <label>Phát thải (tCO₂e)<input type="number" min="0" value={f.emissions_tco2e} onChange={(e) => setF({ ...f, emissions_tco2e: e.target.value })} required /></label>
        <label>Hạn ngạch được phân bổ (tCO₂e)<input type="number" min="0" value={f.allowance_tco2e} onChange={(e) => setF({ ...f, allowance_tco2e: e.target.value })} /></label>
        <button>Lưu</button>
        {msg && <p className="muted">{msg}</p>}
      </form>
    </>
  );
}
