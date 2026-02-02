/**
 * USER registration page - Modern Mobile-First Design with Tropical Clean Hospitality Theme.
 */

import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { User, Mail, Phone, Lock, UserPlus, Sparkles, Gem } from "lucide-react";

import { api } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { LanguageSwitcherPill } from "../../components/LanguageSwitcher";
import { getApiErrorMessage } from "../../lib/apiError";
import { normalizeWhatsAppPhone } from "../../lib/phone";
import { t, useCurrentLanguage } from "../../lib/i18n";

export function UserRegister() {
  const lang = useCurrentLanguage();
  const { token, actor, setAuth } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isFormValid = 
    fullName.trim().length > 0 && 
    email.trim().length > 0 && 
    phone.trim().length > 0 && 
    password.trim().length >= 6 && 
    password === passwordConfirm;

  // Hard separation:
  // - Logged-in ADMIN should not see user registration page.
  // - Logged-in USER should be sent to the user area.
  if (token) {
    return <Navigate to={actor === "ADMIN" ? "/admin/orders" : "/packages"} replace />;
  }

  return (
    <div className="flex min-h-screen w-full bg-white overflow-hidden">
      {/* Left Side - Hero Section (Desktop Only) */}
      <motion.div 
        initial={{ x: "-100%", opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="hidden lg:flex w-1/2 relative bg-slate-900 items-center justify-center overflow-hidden"
      >
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img 
            src="/img/hero.png" 
            alt="LokaClean Hero" 
            className="w-full h-full object-cover object-center opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 via-slate-900/60 to-tropical-900/40 mix-blend-multiply" />
        </div>

        {/* Content Overlay */}
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
              <img src="/img/logo.jpg" alt="Logo" className="h-20 w-20 object-contain drop-shadow-lg rounded-2xl" />
            </motion.div>
            <h1 className="text-5xl font-bold leading-tight mb-6">
              {t("auth.hero.joinRevolution")} <br/>
              <span className="text-tropical-200">{t("auth.hero.revolutionHighlight")}</span>
            </h1>

            <p className="text-lg text-slate-300 leading-relaxed mb-8">
              {t("auth.hero.subtitle")}
            </p>

            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md p-2 pr-4 rounded-full w-fit border border-white/20">
               <div className="flex -space-x-4">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="w-10 h-10 rounded-full border-2 border-slate-800 bg-slate-700 overflow-hidden">
                      <img src={`https://randomuser.me/api/portraits/thumb/women/${i+30}.jpg`} alt={`Happy Customer ${i}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
               </div>
               <div className="text-sm text-slate-300">
                 {t("auth.hero.joinHappyCustomers")} <span className="text-white font-bold">{t("auth.hero.happyCustomersHighlight")}</span> {t("auth.hero.happyCustomers")}
               </div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Right Side - Form Section */}
      <motion.div 
        className="w-full lg:w-1/2 flex items-center justify-center relative bg-transparent lg:bg-white overflow-hidden lg:p-12"
        initial={{ x: "100%", opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        {/* Mobile Background - Premium Brand Gradient */}
        <div className="absolute inset-0 lg:hidden z-0 bg-slate-900">
          <img 
            src="/img/hero.png" 
            alt="Background" 
            className="w-full h-[39%] object-cover object-top opacity-90"
          />
         <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-slate-900/60 to-slate-900" />
        </div>
        
        {/* Desktop Language Switcher */}
        <div className="hidden lg:block absolute top-8 right-8 z-50">
          <LanguageSwitcherPill variant="dark" uniqueId="desktop-register" />
        </div>

        {/* Decorative Circles (Mobile) - Hidden on small mobile screens for performance */}
        <div className="hidden sm:block absolute inset-0 overflow-hidden pointer-events-none lg:hidden z-0">
            <motion.div
              className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-white/20 blur-3xl"
              animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute top-1/4 -left-10 h-40 w-40 rounded-full bg-yellow-400/20 blur-2xl"
              animate={{ scale: [1.2, 1, 1.2], opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            />
        </div>

        {/* Register Container */}
        <div className="w-full h-full lg:h-auto flex flex-col lg:justify-center relative z-10">
          
          {/* Mobile Header Area (Logo & Welcome & Testimonials) */}
          <div className="lg:hidden min-h-[40vh] flex flex-col justify-end px-6 pb-6 pt-10 text-white relative z-10">
              
              {/* Mobile Language Switcher */}
              <div className="absolute top-6 right-6 z-20">
                  <LanguageSwitcherPill uniqueId="mobile-register" />
              </div>

              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mb-4 flex flex-col w-full"
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/20 sm:backdrop-blur-md border border-white/30 shadow-lg">
                    <img src="/img/logo.jpg" alt="Logo" className="h-16 w-16 object-contain rounded-xl" />
                  </div>
                </div>
                
                <h2 className="text-2xl font-bold leading-tight mb-3 drop-shadow-md">
                  {t("auth.hero.joinRevolution")} <br/>
                  <span className="text-tropical-200">{t("auth.hero.revolutionHighlight")}</span>
                </h2>

                <p className="text-xs text-slate-100 leading-relaxed mb-6 max-w-xs drop-shadow-sm">
                  {t("auth.hero.subtitle")}
                </p>

                <div className="flex items-center gap-3 bg-white/10 sm:backdrop-blur-md p-1.5 pr-3 rounded-full w-fit border border-white/20">
                  <div className="flex -space-x-3">
                      {[1,2,3,4].map(i => (
                      <div key={i} className="w-6 h-6 rounded-full border border-slate-800 bg-slate-700 overflow-hidden">
                          <img src={`https://randomuser.me/api/portraits/thumb/women/${i+30}.jpg`} alt={`Happy Customer ${i}`} className="w-full h-full object-cover" />
                      </div>
                      ))}
                  </div>
                  <div className="text-[10px] text-slate-300">
                    {t("auth.hero.joinHappyCustomers")} <span className="text-white font-bold">{t("auth.hero.happyCustomersHighlight")}</span> {t("auth.hero.happyCustomers")}
                  </div>
                </div>
              </motion.div>
          </div>

          {/* Form Container - Bottom Sheet Style on Mobile */}
          <div className="flex-1 lg:flex-none bg-white rounded-t-[2.5rem] lg:rounded-none px-6 py-8 sm:px-12 lg:px-0 lg:py-0 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] lg:shadow-none relative lg:flex lg:flex-col lg:justify-center">
            
            {/* Desktop Logo/Header (Hidden on Mobile) */}
            <div className="mb-8 w-full max-w-md mx-auto">
                {/* Mobile Title (Only visible on mobile inside sheet) */}
                <div className="lg:hidden mb-6 pt-2">
                    <div className="flex items-center gap-3 mb-1">
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.5 }}
                      >
                        <motion.div
                          animate={{ 
                            rotate: [0, 15, -5, 15, 0],
                            scale: [1, 1.1, 1]
                          }}
                          transition={{ 
                            duration: 3, 
                            repeat: Infinity, 
                            repeatDelay: 2,
                            ease: "easeInOut" 
                          }}
                          className="p-1.5 rounded-lg bg-gradient-to-br from-tropical-100 to-ocean-100 border border-tropical-200 shadow-sm"
                        >
                          <UserPlus className="w-5 h-5 text-tropical-600" />
                        </motion.div>
                      </motion.div>
                      <h3 className="text-2xl font-bold text-slate-900">{t("auth.register.title")}</h3>
                    </div>
                    <p className="text-slate-500 text-sm">{t("auth.register.subtitle")}</p>
                </div>

                <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="hidden lg:flex items-start gap-5"
                >
                    <div className="pt-1">
                        <div className="flex items-center gap-3 mb-1">
                          <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.5 }}
                          >
                            <motion.div
                              animate={{ 
                                y: [0, -3, 0],
                                rotate: [0, 5, -5, 0],
                                filter: ["drop-shadow(0 2px 4px rgba(20, 184, 166, 0.1))", "drop-shadow(0 4px 8px rgba(20, 184, 166, 0.3))", "drop-shadow(0 2px 4px rgba(20, 184, 166, 0.1))"]
                              }}
                              transition={{ 
                                duration: 4, 
                                repeat: Infinity, 
                                ease: "easeInOut" 
                              }}
                              className="p-2 rounded-xl bg-gradient-to-br from-tropical-50 to-white border border-tropical-100 shadow-sm"
                            >
                              <UserPlus className="w-6 h-6 text-tropical-500" />
                            </motion.div>
                          </motion.div>
                          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">{t("auth.register.title")}</h2>
                        </div>
                        <p className="text-slate-500 text-base font-medium">{t("auth.register.subtitle")}</p>
                    </div>
                </motion.div>
            </div>

            {/* Form Content */}
            <div className="w-full max-w-md mx-auto">
                {error && (
                    <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 flex items-start gap-3"
                    >
                    <div className="mt-0.5 min-w-[16px]"><Sparkles className="h-4 w-4 text-red-500" /></div>
                    <span className="font-medium">{error}</span>
                    </motion.div>
                )}

                <form
                    className="space-y-4 lg:space-y-6"
                    onSubmit={async (e) => {
                    e.preventDefault();

                    const normalizedPhone = normalizeWhatsAppPhone(phone);
                    if (!normalizedPhone) {
                        setError(t("auth.validation.whatsappInvalidFormat"));
                        return;
                    }
                    if (password.trim().length < 6) {
                        setError(t("auth.validation.passwordMin"));
                        return;
                    }
                    if (password !== passwordConfirm) {
                        setError(t("auth.validation.passwordMismatch"));
                        return;
                    }
                    setLoading(true);
                    setError(null);
                    try {
                        const resp = await api.post("/auth/user/register", {
                        full_name: fullName,
                        email: email.trim().toLowerCase(),
                        phone_number: normalizedPhone,
                        password
                        });
                        const token = resp.data.data.token as string;
                        setAuth(token, "USER");
                        localStorage.removeItem("lokaclean_welcome_shown");
                        navigate("/profile/complete?next=/packages", { replace: true });
                    } catch (err) {
                        const rawMessage = getApiErrorMessage(err);
                        const lowerMsg = rawMessage.toLowerCase();

                        if (lowerMsg.includes("email already registered")) {
                            setError(t("auth.validation.emailRegistered"));
                        } else if (lowerMsg.includes("phone number already registered")) {
                            setError(t("auth.validation.phoneRegistered"));
                        } else {
                            setError(rawMessage);
                        }
                    } finally {
                        setLoading(false);
                    }
                    }}
                >
                    {/* Full Name */}
                    <div className="space-y-2">
                        <label className="text-xs lg:text-sm font-semibold text-slate-700">{t("auth.register.fullNameLabel")}</label>
                        <div className="relative group">
                            <div className="absolute left-3.5 lg:left-4 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-tropical-500 text-slate-400">
                                <User className="h-4 w-4 lg:h-5 lg:w-5" />
                            </div>
                            <input
                                className="w-full rounded-lg lg:rounded-xl border border-slate-300 bg-white pl-10 lg:pl-12 pr-3 lg:pr-4 py-2.5 lg:py-3.5 text-sm lg:text-base font-medium text-slate-900 placeholder-slate-400 transition-all focus:border-tropical-500 focus:ring-4 focus:ring-tropical-500/10 focus:outline-none"
                                value={fullName}
                                onChange={(e) => {
                                setFullName(e.target.value);
                                setError(null);
                                }}
                                required
                                placeholder={t("auth.register.fullNamePlaceholder")}
                            />
                        </div>
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                        <label className="text-xs lg:text-sm font-semibold text-slate-700">{t("auth.register.emailLabel")}</label>
                        <div className="relative group">
                            <div className="absolute left-3.5 lg:left-4 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-tropical-500 text-slate-400">
                                <Mail className="h-4 w-4 lg:h-5 lg:w-5" />
                            </div>
                            <input
                                className="w-full rounded-lg lg:rounded-xl border border-slate-300 bg-white pl-10 lg:pl-12 pr-3 lg:pr-4 py-2.5 lg:py-3.5 text-sm lg:text-base font-medium text-slate-900 placeholder-slate-400 transition-all focus:border-tropical-500 focus:ring-4 focus:ring-tropical-500/10 focus:outline-none"
                                type="email"
                                value={email}
                                onChange={(e) => {
                                setEmail(e.target.value);
                                setError(null);
                                }}
                                required
                                placeholder={t("auth.register.emailPlaceholder")}
                            />
                        </div>
                    </div>

                    {/* Phone Number */}
                    <div className="space-y-2">
                        <label className="text-xs lg:text-sm font-semibold text-slate-700">{t("auth.register.whatsappLabel")}</label>
                        <div className="relative group">
                            <div className="absolute left-3.5 lg:left-4 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-tropical-500 text-slate-400">
                                <Phone className="h-4 w-4 lg:h-5 lg:w-5" />
                            </div>
                            <input
                                className="w-full rounded-lg lg:rounded-xl border-slate-200 bg-slate-50 pl-10 lg:pl-12 pr-3 lg:pr-4 py-2.5 lg:py-3.5 text-sm lg:text-base font-medium text-slate-900 focus:border-tropical-500 focus:bg-white focus:ring-4 focus:ring-tropical-500/10 transition-all duration-300 placeholder-slate-400 focus:outline-none"
                                type="tel"
                                inputMode="tel"
                                autoComplete="tel"
                                value={phone}
                                onChange={(e) => {
                                setPhone(e.target.value);
                                setError(null);
                                }}
                                required
                                placeholder={t("auth.register.whatsappPlaceholder")}
                            />
                        </div>
                    </div>

                    {/* Password Fields */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs lg:text-sm font-semibold text-slate-700">{t("auth.register.passwordLabel")}</label>
                            <div className="relative group">
                                <div className="absolute left-3.5 lg:left-4 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-tropical-500 text-slate-400">
                                    <Lock className="h-4 w-4 lg:h-5 lg:w-5" />
                                </div>
                                <input
                                    className="w-full rounded-lg lg:rounded-xl border border-slate-300 bg-white pl-10 lg:pl-12 pr-3 lg:pr-4 py-2.5 lg:py-3.5 text-sm lg:text-base font-medium text-slate-900 placeholder-slate-400 transition-all focus:border-tropical-500 focus:ring-4 focus:ring-tropical-500/10 focus:outline-none"
                                    type="password"
                                    autoComplete="new-password"
                                    value={password}
                                    onChange={(e) => {
                                    setPassword(e.target.value);
                                    setError(null);
                                    }}
                                    required
                                    placeholder="••••••••"
                                />
                            </div>
                            <p className={`text-[11px] font-medium ml-1 transition-colors ${
                                password.length > 0 && password.trim().length < 6 ? "text-red-500" : "text-slate-400"
                            }`}>
                                {t("auth.validation.passwordMin")}
                            </p>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs lg:text-sm font-semibold text-slate-700">{t("auth.register.confirmPasswordLabel")}</label>
                            <div className="relative group">
                                <div className="absolute left-3.5 lg:left-4 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-tropical-500 text-slate-400">
                                    <Lock className="h-4 w-4 lg:h-5 lg:w-5" />
                                </div>
                                <input
                                    className="w-full rounded-lg lg:rounded-xl border border-slate-300 bg-white pl-10 lg:pl-12 pr-3 lg:pr-4 py-2.5 lg:py-3.5 text-sm lg:text-base font-medium text-slate-900 placeholder-slate-400 transition-all focus:border-tropical-500 focus:ring-4 focus:ring-tropical-500/10 focus:outline-none"
                                    type="password"
                                    autoComplete="new-password"
                                    value={passwordConfirm}
                                    onChange={(e) => {
                                    setPasswordConfirm(e.target.value);
                                    setError(null);
                                    }}
                                    required
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <motion.button
                    type="submit"
                    disabled={loading || !isFormValid}
                    whileHover={isFormValid ? { scale: 1.02, y: -1 } : {}}
                    whileTap={isFormValid ? { scale: 0.98 } : {}}
                    className={[
                        "w-full rounded-xl px-4 py-3.5 text-base font-bold transition-all duration-300 mt-2 relative overflow-hidden group",
                        isFormValid 
                        ? "bg-gradient-to-r from-tropical-600 via-tropical-500 to-ocean-500 text-white shadow-[0_10px_20px_-5px_rgba(13,148,136,0.4)] hover:shadow-[0_15px_30px_-5px_rgba(13,148,136,0.5)]" 
                        : "bg-slate-100 text-slate-300 cursor-not-allowed shadow-none"
                    ].join(" ")}
                    >
                    {/* Shine Effect */}
                    {isFormValid && (
                        <div className="absolute inset-0 -translate-x-full group-hover:animate-shimmer-slide bg-gradient-to-r from-transparent via-white/20 to-transparent z-10" />
                    )}

                    <span className="flex items-center justify-center gap-2 relative z-20">
                        {loading ? (
                        <>
                            <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="h-5 w-5 rounded-full border-2 border-white/30 border-t-white"
                            />
                            <span>{t("auth.register.loading")}</span>
                        </>
                        ) : (
                        <>
                            <Gem className={isFormValid ? "h-5 w-5" : "h-5 w-5 opacity-50"} />
                            <span className="tracking-wide">{t("auth.register.submitButton")}</span>
                        </>
                        )}
                    </span>
                    </motion.button>
                </form>

                <div className="mt-8 text-center">
                    <p className="text-sm text-slate-500 font-medium">
                    {t("auth.register.footerText")}{" "}
                    <Link
                        to="/login"
                        className="font-bold text-tropical-600 hover:text-tropical-700 transition-colors"
                    >
                        {t("auth.register.footerLink")}
                    </Link>
                    </p>
                </div>
                </div>
            </div>
        </div>
      </motion.div>
    </div>
  );
}
