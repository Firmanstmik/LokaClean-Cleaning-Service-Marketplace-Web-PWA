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
import axios from "axios";
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
  ChevronDown,
  ScanFace,
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
import { compressImage } from "../../lib/image";
import type { User } from "../../types/api";

export function CompleteProfilePage() {
  useCurrentLanguage(); // Force re-render on language change
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const next = params.get("next") ?? "/home";

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const abortControllerRef = useRef<AbortController | null>(null);
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
  const [activeSection, setActiveSection] = useState<string | null>(null);

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
  // Profile photo is now optional (suggested only)
  const isPhotoValid = true; // Always valid since it's optional
  const isInfoValid = useMemo(() => !!(fullName.trim() && phone.trim()), [fullName, phone]);
  const isLocationValid = useMemo(() => !!defaultLoc, [defaultLoc]);

  // Callbacks
  const handleAddressChange = useMemo(
    () => (addr: string | null) => {
      if (!addr) return;
      addressFromMapRef.current = true;
      setAddress(addr);
    },
    []
  );

  const handlePhotoChange = useMemo(() => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setActionError(t("completeProfile.errorPhotoSize") || "Ukuran file terlalu besar (maks 10MB).");
        return;
      }
      setProfilePhoto(file);
      setActionError(null);
    }
  }, []); // Remove 't' dependency if t is stable, or keep it. t is usually stable.

  // Section Content Memoization
  const photoSection = useMemo(() => ({
    id: "photo",
    title: t("completeProfile.profilePhoto"),
    subtitle: t("completeProfile.uploadPhotoHint"),
    icon: ScanFace,
    isValid: !!photoUrl, // Only show green check if photo is actually present
    isOptional: true, // New flag for UI
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
          onChange={handlePhotoChange}
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
  }), [isPhotoValid, photoUrl, profilePhoto, handlePhotoChange]); // t is global

  const infoSection = useMemo(() => ({
    id: "info",
    title: t("completeProfile.personalInfo"),
    subtitle: t("completeProfile.subtitle"),
    icon: Fingerprint,
    isValid: isInfoValid,
    isOptional: false,
    content: (
      <div className="space-y-4 sm:space-y-5">
        <div className="group">
          <label className="mb-1.5 sm:mb-2 block text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500">
            {t("completeProfile.fullName")}
          </label>
          <div className="relative">
            <UserIcon className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-slate-400 group-focus-within:text-teal-500 transition-colors" />
            <input
              className="w-full rounded-2xl border border-slate-200 bg-white pl-10 sm:pl-12 pr-4 py-3 sm:py-4 text-sm font-semibold text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 shadow-sm"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder={t("completeProfile.fullNamePlaceholder")}
              required
            />
          </div>
        </div>

        <div className="group">
          <label className="mb-2 block text-[10px] sm:text-xs font-bold uppercase tracking-widest text-slate-500">
            {t("completeProfile.phone")}
          </label>
          <div className="relative">
            <Phone className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-teal-500 transition-colors" />
            <input
              className="w-full rounded-2xl border border-slate-200 bg-white pl-10 sm:pl-12 pr-4 py-3 sm:py-4 text-sm font-semibold text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 shadow-sm"
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
  }), [isInfoValid, fullName, phone]);

  const locationSection = useMemo(() => ({
    id: "location",
    title: t("completeProfile.defaultLocation"),
    subtitle: t("completeProfile.locationSubtitle"),
    icon: Compass,
    isValid: isLocationValid,
    isOptional: false,
    content: (
      <div className="space-y-4">
        <div className="relative mb-6">
          <MapPicker
            value={defaultLoc}
            onChange={setDefaultLoc}
            onAddressChange={handleAddressChange}
            hideLabel
            isOpen={activeSection === "location"}
          />
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
        </div>
      </div>
    )
  }), [isLocationValid, defaultLoc, address, geocodingAddress, handleAddressChange, activeSection]);

  const sections = useMemo(() => [photoSection, infoSection, locationSection], [photoSection, infoSection, locationSection]);

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
  // Photo is optional now
  // if (!alreadyHasPhoto && !profilePhoto) missing.push("Profile Photo");
  if (!defaultLoc) missing.push("Default Location");

  // Calculate progress
  const totalFields = 3; // Reduced from 4 (photo removed)
  const completedFields = totalFields - missing.length;
  const progressPercentage = (completedFields / totalFields) * 100;

  const handleSave = async () => {
    if (saving) return;

    // Validate sections
    // Photo check removed as it is optional
    if (!isInfoValid) {
      setActiveSection("info");
      setActionError(t("completeProfile.errorName"));
      return;
    }
    if (!isLocationValid) {
      setActiveSection("location");
      setActionError(t("completeProfile.errorLocation"));
      return;
    }

    setSaving(true);
    setActionError(null);
    setUploadProgress(0);

    // Cancel previous request if any
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

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
      
      // Compress and append photo if exists
      if (profilePhoto) {
        try {
          const compressed = await compressImage(profilePhoto);
          fd.append("profile_photo", compressed);
        } catch (err) {
          console.warn("Image compression failed, using original", err);
          fd.append("profile_photo", profilePhoto);
        }
      }

      const resp = await api.put("/users/me", fd, {
        signal: abortControllerRef.current.signal,
        onUploadProgress: (progressEvent) => {
          const total = progressEvent.total || 1;
          const progress = Math.round((progressEvent.loaded * 100) / total);
          setUploadProgress(progress);
        }
      });
      
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
      if (axios.isCancel(err)) {
        return;
      }
      setActionError(getApiErrorMessage(err));
      setSaving(false);
    } finally {
      abortControllerRef.current = null;
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-4 sm:space-y-6 pb-0">
      {/* Header Section */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-slate-900 p-5 sm:p-10 text-white shadow-lg sm:shadow-[0_15px_40px_-10px_rgba(15,23,42,0.3)]"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 sm:bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] sm:from-teal-500/20 sm:via-slate-900/0 sm:to-slate-900/0" />
        <div className="absolute inset-0 bg-gradient-to-tr from-slate-900 via-slate-900 to-slate-800 sm:bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] sm:from-blue-600/20 sm:via-slate-900/0 sm:to-slate-900/0" />
        
        <div className="relative z-10">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-[10px] sm:text-xs font-bold uppercase tracking-widest border border-white/10 text-teal-300">
                  {t("completeProfile.step2")}
                </span>
              </div>
              <h1 className="text-xl sm:text-4xl font-bold tracking-tight leading-tight text-white">
                {t("completeProfile.title")}
              </h1>
              <p className="mt-2 text-slate-400 text-xs sm:text-base max-w-lg leading-relaxed font-medium">
                {t("completeProfile.subtitle")}
              </p>
            </div>
            <div className="hidden sm:flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-400 to-blue-500 shadow-lg shadow-teal-500/20 rotate-3">
              <Sparkles className="h-7 w-7 text-white" />
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-6 sm:mt-8">
            <div className="flex items-center justify-between text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-2 text-slate-400">
              <span className="flex items-center gap-1.5">
                <div className={`h-1.5 w-1.5 rounded-full ${progressPercentage === 100 ? "bg-teal-400" : "bg-slate-500"}`} />
                {t("completeProfile.completionStatus")}
              </span>
              <span className="text-white">{Math.round(progressPercentage)}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                className="h-full bg-gradient-to-r from-teal-400 to-blue-500 shadow-[0_0_20px_rgba(45,212,191,0.5)]"
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
            className={`relative overflow-hidden rounded-2xl p-[2px] transition-all duration-300 ${
              activeSection === step.id
                ? "bg-gradient-to-br from-teal-400 via-blue-500 to-purple-600 shadow-lg sm:shadow-xl sm:shadow-blue-500/20"
                : step.isValid
                  ? "bg-gradient-to-br from-emerald-400 via-teal-400 to-emerald-400"
                  : "bg-gradient-to-br from-slate-100 via-slate-200 to-slate-100"
            }`}
          >
            <div className="h-full w-full rounded-xl bg-white overflow-hidden">
              <button
                onClick={() => setActiveSection(activeSection === step.id ? null : step.id)}
                className="w-full flex items-center justify-between p-4 sm:p-6 text-left outline-none group"
              >
                <div className="flex items-center gap-3.5 sm:gap-4">
                  <div className={`flex h-11 w-11 sm:h-14 sm:w-14 items-center justify-center rounded-2xl transition-all duration-300 ${
                    step.isValid 
                      ? "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100 shadow-sm" 
                      : activeSection === step.id 
                        ? "bg-slate-900 text-white shadow-md sm:shadow-lg sm:shadow-slate-900/20" 
                        : "bg-slate-50 text-slate-400 group-hover:bg-white group-hover:shadow-sm"
                  }`}>
                    <step.icon className={`h-5 w-5 sm:h-6 sm:w-6 transition-transform duration-300 group-hover:scale-110 ${step.isValid ? 'text-emerald-600' : ''}`} />
                  </div>
                  <div>
                    <h3 className={`text-sm sm:text-lg font-bold tracking-tight transition-colors ${
                      activeSection === step.id ? "text-slate-900" : "text-slate-600 group-hover:text-slate-900"
                    }`}>
                      {step.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      {step.isValid && !step.isOptional ? (
                        <span className="flex items-center gap-1.5 text-[10px] sm:text-xs font-bold text-emerald-600 tracking-wide">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          {t("completeProfile.completed")}
                        </span>
                      ) : step.isOptional ? (
                        <span className="flex items-center gap-1.5 text-[10px] sm:text-xs font-bold text-slate-500 tracking-wide">
                           {step.isValid ? (
                             <>
                               <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                               <span className="text-emerald-600">{t("completeProfile.completed")}</span>
                             </>
                           ) : (
                             <>
                               <div className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                               {t("completeProfile.optional") || "Optional"}
                             </>
                           )}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-[10px] sm:text-xs font-bold text-rose-500 tracking-wide">
                          <div className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
                          {t("completeProfile.required")}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className={`h-8 w-8 sm:h-10 sm:w-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                  activeSection === step.id ? "bg-slate-100 rotate-180" : "bg-transparent group-hover:bg-slate-50"
                }`}>
                  <ChevronDown className={`h-5 w-5 transition-colors ${
                    activeSection === step.id ? "text-slate-900" : "text-slate-400"
                  }`} />
                </div>
              </button>
              
              {/* CSS Grid Animation for smooth performance & Map persistence */}
              <div 
                className={`grid transition-[grid-template-rows] duration-300 ease-out will-change-[grid-template-rows] ${
                  activeSection === step.id ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                }`}
              >
                <div className="overflow-hidden transition-opacity duration-300">
                  <div className="px-4 pb-4 sm:px-6 sm:pb-6 pt-0">
                    <div className="h-px w-full bg-slate-100 mb-4 sm:mb-6" />
                    <div className="rounded-2xl bg-slate-50 p-3 sm:p-6 border border-slate-100">
                      {step.content}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Important Note Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="rounded-2xl bg-gradient-to-br from-white to-slate-50 border border-slate-100 p-5 sm:p-6 shadow-sm"
      >
        <div className="flex items-center gap-3 mb-3 sm:mb-4">
          <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 ring-1 ring-blue-100">
            <ShieldCheck className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight">{t("completeProfile.noteTitle")}</h3>
            <p className="text-[10px] sm:text-xs text-slate-500 font-medium">{t("completeProfile.noteSubtitle")}</p>
          </div>
        </div>
        <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
          <div className="flex items-start gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-white border border-slate-100 shadow-sm">
            <div className="mt-1 h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-blue-500 shrink-0 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
            <p className="text-[10px] sm:text-xs text-slate-600 leading-relaxed font-medium">
              {t("completeProfile.noteAddress")}
            </p>
          </div>
          <div className="flex items-start gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-white border border-slate-100 shadow-sm">
            <div className="mt-1 h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-teal-500 shrink-0 shadow-[0_0_8px_rgba(20,184,166,0.5)]" />
            <p className="text-[10px] sm:text-xs text-slate-600 leading-relaxed font-medium">
              {t("completeProfile.notePhoto")}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Floating Save Button */}
      <div className="mt-4">
        <div className="mx-auto max-w-3xl">
          <button
            onClick={handleSave}
            disabled={saving}
            className="group relative w-full overflow-hidden rounded-2xl bg-slate-900 p-4 sm:p-5 shadow-xl shadow-slate-900/20 transition-all duration-300 active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-teal-500/20 via-blue-500/20 to-purple-500/20 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
            
            <div className="relative flex items-center justify-center gap-2 sm:gap-3">
              {saving ? (
                <>
                  <div className="h-4 w-4 sm:h-5 sm:w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  <span className="text-xs sm:text-sm font-bold text-white tracking-wide">
                    {uploadProgress > 0 ? `${uploadProgress}%` : t("completeProfile.saving")}
                  </span>
                </>
              ) : (
                <>
                  <span className="text-xs sm:text-base font-bold text-white tracking-widest uppercase">{t("completeProfile.save")}</span>
                  <div className="flex h-6 w-6 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm transition-transform duration-300 group-hover:translate-x-1">
                    <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
                  </div>
                </>
              )}
            </div>
          </button>
          {actionError && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-2 sm:mt-3 text-center text-[10px] sm:text-xs font-bold text-rose-500 bg-rose-50/80 backdrop-blur-sm py-2 sm:py-2.5 px-4 rounded-xl border border-rose-100 shadow-sm"
            >
              {actionError}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
