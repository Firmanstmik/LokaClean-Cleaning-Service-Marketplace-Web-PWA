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
  ArrowRight,
  ChevronDown
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

  // Accordion State
  const [activeSection, setActiveSection] = useState<string | null>("photo");

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

  const sections = [
    {
      id: "photo",
      title: t("completeProfile.profilePhoto"),
      subtitle: t("completeProfile.uploadPhotoHint"),
      icon: Camera,
      isValid: isPhotoValid,
      content: (
        <div className="text-center py-2">
          <div className="relative mx-auto h-28 w-28 sm:h-32 sm:w-32 group">
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
                  <UserIcon className="h-10 w-10 sm:h-12 sm:w-12 mb-1" />
                </div>
              )}
              
              {/* Overlay */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                <Camera className="h-8 w-8 text-white" />
              </div>
            </div>

            <button 
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-teal-600 text-white shadow-lg transition-transform hover:bg-teal-700 hover:scale-110 border-4 border-white"
            >
              <Camera className="h-4 w-4" />
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
                // Validate file size (10MB)
                if (file.size > 10 * 1024 * 1024) {
                  setActionError(t("completeProfile.errorPhotoSize") || "Ukuran file terlalu besar (maks 10MB).");
                  return;
                }
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
      )
    },
    {
      id: "info",
      title: t("completeProfile.personalInfo"),
      subtitle: t("completeProfile.subtitle"),
      icon: UserIcon,
      isValid: isInfoValid,
      content: (
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
      )
    },
    {
      id: "location",
      title: t("completeProfile.defaultLocation"),
      subtitle: t("completeProfile.locationSubtitle"),
      icon: MapPin,
      isValid: isLocationValid,
      content: (
        <div className="space-y-4">
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
        </div>
      )
    }
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-4 sm:space-y-6 pb-24">
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
          className="absolute top-0 right-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-white/20 blur-2xl will-change-transform" 
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.4, 0.2] 
          }}
          transition={{ duration: 10, repeat: Infinity, delay: 1 }}
          className="absolute bottom-0 left-0 -mb-10 -ml-10 h-40 w-40 rounded-full bg-teal-400/30 blur-xl will-change-transform" 
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

      {/* Accordion Sections */}
      <div className="space-y-3 sm:space-y-4">
        {sections.map((step, index) => (
          <motion.div
            key={step.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * index }}
            className={`overflow-hidden rounded-3xl border transition-all duration-300 ${
              activeSection === step.id
                ? "bg-white border-slate-200 shadow-[0_15px_30px_-5px_rgba(0,0,0,0.05)] ring-1 ring-slate-100"
                : "bg-white border-slate-100 shadow-sm hover:shadow-md hover:bg-slate-50/50"
            }`}
          >
            <button
              onClick={() => setActiveSection(activeSection === step.id ? null : step.id)}
              className="w-full flex items-center justify-between p-4 sm:p-5 text-left outline-none group"
            >
              <div className="flex items-center gap-3 sm:gap-4">
                <div className={`flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-2xl transition-colors duration-300 ${
                  step.isValid 
                    ? "bg-emerald-50 text-emerald-600 border border-emerald-100" 
                    : activeSection === step.id 
                      ? "bg-teal-50 text-teal-600 border border-teal-100" 
                      : "bg-slate-50 text-slate-400 border border-slate-100"
                }`}>
                  <step.icon className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <div>
                  <h3 className={`text-sm sm:text-base font-bold transition-colors ${
                    activeSection === step.id ? "text-slate-900" : "text-slate-700"
                  }`}>
                    {step.title}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {step.isValid ? (
                      <span className="flex items-center gap-1 text-[10px] sm:text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                        <CheckCircle2 className="h-3 w-3" />
                        {t("completeProfile.completed")}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] sm:text-xs font-semibold text-rose-500 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100">
                        <AlertCircle className="h-3 w-3" />
                        {t("completeProfile.required")}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <ChevronDown className={`h-5 w-5 text-slate-400 transition-transform duration-300 ${
                activeSection === step.id ? "rotate-180 text-teal-600" : "group-hover:text-slate-600"
              }`} />
            </button>
            <AnimatePresence initial={false}>
              {activeSection === step.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
                  className="will-change-transform"
                >
                  <div className="border-t border-slate-50 p-4 sm:p-5 bg-slate-50/30">
                    {step.content}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>

      {/* Important Note Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="rounded-3xl border border-blue-100 bg-blue-50/50 p-5 sm:p-6"
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600">
            <Sparkles className="h-4 w-4" />
          </div>
          <h3 className="text-sm font-bold text-blue-900">{t("completeProfile.noteTitle")}</h3>
        </div>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-400 shrink-0" />
            <p className="text-xs sm:text-sm text-blue-800/80 leading-relaxed">
              {t("completeProfile.noteAddress")}
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-400 shrink-0" />
            <p className="text-xs sm:text-sm text-blue-800/80 leading-relaxed">
              {t("completeProfile.notePhoto")}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Floating Save Button */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6 bg-gradient-to-t from-white via-white to-transparent pb-6 pt-12">
        <div className="max-w-3xl mx-auto">
          <button
            onClick={async () => {
              if (saving) return;

              // Validate sections
              if (!isPhotoValid) {
                setActiveSection("photo");
                setActionError(t("completeProfile.errorPhoto"));
                return;
              }
              if (!isInfoValid) {
                setActiveSection("info");
                setActionError(t("completeProfile.errorName")); // Simplified error
                return;
              }
              if (!isLocationValid) {
                setActiveSection("location");
                setActionError(t("completeProfile.errorLocation"));
                return;
              }

              setSaving(true);
              setActionError(null);

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
                // backend expects 'profile_photo' or 'photo'? The original code said 'profile_photo'
                if (profilePhoto) fd.append("profile_photo", profilePhoto);

                const resp = await api.put("/users/me", fd);
                const updated = resp.data.data.user as User;
                
                // Cleanup preview URL
                if (photoPreviewUrl) {
                  URL.revokeObjectURL(photoPreviewUrl);
                }
                
                setUser(updated);
                setProfilePhoto(null);

                // Notify navbar
                window.dispatchEvent(new Event("profileUpdated"));

                // Navigate
                navigate(next, { replace: true });
              } catch (err) {
                setActionError(getApiErrorMessage(err));
                setSaving(false);
              }
            }}
            disabled={saving}
            className="group relative w-full overflow-hidden rounded-2xl bg-slate-900 p-4 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.4)] transition-all active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-teal-500 via-blue-600 to-purple-600 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
            
            <div className="relative flex items-center justify-center gap-3">
              {saving ? (
                <>
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  <span className="font-bold text-white">{t("completeProfile.saving")}
</span>
                </>
              ) : (
                <>
                  <span className="text-base font-bold text-white tracking-wide">{t("completeProfile.save")}</span>
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                    <ChevronRight className="h-4 w-4 text-white" />
                  </div>
                </>
              )}
            </div>
          </button>
          {actionError && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 text-center text-xs font-bold text-rose-500 bg-rose-50/80 backdrop-blur-sm py-2 px-4 rounded-xl border border-rose-100"
            >
              {actionError}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
