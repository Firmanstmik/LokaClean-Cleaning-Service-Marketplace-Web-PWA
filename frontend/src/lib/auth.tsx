/**
 * Minimal auth state for Phase 1.
 *
 * We have two actors:
 * - USER (tourist)
 * - ADMIN (operator)
 *
 * We store JWT in localStorage for simplicity. In production, consider httpOnly cookies.
 */

/* eslint-disable react-refresh/only-export-components */
// We intentionally export both the provider and the hook from one module for ergonomics.
// If Fast Refresh constraints become an issue, split `AuthProvider` and `useAuth` into separate files.

import React, { createContext, useContext, useMemo, useState } from "react";

export type Actor = "USER" | "ADMIN";

type AuthContextValue = {
  token: string | null;
  actor: Actor | null;
  setAuth: (token: string, actor: Actor) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function readInitialAuth(): { token: string | null; actor: Actor | null } {
  const token = localStorage.getItem("lokaclean_token");
  const actorRaw = localStorage.getItem("lokaclean_actor");
  const actor = actorRaw === "USER" || actorRaw === "ADMIN" ? actorRaw : null;
  return { token, actor };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => readInitialAuth().token);
  const [actor, setActor] = useState<Actor | null>(() => readInitialAuth().actor);

  const value = useMemo<AuthContextValue>(() => {
    return {
      token,
      actor,
      setAuth: (nextToken, nextActor) => {
        localStorage.setItem("lokaclean_token", nextToken);
        localStorage.setItem("lokaclean_actor", nextActor);
        setToken(nextToken);
        setActor(nextActor);
      },
      logout: () => {
        localStorage.removeItem("lokaclean_token");
        localStorage.removeItem("lokaclean_actor");
        setToken(null);
        setActor(null);
      }
    };
  }, [token, actor]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}


