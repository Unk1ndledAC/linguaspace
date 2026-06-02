import { get, post } from "./client";
import type { ApiList, ScoreReport, TrainingRecord, TrainingScenario } from "./types";

export const trainingApi = {
  scenarios: () => get<ApiList<TrainingScenario>>("/api/training/scenarios"),
  score: (payload: { scenario: string; question: string; answer: string }) =>
    post<ScoreReport>("/api/training/score", payload),
  records: () => get<ApiList<TrainingRecord>>("/api/training/records"),
};
