/**
 * ADMIN login page with modern UI and professional animations.
 */

import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, Mail, Lock, LogIn, ArrowLeft, AlertCircle } from "lucide-react";

import { api } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { getApiErrorMessage } from "../../lib/apiError";

export function AdminLogin() {
  const { token, actor, setAuth } = useAuth();
  const navigate = useNavigate();

  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Hard separation:
  // - Logged-in USER should not see admin login page.
  // - Logged-in ADMIN should be sent to admin dashboard.
  if (token) {
    return <Navigate to={actor === "ADMIN" ? "/admin/orders" : "/packages"} replace />;
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 p-4 overflow-hidden">
      {/* Premium animated background with particles */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Large gradient orbs */}
        <motion.div
          className="absolute -left-1/4 -top-1/4 h-[600px] w-[600px] rounded-full bg-gradient-to-br from-blue-500/30 to-indigo-500/30 blur-3xl"
          animate={{
            x: [0, 100, 0],
            y: [0, 100, 0],
            scale: [1, 1.3, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute -bottom-1/4 -right-1/4 h-[600px] w-[600px] rounded-full bg-gradient-to-br from-purple-500/30 to-pink-500/30 blur-3xl"
          animate={{
            x: [0, -100, 0],
            y: [0, -100, 0],
            scale: [1, 1.3, 1],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        
        {/* Floating particles */}
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-white/10"
            style={{
              width: Math.random() * 8 + 4,
              height: Math.random() * 8 + 4,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, Math.random() * -100 - 50],
              x: [0, Math.random() * 100 - 50],
              opacity: [0, 1, 0],
              scale: [0, 1, 0],
            }}
            transition={{
              duration: Math.random() * 10 + 5,
              repeat: Infinity,
              delay: Math.random() * 5,
              ease: "easeInOut",
            }}
          />
        ))}

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-10 bg-grid-pattern" />
      </div>

      {/* Premium login card - Compact and Responsive */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.9, rotateX: 15 }}
        animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
        transition={{ duration: 0.7, type: "spring", stiffness: 200, damping: 20 }}
        className="relative w-full max-w-sm sm:max-w-md z-10"
        style={{ perspective: "1000px" }}
      >
        <motion.div
          className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-white/20 bg-white/10 backdrop-blur-2xl backdrop-saturate-200 p-5 sm:p-6 lg:p-8 shadow-2xl shadow-black/40"
          whileHover={{ scale: 1.01, y: -2 }}
          transition={{ duration: 0.3 }}
        >
          {/* Enhanced glassmorphism layers */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-white/5 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-indigo-500/10 via-transparent to-transparent" />
          
          {/* Animated border glow */}
          <motion.div
            className="absolute inset-0 rounded-3xl bg-gradient-to-r from-blue-500/20 via-indigo-500/20 to-purple-500/20 blur-xl"
            animate={{
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          {/* Shimmer effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
            animate={{
              x: ["-100%", "200%"],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              repeatDelay: 2,
              ease: "linear",
            }}
          />
          
          {/* Content */}
          <div className="relative z-10">
            {/* Premium header - Compact */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-5 sm:mb-6 text-center"
            >
              <motion.div
                className="relative mx-auto mb-3 sm:mb-4 flex h-16 w-16 sm:h-20 sm:w-20 lg:h-24 lg:w-24 items-center justify-center rounded-xl sm:rounded-2xl bg-white shadow-xl sm:shadow-2xl overflow-hidden"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.3 }}
              >
                <img
                  src="/img/logo.jpg"
                  alt="LokaClean Logo"
                  className="h-full w-full object-contain p-1 scale-110"
                />
              </motion.div>
              <motion.h1 
                className="text-2xl sm:text-3xl lg:text-4xl font-black bg-gradient-to-r from-white via-slate-100 to-white bg-clip-text text-transparent"
                animate={{
                  backgroundPosition: ["0%", "100%", "0%"],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "linear",
                }}
              >
                Admin Portal
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="mt-2 sm:mt-3 flex items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-semibold text-slate-300"
              >
                <Shield className="h-3 w-3 sm:h-4 sm:w-4 text-indigo-400" />
                <span className="hidden sm:inline">Secure access to operations dashboard</span>
                <span className="sm:hidden">Secure admin access</span>
              </motion.p>
            </motion.div>

            {/* Error message */}
            {error ? (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="mb-4 sm:mb-5 flex items-center gap-2 sm:gap-3 rounded-lg sm:rounded-xl border border-red-500/30 bg-red-500/10 p-3 sm:p-4 text-xs sm:text-sm text-red-200 backdrop-blur-sm"
              >
                <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                <span className="break-words">{error}</span>
              </motion.div>
            ) : null}

            {/* Login form */}
            <form
              className="space-y-4 sm:space-y-5"
              onSubmit={async (e) => {
                e.preventDefault();
                setLoading(true);
                setError(null);
                try {
                  const resp = await api.post("/auth/admin/login", { login, password });
                  const token = resp.data.data.token as string;
                  const admin = resp.data.data.admin;
                  
                  console.log('[AdminLogin] Login response:', { token, admin });
                  
                  // Store admin data in localStorage
                  if (admin && admin.full_name) {
                    const adminData = {
                      id: admin.id,
                      full_name: admin.full_name,
                      email: admin.email
                    };
                    localStorage.setItem("lokaclean_admin_data", JSON.stringify(adminData));
                    console.log('[AdminLogin] Stored admin data:', adminData);
                  } else {
                    console.warn('[AdminLogin] Admin data missing or invalid:', admin);
                  }
                  
                  setAuth(token, "ADMIN");
                  // Force a hard redirect to ensure state is picked up correctly
                  window.location.href = "/admin/orders";
                } catch (err) {
                  setError(getApiErrorMessage(err));
                } finally {
                  setLoading(false);
                }
              }}
            >
              {/* Email/Phone field */}
              <motion.label
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="block"
              >
                <div className="mb-1.5 sm:mb-2 flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-semibold text-slate-200">
                  <Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  Email or WhatsApp Number
                </div>
                <input
                  className="w-full rounded-lg sm:rounded-xl border border-white/20 bg-white/10 px-3 py-2.5 sm:px-4 sm:py-3 text-sm sm:text-base text-white placeholder-slate-400 backdrop-blur-sm transition-all focus:border-white/40 focus:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white/20"
                  type="text"
                  value={login}
                  onChange={(e) => setLogin(e.target.value)}
                  required
                  placeholder="admin@lokaclean.local or 0812..."
                />
              </motion.label>

              {/* Password field */}
              <motion.label
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="block"
              >
                <div className="mb-1.5 sm:mb-2 flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-semibold text-slate-200">
                  <Lock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  Password
                </div>
                <input
                  className="w-full rounded-lg sm:rounded-xl border border-white/20 bg-white/10 px-3 py-2.5 sm:px-4 sm:py-3 text-sm sm:text-base text-white placeholder-slate-400 backdrop-blur-sm transition-all focus:border-white/40 focus:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white/20"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                />
              </motion.label>

              {/* Premium submit button */}
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="group relative w-full overflow-hidden rounded-lg sm:rounded-xl bg-gradient-to-r from-slate-800 via-slate-700 to-indigo-900 px-4 py-3 sm:px-6 sm:py-3.5 text-xs sm:text-sm font-black text-white shadow-xl sm:shadow-2xl transition-all hover:shadow-indigo-900/50 disabled:opacity-60"
              >
                {/* Multi-layer shimmer */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
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
                {/* Pulse glow */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-indigo-400/20 to-blue-400/20"
                  animate={{
                    opacity: [0.3, 0.6, 0.3],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
                <span className="relative z-10 flex items-center justify-center gap-1.5 sm:gap-2">
                  {loading ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="h-4 w-4 sm:h-5 sm:w-5 rounded-full border-2 sm:border-3 border-white/30 border-t-white"
                      />
                      <span className="text-xs sm:text-sm">Authenticating...</span>
                    </>
                  ) : (
                    <>
                      <motion.div
                        animate={{ x: [0, 4, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                      >
                        <LogIn className="h-4 w-4 sm:h-5 sm:w-5" />
                      </motion.div>
                      <span className="text-xs sm:text-sm">Sign In to Dashboard</span>
                    </>
                  )}
                </span>
              </motion.button>
            </form>

            {/* Footer link */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-5 sm:mt-6 lg:mt-8 border-t border-white/10 pt-4 sm:pt-5 lg:pt-6 text-center"
            >
              <Link
                to="/login"
                className="group inline-flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium text-slate-300 transition-colors hover:text-white"
              >
                <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4 transition-transform group-hover:-translate-x-1" />
                <span className="hidden sm:inline">Back to user login</span>
                <span className="sm:hidden">Back to login</span>
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}


