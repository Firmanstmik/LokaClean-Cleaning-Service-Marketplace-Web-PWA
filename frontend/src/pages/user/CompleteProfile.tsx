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

import { useEffect, useMemo, useRef, useState } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  User as UserIcon, 
  Phone, 
  MapPin, 
  Camera, 
  AlertCircle, 
  ChevronRight,
  Fingerprint,
  Compass,
  ShieldCheck
} from "lucide-react";

import { MapPicker, type LatLng } from "../../components/MapPicker";
import { api } from "../../lib/api";
import { getApiErrorMessage } from "../../lib/apiError";
import { normalizeWhatsAppPhone } from "../../lib/phone";
import { isUserProfileComplete } from "../../lib/profile";
import { toAbsoluteUrl } from "../../lib/urls";
import { t, useCurrentLanguage } from "../../lib/i18n";
import type { User } from "../../types/api";

export function CompleteProfilePage() {
  useCurrentLanguage(); // Force re-render on language change
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
  const [address, setAddress] = useState("");
  const [geocodingAddress, setGeocodingAddress] = useState(false);
  const addressGeocodeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const addressFromMapRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    if (addressGeocodeTimeoutRef.current) {
      clearTimeout(addressGeocodeTimeoutRef.current);
    }

    if (!address || address.trim().length === 0 || addressFromMapRef.current) {
      addressFromMapRef.current = false;
      return;
    }

    if (address.trim().length < 3) {
      return;
    }

    addressGeocodeTimeoutRef.current = setTimeout(async () => {
      try {
        setGeocodingAddress(true);
        const resp = await api.get("/geo/forward", {
          params: { q: address.trim() }
        });
        const data = resp.data.data;
        if (data && typeof data.lat === "number" && typeof data.lng === "number") {
          setDefaultLoc({ lat: data.lat, lng: data.lng });
        }
      } catch (err) {
        if (import.meta.env.DEV) {
          console.warn("[CompleteProfile] Forward geocoding failed:", err);
        }
      } finally {
        setGeocodingAddress(false);
      }
    }, 800);

    return () => {
      if (addressGeocodeTimeoutRef.current) {
        clearTimeout(addressGeocodeTimeoutRef.current);
      }
    };
  }, [address]);

  // Validation States
  const isPhotoValid = useMemo(() => !!photoUrl, [photoUrl]);
  const isInfoValid = useMemo(() => !!(fullName.trim() && phone.trim()), [fullName, phone]);
  const isLocationValid = useMemo(() => !!defaultLoc, [defaultLoc]);

  if (loading) return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-8">
      <motion.div 
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        className="h-10 w-10 rounded-full border-4 border-indigo-200 border-t-indigo-600"
      />
      <p className="mt-4 text-sm font-medium text-slate-500 animate-pulse">{t("completeProfile.preparing")}</p>
    </div>
  );

  if (loadError) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-4">
        <div className="w-full max-w-md rounded-3xl border-2 border-rose-100 bg-white p-8 text-center shadow-xl">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-rose-50 text-rose-500">
            <AlertCircle className="h-8 w-8" />
          </div>
          <h3 className="text-xl font-black text-slate-900">{t("completeProfile.connectionIssue")}</h3>
          <p className="mt-2 text-sm text-slate-600">{loadError || t("completeProfile.connectionIssueText")}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-6 w-full rounded-xl bg-slate-900 py-3 text-sm font-bold text-white transition-transform active:scale-95"
          >
            {t("completeProfile.tryAgain")}
          </button>
        </div>
      </div>
    );
  }
  
  if (!user) return null;

  // If profile is already complete, send the user to where they wanted to go.
  if (isUserProfileComplete(user)) {
    return <Navigate to={next} replace />;
  }

  const missing: string[] = [];
  if (!fullName.trim()) missing.push("Full Name");
  if (!phone.trim()) missing.push("Phone Number");
  if (!alreadyHasPhoto && !profilePhoto) missing.push("Profile Photo");
  if (!defaultLoc) missing.push("Default Location");

  // Calculate progress
  const totalFields = 4;
  const completedFields = totalFields - missing.length;
  const progressPercentage = (completedFields / totalFields) * 100;

  return (
    <div className="bg-[#F0F2F5]">
      {/* Header Card (Facebook Style) */}
      <div className="bg-white shadow-sm mb-4">
        {/* Cover Photo Area */}
        <div className="relative h-32 sm:h-48 bg-gradient-to-r from-teal-500 via-blue-600 to-purple-600">
          <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.1)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.1)_50%,rgba(255,255,255,0.1)_75%,transparent_75%,transparent)] bg-[length:20px_20px] opacity-20" />
        </div>

        {/* Profile Info Area */}
        <div className="px-4 pb-6 -mt-12 sm:-mt-16 flex flex-col items-center relative z-10">
          <div className="relative group">
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="h-24 w-24 sm:h-32 sm:w-32 rounded-full border-4 border-white bg-slate-100 shadow-md overflow-hidden cursor-pointer relative"
            >
              {photoUrl ? (
                <img src={photoUrl} className="h-full w-full object-cover" alt="Profile" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-slate-300 bg-slate-50">
                  <UserIcon className="h-10 w-10 sm:h-12 sm:w-12" />
                </div>
              )}
            </div>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-slate-700 shadow-sm border-2 border-white transition-colors hover:bg-slate-300"
            >
              <Camera className="h-4 w-4" />
            </button>
          </div>
          
          <div className="mt-3 text-center">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">{fullName || t("completeProfile.fullNamePlaceholder") || "Nama Pengguna"}</h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">{t("completeProfile.subtitle")}</p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 pb-4 space-y-3">
        {/* Progress Indicator */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 mb-2">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest mb-2 text-slate-400">
            <span>{t("completeProfile.completionStatus")}</span>
            <span className="text-blue-600">{Math.round(progressPercentage)}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              className="h-full bg-gradient-to-r from-teal-400 to-blue-500"
            />
          </div>
        </div>

        {/* Grid Layout for Inputs (Facebook Menu Style) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          
          {/* Full Name Card */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-3 flex flex-col gap-2">
            <div className="flex items-center gap-2 mb-1">
              <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                <UserIcon className="h-5 w-5" />
              </div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t("completeProfile.fullName")}</label>
            </div>
            <input
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10 transition-all"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder={t("completeProfile.fullNamePlaceholder")}
            />
          </div>

          {/* Phone Card */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-3 flex flex-col gap-2">
            <div className="flex items-center gap-2 mb-1">
              <div className="h-8 w-8 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600 shrink-0">
                <Phone className="h-5 w-5" />
              </div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t("completeProfile.phone")}</label>
            </div>
            <input
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10 transition-all"
              type="tel"
              inputMode="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={t("completeProfile.phonePlaceholder")}
            />
          </div>

          {/* Location Map Card (Full Width) */}
          <div className="sm:col-span-2 bg-white rounded-xl shadow-sm border border-slate-100 p-3 flex flex-col gap-3">
             <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600 shrink-0">
                  <Compass className="h-5 w-5" />
                </div>
                <h2 className="text-sm font-bold text-slate-900">{t("completeProfile.defaultLocation")}</h2>
             </div>
             <div className="rounded-lg overflow-hidden border border-slate-200 shadow-sm">
                <MapPicker
                  value={defaultLoc}
                  onChange={setDefaultLoc}
                  onAddressChange={(addr) => {
                    if (!addr) return;
                    addressFromMapRef.current = true;
                    setAddress(addr);
                  }}
                  hideLabel
                />
             </div>
          </div>

          {/* Address Detail Card (Full Width) */}
          <div className="sm:col-span-2 bg-white rounded-xl shadow-sm border border-slate-100 p-3 flex flex-col gap-2">
            <div className="flex items-center gap-2 mb-1">
              <div className="h-8 w-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600 shrink-0">
                <MapPin className="h-5 w-5" />
              </div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t("completeProfile.addressDetailLabel")}</label>
            </div>
            <div className="relative">
               <textarea
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-900 outline-none focus:border-teal-500 focus:bg-white focus:ring-2 focus:ring-teal-500/10 transition-all min-h-[80px] resize-none leading-relaxed"
                  value={address}
                  onChange={(e) => {
                     addressFromMapRef.current = false;
                     setAddress(e.target.value);
                  }}
                  placeholder={t("completeProfile.addressPlaceholder")}
               />
               {geocodingAddress && (
                 <div className="absolute right-3 bottom-3">
                   <motion.div 
                     animate={{ rotate: 360 }}
                     transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                     className="h-4 w-4 rounded-full border-2 border-slate-300 border-t-teal-500"
                   />
                 </div>
               )}
            </div>
          </div>
        </div>

        {/* Important Note Section (Grid Style) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-100 flex items-start gap-2">
              <div className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                {t("completeProfile.noteAddress")}
              </p>
            </div>
            <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-100 flex items-start gap-2">
              <div className="mt-1 h-1.5 w-1.5 rounded-full bg-teal-500 shrink-0" />
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                {t("completeProfile.notePhoto")}
              </p>
            </div>
        </div>

        {/* File Input */}
        <input
          ref={fileInputRef}
          className="hidden"
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0] ?? null;
            if (file) {
              if (file.size > 10 * 1024 * 1024) {
                setActionError(t("completeProfile.errorPhotoSize") || "Ukuran file terlalu besar (maks 10MB).");
                return;
              }
              setProfilePhoto(file);
              setActionError(null);
            }
          }}
        />

        {/* Save Button */}
        <div className="pt-2 pb-2">
          <button
            onClick={async () => {
              if (saving) return;

              // Validate sections
              if (!isPhotoValid) {
                window.scrollTo({ top: 0, behavior: 'smooth' });
                setActionError(t("completeProfile.errorPhoto"));
                return;
              }
              if (!isInfoValid) {
                setActionError(t("completeProfile.errorName"));
                return;
              }
              if (!isLocationValid) {
                setActionError(t("completeProfile.errorLocation"));
                return;
              }

              setSaving(true);
              setActionError(null);

              try {
                const normalizedPhone = normalizeWhatsAppPhone(phone);
                if (!normalizedPhone) {
                  setActionError(t("profile.invalidPhoneNumber"));
                  setSaving(false);
                  return;
                }

                if (!defaultLoc) {
                  setActionError(t("completeProfile.errorLocation"));
                  setSaving(false);
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
                
                if (photoPreviewUrl) {
                  URL.revokeObjectURL(photoPreviewUrl);
                }
                
                setUser(updated);
                setProfilePhoto(null);
                window.dispatchEvent(new Event("profileUpdated"));
                navigate(next, { replace: true });
              } catch (err) {
                setActionError(getApiErrorMessage(err));
                setSaving(false);
              }
            }}
            disabled={saving}
            className="w-full rounded-xl bg-gradient-to-r from-teal-500 to-blue-600 p-4 text-white shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2"
          >
             {saving ? (
                <>
                   <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                   <span className="font-bold text-sm uppercase tracking-wider">{t("completeProfile.saving")}</span>
                </>
             ) : (
                <>
                   <span className="font-bold text-sm uppercase tracking-wider">{t("completeProfile.save")}</span>
                   <ChevronRight className="h-5 w-5" />
                </>
             )}
          </button>
          
          {actionError && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 text-center text-xs font-bold text-rose-500 bg-rose-50 py-3 px-4 rounded-xl border border-rose-100 shadow-sm"
            >
              {actionError}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
