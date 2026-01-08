/**
 * USER onboarding: complete profile after registration/login.
 *
 * Required (Phase 1 UX):
 * - full name
 * - phone number
 * - profile photo
 * - default map location
 *
 * Note: DB fields remain optional per ERD; enforcement is done in UI routing.
 */

import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";

import { MapPicker, type LatLng } from "../../components/MapPicker";
import { api } from "../../lib/api";
import { getApiErrorMessage } from "../../lib/apiError";
import { normalizeWhatsAppPhone } from "../../lib/phone";
import { isUserProfileComplete } from "../../lib/profile";
import { toAbsoluteUrl } from "../../lib/urls";
import type { User } from "../../types/api";

export function CompleteProfilePage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const next = params.get("next") ?? "/packages";

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [defaultLoc, setDefaultLoc] = useState<LatLng | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoadError(null);
      try {
        const resp = await api.get("/users/me");
        const me = resp.data.data.user as User;
        if (!alive) return;
        setUser(me);
        setFullName(me.full_name);
        setPhone(me.phone_number);
        if (me.default_latitude != null && me.default_longitude != null) {
          setDefaultLoc({ lat: me.default_latitude, lng: me.default_longitude });
        }
      } catch (err) {
        if (alive) setLoadError(getApiErrorMessage(err));
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // Photo URL: prefer new file preview, fallback to existing photo
  const photoPreviewUrl = useMemo(() => {
    if (profilePhoto) {
      return URL.createObjectURL(profilePhoto);
    }
    return null;
  }, [profilePhoto]);

  const existingPhotoUrl = useMemo(() => toAbsoluteUrl(user?.profile_photo ?? null), [user?.profile_photo]);
  const photoUrl = photoPreviewUrl ?? existingPhotoUrl;
  const alreadyHasPhoto = Boolean(user?.profile_photo);

  // Cleanup preview URL when component unmounts or photo changes
  useEffect(() => {
    return () => {
      if (photoPreviewUrl) {
        URL.revokeObjectURL(photoPreviewUrl);
      }
    };
  }, [photoPreviewUrl]);

  if (loading) return <div className="text-sm text-slate-600">Loading profile...</div>;
  if (loadError) {
    return (
      <div className="rounded-xl border bg-white p-6">
        <div className="text-lg font-semibold">Could not load profile</div>
        <div className="mt-2 text-sm text-rose-700">{loadError}</div>
      </div>
    );
  }
  if (!user) return null;

  // If profile is already complete, send the user to where they wanted to go.
  if (isUserProfileComplete(user)) {
    return <Navigate to={next} replace />;
  }

  const missing: string[] = [];
  if (!fullName.trim()) missing.push("Full name");
  if (!phone.trim()) missing.push("Phone number");
  if (!alreadyHasPhoto && !profilePhoto) missing.push("Profile photo");
  if (!defaultLoc) missing.push("Default location");

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="text-xl font-semibold">Complete your profile</div>
        <div className="mt-1 text-sm text-slate-600">
          We’ll use this to prefill your future orders—so you don’t have to re-enter details again.
        </div>

        {missing.length > 0 ? (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <div className="font-semibold">Required to continue:</div>
            <div className="mt-1 text-amber-800">{missing.join(", ")}</div>
          </div>
        ) : null}

        {actionError ? (
          <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
            {actionError}
          </div>
        ) : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="text-sm font-semibold text-slate-800">Account</div>

          <div className="mt-4 grid gap-4">
            <label className="block">
              <div className="text-sm font-medium text-slate-700">Full name</div>
              <input
                className="mt-1 w-full rounded-lg border px-3 py-2"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </label>

            <label className="block">
              <div className="text-sm font-medium text-slate-700">Phone number</div>
              <input
                className="mt-1 w-full rounded-lg border px-3 py-2"
                type="tel"
                inputMode="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </label>
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="text-sm font-semibold text-slate-800">Profile photo</div>
          <div className="mt-4 flex items-start gap-4">
            <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-2xl border bg-slate-50">
              {photoUrl ? (
                <img
                  className="h-full w-full object-cover"
                  src={photoUrl}
                  alt="Profile photo"
                  crossOrigin="anonymous"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = "none";
                    const parent = target.parentElement;
                    if (parent && !parent.querySelector(".photo-placeholder")) {
                      const placeholder = document.createElement("div");
                      placeholder.className = "photo-placeholder flex h-full w-full items-center justify-center text-xs text-slate-400";
                      placeholder.textContent = "Failed to load";
                      parent.appendChild(placeholder);
                    }
                  }}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">No photo</div>
              )}
            </div>
            <div className="flex-1">
              <input
                className="w-full rounded-lg border bg-white px-3 py-2 text-sm"
                type="file"
                accept="image/*"
                aria-label="Upload profile photo"
                title="Upload profile photo"
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null;
                  setProfilePhoto(file);
                  setActionError(null);
                }}
              />
              <div className="mt-2 text-xs text-slate-500">
                {profilePhoto
                  ? `Selected: ${profilePhoto.name} (${(profilePhoto.size / 1024).toFixed(1)} KB)`
                  : "Please upload a clear photo. This helps operations verify the correct room/user."}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm lg:col-span-2">
          <MapPicker value={defaultLoc} onChange={setDefaultLoc} />
          <div className="mt-3 text-xs text-slate-500">
            This pin will be used as the default location for new orders (you can adjust per order).
          </div>
        </div>
      </div>

      <button
        className="rounded-lg bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-60"
        disabled={saving}
        onClick={async () => {
          setActionError(null);

          // Enforce completion before continuing.
          if (!fullName.trim()) return setActionError("Full name is required.");
          if (!phone.trim()) return setActionError("Phone number is required.");
          if (!defaultLoc) return setActionError("Default location is required.");
          if (!alreadyHasPhoto && !profilePhoto) return setActionError("Profile photo is required.");

          setSaving(true);
          try {
            const normalizedPhone = normalizeWhatsAppPhone(phone);
            if (!normalizedPhone) {
              setActionError("Nomor WhatsApp tidak valid. Contoh: +628123456789 atau 08123456789.");
              return;
            }

            const fd = new FormData();
            fd.append("full_name", fullName);
            fd.append("phone_number", normalizedPhone);
            fd.append("default_latitude", String(defaultLoc.lat));
            fd.append("default_longitude", String(defaultLoc.lng));
            if (profilePhoto) fd.append("profile_photo", profilePhoto);

            const resp = await api.put("/users/me", fd);
            const updated = resp.data.data.user as User;
            
            // Cleanup preview URL before updating user
            if (photoPreviewUrl) {
              URL.revokeObjectURL(photoPreviewUrl);
            }
            
            setUser(updated);
            setProfilePhoto(null);

            // Notify navbar to refresh profile photo
            window.dispatchEvent(new Event("profileUpdated"));

            // If complete, go to next route.
            if (isUserProfileComplete(updated)) {
              navigate(next, { replace: true });
            }
          } catch (err) {
            setActionError(getApiErrorMessage(err));
          } finally {
            setSaving(false);
          }
        }}
      >
        {saving ? "Saving..." : "Save & continue"}
      </button>
    </div>
  );
}


