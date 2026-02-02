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
import { motion, AnimatePresence } from "framer-motion";
import { 
  User as UserIcon, 
  Phone, 
  MapPin, 
  Camera, 
  Save, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  ChevronRight,
  ArrowRight
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
    <div className="max-w-3xl mx-auto space-y-4 sm:space-y-6 pb-10">
      {/* Header Section */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal-500 via-blue-600 to-purple-700 p-5 sm:p-10 text-white shadow-[0_20px_40px_-10px_rgba(0,0,0,0.3)] ring-1 ring-white/20"
      >
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3] 
          }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute top-0 right-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-white/20 blur-3xl" 
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.4, 0.2] 
          }}
          transition={{ duration: 10, repeat: Infinity, delay: 1 }}
          className="absolute bottom-0 left-0 -mb-10 -ml-10 h-40 w-40 rounded-full bg-teal-400/30 blur-2xl" 
        />
        
        <div className="relative z-10">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-white/20 backdrop-blur-md text-[9px] sm:text-xs font-bold uppercase tracking-wider border border-white/10 shadow-sm">
                  {t("completeProfile.step2")}
                </span>
                <span className="flex h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-teal-300 animate-pulse" />
              </div>
              <h1 className="text-xl sm:text-4xl font-black tracking-tight leading-tight">
                {t("completeProfile.title")}
              </h1>
              <p className="mt-2 sm:mt-3 text-blue-50 text-xs sm:text-base max-w-lg leading-relaxed font-medium">
                {t("completeProfile.subtitle")}
              </p>
            </div>
            <div className="hidden sm:flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 shadow-inner rotate-3 hover:rotate-6 transition-transform">
              <Sparkles className="h-8 w-8 text-yellow-300 drop-shadow-lg" />
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-6 sm:mt-8">
            <div className="flex items-center justify-between text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-1.5 sm:mb-2 text-blue-100">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                {t("completeProfile.completionStatus")}
              </span>
              <span>{Math.round(progressPercentage)}%</span>
            </div>
            <div className="h-2 sm:h-3 w-full rounded-full bg-black/20 backdrop-blur-sm overflow-hidden border border-white/10">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-teal-300 via-emerald-300 to-teal-300 shadow-[0_0_15px_rgba(94,234,212,0.6)]"
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-12">
        {/* Left Column: Photo & Personal Info */}
        <div className="lg:col-span-5 space-y-4 sm:space-y-6">
          {/* Photo Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-3xl border-0 bg-white p-4 sm:p-6 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.25)] hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.3)] transition-all duration-500"
          >
            <div className="text-center">
              <h3 className="text-base sm:text-lg font-black text-slate-900">{t("completeProfile.profilePhoto")}</h3>
              <p className="text-[10px] sm:text-xs text-slate-500 mt-1 mb-4 sm:mb-6">{t("completeProfile.uploadPhotoHint")}</p>
              
              <div className="relative mx-auto h-24 w-24 sm:h-32 sm:w-32 group">
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="relative h-full w-full cursor-pointer overflow-hidden rounded-full border-4 border-white bg-slate-50 shadow-[0_10px_30px_-5px_rgba(0,0,0,0.155)] transition-transform duration-300 group-hover:scale-105 group-active:scale-95 ring-4 ring-teal-50"
                >
                  {photoUrl ? (
                    <img
                      className="h-full w-full object-cover"
                      src={photoUrl}
                      alt="Profile"
                      crossOrigin="anonymous"
                    />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center text-slate-300 bg-slate-50">
                      <UserIcon className="h-8 w-8 sm:h-12 sm:w-12 mb-1" />
                    </div>
                  )}
                  
                  {/* Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                    <Camera className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                  </div>
                </div>

                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-teal-600 text-white shadow-lg transition-transform hover:bg-teal-700 hover:scale-110 border-4 border-white"
                >
                  <Camera className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </button>
              </div>

              <input
                ref={fileInputRef}
                className="hidden"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null;
                  if (file) {
                    setProfilePhoto(file);
                    setActionError(null);
                  }
                }}
              />
              
              {profilePhoto && (
                <motion.div 
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-600 border border-emerald-100"
                >
                  <CheckCircle2 className="h-3 w-3" />
                  {t("completeProfile.photoSelected")}
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* Personal Info Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-3xl border-0 bg-white p-4 sm:p-6 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.25)] hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.3)] transition-all duration-500"
          >
            <div className="flex items-center gap-2 mb-4 sm:mb-6">
              <div className="p-2 rounded-xl bg-teal-50 text-teal-600">
                <UserIcon className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <h3 className="text-base sm:text-lg font-black text-slate-900">{t("completeProfile.personalInfo")}</h3>
            </div>

            <div className="space-y-4 sm:space-y-5">
              <div className="group">
                <label className="mb-1.5 sm:mb-2 block text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500">
                  {t("completeProfile.fullName")}
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-slate-400 group-focus-within:text-teal-500 transition-colors" />
                  <input
                    className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50/50 pl-10 sm:pl-12 pr-4 py-2.5 sm:py-3.5 text-xs sm:text-sm font-semibold text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={t("completeProfile.fullNamePlaceholder")}
                    required
                  />
                </div>
              </div>

              <div className="group">
                <label className="mb-1.5 sm:mb-2 block text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500">
                  {t("completeProfile.phone")}
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-slate-400 group-focus-within:text-teal-500 transition-colors" />
                  <input
                    className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50/50 pl-10 sm:pl-12 pr-4 py-2.5 sm:py-3.5 text-xs sm:text-sm font-semibold text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10"
                    type="tel"
                    inputMode="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder={t("completeProfile.phonePlaceholder")}
                    required
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right Column: Location */}
        <div className="lg:col-span-7">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="h-full rounded-3xl border-0 bg-white p-4 sm:p-6 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.25)] hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.3)] transition-all duration-500 flex flex-col"
          >
            <div className="flex items-center gap-2 mb-4 sm:mb-6">
              <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
                <MapPin className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900">{t("completeProfile.defaultLocation")}</h3>
                <p className="text-[10px] sm:text-xs text-slate-500">{t("completeProfile.locationSubtitle")}</p>
              </div>
            </div>

            <div className="relative mb-6">
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
              {!defaultLoc && (
                <div className="absolute top-32 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-[400]">
                  <div className="bg-white/90 backdrop-blur px-4 py-2 rounded-xl shadow-lg border border-white/50 text-xs font-bold text-slate-600 whitespace-nowrap animate-bounce">
                    {t("completeProfile.mapHintOverlay")}
                  </div>
                </div>
              )}
            </div>

            <div className="group bg-slate-50/50 rounded-2xl p-4 border border-slate-100 focus-within:bg-white focus-within:border-rose-200 focus-within:shadow-lg focus-within:shadow-rose-100/50 transition-all duration-300">
              <label className="mb-2 block text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 group-focus-within:text-rose-500 transition-colors">
                {t("completeProfile.addressDetailLabel")}
              </label>
              <div className="relative">
                <MapPin className="absolute left-0 top-3 h-5 w-5 text-slate-300 group-focus-within:text-rose-500 transition-colors" />
                <textarea
                  className="w-full min-h-[80px] bg-transparent pl-8 py-2 text-xs sm:text-sm font-medium text-slate-700 placeholder:text-slate-400 outline-none resize-none leading-relaxed"
                  value={address}
                  onChange={(e) => {
                    addressFromMapRef.current = false;
                    setAddress(e.target.value);
                  }}
                  placeholder={t("completeProfile.addressPlaceholder")}
                />
                {geocodingAddress && (
                  <div className="absolute right-0 bottom-0">
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="h-4 w-4 rounded-full border-2 border-slate-300 border-t-rose-500"
                    />
                  </div>
                )}
              </div>
              <div className="mt-2 text-[10px] text-slate-400 leading-normal border-t border-slate-100 pt-2 group-focus-within:text-slate-500">
                {t("completeProfile.addressHelp")}
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Error Message Toast */}
      <AnimatePresence>
        {actionError && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 sm:bottom-10 left-4 right-4 sm:left-1/2 sm:-translate-x-1/2 max-w-md z-50"
          >
            <div className="flex items-center gap-3 rounded-2xl bg-rose-600 p-4 text-white shadow-2xl shadow-rose-900/20">
              <AlertCircle className="h-6 w-6 flex-shrink-0 text-white/90" />
              <p className="text-sm font-bold">{actionError}</p>
              <button 
                onClick={() => setActionError(null)}
                className="ml-auto rounded-lg bg-white/20 p-1 hover:bg-white/30"
              >
                <div className="h-4 w-4 rotate-45 border-l-2 border-t-2 border-white" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action Button - Bottom of Form */}
      <div className="mt-6 pt-2 z-40">
        <div className="max-w-3xl mx-auto">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="group relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-teal-500 via-blue-600 to-purple-600 py-3 sm:py-5 text-white shadow-[0_20px_40px_-10px_rgba(37,99,235,0.4)] disabled:cursor-not-allowed disabled:opacity-70"
            disabled={saving}
            onClick={async () => {
              setActionError(null);

              // Enforce completion before continuing.
              if (!fullName.trim()) return setActionError(t("completeProfile.errorName"));
              if (!phone.trim()) return setActionError(t("completeProfile.errorPhone"));
              if (!defaultLoc) return setActionError(t("completeProfile.errorLocation"));
              if (!alreadyHasPhoto && !profilePhoto) return setActionError(t("completeProfile.errorPhoto"));

              setSaving(true);
              try {
                const normalizedPhone = normalizeWhatsAppPhone(phone);
                if (!normalizedPhone) {
                  setActionError(t("profile.invalidPhoneNumber"));
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
            <div className="absolute inset-0 bg-gradient-to-r from-teal-600 via-blue-600 to-purple-600 opacity-100 transition-opacity group-hover:opacity-90" />
            <div className="absolute inset-0 bg-[url('/patterns/noise.png')] opacity-10 mix-blend-overlay" />
            
            <span className="relative flex items-center justify-center gap-2 text-sm sm:text-lg font-black tracking-wide">
              {saving ? (
                <>
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="h-4 w-4 sm:h-5 sm:w-5 rounded-full border-2 border-white/30 border-t-white"
                  />
                  {t("completeProfile.saving")}
                </>
              ) : (
                <>
                  {t("completeProfile.save")}
                  <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </span>
          </motion.button>
        </div>
      </div>
    </div>
  );
}
