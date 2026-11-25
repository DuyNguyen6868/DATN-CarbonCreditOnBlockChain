"use client";
import Link from "next/link";
import { useState } from "react";
import { useWallet } from "./WalletProvider";
import { short } from "@/lib/chain";

const ROLE_LABEL = {
  ADMIN: "Cơ quan quản lý",
  VERIFIER: "VVB",
  PROJECT_OWNER: "Chủ dự án",
  BUYER: "Doanh nghiệp",
};

export default function Nav() {
  const { user, error, login, logout } = useWallet();
  const [role, setRole] = useState("BUYER");

  return (
    <header className="nav">
      <Link href="/" className="brand">
        Carbon Registry
      </Link>
      <nav>
        <Link href="/">Dự án</Link>
        <Link href="/lookup">Tra cứu</Link>
        {user?.role === "PROJECT_OWNER" && <Link href="/owner">Dự án của tôi</Link>}
        {user?.role === "VERIFIER" && <Link href="/verifier">Thẩm định</Link>}
        {user && <Link href="/wallet">Ví tín chỉ</Link>}
        {user && <Link href="/dashboard">Dashboard</Link>}
        {user?.role === "ADMIN" && <Link href="/admin">Quản trị</Link>}
      </nav>
      <div className="session">
        {user ? (
          <>
            <span className="badge">{ROLE_LABEL[user.role]}</span>
            <code>{short(user.wallet_address)}</code>
            <button className="ghost" onClick={logout}>
              Đăng xuất
            </button>
          </>
        ) : (
          <>
            <select value={role} onChange={(e) => setRole(e.target.value)} title="Vai trò khi đăng ký lần đầu">
              <option value="BUYER">Doanh nghiệp mua</option>
              <option value="PROJECT_OWNER">Chủ dự án</option>
            </select>
            <button onClick={() => login(role)}>Kết nối MetaMask</button>
          </>
        )}
      </div>
      {error && <p className="error full">{error}</p>}
    </header>
  );
}
