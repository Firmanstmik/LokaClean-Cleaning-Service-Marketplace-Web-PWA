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
  const { token } = useAuth();
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
      setUser(resp.data.data.user as User);
      setError(null);
    } catch (err) {
      const msg = getApiErrorMessage(err);
      // If 401/404, the interceptor handles it, but we catch it here too
      setError(msg);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [token]);

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
