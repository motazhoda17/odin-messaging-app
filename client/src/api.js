// A tiny wrapper around fetch() for talking to our Express API.
// It adds the JWT, sends/receives JSON and turns errors into exceptions.

const BASE_URL = import.meta.env.VITE_API_URL || "";
const TOKEN_KEY = "chatter-token";

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

// Thrown when the API answers with an error status.
export class ApiError extends Error {
  constructor(status, messages) {
    super(messages.join(" "));
    this.status = status;
    this.messages = messages;
  }
}

export async function api(path, { method = "GET", body } = {}) {
  const headers = {};
  const token = tokenStore.get();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body) headers["Content-Type"] = "application/json";

  const res = await fetch(`${BASE_URL}/api${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    // Our API sends either { errors: [...] } or { error: "..." }.
    const messages = data.errors || [data.error || `Request failed (${res.status})`];
    throw new ApiError(res.status, messages);
  }
  return data;
}
