import { get, post, put, remove } from "./client";
import type { ApiList, User, UserRole } from "./types";

export const systemApi = {
  health: () => get<Record<string, unknown>>("/api/health"),
  architecture: () => get<Record<string, unknown>>("/api/architecture/audit"),
  users: () => get<ApiList<User>>("/api/users"),
  addUser: (payload: { username: string; password?: string; display_name?: string; role: UserRole; language?: string }) => post<User>("/api/users", payload),
  updateUserStatus: (id: string, status: "active" | "disabled" | "locked") => put<User>(`/api/users/${id}/status?status=${status}`),
  updateUser: (id: string, payload: { display_name: string; role: UserRole; language: string; status: string }) => put<User>(`/api/users/${id}`, payload),
  deleteUser: (id: string) => remove<{ ok: boolean }>(`/api/users/${id}`),
  modelLogs: () => get<ApiList<Record<string, unknown>>>("/api/logs/model-calls"),
  requestTraces: () => get<ApiList<Record<string, unknown>>>("/api/logs/request-traces"),
  dashboard: () => get<{ metrics: SystemMetrics; alerts: SystemAlert[] }>("/api/system/dashboard"),
  alerts: () => get<ApiList<SystemAlert>>("/api/system/alerts"),
  metrics: () => get<SystemMetrics>("/api/system/metrics"),
  settings: () => get<{ values: Record<string, unknown>; updated_at: string }>("/api/system/settings"),
  updateSettings: (values: Record<string, unknown>) => put<{ values: Record<string, unknown>; updated_at: string }>("/api/system/settings", { values }),
  roles: () => get<ApiList<Role>>("/api/roles"),
  permissions: () => get<ApiList<Permission>>("/api/permissions"),
  updateRolePermissions: (id: string, permission_ids: string[]) => put<Role>(`/api/roles/${id}/permissions`, { permission_ids }),
};

export type Role = { id: string; name: string; description: string; permissions: string[] };
export type Permission = { id: string; name: string; module: string };
export type SystemAlert = { id: string; level: string; source: string; title: string; detail: string };
export type SystemMetrics = { overview: Record<string, number>; sessions: number; feedback: number; model_calls: number; request_traces: number; rag_reliable_rate: number; capabilities: Record<string, { calls: number; avg_latency_ms: number; failed: number }> };
