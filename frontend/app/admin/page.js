"use client";
import { api } from "@/lib/api";
import { sendTx } from "@/lib/chain";
import { useWallet } from "@/components/WalletProvider";
import { useLoad, Status, ActionButton, date } from "@/components/ui";

const ROLES = ["ADMIN", "VERIFIER", "PROJECT_OWNER", "BUYER"];
const STATUSES = ["Listed", "Validated", "Registered", "Completed", "Withdrawn"];

/**
 * Cơ quan quản lý: phân quyền tài khoản (cấp VERIFIER thì đồng thời grantRole on-chain),
 * đổi trạng thái dự án, tạm dừng/tiếp tục hợp đồng.
 */
export default function AdminPage() {
  const { user } = useWallet();
  const users = useLoad(() => (user?.role === "ADMIN" ? api("/users") : Promise.resolve([])), [user?.role]);
  const projects = useLoad(() => api("/projects"), []);
  if (user?.role !== "ADMIN") return <p>Trang này dành cho cơ quan quản lý.</p>;

  async function setRole(address, role, current) {
    // Thu hồi/cấp VERIFIER_ROLE on-chain trước, rồi mới đổi off-chain để hai phía khớp nhau.
    if (role === "VERIFIER" && current !== "VERIFIER")
      await sendTx(async ({ nft }) => nft.grantRole(await nft.VERIFIER_ROLE(), address));
    if (current === "VERIFIER" && role !== "VERIFIER")
      await sendTx(async ({ nft }) => nft.revokeRole(await nft.VERIFIER_ROLE(), address));
    await api(`/users/${address}/role`, { method: "PATCH", body: { role } });
    users.reload();
    return { text: `Đã đổi vai trò thành ${role}` };
  }

  return (
    <>
      <h1>Quản trị</h1>
      <div className="row panel">
        <b>Hợp đồng:</b>
        <ActionButton label="Tạm dừng" className="ghost" run={() => sendTx(({ nft }) => nft.pause(), "Đã tạm dừng hợp đồng")} />
        <ActionButton label="Tiếp tục" className="ghost" run={() => sendTx(({ nft }) => nft.unpause(), "Hợp đồng hoạt động lại")} />
      </div>

      <h2>Tài khoản</h2>
      <Status {...users} />
      <div className="table-wrap">
        <table>
          <thead><tr><th>Ví</th><th>Tổ chức</th><th>Vai trò</th><th>Ngày tạo</th><th>Đổi vai trò</th></tr></thead>
          <tbody>
            {users.data?.map((u) => (
              <tr key={u.wallet_address}>
                <td><code>{u.wallet_address}</code></td>
                <td>{u.organization}</td>
                <td><span className="badge">{u.role}</span></td>
                <td>{date(u.created_at)}</td>
                <td className="row">
                  {ROLES.filter((r) => r !== u.role).map((r) => (
                    <ActionButton key={r} label={r} className="ghost" run={() => setRole(u.wallet_address, r, u.role)} />
                  ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>Trạng thái dự án</h2>
      <Status {...projects} />
      <div className="table-wrap">
        <table>
          <thead><tr><th>Mã</th><th>Tên</th><th>Trạng thái</th></tr></thead>
          <tbody>
            {projects.data?.map((p) => (
              <tr key={p.id}>
                <td>{p.project_id}</td>
                <td>{p.project_name}</td>
                <td>
                  <select
                    value={p.project_status}
                    onChange={(e) =>
                      api(`/projects/${p.id}`, { method: "PATCH", body: { project_status: e.target.value } })
                        .then(projects.reload)
                        .catch((err) => alert(err.message))
                    }
                  >
                    {STATUSES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
