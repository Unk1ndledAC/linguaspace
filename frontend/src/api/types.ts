export type ApiList<T> = { items: T[] };
export type UserRole = "tourist" | "student" | "guide" | "admin";
export type User = { id: string; username: string; display_name: string; role: UserRole; language: string; status?: string };
export type LoginResponse = { token: string; user: User };
export type KnowledgeStats = {
  knowledge_items: number;
  graph_relations: number;
  places: number;
  routes: number;
  training_scenarios: number;
  terms: number;
  pending_reviews: number;
};
export type GuidePlace = { id: string; name: string; image_key: string; tags: string; sort_order: string };
export type GuideQuestion = { id: string; question: string; sort_order: string };
export type GuideContent = { places: GuidePlace[]; questions: GuideQuestion[] };
export type TouristMessage = {
  id: string;
  session_id: string;
  role: string;
  input_type: string;
  question: string;
  answer: string;
  sources_json?: string;
  reliable?: boolean | number;
  model?: string;
  provider?: string;
  created_at: string;
};

export type TouristSession = {
  id: string;
  visitor_name: string;
  language: string;
  location: string;
  status: string;
  messages: TouristMessage[];
  last_question?: string;
};
export type KnowledgeSource = { id: string; title: string; snippet: string; score?: number; match_terms?: string[] };
export type GraphRelation = { id: string; source: string; relation: string; target: string };
export type ChatResult = {
  session_id: string;
  question?: string;
  answer: string;
  translated_answer?: string;
  translation_note?: string;
  sources: KnowledgeSource[];
  graph?: GraphRelation[];
  reliable: boolean;
  provider: string;
  model?: string | null;
  retrieval?: { max_score: number; min_score: number; sources: number; search_question: string };
};
export type AudioAskResult = ChatResult & {
  audio_url: string;
  transcript: { text: string; language?: string; engine?: string; available?: boolean };
};
export type ImageAskResult = ChatResult & {
  upload: { url?: string; backend?: string };
  vision_summary: string;
};
export type TravelRoute = { route_key: string; name: string; match_terms: string; mode: string; reason: string; nodes: string; sort_order: string };
export type RouteFilter = { id?: string; label?: string; value?: string; category?: string; [key: string]: string | undefined };
export type RouteContent = { routes: TravelRoute[]; filters: RouteFilter[] };
export type Feedback = { id: string; message_id: string; rating: number; content: string; status: string; created_at: string };
export type Favorite = { id: string; session_id: string; item_type: string; item_id: string; title: string; created_at: string };
export type CultureTip = { id: string; title: string; summary: string; tags: string[]; source: string };
export type OverviewStats = { knowledge_items: number; graph_relations: number; routes: number; terms: number; today_questions: number; today_sessions: number; pending_reviews: number };
