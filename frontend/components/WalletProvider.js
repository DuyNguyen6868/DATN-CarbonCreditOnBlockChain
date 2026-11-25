"use client";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api, TOKEN_KEY } from "@/lib/api";
import { getSigner } from "@/lib/chain";

const WalletContext = createContext(null);
export const useWallet = () => useContext(WalletContext);

/**
 * Quản lý phiên đăng nhập bằng ví: kết nối MetaMask, ký thông điệp đăng nhập,
 * lưu JWT trong localStorage và thông tin tài khoản (vai trò) từ backend.
 */
export default function WalletProvider({ children }) {
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    try {
      setUser(await api("/auth/me"));
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    try {
      if (localStorage.getItem(TOKEN_KEY)) refresh();
    } catch {
      /* localStorage không dùng được: coi như chưa đăng nhập */
    }
    if (typeof window !== "undefined" && window.ethereum?.on) {
      const onChange = () => logout();
      window.ethereum.on("accountsChanged", onChange);
      return () => window.ethereum.removeListener?.("accountsChanged", onChange);
    }
  }, [refresh]);

  async function login(role, organization) {
    setError("");
    try {
      const signer = await getSigner();
      const address = await signer.getAddress();
      const { message } = await api("/auth/nonce", { method: "POST", body: { address } });
      const signature = await signer.signMessage(message);
      const res = await api("/auth/login", { method: "POST", body: { address, signature, role, organization } });
      localStorage.setItem(TOKEN_KEY, res.token);
      setUser(res.user);
    } catch (e) {
      setError(e.shortMessage || e.message);
    }
  }

  function logout() {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* bỏ qua */
    }
    setUser(null);
  }

  return (
    <WalletContext.Provider value={{ user, error, login, logout, refresh }}>{children}</WalletContext.Provider>
  );
}
