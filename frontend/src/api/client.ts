const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";
export const WS_BASE_URL = import.meta.env.VITE_WS_BASE_URL ?? "ws://localhost:8000";
const TOKEN_KEY = "linguaspace_access_token";

export class ApiError extends Error {
  status: number;
  detail: string;

  constructor(status: number, detail: string) {
    super(detail);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }
}

export function getAccessToken() {
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setAccessToken(token: string | null) {
  if (token) window.localStorage.setItem(TOKEN_KEY, token);
  else window.localStorage.removeItem(TOKEN_KEY);
}

export function apiUrl(path: string) {
  return `${API_BASE_URL}${path}`;
}

function headers(init?: RequestInit, json = true) {
  const token = getAccessToken();
  return {
    ...(json ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(init?.headers ?? {}),
  };
}

async function detail(response: Response) {
  const body = await response.text();
  try {
    const parsed = JSON.parse(body) as { detail?: string };
    return parsed.detail ?? body;
  } catch {
    return body || `请求失败 (${response.status})`;
  }
}

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers: headers(init) });
  } catch {
    throw new ApiError(0, "无法连接后端服务，请检查 API 地址和服务状态。");
  }
  if (!response.ok) throw new ApiError(response.status, await detail(response));
  return response.json() as Promise<T>;
}

export function get<T>(path: string) {
  return request<T>(path);
}

export function post<T>(path: string, body?: unknown) {
  return request<T>(path, { method: "POST", body: body === undefined ? undefined : JSON.stringify(body) });
}

export function put<T>(path: string, body?: unknown) {
  return request<T>(path, { method: "PUT", body: body === undefined ? undefined : JSON.stringify(body) });
}

export function remove<T>(path: string) {
  return request<T>(path, { method: "DELETE" });
}

export async function upload<T>(path: string, form: FormData): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { method: "POST", headers: headers(undefined, false), body: form });
  } catch {
    throw new ApiError(0, "无法连接后端服务，请检查 API 地址和服务状态。");
  }
  if (!response.ok) throw new ApiError(response.status, await detail(response));
  return response.json() as Promise<T>;
}

export type StreamResult = {
  sessionId: string;
  sources: number;
};

export async function stream(path: string, body: unknown, onChunk: (chunk: string) => void): Promise<StreamResult> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { method: "POST", headers: headers(), body: JSON.stringify(body) });
  } catch {
    throw new ApiError(0, "无法连接后端服务，请检查 API 地址和服务状态。");
  }
  if (!response.ok || !response.body) throw new ApiError(response.status, await detail(response));
  const result = {
    sessionId: response.headers.get("X-LinguaSpace-Session") ?? "",
    sources: Number(response.headers.get("X-LinguaSpace-Sources") ?? 0),
  };
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    onChunk(decoder.decode(value, { stream: true }));
  }
  const tail = decoder.decode();
  if (tail) onChunk(tail);
  return result;
}
