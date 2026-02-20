/**
 * USER profile page (Redesigned).
 * Matches "Selfie Time" style layout (Menu/Dashboard view).
 * 
 * Features:
 * - Dashboard View (Default): Avatar, Stats, Menu List.
 * - Edit View (Toggle): Full form for updating details.
 */

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  User as UserIcon, Phone, MapPin, Camera, Save, CheckCircle2, 
  AlertCircle, Lightbulb, Eye, EyeOff, Lock, Mail, Sparkles, 
  Globe, Trash2, LogOut, ChevronRight, History, Users, Gift, 
  Bell, Smartphone, Edit2, ArrowLeft, Ticket, Package, Gamepad2, X, Download
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { DeleteAccountVerificationDialog } from "../../components/DeleteAccountVerificationDialog";
import { CircularLoader } from "../../components/ui/CircularLoader";
import { CleaningGame } from "../../components/CleaningGame";

import { MapPicker, type LatLng } from "../../components/MapPicker";
import { api } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { getApiErrorMessage } from "../../lib/apiError";
import { normalizeWhatsAppPhone } from "../../lib/phone";
import { toAbsoluteUrl } from "../../lib/urls";
import { getLanguage, setLanguage, t } from "../../lib/i18n";
import type { User } from "../../types/api";
import { IOSInstallPrompt } from "../../components/IOSInstallPrompt";
import { AndroidInstallPrompt } from "../../components/AndroidInstallPrompt";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  
  // UI State
  const [isEditing, setIsEditing] = useState(false);
  const [showGame, setShowGame] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showVerificationDialog, setShowVerificationDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState<"id" | "en">(getLanguage());
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showAndroidPromo, setShowAndroidPromo] = useState(true);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIOSInstallPrompt, setShowIOSInstallPrompt] = useState(false);
  const [showAndroidInstallPrompt, setShowAndroidInstallPrompt] = useState(false);

  // PWA Install Prompt Listener
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  // Form State
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [defaultLoc, setDefaultLoc] = useState<LatLng | null>(null);

  const navigate = useNavigate();
  const { logout } = useAuth();

  // Listen for language changes
  useEffect(() => {
    const handleLanguageChange = () => {
      setCurrentLanguage(getLanguage());
    };
    window.addEventListener("languagechange", handleLanguageChange);
    return () => window.removeEventListener("languagechange", handleLanguageChange);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setDeferredPrompt(null);
        setShowAndroidPromo(false);
      }
    } else {
      const nav = navigator as Navigator & { vendor?: string; opera?: string };
      const ua = nav.userAgent || nav.vendor || nav.opera || "";
      const isIOS = /iPad|iPhone|iPod/.test(ua);
      const isAndroid = /android/i.test(ua);
      const isChrome =
        /chrome/i.test(ua) && !/edg/i.test(ua) && !/opr/i.test(ua) && !/samsungbrowser/i.test(ua);

      if (isAndroid && !isChrome) {
        const current = window.location.href.replace(/^https?:\/\//, "");
        window.location.href = `intent://${current}#Intent;scheme=https;package=com.android.chrome;end`;
        return;
      }

      if (isIOS) {
        setShowIOSInstallPrompt(true);
      } else if (isAndroid) {
        setShowAndroidInstallPrompt(true);
      } else {
        setShowIOSInstallPrompt(true);
      }
    }
  };

  // Load User Data
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const resp = await api.get("/users/me");
        const me = resp.data.data.user as User;
        if (!alive) return;
        setUser(me);
        setFullName(me.full_name);
        setPhone(me.phone_number);
        setEmail(me.email);
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

  // Photo URL logic
  const photoPreviewUrl = useMemo(() => {
    if (profilePhoto) return URL.createObjectURL(profilePhoto);
    return null;
  }, [profilePhoto]);

  const existingPhotoUrl = useMemo(() => toAbsoluteUrl(user?.profile_photo ?? null), [user?.profile_photo]);
  const displayPhotoUrl = photoPreviewUrl ?? existingPhotoUrl;

  useEffect(() => {
    return () => {
      if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
    };
  }, [photoPreviewUrl]);

  // Handle Save
  const handleSave = async () => {
    setActionError(null);
    setSuccessMessage(null);

    // Validate password if provided
    if (password || confirmPassword) {
      if (password.length < 6) {
        setActionError(t("profile.passwordMinLength"));
        return;
      }
      if (password !== confirmPassword) {
        setActionError(t("profile.passwordsDoNotMatch"));
        return;
      }
    }

    const normalizedPhone = normalizeWhatsAppPhone(phone);
    if (!normalizedPhone) {
      setActionError(t("profile.invalidPhoneNumber"));
      return;
    }

    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("full_name", fullName);
      fd.append("phone_number", normalizedPhone);
      fd.append("email", email);
      if (password) fd.append("password", password);
      if (defaultLoc) {
        fd.append("default_latitude", String(defaultLoc.lat));
        fd.append("default_longitude", String(defaultLoc.lng));
      }
      if (profilePhoto) fd.append("profile_photo", profilePhoto);

      const resp = await api.put("/users/me", fd);
      const updated = resp.data.data.user as User;
      
      if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
      
      setUser(updated);
      setProfilePhoto(null);
      setPassword("");
      setConfirmPassword("");

      setSuccessMessage(t("profile.profileUpdated"));
      setTimeout(() => setSuccessMessage(null), 5000);
      setIsEditing(false); // Return to view mode on success

      window.dispatchEvent(new Event("profileUpdated"));
    } catch (err) {
      setActionError(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <CircularLoader size="lg" />
        <p className="mt-4 text-sm text-slate-600">{t("profile.loadingProfile")}</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="p-6">
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <div className="text-lg font-semibold">{t("profile.couldNotLoadProfile")}</div>
          <div className="mt-2 text-sm text-rose-700">{loadError}</div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  // Game Overlay
  if (showGame) {
    return <CleaningGame onClose={() => setShowGame(false)} />;
  }

  if (!isEditing) {
    return (
      <>
      <div className="min-h-screen bg-slate-50/50 pb-24 relative overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute top-0 left-0 w-full h-[300px] bg-gradient-to-b from-cyan-50/80 to-transparent pointer-events-none" />
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-teal-100/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-40 -left-20 w-48 h-48 bg-blue-100/30 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="relative z-10 flex items-center justify-between px-6 py-6">
           <div className="relative">
             <button
               className="p-2 bg-white/50 backdrop-blur-sm rounded-xl shadow-sm border border-white/50 relative group"
               onClick={() => setShowAndroidPromo(true)}
               aria-label="Android App"
             >
               <Smartphone className="h-6 w-6 text-slate-700 group-hover:text-teal-600 transition-colors" />
               {!showAndroidPromo && (
                 <span className="absolute top-1 right-1 h-2.5 w-2.5 rounded-full bg-teal-500 border border-white animate-pulse" />
               )}
             </button>
             <AnimatePresence>
               {showAndroidPromo && (
                 <motion.div
                   initial={{ opacity: 0, x: -10, scale: 0.95 }}
                   animate={{ opacity: 1, x: 0, scale: 1 }}
                   exit={{ opacity: 0, scale: 0.95 }}
                   className="absolute top-0 left-14 z-50 w-max max-w-[200px]"
                 >
                   {/* Arrow */}
                   <div className="absolute -left-1.5 top-3.5 w-0 h-0 border-t-[6px] border-t-transparent border-r-[8px] border-r-white border-b-[6px] border-b-transparent drop-shadow-sm" />
                   
                   <div 
                      className="relative bg-white rounded-xl p-2.5 shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-100 flex items-center gap-3 cursor-pointer active:scale-95 transition-transform"
                      onClick={handleInstallClick}
                    >
                      <div className="h-9 w-9 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-200 shrink-0">
                        <Download className="h-4 w-4" />
                      </div>
                     <div className="flex-1 min-w-0">
                       <h3 className="text-[11px] font-bold text-slate-800 mb-0.5 leading-tight">{t("profile.androidPromo.title")}</h3>
                       <p className="text-[9px] text-slate-500 leading-tight">{t("profile.androidPromo.desc")}</p>
                     </div>
                     <button 
                       onClick={(e) => {
                         e.stopPropagation();
                         setShowAndroidPromo(false);
                       }}
                       className="absolute -top-1.5 -right-1.5 bg-white rounded-full p-0.5 shadow-sm border border-slate-100 text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                     >
                       <X className="h-3 w-3" />
                     </button>
                   </div>
                 </motion.div>
               )}
             </AnimatePresence>
           </div>
           <h1 className="text-lg font-extrabold text-slate-800 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-teal-600 to-cyan-600">
             LokaClean
           </h1>
           <div className="relative p-2 bg-white/50 backdrop-blur-sm rounded-xl shadow-sm border border-white/50">
             <Bell className="h-6 w-6 text-slate-700" />
             <span className="absolute top-2 right-2.5 h-2.5 w-2.5 rounded-full bg-rose-500 border border-white shadow-sm animate-pulse"></span>
           </div>
        </div>

        {/* Profile Info */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-6 mt-4 relative z-10"
        >
           <div className="flex items-center gap-5">
              <div className="relative flex-shrink-0 group cursor-pointer" onClick={() => setIsEditing(true)}>
                 <div className="h-24 w-24 rounded-full p-1 bg-gradient-to-br from-cyan-400 via-teal-400 to-emerald-400 shadow-lg shadow-teal-200/50 group-hover:shadow-teal-300/60 transition-all duration-300 group-hover:scale-105">
                    <img 
                     src={displayPhotoUrl || ""} 
                     alt={user.full_name || "Profile Photo"}
                     className="h-full w-full rounded-full object-cover border-4 border-white bg-slate-100"
                     onError={(e) => {
                       (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${user.full_name}&background=random`;
                     }}
                   />
                 </div>
                 <div className="absolute -bottom-1 -right-1 bg-white text-emerald-500 p-1.5 rounded-full shadow-md border border-slate-100 group-hover:rotate-12 transition-transform">
                    <Edit2 className="h-4 w-4" />
                 </div>
              </div>
              
              <div className="flex-1 min-w-0 pt-2">
                 <h2 className="text-2xl font-black text-slate-800 leading-tight truncate pr-2">{user.full_name}</h2>
                 
                 {/* Membership Badge */}
                 <div className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-sm shadow-emerald-200">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span className="text-xs font-bold tracking-wide">Clean Member</span>
                 </div>
                 
                 <div className="mt-3 flex items-center gap-3 text-slate-500 text-xs font-medium">
                    <div className="flex items-center gap-1">
                      <Phone className="h-3.5 w-3.5" />
                      <span>{user.phone_number}</span>
                    </div>
                 </div>
              </div>
           </div>
        </motion.div>

        {/* Stats Grid - "Clean Tiles" */}
        {/* Removed as per user request */}

        {/* Menu List - "Modern List" */}
        <div className="px-6 mt-10 relative z-10">
           <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
             <div className="h-6 w-1 rounded-full bg-teal-500"></div>
             Pengaturan
           </h3>
           <motion.div 
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: 0.3 }}
             className="bg-white rounded-3xl p-2 shadow-[0_15px_40px_-10px_rgba(0,0,0,0.08)] border border-slate-100 ring-1 ring-slate-900/5 relative overflow-hidden"
           >
              {/* Decorative top sheen */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-400/20 via-cyan-400/20 to-teal-400/20"></div>
              
              <div className="divide-y divide-slate-100">
                <MenuItem 
                  icon={History} 
                  label={currentLanguage === 'id' ? "Riwayat Pesanan" : "Order History"} 
                  onClick={() => navigate('/orders')} 
                  color="text-blue-500"
                  bgColor="bg-blue-50"
                />
                <MenuItem 
                  icon={Package} 
                  label={currentLanguage === 'id' ? "Daftar Paket" : "Package List"} 
                  onClick={() => navigate('/home')} 
                  color="text-indigo-500"
                  bgColor="bg-indigo-50"
                />
                <MenuItem 
                  icon={Gamepad2} 
                  label={currentLanguage === 'id' ? "Games biar ga boring" : "Fun Games"} 
                  onClick={() => setShowGame(true)} 
                  color="text-rose-500"
                  bgColor="bg-rose-50"
                />
                <MenuItem 
                  icon={Globe} 
                  label={currentLanguage === 'id' ? "Bahasa Aplikasi" : "App Language"} 
                  onClick={() => {
                     const newLang = currentLanguage === 'id' ? 'en' : 'id';
                     setLanguage(newLang);
                     setCurrentLanguage(newLang);
                  }} 
                  value={currentLanguage === 'id' ? 'ID' : 'EN'}
                  color="text-teal-500"
                  bgColor="bg-teal-50"
                />
              </div>
           </motion.div>
        </div>

        {/* Banner - "Premium Verification Card" */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="px-6 mt-8 relative z-10"
        >
           <div 
             onClick={() => setIsEditing(true)}
             className="group cursor-pointer relative overflow-hidden rounded-3xl bg-slate-900 p-6 text-white shadow-xl shadow-slate-900/20 ring-1 ring-white/10"
           >
              {/* Background Luxury Effects */}
              <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"></div>
              <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl -mr-20 -mt-20 group-hover:bg-amber-500/20 transition-colors duration-500"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl -ml-10 -mb-10 group-hover:bg-teal-500/20 transition-colors duration-500"></div>
              
              {/* Gold border accent */}
              <div className="absolute inset-0 rounded-3xl border border-white/5 group-hover:border-amber-500/30 transition-colors duration-500"></div>

              <div className="relative z-10 flex items-center justify-between">
                 <div className="flex items-center gap-5">
                    <div className="relative">
                      {/* Premium Icon Container */}
                      <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-amber-200 to-amber-500 flex items-center justify-center shadow-lg shadow-amber-900/50 relative overflow-hidden">
                          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
                          <CheckCircle2 className="h-7 w-7 text-amber-900 drop-shadow-sm" />
                      </div>
                      <div className="absolute -bottom-1 -right-1 bg-slate-900 rounded-full p-1 border border-amber-500/30">
                        <Lock className="h-3 w-3 text-amber-400" />
                      </div>
                    </div>
                    <div>
                       <div className="font-bold text-base leading-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-100">
                         {currentLanguage === 'id' ? "Lengkapi Profil Anda" : "Complete your profile"}
                       </div>
                       <div className="text-xs text-slate-400 mt-1.5 font-medium pr-4 leading-relaxed">
                         {currentLanguage === 'id' 
                           ? "Verifikasi akun untuk keamanan & kemudahan pesanan." 
                           : "Verify account for security & easier booking."}
                       </div>
                    </div>
                 </div>
                 <div className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-amber-500/20 transition-all duration-300 border border-white/5 group-hover:border-amber-500/30">
                   <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-amber-200" />
                 </div>
              </div>
           </div>
        </motion.div>
        
        {/* Logout Section */}
        <div className="px-6 mt-8 mb-4 flex justify-center pb-8">
           <button 
             onClick={logout}
             className="flex items-center gap-2 text-slate-400 hover:text-rose-500 transition-colors text-sm font-semibold px-6 py-3 rounded-full hover:bg-rose-50"
           >
             <LogOut className="h-4 w-4" />
             {currentLanguage === 'id' ? "Keluar dari Aplikasi" : "Log Out"}
           </button>
        </div>
      </div>
      <IOSInstallPrompt
        isOpen={showIOSInstallPrompt}
        onClose={() => setShowIOSInstallPrompt(false)}
      />
      <AndroidInstallPrompt
        isOpen={showAndroidInstallPrompt}
        onClose={() => setShowAndroidInstallPrompt(false)}
      />
      </>
    );
  }

  // =================================================================
  // EDIT MODE (Original Form Logic)
  // =================================================================
  return (
    <div className="min-h-screen bg-slate-50 pb-20">
       {/* Edit Header */}
       <div className="sticky top-0 z-20 bg-white px-4 py-4 shadow-sm flex items-center gap-3">
          <button onClick={() => setIsEditing(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
             <ArrowLeft className="h-5 w-5 text-slate-700" />
          </button>
          <h1 className="text-lg font-bold text-slate-800">{t("profile.yourProfile")}</h1>
       </div>

      <div className="max-w-xl mx-auto px-4 py-6">
        {/* Success Message */}
        <AnimatePresence>
          {successMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 flex items-center gap-2 rounded-xl border-2 border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700"
            >
              <CheckCircle2 className="h-5 w-5" />
              <span>{successMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Photo Upload */}
        <div className="mb-8 flex flex-col items-center">
           <div className="relative">
              <div className="h-28 w-28 rounded-full overflow-hidden border-4 border-white shadow-lg bg-slate-200">
                {displayPhotoUrl ? (
                  <img src={displayPhotoUrl} className="h-full w-full object-cover" alt="Profile" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-slate-400">
                    <UserIcon className="h-12 w-12" />
                  </div>
                )}
              </div>
              <label className="absolute bottom-0 right-0 p-2 bg-emerald-500 text-white rounded-full shadow-md cursor-pointer hover:bg-emerald-600 transition-colors">
                 <Camera className="h-4 w-4" />
                 <input 
                   type="file" 
                   className="hidden" 
                   accept="image/*" 
                   onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (file.size > 10 * 1024 * 1024) {
                           setActionError("File size too large (max 10MB).");
                           return;
                        }
                        setProfilePhoto(file);
                      }
                   }}
                 />
              </label>
           </div>
           <p className="mt-3 text-xs text-slate-500">{t("profile.clickToSelect")}</p>
        </div>

        {/* Form Fields */}
        <div className="space-y-5 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
           <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">{t("profile.fullName")}</label>
              <input
                className="w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium focus:border-emerald-500 focus:bg-white focus:outline-none transition-all"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
           </div>

           <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">{t("profile.phoneNumber")}</label>
              <input
                className="w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium focus:border-emerald-500 focus:bg-white focus:outline-none transition-all"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
           </div>

           <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">{t("profile.email")}</label>
              <input
                className="w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium focus:border-emerald-500 focus:bg-white focus:outline-none transition-all"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
           </div>
           
           <div className="pt-4 border-t border-slate-100">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-3 block">{t("profile.defaultLocation")}</label>
              <MapPicker value={defaultLoc} onChange={setDefaultLoc} />
           </div>
        </div>

        {/* Password Section */}
        <div className="mt-6 space-y-5 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
           <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Lock className="h-4 w-4 text-emerald-500" />
              {t("profile.changePassword")}
           </h3>
           
           <div className="space-y-1">
              <input
                className="w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-emerald-500 focus:bg-white focus:outline-none transition-all"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t("profile.newPassword")}
              />
           </div>
           <div className="space-y-1">
              <input
                className="w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-emerald-500 focus:bg-white focus:outline-none transition-all"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t("profile.confirmNewPassword")}
              />
           </div>
        </div>

        {/* Delete Account */}
        <div className="mt-8 flex justify-center">
           <button 
             onClick={() => setShowDeleteDialog(true)}
             className="text-xs font-bold text-rose-500 hover:text-rose-600 transition-colors flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-rose-50"
           >
             <Trash2 className="h-4 w-4" />
             {currentLanguage === 'id' ? "Hapus Akun Permanen" : "Delete Account Permanently"}
           </button>
        </div>

        {/* Error */}
        <AnimatePresence>
          {actionError && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="fixed bottom-24 left-4 right-4 z-50 rounded-xl bg-rose-600 p-4 text-white shadow-xl"
            >
              <div className="flex items-center gap-3">
                 <AlertCircle className="h-5 w-5 flex-shrink-0" />
                 <p className="text-sm font-medium">{actionError}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Save Button FAB */}
        <div className="fixed bottom-24 right-4 left-4 sm:left-auto sm:right-8 sm:w-auto z-40">
           <button
             onClick={handleSave}
             disabled={saving}
             className="w-full sm:w-auto shadow-xl shadow-emerald-500/30 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold py-4 px-8 rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-70 disabled:scale-100"
           >
              {saving ? (
                 <CircularLoader size="sm" variant="white" />
              ) : (
                 <>
                   <Save className="h-5 w-5" />
                   <span>{t("profile.saveChanges")}</span>
                 </>
              )}
           </button>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={() => {
          setShowDeleteDialog(false);
          setShowVerificationDialog(true);
        }}
        title={currentLanguage === "id" ? "Hapus Akun?" : "Delete Account?"}
        message={
          currentLanguage === "id"
            ? "Apakah Anda yakin ingin menghapus akun Anda? Tindakan ini tidak dapat dibatalkan."
            : "Are you sure you want to delete your account? This action cannot be undone."
        }
        confirmText={currentLanguage === "id" ? "Ya, Hapus" : "Yes, Delete"}
        cancelText={currentLanguage === "id" ? "Batal" : "Cancel"}
        variant="danger"
        isLoading={false}
      />

      {user && (
        <DeleteAccountVerificationDialog
          isOpen={showVerificationDialog}
          onClose={() => setShowVerificationDialog(false)}
          onConfirm={async (emailOrPhone, password) => {
            setDeleting(true);
            try {
              await api.delete("/users/me", {
                data: { email_or_phone: emailOrPhone, password: password }
              });
              localStorage.removeItem("lokaclean_token");
              navigate("/login");
            } catch (err) {
              setActionError(getApiErrorMessage(err));
              setShowVerificationDialog(false);
            } finally {
              setDeleting(false);
            }
          }}
          userEmail={user.email}
          userPhone={user.phone_number}
          currentLanguage={currentLanguage}
          isLoading={deleting}
        />
      )}
    </div>
  );
}

function MenuItem({ icon: Icon, label, onClick, value, color = "text-slate-400", bgColor = "bg-slate-50" }: { 
  icon: typeof UserIcon, label: string, onClick: () => void, value?: string, color?: string, bgColor?: string 
}) {
  return (
    <button onClick={onClick} className="w-full flex items-center justify-between group p-3 rounded-xl hover:bg-slate-50 transition-colors">
       <div className="flex items-center gap-4">
          <div className={`p-2 rounded-xl ${bgColor} ${color} group-hover:scale-110 transition-transform`}>
            <Icon className="h-5 w-5" />
          </div>
          <span className="text-sm font-bold text-slate-700 group-hover:text-slate-900 transition-colors">{label}</span>
       </div>
       <div className="flex items-center gap-2">
          {value && <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-md">{value}</span>}
          <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-400 transition-colors" />
       </div>
    </button>
  )
}
