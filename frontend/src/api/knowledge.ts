import { get, post, put, remove } from "./client";
import type { ApiList, KnowledgeSource, KnowledgeStats } from "./types";

export type ReviewTask = {
  id: string;
  object_type: string;
  object_id: string;
  title: string;
  content: string;
  source: string;
  tags_json: string;
  status: string;
  reviewer: string;
  comment: string;
  created_at: string;
  updated_at: string;
};

export type Term = { id: string; zh_name: string; language: string; translation: string; scene: string; status: string; created_at: string };
export type KnowledgeDocument = { id: string; title: string; source: string; content: string; status: string; vector_status: string; chunk_count: number; updated_at: string };
export type KnowledgeChunk = { id: string; document_id: string; title: string; content: string; tags_json: string; status: string; vector_status: string; updated_at: string };
export type KnowledgeStatistics = KnowledgeStats & { documents: number; chunks: number; vectorized_chunks: number; vector_coverage: number; rag: number };

export const knowledgeApi = {
  stats: () => get<KnowledgeStats>("/api/knowledge/stats"),
  documents: () => get<ApiList<KnowledgeDocument>>("/api/knowledge/documents"),
  deleteDocument: (id: string) => remove<{ ok: boolean }>(`/api/knowledge/documents/${id}`),
  splitDocument: (id: string) => post<Record<string, unknown>>(`/api/knowledge/documents/${id}/split`),
  vectorizeDocument: (id: string) => post<Record<string, unknown>>(`/api/knowledge/documents/${id}/vectorize`),
  chunks: () => get<ApiList<KnowledgeChunk>>("/api/knowledge/chunks"),
  addChunk: (payload: { document_id: string; title: string; content: string; tags?: string[] }) => post<KnowledgeChunk>("/api/knowledge/chunks", payload),
  updateChunk: (id: string, payload: { document_id: string; title: string; content: string; tags?: string[] }) => put<KnowledgeChunk>(`/api/knowledge/chunks/${id}`, payload),
  deleteChunk: (id: string) => remove<{ ok: boolean }>(`/api/knowledge/chunks/${id}`),
  vectorizeChunk: (id: string) => post<KnowledgeChunk>(`/api/knowledge/chunks/${id}/vectorize`),
  reviewTasks: (status = "") => get<ApiList<ReviewTask>>(`/api/review/tasks${status ? `?status=${encodeURIComponent(status)}` : ""}`),
  decideReview: (id: string, status: "approved" | "rejected" | "offline", comment = "") => post<ReviewTask>(`/api/review/tasks/${id}/decision`, { status, comment }),
  terms: () => get<ApiList<Term>>("/api/terms"),
  addTerm: (payload: Omit<Term, "id" | "status" | "created_at">) => post<Term>("/api/terms", payload),
  updateTerm: (id: string, payload: Omit<Term, "id" | "status" | "created_at">) => put<Term>(`/api/terms/${id}`, payload),
  deleteTerm: (id: string) => remove<{ ok: boolean }>(`/api/terms/${id}`),
  importTerms: (items: Array<Omit<Term, "id" | "status" | "created_at">>) => post<{ items: Term[]; created: number }>("/api/terms/import", { items }),
  checkTerms: (text: string) => post<{ matched: number; items: Term[] }>("/api/terms/check", { text }),
  search: (query: string, top_k = 5) => post<ApiList<KnowledgeSource>>("/api/knowledge/search", { query, top_k }),
  statistics: () => get<KnowledgeStatistics>("/api/knowledge/statistics"),
};
