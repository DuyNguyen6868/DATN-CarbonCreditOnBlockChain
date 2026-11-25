"use client";
import Link from "next/link";
import { useState } from "react";
import { api, uploadFile } from "@/lib/api";
import { useWallet } from "@/components/WalletProvider";
import { useLoad, Status, fmt, date } from "@/components/ui";

const EMPTY_PROJECT = {
  project_id: "",
  project_name: "",
  program: "VCS",
  methodology: "",
  sector: "",
  project_type: "",
  project_developer: "",
  in_country_region: "",
  description: "",
};

export default function OwnerPage() {
  const { user } = useWallet();
  const me = user?.wallet_address;
  const projects = useLoad(() => (me ? api(`/projects?owner=${me}`) : Promise.resolve([])), [me]);
  const requests = useLoad(() => (me ? api("/issuance-requests") : Promise.resolve([])), [me]);

  const [p, setP] = useState(EMPTY_PROJECT);
  const [pMsg, setPMsg] = useState("");
  const [r, setR] = useState({ project_id: "", vintage_year: new Date().getFullYear() - 1, quantity: "", file: null });
  const [rMsg, setRMsg] = useState("");

  if (user?.role !== "PROJECT_OWNER") return <p>Trang này dành cho chủ dự án. Hãy đăng nhập bằng ví có vai trò Chủ dự án.</p>;

  async function createProject(e) {
    e.preventDefault();
    setPMsg("");
    try {
      const { in_country_region, ...rest } = p;
      await api("/projects", {
        method: "POST",
        body: {
          ...rest,
          locations: in_country_region ? [{ in_country_region }] : [],
          stakeholders: p.project_developer ? [{ organization: p.project_developer, stakeholder_role: "Project Developer" }] : [],
        },
      });
      setP(EMPTY_PROJECT);
      setPMsg("Đã đăng ký dự án");
      projects.reload();
    } catch (err) {
      setPMsg(err.message);
    }
  }

  async function submitRequest(e) {
    e.preventDefault();
    setRMsg("");
    try {
      if (!r.file) throw new Error("Chọn tệp báo cáo giám sát");
      const doc = await uploadFile(r.file);
      await api("/issuance-requests", {
        method: "POST",
        body: { project_id: r.project_id, vintage_year: r.vintage_year, quantity: r.quantity, monitoring_doc_hash: doc.sha3_hash },
      });
      setRMsg("Đã gửi yêu cầu cấp tín chỉ, chờ VVB thẩm định");
      requests.reload();
    } catch (err) {
      setRMsg(err.message);
    }
  }

  const field = (k, label, props = {}) => (
    <label>
      {label}
      <input value={p[k]} onChange={(e) => setP({ ...p, [k]: e.target.value })} {...props} />
    </label>
  );

  return (
    <>
      <h1>Dự án của tôi</h1>
      <Status {...projects} />
      {projects.data && (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Mã</th><th>Tên</th><th>Trạng thái</th><th>Đã cấp</th><th>Đã hủy</th></tr></thead>
            <tbody>
              {projects.data.map((x) => (
                <tr key={x.id}>
                  <td><Link href={`/projects/${x.id}`}>{x.project_id}</Link></td>
                  <td>{x.project_name}</td>
                  <td><span className="badge">{x.project_status}</span></td>
                  <td>{fmt(x.issued)}</td>
                  <td>{fmt(x.retired)}</td>
                </tr>
              ))}
              {!projects.data.length && <tr><td colSpan={5} className="muted">Chưa có dự án.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      <h2>Yêu cầu cấp tín chỉ</h2>
      <Status {...requests} />
      {requests.data && (
        <div className="table-wrap">
          <table>
            <thead><tr><th>#</th><th>Dự án</th><th>Vintage</th><th>Số lượng</th><th>Trạng thái</th><th>Ghi chú VVB</th><th>Ngày gửi</th></tr></thead>
            <tbody>
              {requests.data.map((x) => (
                <tr key={x.id}>
                  <td>{x.id}</td>
                  <td>{x.registry_project_id}</td>
                  <td>{x.vintage_year}</td>
                  <td>{fmt(x.quantity)}</td>
                  <td><span className={`badge ${x.status}`}>{x.status}</span>{x.token_id ? ` → lô #${x.token_id}` : ""}</td>
                  <td>{x.review_note}</td>
                  <td>{date(x.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="grid" style={{ marginTop: 24, alignItems: "start" }}>
        <form className="panel stack" onSubmit={submitRequest}>
          <h2 style={{ marginTop: 0 }}>Gửi yêu cầu cấp tín chỉ</h2>
          <label>
            Dự án
            <select value={r.project_id} onChange={(e) => setR({ ...r, project_id: e.target.value })} required>
              <option value="">-- chọn --</option>
              {projects.data?.map((x) => <option key={x.id} value={x.id}>{x.project_id}</option>)}
            </select>
          </label>
          <label>Năm giảm phát thải (vintage)<input type="number" value={r.vintage_year} onChange={(e) => setR({ ...r, vintage_year: e.target.value })} required /></label>
          <label>Số lượng (tCO₂e)<input type="number" min="1" value={r.quantity} onChange={(e) => setR({ ...r, quantity: e.target.value })} required /></label>
          <label>Báo cáo giám sát<input type="file" onChange={(e) => setR({ ...r, file: e.target.files[0] })} required /></label>
          <button>Gửi yêu cầu</button>
          {rMsg && <p className="muted">{rMsg}</p>}
        </form>

        <form className="panel stack" onSubmit={createProject}>
          <h2 style={{ marginTop: 0 }}>Đăng ký dự án mới</h2>
          {field("project_id", "Mã dự án", { required: true, placeholder: "VN-REDD-0001" })}
          {field("project_name", "Tên dự án", { required: true })}
          {field("program", "Chương trình / tiêu chuẩn")}
          {field("methodology", "Phương pháp luận")}
          {field("sector", "Lĩnh vực")}
          {field("project_type", "Loại dự án")}
          {field("project_developer", "Đơn vị phát triển dự án")}
          {field("in_country_region", "Tỉnh/thành")}
          <label>Mô tả<textarea rows={3} value={p.description} onChange={(e) => setP({ ...p, description: e.target.value })} /></label>
          <button>Đăng ký</button>
          {pMsg && <p className="muted">{pMsg}</p>}
        </form>
      </div>
    </>
  );
}
