/**
 * Route guard that enforces login + actor (USER vs ADMIN).
 */

import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";

import type { Actor } from "../lib/auth";
import { useAuth } from "../lib/auth";
import { useUserGlobal } from "./UserGlobalData";
import { PageSkeleton } from "./ui/PageSkeleton";

export function RequireActor({ actor, children }: { actor: Actor; children: ReactNode }) {
  const { token, actor: currentActor } = useAuth();
  const { loading } = useUserGlobal();
  const location = useLocation();

  // If we have a token but user data is still loading, wait before redirecting.
  // This prevents the "flash of login/landing page" when refreshing.
  if (token && loading) {
    return <PageSkeleton />;
  }

  if (!token) {
    const to = actor === "ADMIN" ? "/adminlokacleanmandalika/login" : "/login";
    return <Navigate to={to} replace state={{ from: location.pathname }} />;
  }

  if (currentActor !== actor) {
    // If token exists but actor is missing/mismatch, redirect to login to re-verify
    // instead of sending to Home (which causes a flash of landing page).
    // Login page will handle the redirect back to the intended destination.
    if (!currentActor) {
      const to = actor === "ADMIN" ? "/adminlokacleanmandalika/login" : "/login";
      return <Navigate to={to} replace state={{ from: location.pathname }} />;
    }

    // Hard separation: if a USER tries to access ADMIN routes (or vice versa),
    // redirect them to their correct area instead of letting them see the other login pages.
    if (currentActor === "ADMIN") return <Navigate to="/admin/orders" replace />;
    if (currentActor === "USER") return <Navigate to="/home" replace />;
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}


