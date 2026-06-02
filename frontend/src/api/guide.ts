import { get, post, put, remove } from "./client";
import type { ApiList, TouristSession } from "./types";

export type GuideCorrection = { id: string; record_id: string; mode: string; guide_note: string; optimized_answer: string; status: string; created_at: string };
export type CollaborationCase = { id: string; case_type: string; question: string; strategy: string; guide_note: string; sort_order: string; updated_at: string };
export type TakeoverLog = { id: string; session_id: string; action: string; guide_id: string; note: string; created_at: string };
export type GuideProfile = { id: string; display_name: string; bio: string; languages: string[]; specialties: string[]; stats: { takeovers: number; corrections: number; replies: number } };

export const guideApi = {
  sessions: () => get<ApiList<TouristSession>>("/api/collaboration/sessions"),
  corrections: () => get<ApiList<GuideCorrection>>("/api/collaboration/corrections"),
  cases: () => get<ApiList<CollaborationCase>>("/api/collaboration/cases"),
  takeover: (sessionId: string) => post<Record<string, unknown>>(`/api/sessions/${sessionId}/takeover`),
  release: (sessionId: string) => post<Record<string, unknown>>(`/api/sessions/${sessionId}/release`),
  takeoverLogs: () => get<ApiList<TakeoverLog>>("/api/guide/takeover-logs"),
  profile: () => get<GuideProfile>("/api/guide/profile"),
  reply: (sessionId: string, answer: string) => post<Record<string, unknown>>(`/api/sessions/${sessionId}/guide-reply`, { answer }),
  review: (payload: { record_id: string; mode?: string; guide_note?: string; optimized_answer?: string }) => post<Record<string, unknown>>("/api/guide/questions/review", payload),
  addCorrection: (payload: { question: string; ai_answer?: string; guide_note?: string }) => post<GuideCorrection>("/api/collaboration/correction", payload),
  updateCorrection: (id: string, payload: { guide_note?: string; optimized_answer?: string; status?: string }) => put<GuideCorrection>(`/api/collaboration/corrections/${id}`, payload),
  addCase: (payload: Omit<CollaborationCase, "id" | "sort_order" | "updated_at">) => post<CollaborationCase>("/api/collaboration/cases", payload),
  updateCase: (id: string, payload: Omit<CollaborationCase, "id" | "sort_order" | "updated_at">) => put<CollaborationCase>(`/api/collaboration/cases/${id}`, payload),
  deleteCase: (id: string) => remove<{ ok: boolean }>(`/api/collaboration/cases/${id}`),
};
