/**
 * USER login page - Modern Mobile-First Design with Tropical Clean Hospitality Theme.
 */

import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, Lock, Sparkles, Hand } from "lucide-react";

import { api } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { CircularLoader } from "../../components/ui/CircularLoader";
import { LanguageSwitcherPill } from "../../components/LanguageSwitcher";
import { getApiErrorMessage } from "../../lib/apiError";
import { normalizeWhatsAppPhone } from "../../lib/phone";
import { t, useCurrentLanguage } from "../../lib/i18n";
import { Helmet } from "react-helmet-async";

export function UserLogin() {
  useCurrentLanguage();
  const { token, actor, setAuth } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [resetPassword, setResetPassword] = useState("");
  const [resetPasswordConfirm, setResetPasswordConfirm] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [resetPhone, setResetPhone] = useState<string | null>(null);

  const isFormValid = login.trim().length > 0 && password.trim().length >= 6;

  const handleForgotPasswordClick = async () => {
    const rawLogin = login.trim();
    if (!rawLogin) {
      setError(t("auth.validation.whatsappRequired"));
      return;
    }
    const normalized = normalizeWhatsAppPhone(rawLogin);
    if (!normalized) {
      setError(t("auth.validation.whatsappInvalidFormat"));
      return;
    }

    try {
      await api.post("/auth/user/reset-password/check", {
        phone_number: normalized
      });
    } catch (err) {
      setError(getApiErrorMessage(err));
      return;
    }

    setResetPhone(normalized);
    setResetPassword("");
    setResetPasswordConfirm("");
    setResetError(null);
    setResetMessage(null);
    setShowResetDialog(true);
  };

  const closeResetDialog = () => {
    setShowResetDialog(false);
    setResetError(null);
    setResetMessage(null);
    setResetPassword("");
    setResetPasswordConfirm("");
  };

  if (token) {
    const state = location.state as { from?: string } | null;
    const from = state?.from || (actor === "ADMIN" ? "/admin/orders" : "/home");
    return <Navigate to={from} replace />;
  }

  return (
    <div className="flex min-h-screen w-full bg-white overflow-hidden">
      <Helmet>
        <title>Login LokaClean | Cleaning Service Mandalika</title>
      </Helmet>

      <motion.div
        initial={{ x: "-100%", opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="hidden lg:flex w-1/2 relative bg-slate-900 items-center justify-center overflow-hidden"
      >
        <div className="absolute inset-0 z-0">
          <img
            src="/img/hero.png"
            alt="LokaClean Hero"
            className="w-full h-full object-cover object-center opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 via-slate-900/60 to-tropical-900/40 mix-blend-multiply" />
        </div>

        <div className="relative z-10 p-12 text-white max-w-xl">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <motion.div
              whileHover={{ scale: 1.05, rotate: 5 }}
              transition={{ type: "spring", stiffness: 300 }}
              className="flex h-24 w-24 items-center justify-center rounded-3xl bg-white/15 backdrop-blur-xl border border-white/30 mb-8 shadow-[0_8px_32px_rgba(0,0,0,0.2)] ring-1 ring-white/20"
            >
              <img
                src="/img/logo.jpg"
                alt="Logo"
                className="h-20 w-20 object-contain drop-shadow-lg rounded-2xl"
              />
            </motion.div>
            <h1 className="text-5xl font-bold leading-tight mb-6">
              <span>Clean Comfort,</span> <br />
              <span className="text-tropical-300">Island Style.</span>
            </h1>
            <p className="text-lg text-slate-300 leading-relaxed mb-8">
              Top-tier cleaning in Lombok, right in your pocket. Professional, fun, and totally trusted.
            </p>

            <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md p-2 pr-6 rounded-full w-fit border border-white/20">
              <div className="flex -space-x-4">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="w-10 h-10 rounded-full border-2 border-slate-800 bg-slate-700 overflow-hidden"
                  >
                    <img
                      src={`https://randomuser.me/api/portraits/thumb/men/${i + 20}.jpg`}
                      alt={`User ${i}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
              <div className="flex flex-col justify-center">
                <div className="flex items-center gap-1 text-amber-400">
                  <Sparkles className="w-3.5 h-3.5 fill-current" />
                  <span className="font-bold text-white text-sm">4.9/5.0</span>
                </div>
                <span className="text-xs text-slate-300">
                  Join 2,000+ happy locals & travelers
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      <motion.div
        className="w-full lg:w-1/2 flex items-center justify-center relative bg-transparent lg:bg-white overflow-hidden lg:p-12"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div className="absolute inset-0 lg:hidden z-0 bg-slate-900">
          <img
            src="/img/hero.png"
            alt="Background"
            className="w-full h-[48%] object-cover object-top opacity-90"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-slate-900/60 to-slate-900" />
        </div>

        <div className="hidden lg:block absolute top-8 right-8 z-50">
          <LanguageSwitcherPill variant="dark" uniqueId="desktop-login" />
        </div>

        <div className="hidden sm:block absolute inset-0 overflow-hidden pointer-events-none z-0">
          <motion.div
            className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-tropical-500/10 lg:bg-tropical-500/5 blur-3xl"
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute top-1/4 -left-10 h-40 w-40 rounded-full bg-yellow-400/20 lg:bg-yellow-400/10 blur-2xl"
            animate={{ scale: [1.2, 1, 1.2], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          />
        </div>

        <div className="w-full h-full lg:h-auto flex flex-col lg:justify-center relative z-10">
          <div className="lg:hidden min-h-[40vh] flex flex-col justify-end px-6 pb-6 pt-10 text-white relative z-10">
            <div className="absolute top-6 right-6 z-20">
              <LanguageSwitcherPill uniqueId="mobile-login" />
            </div>

            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-4"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/20 sm:backdrop-blur-md border border-white/30 shadow-lg">
                  <img src="/img/logo.jpg" alt="Logo" className="h-16 w-16 object-contain rounded-xl" />
                </div>
              </div>

              <h2 className="text-2xl font-bold leading-tight mb-3 drop-shadow-md">
                {t("auth.hero.titlePart1")} <br />
                <span className="text-tropical-200">{t("auth.hero.titleHighlight")}</span>
              </h2>

              <p className="text-xs text-slate-100 leading-relaxed mb-6 max-w-xs drop-shadow-sm">
                {t("auth.hero.subtitle")}
              </p>

              <div className="flex items-center gap-3 bg-white/10 sm:backdrop-blur-md p-1.5 pr-3 rounded-full w-fit border border-white/20">
                <div className="flex -space-x-3">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="w-6 h-6 rounded-full border border-slate-800 bg-slate-700 overflow-hidden"
                    >
                      <img
                        src={`https://randomuser.me/api/portraits/thumb/men/${i + 20}.jpg`}
                        alt={`User ${i}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5 text-yellow-300 fill-yellow-300" />
                    <span className="text-[10px] font-bold text-white">4.9/5.0</span>
                  </div>
                  <span className="text-[9px] text-slate-300 leading-none">
                    {t("auth.hero.trustedUsers")}
                  </span>
                </div>
              </div>
            </motion.div>
          </div>

          <div className="flex-1 lg:flex-none bg-white rounded-t-[2.5rem] lg:rounded-none px-6 py-8 sm:px-12 lg:px-0 lg:py-0 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] lg:shadow-none relative lg:flex lg:flex-col lg:justify-center">
            <div className="mb-8 w-full max-w-md mx-auto">
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight">
                  {t("auth.login.welcomeTitle")}
                </h2>
                <motion.div
                  animate={{ rotate: [0, 20, 0, 20, 0] }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    repeatDelay: 3,
                    ease: "easeInOut",
                  }}
                  className="origin-bottom-right"
                >
                  <Hand className="h-6 w-6 lg:h-8 lg:w-8 text-tropical-500 fill-tropical-200" />
                </motion.div>
              </div>
              <p className="text-slate-600 text-sm lg:text-base leading-relaxed">
                {t("auth.login.welcomeSubtitle")}
              </p>
            </div>

            <div className="w-full max-w-md mx-auto">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 flex items-start gap-3"
                >
                  <div className="mt-0.5 min-w-[16px]">
                    <Sparkles className="h-4 w-4 text-red-500" />
                  </div>
                  <span className="font-medium">{error}</span>
                </motion.div>
              )}

              <form
                className="space-y-4 lg:space-y-6"
                onSubmit={async (e) => {
                  e.preventDefault();

                  const rawLogin = login.trim();
                  if (!rawLogin) {
                    setError(t("auth.validation.whatsappRequired"));
                    return;
                  }
                  const normalized = normalizeWhatsAppPhone(rawLogin);
                  if (!normalized) {
                    setError(t("auth.validation.whatsappInvalidFormat"));
                    return;
                  }
                  const loginValue = normalized;
                  if (!password.trim()) {
                    setError(t("auth.validation.passwordRequired"));
                    return;
                  }
                  if (password.trim().length < 6) {
                    setError(t("auth.validation.passwordMin"));
                    return;
                  }
                  setLoading(true);
                  setError(null);
                  try {
                    const resp = await api.post("/auth/user/login", {
                      login: loginValue,
                      password,
                    });
                    const tokenVal = resp.data.data.token as string;
                    setAuth(tokenVal, "USER");
                    localStorage.removeItem("lokaclean_welcome_shown");
                    navigate("/home", { replace: true });
                  } catch (err) {
                    const errorMessage = getApiErrorMessage(err);
                    let friendlyMessage = errorMessage;
                    const lowered = errorMessage.toLowerCase();
                    if (lowered.includes("invalid credentials")) {
                      friendlyMessage = t("auth.validation.loginFailed");
                    } else if (lowered.includes("nomor whatsapp tidak valid")) {
                      friendlyMessage = t("auth.validation.whatsappInvalidFormat");
                    } else if (lowered.includes("password salah")) {
                      friendlyMessage = t("auth.validation.loginFailed");
                    } else if (lowered.includes("tidak terdaftar")) {
                      friendlyMessage = errorMessage;
                    }
                    setError(friendlyMessage);
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                <div className="space-y-1.5 lg:space-y-2">
                  <label className="text-xs lg:text-sm font-semibold text-slate-700">
                    {t("auth.login.whatsappLabel")}
                  </label>
                  <div className="relative group">
                    <div className="absolute left-3.5 lg:left-4 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-tropical-500 text-slate-400">
                      <Phone className="h-4 w-4 lg:h-5 lg:w-5" />
                    </div>
                    <input
                      className="w-full rounded-lg lg:rounded-xl border border-slate-300 bg-white pl-10 lg:pl-12 pr-3 lg:pr-4 py-2.5 lg:py-3.5 text-sm lg:text-base font-medium text-slate-900 placeholder-slate-400 transition-all focus:border-tropical-500 focus:ring-4 focus:ring-tropical-500/10 focus:outline-none"
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      value={login}
                      onChange={(e) => {
                        setLogin(e.target.value);
                        setError(null);
                      }}
                      required
                      placeholder={t("auth.login.whatsappPlaceholder")}
                    />
                  </div>
                  <div className="text-[10px] lg:text-xs text-slate-500 pl-1">
                    Format: <span className="font-medium">+kode negara</span> (e.g. +62)
                  </div>
                </div>

                <div className="space-y-1.5 lg:space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs lg:text-sm font-semibold text-slate-700">
                      {t("auth.login.passwordLabel")}
                    </label>
                    <button
                      type="button"
                      onClick={handleForgotPasswordClick}
                      className="text-[10px] lg:text-xs font-semibold text-tropical-600 hover:text-tropical-700"
                    >
                      {t("auth.login.forgotPassword")}
                    </button>
                  </div>
                  <div className="relative group">
                    <div className="absolute left-3.5 lg:left-4 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-tropical-500 text-slate-400">
                      <Lock className="h-4 w-4 lg:h-5 lg:w-5" />
                    </div>
                    <input
                      className="w-full rounded-lg lg:rounded-xl border border-slate-300 bg-white pl-10 lg:pl-12 pr-3 lg:pr-4 py-2.5 lg:py-3.5 text-sm lg:text-base font-medium text-slate-900 placeholder-slate-400 transition-all focus:border-tropical-500 focus:ring-4 focus:ring-tropical-500/10 focus:outline-none"
                      type="password"
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setError(null);
                      }}
                      required
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <motion.button
                  type="submit"
                  disabled={loading || !isFormValid}
                  whileHover={isFormValid ? { scale: 1.02, y: -1 } : {}}
                  whileTap={isFormValid ? { scale: 0.98 } : {}}
                  className={[
                    "w-full rounded-xl px-4 py-3.5 text-base font-bold transition-all duration-300 mt-2 relative overflow-hidden group",
                    isFormValid
                      ? "bg-gradient-to-r from-tropical-600 via-tropical-500 to-ocean-500 text-white shadow-[0_10px_20px_-5px_rgba(13,148,136,0.4)] hover:shadow-[0_15px_30px_-5px_rgba(13,148,136,0.5)]"
                      : "bg-slate-100 text-slate-300 cursor-not-allowed shadow-none",
                  ].join(" ")}
                >
                  {isFormValid && (
                    <div className="absolute inset-0 -translate-x-full group-hover:animate-shimmer-slide bg-gradient-to-r from-transparent via-white/20 to-transparent z-10" />
                  )}

                  <span className="flex items-center justify-center gap-2 relative z-20">
                    {loading ? (
                      <>
                        <CircularLoader size="sm" />
                        <span>{t("auth.login.loading")}</span>
                      </>
                    ) : (
                      <>
                        <Sparkles
                          className={isFormValid ? "h-5 w-5" : "h-5 w-5 opacity-50"}
                        />
                        <span className="tracking-wide">{t("auth.login.submitButton")}</span>
                      </>
                    )}
                  </span>
                </motion.button>
              </form>

              <div className="mt-8 text-center">
                <p className="text-sm text-slate-500 font-medium">
                  {t("auth.login.footerText")}{" "}
                  <Link
                    to="/register"
                    className="font-bold text-tropical-600 hover:text-tropical-700 transition-colors"
                  >
                    {t("auth.login.footerLink")}
                  </Link>
                </p>
              </div>
            </div>

            <AnimatePresence>
              {loading && (
                <motion.div
                  initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
                  animate={{ opacity: 1, backdropFilter: "blur(8px)" }}
                  exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
                  className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/50 rounded-t-[2.5rem] lg:rounded-none"
                >
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                    className="flex flex-col items-center bg-white/80 p-8 rounded-3xl shadow-2xl border border-white/50 backdrop-blur-xl"
                  >
                    <CircularLoader size="xl" className="mb-6" />
                    <h3 className="text-xl font-bold text-slate-800 mb-2">
                      {t("auth.login.submitButton")}...
                    </h3>
                    <p className="text-sm text-slate-500 font-medium">Please wait a moment</p>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {showResetDialog && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4"
                >
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200 p-6 space-y-4"
                  >
                    <div className="space-y-1">
                      <div className="text-xs font-semibold text-tropical-600">
                        {t("auth.login.passwordLabel")}
                      </div>
                      <h3 className="text-lg font-bold text-slate-900">
                        {t("auth.login.forgotPassword")}
                      </h3>
                      <p className="text-xs text-slate-500">
                        Nomor WhatsApp terdaftar:{" "}
                        <span className="font-semibold text-slate-800">
                          {resetPhone}
                        </span>
                      </p>
                    </div>

                    {resetError && (
                      <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                        {resetError}
                      </div>
                    )}

                    {resetMessage && (
                      <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                        {resetMessage}
                      </div>
                    )}

                    <form
                      className="space-y-3"
                      onSubmit={async (e) => {
                        e.preventDefault();
                        if (!resetPhone) return;

                        if (!resetPassword || resetPassword.trim().length < 6) {
                          setResetError("Password minimal 6 karakter");
                          return;
                        }
                        if (resetPassword !== resetPasswordConfirm) {
                          setResetError("Konfirmasi password tidak sama");
                          return;
                        }

                        setResetLoading(true);
                        setResetError(null);
                        setResetMessage(null);
                        try {
                          await api.post("/auth/user/reset-password", {
                            phone_number: resetPhone,
                            new_password: resetPassword
                          });
                          setResetMessage(
                            "Password berhasil direset. Silakan login dengan password baru."
                          );
                          setPassword("");
                        } catch (err) {
                          setResetError(getApiErrorMessage(err));
                        } finally {
                          setResetLoading(false);
                        }
                      }}
                    >
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-700">
                          Password baru
                        </label>
                        <input
                          type="password"
                          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm font-medium text-slate-900 placeholder-slate-400 focus:border-tropical-500 focus:ring-2 focus:ring-tropical-500/20 focus:outline-none"
                          placeholder="••••••••"
                          value={resetPassword}
                          onChange={(e) => {
                            setResetPassword(e.target.value);
                            setResetError(null);
                          }}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-700">
                          Konfirmasi password baru
                        </label>
                        <input
                          type="password"
                          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm font-medium text-slate-900 placeholder-slate-400 focus:border-tropical-500 focus:ring-2 focus:ring-tropical-500/20 focus:outline-none"
                          placeholder="••••••••"
                          value={resetPasswordConfirm}
                          onChange={(e) => {
                            setResetPasswordConfirm(e.target.value);
                            setResetError(null);
                          }}
                        />
                      </div>

                      {resetMessage ? (
                        <div className="flex gap-2 pt-2">
                          <button
                            type="button"
                            onClick={closeResetDialog}
                            className="w-full rounded-lg bg-tropical-600 px-3 py-2.5 text-sm font-semibold text-white hover:bg-tropical-700"
                            disabled={resetLoading}
                          >
                            Tutup
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-2 pt-2">
                          <button
                            type="button"
                            onClick={closeResetDialog}
                            className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                            disabled={resetLoading}
                          >
                            Batal
                          </button>
                          <button
                            type="submit"
                            disabled={resetLoading}
                            className="flex-1 rounded-lg bg-tropical-600 px-3 py-2.5 text-sm font-semibold text-white hover:bg-tropical-700 disabled:opacity-60"
                          >
                            {resetLoading ? "Memproses..." : "Reset password"}
                          </button>
                        </div>
                      )}
                    </form>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
