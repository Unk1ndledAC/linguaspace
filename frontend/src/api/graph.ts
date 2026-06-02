import { get, post, put, remove } from "./client";
import type { ApiList } from "./types";

export type GraphRelation = { id: string; source: string; relation: string; target: string };

export const graphApi = {
  list: (keyword = "") => get<ApiList<GraphRelation>>(`/api/graph?keyword=${encodeURIComponent(keyword)}`),
  query: (entity: string) => post<ApiList<GraphRelation>>("/api/graph/query", { entity }),
  create: (relation: Omit<GraphRelation, "id">) => post<GraphRelation>("/api/graph", relation),
  update: (id: string, relation: Omit<GraphRelation, "id">) => put<GraphRelation>(`/api/graph/${id}`, relation),
  remove: (id: string) => remove<{ ok: boolean }>(`/api/graph/${id}`),
};
