import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api } from "../lib/api";
import { getApiErrorMessage } from "../lib/apiError";
import type { User } from "../types/api";
import { useAuth } from "../lib/auth";

type UserContextValue = {
  user: User | null;
  loading: boolean;
  error: string | null;
  refreshUser: () => Promise<void>;
};

const UserContext = createContext<UserContextValue | null>(null);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const { token, actor, setAuth } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = useCallback(async () => {
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      // Don't set loading to true on refresh to avoid UI flickering if data exists
      // But for first load, loading is true.
      const resp = await api.get("/users/me");
      const userData = resp.data.data.user as User;
      setUser(userData);
      setError(null);

      // Self-healing: If token is valid but actor is missing/wrong, restore it
      // This fixes the issue where missing actor in localStorage causes redirect to Landing Page
      if (userData.role && (!actor || actor !== userData.role)) {
        console.log("[UserGlobalData] Restoring missing/mismatched actor state:", userData.role);
        // Cast to any to avoid strict type checking issues if role string varies slightly, 
        // though it should match "USER" | "ADMIN"
        setAuth(token, userData.role as any); 
      }
    } catch (err) {
      const msg = getApiErrorMessage(err);
      // If 401/404, the interceptor handles it, but we catch it here too
      setError(msg);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [token, actor, setAuth]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return (
    <UserContext.Provider value={{ user, loading, error, refreshUser: fetchUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUserGlobal() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUserGlobal must be used within <UserProvider>");
  return ctx;
}
