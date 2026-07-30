"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { authApi } from "@/lib/api";

type AuthUser = {
  id: string;
  email: string;
  name: string;
  plan: string;
};

type LoginPayload = {
  email: string;
  password: string;
};

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

function isValidAuthUser(value: unknown): value is AuthUser {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<AuthUser>;
  return (
    typeof candidate.id === "string" &&
    isUuid(candidate.id) &&
    typeof candidate.email === "string" &&
    typeof candidate.name === "string" &&
    typeof candidate.plan === "string"
  );
}

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => void;
};

const TOKEN_KEY = "study_planner_token";
const USER_KEY = "study_planner_user";

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = window.localStorage.getItem(TOKEN_KEY);
    const storedUser = window.localStorage.getItem(USER_KEY);

    if (storedToken) {
      setToken(storedToken);
    }

    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser) as unknown;
        if (isValidAuthUser(parsedUser)) {
          setUser(parsedUser);
        } else {
          window.localStorage.removeItem(USER_KEY);
          window.localStorage.removeItem(TOKEN_KEY);
        }
      } catch {
        window.localStorage.removeItem(USER_KEY);
        window.localStorage.removeItem(TOKEN_KEY);
      }
    }

    setLoading(false);
  }, []);

  async function login(payload: LoginPayload) {
    const response = await authApi.post("/api/auth/login", payload);
    const nextToken = response.data?.access_token as string | undefined;
    const nextUser = response.data?.user as unknown;

    if (!nextToken || !isValidAuthUser(nextUser)) {
      throw new Error("Invalid login response");
    }

    setToken(nextToken);
    setUser(nextUser);
    window.localStorage.setItem(TOKEN_KEY, nextToken);
    window.localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
  }

  function logout() {
    setToken(null);
    setUser(null);
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(USER_KEY);
  }

  const value = useMemo<AuthContextValue>(
    () => ({ user, token, loading, login, logout }),
    [user, token, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return ctx;
}
