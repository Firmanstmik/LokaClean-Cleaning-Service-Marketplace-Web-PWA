/**
 * USER registration page - Modern Mobile-First Design with Tropical Clean Hospitality Theme.
 */

import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { User, Mail, Phone, Lock, UserPlus, Sparkles } from "lucide-react";

import { api } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { getApiErrorMessage } from "../../lib/apiError";
import { normalizeWhatsAppPhone } from "../../lib/phone";

export function UserRegister() {
  const { token, actor, setAuth } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Hard separation:
  // - Logged-in ADMIN should not see user registration page.
  // - Logged-in USER should be sent to the user area.
  if (token) {
    return <Navigate to={actor === "ADMIN" ? "/admin/orders" : "/packages"} replace />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-tropical-50 via-ocean-50/30 to-sand-50/50 p-4 sm:p-6 py-8 sm:py-12">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-1/4 left-1/4 h-64 w-64 rounded-full bg-tropical-200/30 blur-3xl"
          animate={{
            x: [0, 50, 0],
            y: [0, 50, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 h-64 w-64 rounded-full bg-ocean-200/30 blur-3xl"
          animate={{
            x: [0, -50, 0],
            y: [0, -50, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      {/* Registration Card - Compact Professional Design */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, type: "spring", stiffness: 200 }}
        className="relative w-full max-w-sm z-10"
      >
        {/* Background glow effect behind card */}
        <div className="absolute inset-0 -z-10 bg-tropical-500/20 blur-3xl rounded-2xl opacity-50"></div>
        
        <div className="relative rounded-2xl border border-white/60 bg-white/90 backdrop-blur-xl shadow-xl shadow-tropical-500/20 p-5 sm:p-6 overflow-hidden">
          {/* Animated cleaning broom effect */}
          <div className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none overflow-hidden">
            <motion.div
              className="absolute bottom-4 left-0"
              animate={{
                x: ["-10%", "110%"],
              }}
              transition={{
                duration: 10,
                repeat: Infinity,
                repeatDelay: 4,
                ease: "linear",
              }}
            >
              {/* Broom SVG */}
              <motion.div
                className="flex flex-col items-center"
                animate={{
                  y: [0, -3, 0],
                  rotate: [0, -5, 0],
                }}
                transition={{
                  duration: 0.6,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <svg
                  width="36"
                  height="36"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-tropical-600"
                >
                  {/* Broom handle */}
                  <line x1="12" y1="4" x2="12" y2="12" />
                  {/* Broom head */}
                  <path d="M6 12h12M6 12v6M9 12v6M12 12v6M15 12v6M18 12v6" />
                </svg>
              </motion.div>
              {/* Cleaning sparkles that appear and fade */}
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute bottom-0"
                  initial={{ opacity: 0 }}
                  animate={{
                    opacity: [0, 0.8, 0],
                    scale: [0.5, 1.2, 0.5],
                    y: [0, -15, -25],
                    x: [i * 15 - 20, i * 15 - 15, i * 15 - 10],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: i * 0.15,
                    ease: "easeOut",
                  }}
                >
                  <Sparkles className="h-2 w-2 text-tropical-400/70" />
                </motion.div>
              ))}
            </motion.div>
          </div>
          {/* Header with Logo */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-5 text-center"
          >
            <motion.div
              className="mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-xl bg-white shadow-lg overflow-hidden"
              whileHover={{ scale: 1.05 }}
              animate={{
                rotate: [0, 5, -5, 0],
              }}
              transition={{
                rotate: {
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                },
                scale: { duration: 0.3 }
              }}
            >
              <img
                src="/img/logo.png"
                alt="LokaClean Logo"
                className="h-full w-full object-contain p-2 scale-110"
              />
            </motion.div>
            <h1 className="text-xl font-semibold text-slate-900 mb-1">Create your account</h1>
            <p className="text-xs text-slate-500">Join us for a cleaner space</p>
          </motion.div>

          {/* Error message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 rounded-lg border border-red-200 bg-red-50 p-2.5 text-sm text-red-700"
            >
              <span className="font-medium">{error}</span>
            </motion.div>
          )}

          {/* Registration Form */}
          <form
            className="space-y-3.5 relative z-10"
            onSubmit={async (e) => {
              e.preventDefault();

              const normalizedPhone = normalizeWhatsAppPhone(phone);
              if (!normalizedPhone) {
                setError("Nomor WhatsApp tidak valid. Contoh: +628123456789 atau 08123456789.");
                return;
              }
              if (password.trim().length < 6) {
                setError("Password minimal 6 karakter.");
                return;
              }
              if (password !== passwordConfirm) {
                setError("Konfirmasi password tidak sama.");
                return;
              }
              setLoading(true);
              setError(null);
              try {
                const resp = await api.post("/auth/user/register", {
                  full_name: fullName,
                  email,
                  phone_number: normalizedPhone,
                  password
                });
                const token = resp.data.data.token as string;
                setAuth(token, "USER");
                // Clear welcome screen cache to show welcome screen after register
                localStorage.removeItem("lokaclean_welcome_shown");
                navigate("/profile/complete?next=/packages", { replace: true });
              } catch (err) {
                setError(getApiErrorMessage(err));
              } finally {
                setLoading(false);
              }
            }}
          >
            <label className="block">
              <div className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-700">
                <User className="h-4 w-4 text-tropical-600" />
                Full Name
              </div>
              <input
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 transition-all focus:border-tropical-500 focus:ring-2 focus:ring-tropical-100 focus:outline-none"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  setError(null);
                }}
                required
                placeholder="Your full name"
              />
            </label>

            <label className="block">
              <div className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-700">
                <Mail className="h-4 w-4 text-ocean-600" />
                Email
              </div>
              <input
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 transition-all focus:border-ocean-500 focus:ring-2 focus:ring-ocean-100 focus:outline-none"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError(null);
                }}
                required
                placeholder="you@email.com"
              />
            </label>

            <label className="block">
              <div className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-700">
                <Phone className="h-4 w-4 text-tropical-600" />
                WhatsApp Number
              </div>
              <input
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 transition-all focus:border-tropical-500 focus:ring-2 focus:ring-tropical-100 focus:outline-none"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  setError(null);
                }}
                required
                placeholder="+62 812-3456-7890"
              />
              <div className="mt-1 text-xs text-slate-500">
                Format: <span className="font-medium">08…</span> atau <span className="font-medium">+…</span>
              </div>
            </label>

            <label className="block">
              <div className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-700">
                <Lock className="h-4 w-4 text-ocean-600" />
                Password
              </div>
              <input
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 transition-all focus:border-ocean-500 focus:ring-2 focus:ring-ocean-100 focus:outline-none"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(null);
                }}
                required
                placeholder="Minimal 6 karakter"
              />
            </label>

            <label className="block">
              <div className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-700">
                <Lock className="h-4 w-4 text-ocean-600" />
                Confirm Password
              </div>
              <input
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 transition-all focus:border-ocean-500 focus:ring-2 focus:ring-ocean-100 focus:outline-none"
                type="password"
                autoComplete="new-password"
                value={passwordConfirm}
                onChange={(e) => {
                  setPasswordConfirm(e.target.value);
                  setError(null);
                }}
                required
                placeholder="Re-enter password"
              />
            </label>

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.01 }}
              whileTap={{ scale: loading ? 1 : 0.99 }}
              className="w-full rounded-lg bg-tropical-gradient px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-tropical-500/30 transition-all hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <span className="flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white"
                    />
                    <span>Creating account...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" />
                    <span>Create account</span>
                  </>
                )}
              </span>
            </motion.button>
          </form>

          {/* Footer Link */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-5 border-t border-slate-200 pt-4 text-center"
          >
            <p className="text-sm text-slate-600">
              Already have an account?{" "}
              <Link
                to="/login"
                className="font-semibold text-tropical-600 hover:text-tropical-700 hover:underline transition-colors"
              >
                Sign in
              </Link>
            </p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
