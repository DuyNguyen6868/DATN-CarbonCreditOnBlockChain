"use client";
import { useEffect, useState } from "react";
import { txUrl } from "@/lib/chain";

/** Tải dữ liệu từ hàm async, trả về {data, error, loading, reload}. */
export function useLoad(fn, deps = []) {
  const [state, setState] = useState({ data: null, error: "", loading: true });
  const [n, setN] = useState(0);
  useEffect(() => {
    let alive = true;
    setState((s) => ({ ...s, loading: true }));
    fn()
      .then((data) => alive && setState({ data, error: "", loading: false }))
      .catch((e) => alive && setState({ data: null, error: e.message, loading: false }));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, n]);
  return { ...state, reload: () => setN((x) => x + 1) };
}

export function Status({ loading, error }) {
  if (loading) return <p className="muted">Đang tải…</p>;
  if (error) return <p className="error">{error}</p>;
  return null;
}

/** Nút chạy một thao tác async (thường là giao dịch on-chain), hiển thị trạng thái và kết quả. */
export function ActionButton({ label, run, onDone, disabled, className }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  async function click() {
    setBusy(true);
    setMsg(null);
    try {
      const out = await run();
      setMsg({ ok: true, text: out?.text || "Thành công", hash: out?.hash });
      onDone?.(out);
    } catch (e) {
      setMsg({ ok: false, text: e.message });
    } finally {
      setBusy(false);
    }
  }
  const link = msg?.hash && txUrl(msg.hash);
  return (
    <span className="action">
      <button className={className} onClick={click} disabled={busy || disabled}>
        {busy ? "Đang xử lý…" : label}
      </button>
      {msg && (
        <span className={msg.ok ? "ok" : "error"}>
          {msg.text}
          {link && (
            <>
              {" "}
              <a href={link} target="_blank" rel="noreferrer">
                xem giao dịch
              </a>
            </>
          )}
        </span>
      )}
    </span>
  );
}

export const fmt = (n) => Number(n || 0).toLocaleString("vi-VN");
export const date = (d) => (d ? new Date(d).toLocaleDateString("vi-VN") : "");
