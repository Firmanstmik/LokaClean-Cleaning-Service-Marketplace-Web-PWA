/**
 * USER login page - Modern Mobile-First Design with Tropical Clean Hospitality Theme.
 */

import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, Phone, Lock, LogIn, Sparkles } from "lucide-react";

import { api } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { getApiErrorMessage } from "../../lib/apiError";
import { normalizeWhatsAppPhone } from "../../lib/phone";

export function UserLogin() {
  const { token, actor, setAuth } = useAuth();
  const navigate = useNavigate();

  const [loginMethod, setLoginMethod] = useState<"EMAIL" | "WHATSAPP">("EMAIL");
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Clear error and login value when switching methods
  const handleMethodChange = (method: "EMAIL" | "WHATSAPP") => {
    setLoginMethod(method);
    setLogin("");
    setError(null);
  };

  // Hard separation:
  // - Logged-in ADMIN should not see user login page.
  // - Logged-in USER should be sent to the user area.
  if (token) {
    return <Navigate to={actor === "ADMIN" ? "/admin/orders" : "/packages"} replace />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-tropical-50 via-ocean-50/30 to-sand-50/50 p-4 sm:p-6">
      {/* Animated background elements - Tropical theme */}
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

      {/* Login Card - Compact Professional Design */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, type: "spring", stiffness: 200 }}
        className="relative w-full max-w-sm z-10"
      >
        {/* Background glow effect behind card */}
        <div className="absolute inset-0 -z-10 bg-tropical-500/20 blur-3xl rounded-3xl opacity-50"></div>
        
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
            <h1 className="text-xl font-semibold text-slate-900 mb-1">Welcome back</h1>
            <p className="text-xs text-slate-500">Sign in to continue</p>
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

          {/* Login Form */}
          <form
            className="space-y-4 relative z-10"
            onSubmit={async (e) => {
              e.preventDefault();

              const rawLogin = login.trim();

              // Validate email format if using EMAIL method
              if (loginMethod === "EMAIL") {
                if (!rawLogin) {
                  setError("Email wajib diisi.");
                  return;
                }
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(rawLogin)) {
                  setError("Format email tidak valid. Contoh: user@example.com");
                  return;
                }
              } else {
                if (!rawLogin) {
                  setError("Nomor WhatsApp wajib diisi.");
                  return;
                }
                const normalized = normalizeWhatsAppPhone(rawLogin);
                if (!normalized) {
                  setError("Format nomor WhatsApp tidak valid. Gunakan format:\n• +628123456789 (format internasional)\n• 08123456789 (format lokal Indonesia)\n• Pastikan nomor minimal 10 digit");
                  return;
                }
              }

              // Prepare login value
              // For email: lowercase
              // For phone: send raw input, let backend normalize (for better compatibility)
              let loginValue: string;
              if (loginMethod === "EMAIL") {
                loginValue = rawLogin.toLowerCase();
              } else {
                // Validate format first, but send raw input to backend
                const normalized = normalizeWhatsAppPhone(rawLogin);
                if (!normalized) {
                  setError("Format nomor WhatsApp tidak valid. Gunakan format: +628123456789 atau 08123456789");
                  return;
                }
                // Send raw input to backend - backend will normalize it
                // This allows backend to try multiple normalization variations
                loginValue = rawLogin.trim();
              }

              if (!password.trim()) {
                setError("Password wajib diisi.");
                return;
              }

              if (password.trim().length < 6) {
                setError("Password minimal 6 karakter.");
                return;
              }
              setLoading(true);
              setError(null);
              try {
                const resp = await api.post("/auth/user/login", {
                  login: loginValue,
                  password
                });
                const token = resp.data.data.token as string;
                setAuth(token, "USER");
                // Clear welcome screen cache to show welcome screen after login
                localStorage.removeItem("lokaclean_welcome_shown");
                navigate("/packages", { replace: true });
              } catch (err) {
                const errorMessage = getApiErrorMessage(err);
                // Make error messages more user-friendly
                let friendlyMessage = errorMessage;
                
                // Check for specific error patterns and make them clearer
                if (errorMessage.toLowerCase().includes("invalid credentials")) {
                  if (loginMethod === "EMAIL") {
                    friendlyMessage = "Email atau password salah. Pastikan email dan password yang Anda masukkan benar.";
                  } else {
                    friendlyMessage = "Nomor WhatsApp atau password salah. Pastikan nomor dan password yang Anda masukkan benar.";
                  }
                } else if (errorMessage.toLowerCase().includes("nomor whatsapp tidak valid")) {
                  friendlyMessage = "Format nomor WhatsApp tidak valid. Gunakan format: +628123456789 atau 08123456789";
                } else if (errorMessage.toLowerCase().includes("password salah")) {
                  friendlyMessage = "Password yang Anda masukkan salah. Silakan coba lagi atau gunakan fitur lupa password jika tersedia.";
                } else if (errorMessage.toLowerCase().includes("tidak terdaftar")) {
                  friendlyMessage = errorMessage; // Already clear from backend
                }
                
                setError(friendlyMessage);
              } finally {
                setLoading(false);
              }
            }}
          >
            {/* Login Method Toggle */}
            <div className="space-y-1.5">
              <div className="text-xs font-medium text-slate-600 uppercase tracking-wide">Login with</div>
              <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-1">
                <button
                  type="button"
                  className={[
                    "flex-1 rounded-md px-3 py-2 text-sm font-medium transition-all",
                    loginMethod === "EMAIL"
                      ? "bg-white text-tropical-600 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  ].join(" ")}
                  onClick={() => handleMethodChange("EMAIL")}
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <Mail className="h-4 w-4" />
                    Email
                  </div>
                </button>
                <button
                  type="button"
                  className={[
                    "flex-1 rounded-md px-3 py-2 text-sm font-medium transition-all",
                    loginMethod === "WHATSAPP"
                      ? "bg-white text-tropical-600 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  ].join(" ")}
                  onClick={() => handleMethodChange("WHATSAPP")}
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <Phone className="h-4 w-4" />
                    WhatsApp
                  </div>
                </button>
              </div>
            </div>

            {/* Login Input */}
            <label className="block">
              <div className="mb-1.5 text-sm font-medium text-slate-700">
                {loginMethod === "EMAIL" ? "Email Address" : "WhatsApp Number"}
              </div>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2">
                  {loginMethod === "EMAIL" ? (
                    <Mail className="h-4 w-4 text-slate-400" />
                  ) : (
                    <Phone className="h-4 w-4 text-slate-400" />
                  )}
                </div>
                <input
                  className="w-full rounded-lg border border-slate-300 bg-white pl-10 pr-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 transition-all focus:border-tropical-500 focus:ring-2 focus:ring-tropical-100 focus:outline-none"
                  type={loginMethod === "EMAIL" ? "email" : "tel"}
                  inputMode={loginMethod === "EMAIL" ? "email" : "tel"}
                  {...(loginMethod === "EMAIL" ? { autoComplete: "email" } : { autoComplete: "tel" })}
                  value={login}
                  onChange={(e) => {
                    setLogin(e.target.value);
                    setError(null);
                  }}
                  required
                  placeholder={loginMethod === "EMAIL" ? "you@email.com" : "+62 812-3456-7890"}
                />
              </div>
              {loginMethod === "WHATSAPP" && (
                <div className="mt-1 text-xs text-slate-500">
                  Format: <span className="font-medium">+kode negara</span>
                </div>
              )}
            </label>

            {/* Password Input */}
            <label className="block">
              <div className="mb-1.5 text-sm font-medium text-slate-700">Password</div>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2">
                  <Lock className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  className="w-full rounded-lg border border-slate-300 bg-white pl-10 pr-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 transition-all focus:border-tropical-500 focus:ring-2 focus:ring-tropical-100 focus:outline-none"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                />
              </div>
            </label>

            {/* Submit Button */}
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
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="h-4 w-4" />
                    <span>Sign in</span>
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
              New user?{" "}
              <Link
                to="/register"
                className="font-semibold text-tropical-600 hover:text-tropical-700 hover:underline transition-colors"
              >
                Create an account
              </Link>
            </p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
