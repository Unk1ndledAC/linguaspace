import { post } from "./client";
import type { LoginResponse } from "./types";

export const authApi = {
  login: (username: string, password: string) => post<LoginResponse>("/api/auth/login", { username, password }),
};
