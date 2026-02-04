/**
 * Route guard that enforces login + actor (USER vs ADMIN).
 */

import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";

import type { Actor } from "../lib/auth";
import { useAuth } from "../lib/auth";

export function RequireActor({ actor, children }: { actor: Actor; children: ReactNode }) {
  const { token, actor: currentActor } = useAuth();
  const location = useLocation();

  if (!token) {
    const to = actor === "ADMIN" ? "/adminlokacleanmandalika/login" : "/login";
    return <Navigate to={to} replace state={{ from: location.pathname }} />;
  }

  if (currentActor !== actor) {
    // Hard separation: if a USER tries to access ADMIN routes (or vice versa),
    // redirect them to their correct area instead of letting them see the other login pages.
    if (currentActor === "ADMIN") return <Navigate to="/admin/orders" replace />;
    if (currentActor === "USER") return <Navigate to="/home" replace />;
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}


