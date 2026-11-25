"use client";
import Link from "next/link";
import { api } from "@/lib/api";
import { useLoad, Status, fmt } from "@/components/ui";

export default function Home() {
  const stats = useLoad(() => api("/stats"));
  const projects = useLoad(() => api("/projects"));

  return (
    <>
      <h1>Hệ thống quản lý tín chỉ carbon</h1>
      {stats.data && (
        <div className="grid">
          <div className="stat"><b>{fmt(stats.data.projects)}</b><span>dự án</span></div>
          <div className="stat"><b>{fmt(stats.data.batches)}</b><span>lô tín chỉ đã cấp</span></div>
          <div className="stat"><b>{fmt(stats.data.issued_tco2e)}</b><span>tCO₂e đã cấp</span></div>
          <div className="stat"><b>{fmt(stats.data.retired_tco2e)}</b><span>tCO₂e đã hủy (bù trừ)</span></div>
        </div>
      )}

      <h2>Dự án</h2>
      <Status {...projects} />
      {projects.data && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Mã dự án</th><th>Tên</th><th>Chương trình</th><th>Trạng thái</th><th>Đã cấp</th><th>Đã hủy</th></tr>
            </thead>
            <tbody>
              {projects.data.map((p) => (
                <tr key={p.id}>
                  <td><Link href={`/projects/${p.id}`}>{p.project_id}</Link></td>
                  <td>{p.project_name}</td>
                  <td>{p.program}</td>
                  <td><span className="badge">{p.project_status}</span></td>
                  <td>{fmt(p.issued)}</td>
                  <td>{fmt(p.retired)}</td>
                </tr>
              ))}
              {!projects.data.length && <tr><td colSpan={6} className="muted">Chưa có dự án.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
