import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { Shield, Mail, Lock, LogIn, ArrowLeft, AlertCircle, Download } from "lucide-react";

import { api } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { getApiErrorMessage } from "../../lib/apiError";
import { IOSInstallPrompt } from "../../components/IOSInstallPrompt";
import { AndroidInstallPrompt } from "../../components/AndroidInstallPrompt";

export function AdminLogin() {
  const { token, actor, setAuth } = useAuth();
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showAndroidPrompt, setShowAndroidPrompt] = useState(false);
  const [showIOSPrompt, setShowIOSPrompt] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  // Hard separation:
  // - Logged-in USER should not see admin login page.
  // - Logged-in ADMIN should be sent to admin dashboard.
  if (token) {
    return <Navigate to={actor === "ADMIN" ? "/admin/orders" : "/home"} replace />;
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 p-4 overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -left-1/4 -top-1/4 h-[600px] w-[600px] rounded-full bg-gradient-to-br from-blue-500/20 to-indigo-500/20 blur-3xl" />
        <div className="absolute -bottom-1/4 -right-1/4 h-[600px] w-[600px] rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 blur-3xl" />
        <div className="absolute inset-0 opacity-10 bg-grid-pattern" />
      </div>

      <div className="relative w-full max-w-sm sm:max-w-md z-10">
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-white/20 bg-white/10 backdrop-blur-2xl backdrop-saturate-200 p-5 sm:p-6 lg:p-8 shadow-2xl shadow-black/40">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-white/5 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-indigo-500/10 via-transparent to-transparent" />

          <div className="relative z-10">
            <div className="mb-5 sm:mb-6 text-center">
              <div className="relative mx-auto mb-3 sm:mb-4 flex h-16 w-16 sm:h-20 sm:w-20 lg:h-24 lg:w-24 items-center justify-center rounded-xl sm:rounded-2xl bg-white shadow-xl sm:shadow-2xl overflow-hidden">
                <img
                  src="/img/logo.jpg"
                  alt="LokaClean Logo"
                  className="h-full w-full object-contain p-1 scale-110"
                />
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black bg-gradient-to-r from-white via-slate-100 to-white bg-clip-text text-transparent">
                Admin Portal
              </h1>
              <p className="mt-2 sm:mt-3 flex items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-semibold text-slate-300">
                <Shield className="h-3 w-3 sm:h-4 sm:w-4 text-indigo-400" />
                <span className="hidden sm:inline">Secure access to operations dashboard</span>
                <span className="sm:hidden">Secure admin access</span>
              </p>
            </div>

            {error ? (
              <div className="mb-4 sm:mb-5 flex items-center gap-2 sm:gap-3 rounded-lg sm:rounded-xl border border-red-500/30 bg-red-500/10 p-3 sm:p-4 text-xs sm:text-sm text-red-200 backdrop-blur-sm">
                <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                <span className="break-words">{error}</span>
              </div>
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
              <label className="block">
                <div className="mb-1.5 sm:mb-2 flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-semibold text-slate-200">
                  <Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  Email atau Nomor WhatsApp
                </div>
                <input
                  className="w-full rounded-lg sm:rounded-xl border border-white/20 bg-white/10 px-3 py-2.5 sm:px-4 sm:py-3 text-sm sm:text-base text-white placeholder-slate-400 backdrop-blur-sm transition-all focus:border-white/40 focus:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white/20"
                  type="text"
                  value={login}
                  onChange={(e) => setLogin(e.target.value)}
                  required
                  placeholder="admin@lokaclean.local or 0812..."
                />
              </label>

              <label className="block">
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
              </label>

              <button
                type="submit"
                disabled={loading}
                className="group relative w-full overflow-hidden rounded-lg sm:rounded-xl bg-gradient-to-r from-slate-800 via-slate-700 to-indigo-900 px-4 py-3 sm:px-6 sm:py-3.5 text-xs sm:text-sm font-black text-white shadow-xl sm:shadow-2xl transition-all hover:shadow-indigo-900/50 disabled:opacity-60"
              >
                <span className="relative z-10 flex items-center justify-center gap-1.5 sm:gap-2">
                  {loading ? (
                    <>
                      <div className="h-4 w-4 sm:h-5 sm:w-5 rounded-full border-2 sm:border-3 border-white/30 border-t-white animate-spin" />
                      <span className="text-xs sm:text-sm">Authenticating...</span>
                    </>
                  ) : (
                    <>
                      <LogIn className="h-4 w-4 sm:h-5 sm:w-5" />
                      <span className="text-xs sm:text-sm">Sign In to Dashboard</span>
                    </>
                  )}
                </span>
              </button>
            </form>

            <div className="mt-4 sm:mt-5">
              <button
                type="button"
                onClick={() => {
                  if (deferredPrompt) {
                    deferredPrompt.prompt();
                    deferredPrompt.userChoice.then((choiceResult: any) => {
                      if (choiceResult.outcome === "accepted") {
                        setDeferredPrompt(null);
                      }
                    });
                  } else {
                    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
                    const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream;
                    const isAndroid = /android/i.test(userAgent);

                    if (isIOS) {
                      setShowIOSPrompt(true);
                    } else if (isAndroid) {
                      setShowAndroidPrompt(true);
                    } else {
                      alert("Silakan gunakan menu browser untuk 'Install app' atau 'Add to Home Screen'.");
                    }
                  }
                }}
                className="flex w-full items-center justify-center gap-2 rounded-lg sm:rounded-xl border border-white/20 bg-white/5 px-3 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm font-semibold text-white backdrop-blur-md transition-colors hover:bg-white/10 hover:border-white/30"
              >
                <Download className="h-4 w-4 text-teal-300" />
                <span>Install aplikasi admin (mobile)</span>
              </button>
              <p className="mt-1.5 text-[10px] sm:text-xs text-slate-300/80">
                Untuk akses cepat dari homescreen Android atau iOS.
              </p>
            </div>

            <div className="mt-5 sm:mt-6 lg:mt-8 border-t border-white/10 pt-4 sm:pt-5 lg:pt-6 text-center">
              <Link
                to="/login"
                className="group inline-flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium text-slate-300 transition-colors hover:text-white"
              >
                <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4 transition-transform group-hover:-translate-x-1" />
                <span className="hidden sm:inline">Back to user login</span>
                <span className="sm:hidden">Back to login</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
      <IOSInstallPrompt isOpen={showIOSPrompt} onClose={() => setShowIOSPrompt(false)} />
      <AndroidInstallPrompt isOpen={showAndroidPrompt} onClose={() => setShowAndroidPrompt(false)} />
    </div>
  );
}


