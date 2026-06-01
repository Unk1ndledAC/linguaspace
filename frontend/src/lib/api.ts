const BASE = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";

async function json<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE}${path}`, { headers: { "Content-Type": "application/json", ...(options?.headers ?? {}) }, ...options });
  if (!response.ok) throw new Error(await response.text());
  return response.json();
}

export type Knowledge = { id: string; title: string; snippet: string; content: string; tags: string[] };
export type Relation = { id: string; source: string; relation: string; target: string };

export const api = {
  health: () => json<any>("/api/health"),
  knowledge: () => json<{ items: Knowledge[] }>("/api/knowledge"),
  addKnowledge: (data: Partial<Knowledge>) => json("/api/knowledge", { method: "POST", body: JSON.stringify(data) }),
  updateKnowledge: (id: string, data: Partial<Knowledge>) => json(`/api/knowledge/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteKnowledge: (id: string) => json(`/api/knowledge/${id}`, { method: "DELETE" }),
  graph: (keyword = "") => json<{ items: Relation[] }>(`/api/graph?keyword=${encodeURIComponent(keyword)}`),
  addRelation: (data: Omit<Relation, "id">) => json("/api/graph", { method: "POST", body: JSON.stringify(data) }),
  deleteRelation: (id: string) => json(`/api/graph/${id}`, { method: "DELETE" }),
  scenarios: () => json<{ items: any[] }>("/api/training/scenarios"),
  score: (data: any) => json<any>("/api/training/score", { method: "POST", body: JSON.stringify(data) }),
  guideQuestions: () => json<{ items: any[] }>("/api/guide/questions"),
  review: (data: any) => json("/api/guide/questions/review", { method: "POST", body: JSON.stringify(data) }),
  route: (data: any) => json<any>("/api/route/recommend", { method: "POST", body: JSON.stringify(data) }),
  logs: () => json<{ items: any[] }>("/api/logs/model-calls"),
  stream: async (question: string, onChunk: (text: string) => void) => {
    const response = await fetch(`${BASE}/api/chat/stream`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question }) });
    if (!response.ok || !response.body) throw new Error(await response.text());
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      onChunk(decoder.decode(value, { stream: true }));
    }
  },
  image: async (file: File, question: string) => {
    const form = new FormData();
    form.append("file", file);
    form.append("question", question);
    const response = await fetch(`${BASE}/api/image/ask`, { method: "POST", body: form });
    if (!response.ok) throw new Error(await response.text());
    return response.json();
  },
};
