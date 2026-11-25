const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

export const TOKEN_KEY = "carbon.jwt";

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

/** Gọi API backend; tự gắn JWT nếu đã đăng nhập. Ném Error với thông báo tiếng Việt từ server. */
export async function api(path, { method = "GET", body, form } = {}) {
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  let payload;
  if (form) payload = form;
  else if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }
  const res = await fetch(`${BASE}${path}`, { method, headers, body: payload });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Lỗi ${res.status}`);
  return data;
}

export async function uploadFile(file) {
  const form = new FormData();
  form.append("file", file);
  return api("/documents", { method: "POST", form });
}

export const documentUrl = (hash) => `${BASE}/documents/${hash}?download`;
