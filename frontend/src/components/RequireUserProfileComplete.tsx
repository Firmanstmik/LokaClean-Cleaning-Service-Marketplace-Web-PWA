/**
 * Route guard for enforcing USER profile completion.
 *
 * This keeps the app flow clean:
 * - Registration/Login -> Complete Profile -> Use the marketplace.
 */

import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";

import { api } from "../lib/api";
import { getApiErrorMessage } from "../lib/apiError";
import { isUserProfileComplete } from "../lib/profile";
import type { User } from "../types/api";
import { CircularLoader } from "./ui/CircularLoader";
import { useUserGlobal } from "./UserGlobalData";

export function RequireUserProfileComplete() {
  const location = useLocation();
  const { user: me, loading, error } = useUserGlobal();

  if (loading) {
    return (
      <div className="flex min-h-[50vh] w-full items-center justify-center">
        <CircularLoader size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border bg-white p-6">
        <div className="text-lg font-semibold">Could not load profile</div>
        <div className="mt-2 text-sm text-rose-700">{error}</div>
        <div className="mt-2 text-sm text-slate-600">Please refresh and try again.</div>
      </div>
    );
  }

  if (!me) return <Outlet />;

  if (!isUserProfileComplete(me)) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/profile/complete?next=${next}`} replace />;
  }

  return <Outlet />;
}


