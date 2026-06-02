import { get, post, put, remove, stream, upload } from "./client";
import type { ApiList, AudioAskResult, ChatResult, CultureTip, Favorite, Feedback, GuideContent, ImageAskResult, OverviewStats, RouteContent, TouristSession, TravelRoute } from "./types";

export const touristApi = {
  createSession: (payload: { language?: string; location?: string; visitor_name?: string }) => post<TouristSession>("/api/sessions", payload),
  sessions: () => get<ApiList<TouristSession>>("/api/sessions"),
  session: (id: string) => get<TouristSession>(`/api/sessions/${id}`),
  guideContent: () => get<GuideContent>("/api/content/guide"),
  ask: (payload: { question: string; language?: string; location?: string; session_id?: string }) => post<ChatResult>("/api/chat", payload),
  askStream: (payload: { question: string; language?: string; location?: string; session_id?: string }, onChunk: (chunk: string) => void) => stream("/api/chat/stream", payload, onChunk),
  routes: () => get<RouteContent>("/api/content/routes"),
  recommendRoute: (payload: { visitor_type?: string; interest?: string; language?: string }) => post<ApiList<TravelRoute>>("/api/route/recommend", payload),
  askImage: (file: File, question: string, options?: { session_id?: string; language?: string; location?: string }) => {
    const form = new FormData();
    form.append("file", file);
    form.append("question", question);
    if (options?.session_id) form.append("session_id", options.session_id);
    if (options?.language) form.append("language", options.language);
    if (options?.location) form.append("location", options.location);
    return upload<ImageAskResult>("/api/image/ask", form);
  },
  transcribeAudio: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return upload<Record<string, unknown>>("/api/audio/transcribe", form);
  },
  askAudio: (file: File, options?: { session_id?: string; language?: string; location?: string }) => {
    const form = new FormData();
    form.append("file", file);
    if (options?.session_id) form.append("session_id", options.session_id);
    if (options?.language) form.append("language", options.language);
    if (options?.location) form.append("location", options.location);
    return upload<AudioAskResult>("/api/audio/ask", form);
  },
  synthesize: (text: string) => post<{ url: string; engine: string }>("/api/tts/synthesize", { text }),
  feedback: () => get<ApiList<Feedback>>("/api/feedback"),
  addFeedback: (payload: { message_id?: string; rating: number; content?: string }) => post<Feedback>("/api/feedback", payload),
  overview: () => get<OverviewStats>("/api/stats/overview"),
  home: (sessionId = "") => get<{ overview: OverviewStats; guide: GuideContent; routes: TravelRoute[]; favorites: Favorite[]; weather: { status: string; note: string } }>(`/api/tourist/home${sessionId ? `?session_id=${encodeURIComponent(sessionId)}` : ""}`),
  cultureTips: (keyword = "") => get<ApiList<CultureTip>>(`/api/tourist/culture-tips${keyword ? `?keyword=${encodeURIComponent(keyword)}` : ""}`),
  favorites: (sessionId = "") => get<ApiList<Favorite>>(`/api/tourist/favorites${sessionId ? `?session_id=${encodeURIComponent(sessionId)}` : ""}`),
  addFavorite: (payload: { session_id?: string; item_type: string; item_id: string; title: string }) => post<Favorite>("/api/tourist/favorites", payload),
  deleteFavorite: (id: string) => remove<{ ok: boolean }>(`/api/tourist/favorites/${id}`),
  handoff: (session_id: string, note = "") => post<{ session_id: string; status: string }>("/api/tourist/handoff", { session_id, note }),
  updatePreferences: (payload: { session_id: string; language: string; location: string }) => put<{ session_id: string; language: string; location: string }>("/api/tourist/preferences", payload),
};
