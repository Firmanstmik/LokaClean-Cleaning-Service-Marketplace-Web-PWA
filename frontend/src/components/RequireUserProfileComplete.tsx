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

export function RequireUserProfileComplete() {
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [me, setMe] = useState<User | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      setError(null);
      try {
        const resp = await api.get("/users/me");
        const user = resp.data.data.user as User;
        if (!alive) return;
        setMe(user);
      } catch (err) {
        if (!alive) return;
        
        // Backup: If interceptor failed to catch 404 (User not found), handle it here
        // This ensures the user isn't stuck on a broken screen
        const msg = getApiErrorMessage(err);
        if (msg.toLowerCase().includes("user not found") || msg.toLowerCase().includes("account not found")) {
           console.log("[RequireUserProfileComplete] User not found (backup handler). Redirecting...");
           localStorage.removeItem("lokaclean_token");
           localStorage.removeItem("lokaclean_actor");
           window.location.href = "/register";
           return;
        }

        setError(msg);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  if (loading) {
    return <div className="text-sm text-slate-600">Checking your profile...</div>;
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

  if (!me) return null;

  if (!isUserProfileComplete(me)) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/profile/complete?next=${next}`} replace />;
  }

  return <Outlet />;
}


