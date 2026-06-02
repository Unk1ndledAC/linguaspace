import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { authApi } from "../api/auth";
import { setAccessToken } from "../api/client";
import type { User } from "../api/types";

type AuthContextValue = {
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
};

const USER_KEY = "linguaspace_user";
const AuthContext = createContext<AuthContextValue | null>(null);

function savedUser() {
  const value = window.localStorage.getItem(USER_KEY);
  if (!value) return null;
  try {
    return JSON.parse(value) as User;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(savedUser);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      login: async (username, password) => {
        const result = await authApi.login(username, password);
        setAccessToken(result.token);
        window.localStorage.setItem(USER_KEY, JSON.stringify(result.user));
        setUser(result.user);
      },
      logout: () => {
        setAccessToken(null);
        window.localStorage.removeItem(USER_KEY);
        setUser(null);
      },
    }),
    [user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used within AuthProvider");
  return value;
}
