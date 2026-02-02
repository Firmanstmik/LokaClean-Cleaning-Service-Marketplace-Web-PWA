/**
 * USER profile page (Phase 1).
 *
 * Allows:
 * - full name + phone (mandatory in business rules)
 * - profile photo upload
 * - default location (lat/lng) via map picker
 */

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User as UserIcon, Phone, MapPin, Camera, Save, CheckCircle2, AlertCircle, Lightbulb, Eye, EyeOff, Lock, Mail, Sparkles, Globe, Trash2, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { DeleteAccountVerificationDialog } from "../../components/DeleteAccountVerificationDialog";

import { MapPicker, type LatLng } from "../../components/MapPicker";
import { PageHeaderCard } from "../../components/PageHeaderCard";
import { api } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { getApiErrorMessage } from "../../lib/apiError";
import { normalizeWhatsAppPhone } from "../../lib/phone";
import { toAbsoluteUrl } from "../../lib/urls";
import { getLanguage, setLanguage, t } from "../../lib/i18n";
import type { User } from "../../types/api";

export function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [defaultLoc, setDefaultLoc] = useState<LatLng | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [currentLanguage, setCurrentLanguage] = useState<"id" | "en">(getLanguage());
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showVerificationDialog, setShowVerificationDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);
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

  // Photo URL: prefer new file preview, fallback to existing photo
  // MUST be called before any early returns (Rules of Hooks)
  const photoPreviewUrl = useMemo(() => {
    if (profilePhoto) {
      return URL.createObjectURL(profilePhoto);
    }
    return null;
  }, [profilePhoto]);

  const existingPhotoUrl = useMemo(() => toAbsoluteUrl(user?.profile_photo ?? null), [user?.profile_photo]);

  const displayPhotoUrl = photoPreviewUrl ?? existingPhotoUrl;

  // Cleanup preview URL when component unmounts or photo changes
  // MUST be called before any early returns (Rules of Hooks)
  useEffect(() => {
    return () => {
      if (photoPreviewUrl) {
        URL.revokeObjectURL(photoPreviewUrl);
      }
    };
  }, [photoPreviewUrl]);

  // Early returns AFTER all hooks
  if (loading) return <div className="text-sm text-slate-600">{t("profile.loadingProfile")}</div>;
  if (loadError) {
    return (
      <div className="rounded-xl border bg-white p-6 shadow-[0_4px_12px_rgba(0,0,0,0.08),0_2px_4px_rgba(0,0,0,0.04)]">
        <div className="text-lg font-semibold">{t("profile.couldNotLoadProfile")}</div>
        <div className="mt-2 text-sm text-rose-700">{loadError}</div>
      </div>
    );
  }
  if (!user) return null;

  return (
    <div className="w-full bg-gradient-to-br from-tropical-50 via-ocean-50/50 to-sand-50/70">
      {/* Professional Card Header */}
      <PageHeaderCard
        icon={UserIcon}
        title={t("profile.yourProfile")}
        subtitle={t("profile.subtitle")}
        gradientFrom="#1abc9c"
        gradientVia="#3498db"
        gradientTo="#1abc9c"
        iconGradientFrom="#1abc9c"
        iconGradientVia="#3498db"
        iconGradientTo="#1abc9c"
        glowColor="rgba(26,188,156"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-5 lg:px-6 pt-5 pb-4 sm:py-6 lg:py-7">
        {/* Success Message */}
        <AnimatePresence>
          {successMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="flex items-center gap-2 rounded-xl border-2 border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 p-3 text-xs sm:text-sm font-semibold text-emerald-700 shadow-lg"
            >
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 0.5 }}
              >
                <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600 flex-shrink-0" />
              </motion.div>
              <span>{successMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

      <div className="space-y-4 sm:space-y-5">
        {/* Profile Photo & Personal Details - Combined Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, type: "spring", stiffness: 100 }}
          className="card-lombok max-w-full overflow-hidden"
        >
          <div className="relative z-10">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mb-4 flex items-center gap-2"
            >
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-lombok-ocean-500 to-lombok-tropical-500">
                <UserIcon className="h-3.5 w-3.5 text-white" />
              </div>
              <div className="text-xs sm:text-sm font-bold text-slate-900">{t("profile.personalDetails")}</div>
            </motion.div>

            {/* Profile Photo Section */}
            <div className="mb-4 flex items-start gap-4">
              <motion.div
                whileHover={{ scale: 1.05, rotate: [0, -5, 5, 0] }}
                transition={{ duration: 0.3 }}
                className="h-20 w-20 sm:h-24 sm:w-24 flex-shrink-0 overflow-hidden rounded-2xl border-2 border-lombok-ocean-200 bg-gradient-to-br from-lombok-ocean-50 to-lombok-tropical-50 shadow-lg"
              >
                {displayPhotoUrl ? (
                  <img
                    className="h-full w-full object-cover"
                    src={displayPhotoUrl}
                    alt="Profile photo"
                    crossOrigin="anonymous"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = "none";
                      const parent = target.parentElement;
                      if (parent && !parent.querySelector(".photo-placeholder")) {
                        const placeholder = document.createElement("div");
                        placeholder.className = "photo-placeholder flex h-full w-full items-center justify-center text-lg font-bold text-lombok-ocean-600";
                        placeholder.textContent = user?.full_name?.[0]?.toUpperCase() ?? "?";
                        parent.appendChild(placeholder);
                      }
                    }}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <UserIcon className="h-10 w-10 sm:h-12 sm:w-12 text-lombok-ocean-400" />
                  </div>
                )}
              </motion.div>
              <div className="flex-1 min-w-0">
                <motion.label
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex cursor-pointer items-center gap-2 rounded-xl border-2 border-dashed border-lombok-ocean-200 bg-lombok-ocean-50/50 p-3 transition-all hover:border-lombok-ocean-400 hover:bg-lombok-ocean-50"
                >
                  <Camera className="h-4 w-4 text-lombok-ocean-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs sm:text-sm font-semibold text-slate-900 truncate">{t("profile.uploadPhoto")}</div>
                    <div className="text-[10px] sm:text-xs text-slate-600">{t("profile.clickToSelect")}</div>
                  </div>
                  <input
                    id="profile-photo-upload"
                    aria-label={t("profile.uploadPhoto")}
                    className="hidden"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0] ?? null;
                      if (file) {
                        if (file.size > 10 * 1024 * 1024) {
                           setActionError("Ukuran file terlalu besar (maks 10MB).");
                           return;
                        }
                        setProfilePhoto(file);
                        setActionError(null);
                      }
                    }}
                  />
                </motion.label>
                {profilePhoto && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-2 text-xs text-slate-500 truncate"
                  >
                    {profilePhoto.name} ({(profilePhoto.size / 1024).toFixed(1)} KB)
                  </motion.div>
                )}
              </div>
            </div>

            {/* Personal Details Fields */}
            <div className="grid gap-3 sm:grid-cols-2">
              <motion.label
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="block"
              >
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1.5">
                  <UserIcon className="h-3.5 w-3.5 text-lombok-ocean-500" />
                  {t("profile.fullName")}
                </div>
                <input
                  id="profile-fullname"
                  aria-label={t("profile.fullName")}
                  className="w-full rounded-xl border-2 border-slate-200 bg-white px-3 sm:px-4 py-2.5 text-sm transition-all focus:border-lombok-ocean-500 focus:ring-2 focus:ring-lombok-ocean-200"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </motion.label>

              <motion.label
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 }}
                className="block"
              >
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1.5">
                  <Phone className="h-3.5 w-3.5 text-lombok-tropical-500" />
                  {t("profile.phoneNumber")}
                </div>
                <input
                  id="profile-phone"
                  aria-label={t("profile.phoneNumber")}
                  className="w-full rounded-xl border-2 border-slate-200 bg-white px-3 sm:px-4 py-2.5 text-sm transition-all focus:border-lombok-ocean-500 focus:ring-2 focus:ring-lombok-ocean-200"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </motion.label>

              <motion.label
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="block sm:col-span-2"
              >
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1.5">
                  <Mail className="h-3.5 w-3.5 text-lombok-ocean-500" />
                  {t("profile.email")}
                </div>
                <input
                  id="profile-email"
                  aria-label={t("profile.email")}
                  className="w-full rounded-xl border-2 border-slate-200 bg-white px-3 sm:px-4 py-2.5 text-sm transition-all focus:border-lombok-ocean-500 focus:ring-2 focus:ring-lombok-ocean-200"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </motion.label>
            </div>
          </div>
        </motion.div>

        {/* Password & Language Settings - Combined Card */}
        <div className="grid gap-4 sm:gap-5 lg:grid-cols-2">
          {/* Password Card */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1, type: "spring", stiffness: 100 }}
            className="card-lombok max-w-full overflow-hidden"
          >
            <div className="relative z-10">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mb-2 flex items-center gap-2"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
                  <Lock className="h-3.5 w-3.5 text-white" />
                </div>
                <div className="text-xs sm:text-sm font-bold text-slate-900">{t("profile.changePassword")}</div>
              </motion.div>

              <div className="mt-4 space-y-4">
                <motion.label
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 }}
                  className="block relative"
                >
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1.5">
                    <Lock className="h-3.5 w-3.5 text-purple-500" />
                    {t("profile.newPassword")}
                  </div>
                  <div className="relative">
                    <input
                      className="w-full rounded-xl border-2 border-slate-200 bg-white px-3 sm:px-4 py-2.5 pr-10 text-sm transition-all focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={t("profile.enterNewPassword")}
                    />
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </motion.button>
                  </div>
                </motion.label>

                <motion.label
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="block relative"
                >
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1.5">
                    <Lock className="h-3.5 w-3.5 text-purple-500" />
                    {t("profile.confirmPassword")}
                  </div>
                  <div className="relative">
                    <input
                      className="w-full rounded-xl border-2 border-slate-200 bg-white px-3 sm:px-4 py-2.5 pr-10 text-sm transition-all focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder={t("profile.confirmNewPassword")}
                    />
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showConfirmPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </motion.button>
                  </div>
                </motion.label>

                {password && confirmPassword && password !== confirmPassword && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-1.5 rounded-lg bg-rose-50 border border-rose-200 px-2.5 py-1.5 text-[10px] text-rose-700"
                  >
                    <AlertCircle className="h-3 w-3 flex-shrink-0" />
                    <span>{t("profile.passwordsDoNotMatch")}</span>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Language Settings */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2, type: "spring", stiffness: 100 }}
            className="card-lombok max-w-full overflow-hidden"
          >
            <div className="relative z-10">
              <div className="mb-1 text-xs font-bold uppercase tracking-wider text-lombok-sunset-500">{t("profile.settings")}</div>
              <div className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <Globe className="h-5 w-5 sm:h-6 sm:w-6 text-lombok-sunset-500" />
                {t("profile.language")}
              </div>

              <div className="mt-4 space-y-3">
                <div className="text-xs sm:text-sm font-medium text-slate-700 mb-3">
                  {t("profile.selectLanguage")}
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setCurrentLanguage("id");
                      setLanguage("id");
                    }}
                    className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all ${
                      currentLanguage === "id"
                        ? "border-lombok-sunset-500 bg-gradient-to-br from-lombok-sunset-50 to-orange-50 shadow-md"
                        : "border-slate-200 bg-white hover:border-lombok-sunset-200 hover:bg-slate-50"
                    }`}
                  >
                    <div className={`text-lg font-black ${currentLanguage === "id" ? "text-lombok-sunset-600" : "text-slate-600"}`}>
                      🇮🇩
                    </div>
                    <div className={`text-xs sm:text-sm font-bold ${currentLanguage === "id" ? "text-lombok-sunset-700" : "text-slate-700"}`}>
                      {t("profile.indonesian")}
                    </div>
                    {currentLanguage === "id" && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="mt-1"
                      >
                        <CheckCircle2 className="h-4 w-4 text-lombok-sunset-600" />
                      </motion.div>
                    )}
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setCurrentLanguage("en");
                      setLanguage("en");
                    }}
                    className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all ${
                      currentLanguage === "en"
                        ? "border-lombok-sunset-500 bg-gradient-to-br from-lombok-sunset-50 to-orange-50 shadow-md"
                        : "border-slate-200 bg-white hover:border-lombok-sunset-200 hover:bg-slate-50"
                    }`}
                  >
                    <div className={`text-lg font-black ${currentLanguage === "en" ? "text-lombok-sunset-600" : "text-slate-600"}`}>
                      🇬🇧
                    </div>
                    <div className={`text-xs sm:text-sm font-bold ${currentLanguage === "en" ? "text-lombok-sunset-700" : "text-slate-700"}`}>
                      {t("profile.english")}
                    </div>
                    {currentLanguage === "en" && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="mt-1"
                      >
                        <CheckCircle2 className="h-4 w-4 text-lombok-sunset-600" />
                      </motion.div>
                    )}
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Default Location Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3, type: "spring", stiffness: 100 }}
          className="card-lombok max-w-full overflow-hidden"
        >
          <div className="relative z-10">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mb-2 flex items-center gap-2"
            >
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-lombok-tropical-500 to-lombok-ocean-500">
                <MapPin className="h-3.5 w-3.5 text-white" />
              </div>
              <div className="text-xs sm:text-sm font-bold text-slate-900">{t("profile.defaultLocation")}</div>
            </motion.div>
            <div className="mt-3">
              <MapPicker value={defaultLoc} onChange={setDefaultLoc} />
            </div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-2 flex items-center gap-1.5 text-[9px] sm:text-[10px] text-slate-500"
            >
              <Lightbulb className="h-3 w-3 text-lombok-tropical-500 flex-shrink-0" />
              <span>{t("profile.locationHint")}</span>
            </motion.div>
          </div>
        </motion.div>

        {/* Save Button with Animation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex justify-end"
        >
          <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            disabled={saving}
            className="group relative overflow-hidden flex items-center gap-2 rounded-xl bg-gradient-to-r from-lombok-ocean-600 to-lombok-tropical-600 px-4 sm:px-5 py-2.5 sm:py-3 text-xs sm:text-sm font-bold text-white shadow-lg transition-all hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed"
            onClick={async () => {
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
              if (password) {
                fd.append("password", password);
              }
              if (defaultLoc) {
                fd.append("default_latitude", String(defaultLoc.lat));
                fd.append("default_longitude", String(defaultLoc.lng));
              }
              if (profilePhoto) fd.append("profile_photo", profilePhoto);

              const resp = await api.put("/users/me", fd);
              const updated = resp.data.data.user as User;
              
              if (photoPreviewUrl) {
                URL.revokeObjectURL(photoPreviewUrl);
              }
              
              setUser(updated);
              setProfilePhoto(null);
              setPassword("");
              setConfirmPassword("");

              setSuccessMessage(t("profile.profileUpdated"));
              setTimeout(() => setSuccessMessage(null), 5000);

              window.dispatchEvent(new Event("profileUpdated"));
            } catch (err) {
              setActionError(getApiErrorMessage(err));
            } finally {
              setSaving(false);
            }
            }}
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              animate={{
                x: ["-100%", "200%"],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatDelay: 1,
                ease: "linear",
              }}
            />
            {saving ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="h-3.5 w-3.5 sm:h-4 sm:w-4 rounded-full border-2 border-white/30 border-t-white"
                />
                <span>{t("profile.saving")}</span>
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span>{t("profile.saveChanges")}</span>
              </>
            )}
          </motion.button>
        </motion.div>

        {/* Account Settings Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="card-lombok max-w-full overflow-hidden mt-4 sm:mt-6"
        >
          <div className="relative z-10">
            <div className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-500">{t("profile.settings")}</div>
            <div className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2 mb-4">
              <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 text-slate-600" />
              {currentLanguage === "id" ? "Pengaturan Akun" : "Account Settings"}
            </div>

            <div className="space-y-3">
              <motion.button
                whileHover={{ scale: 1.02, x: 2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  logout();
                  navigate("/login", { replace: true });
                }}
                className="w-full flex items-center justify-between gap-3 rounded-xl border-2 border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100 p-4 transition-all hover:border-slate-300 hover:from-slate-100 hover:to-slate-200 shadow-sm hover:shadow-md"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-slate-600 to-slate-800 shadow-md">
                    <LogOut className="h-5 w-5 text-white" />
                  </div>
                  <div className="text-left flex-1">
                    <div className="text-sm sm:text-base font-bold text-slate-800">
                      {currentLanguage === "id" ? "Keluar Akun" : "Log Out"}
                    </div>
                    <div className="text-xs text-slate-600 mt-0.5">
                      {currentLanguage === "id"
                        ? "Keluar dari aplikasi LokaClean pada perangkat ini"
                        : "Sign out from LokaClean on this device"}
                    </div>
                  </div>
                </div>
              </motion.button>

              {/* Delete Account Button */}
              <motion.button
                whileHover={{ scale: 1.02, x: 2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowDeleteDialog(true)}
                className="w-full flex items-center justify-between gap-3 rounded-xl border-2 border-rose-200 bg-gradient-to-r from-rose-50 to-red-50 p-4 transition-all hover:border-rose-300 hover:from-rose-100 hover:to-red-100 shadow-sm hover:shadow-md"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-rose-500 to-red-500 shadow-md">
                    <Trash2 className="h-5 w-5 text-white" />
                  </div>
                  <div className="text-left flex-1">
                    <div className="text-sm sm:text-base font-bold text-rose-700">
                      {currentLanguage === "id" ? "Hapus Akun" : "Delete Account"}
                    </div>
                    <div className="text-xs text-rose-600 mt-0.5">
                      {currentLanguage === "id" 
                        ? "Hapus akun dan semua data secara permanen" 
                        : "Permanently delete your account and all data"}
                    </div>
                  </div>
                </div>
                <div className="text-rose-500">
                  <LogOut className="h-5 w-5" />
                </div>
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Error Message */}
        <AnimatePresence>
          {actionError && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="flex items-center gap-2 rounded-xl border-2 border-rose-200 bg-gradient-to-r from-rose-50 to-pink-50 p-3 text-xs sm:text-sm font-semibold text-rose-700 shadow-lg mt-4"
            >
              <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
              <span>{actionError}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      </div>

      {/* Delete Account Confirmation Dialog */}
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
            ? "Apakah Anda yakin ingin menghapus akun Anda? Tindakan ini tidak dapat dibatalkan dan semua data Anda akan dihapus secara permanen, termasuk pesanan, rating, dan riwayat."
            : "Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently deleted, including orders, ratings, and history."
        }
        confirmText={currentLanguage === "id" ? "Ya, Lanjutkan" : "Yes, Continue"}
        cancelText={currentLanguage === "id" ? "Batal" : "Cancel"}
        variant="danger"
        isLoading={false}
      />

      {/* Delete Account Verification Dialog */}
      {user && (
        <DeleteAccountVerificationDialog
          isOpen={showVerificationDialog}
          onClose={() => setShowVerificationDialog(false)}
          onConfirm={async (emailOrPhone, password) => {
            setDeleting(true);
            setActionError(null);
            try {
              // Axios delete with body requires using config.data
              await api.delete("/users/me", {
                data: {
                  email_or_phone: emailOrPhone,
                  password: password
                }
              });
              // Clear local storage and redirect to login
              localStorage.removeItem("lokaclean_token");
              localStorage.removeItem("lokaclean_language");
              localStorage.removeItem("lokaclean_unread_count");
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


