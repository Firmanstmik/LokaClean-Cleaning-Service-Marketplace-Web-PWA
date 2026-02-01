/**
 * ADMIN layout: premium glassmorphism header with advanced animations and visual effects.
 */

import { useEffect, useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { LayoutDashboard, Package, LogOut, Shield, Sparkles, Users, TrendingUp, Bell, Star, User } from "lucide-react";

import { useAuth } from "../lib/auth";
import { ScrollToTop } from "./ScrollToTop";
import { api } from "../lib/api";
import { AdminNotificationContainer } from "./AdminNotificationToast";
import { playOrderNotificationSound } from "../utils/sound";
import { speakNotification, isSpeechSynthesisSupported } from "../utils/textToSpeech";

function BottomNavItem({ to, label, icon: Icon }: { to: string; label: string; icon: typeof LayoutDashboard }) {
  return (
    <NavLink to={to} className="flex-1">
      {({ isActive }) => (
        <motion.div
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          className={`relative flex flex-col items-center justify-center gap-1 sm:gap-1.5 rounded-xl px-2 sm:px-3 py-2.5 sm:py-3 transition-all duration-300 touch-manipulation ${
            isActive
              ? "bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-xl shadow-blue-500/30"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          {isActive && (
            <>
              <motion.div
                layoutId="adminBottomActiveNav"
                className="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600"
                initial={false}
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
              {/* Glow effect */}
              <motion.div
                className="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-400/30 via-indigo-400/30 to-purple-400/30"
                animate={{
                  opacity: [0.4, 0.7, 0.4],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            </>
          )}
          <motion.div
            animate={isActive ? { scale: 1.2 } : { scale: 1 }}
            whileHover={{ scale: 1.25 }}
            transition={{ duration: 0.3 }}
            className="relative z-10"
          >
            <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${isActive ? "text-white" : "text-slate-500"}`} />
          </motion.div>
          <span className={`relative z-10 text-[10px] sm:text-xs font-bold ${isActive ? "text-white" : "text-slate-600"}`}>
            {label}
          </span>
        </motion.div>
      )}
    </NavLink>
  );
}

export function AdminLayout() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  
  // Get admin data from localStorage
  const [adminData, setAdminData] = useState<{ id: number; full_name: string; email: string } | null>(() => {
    try {
      const stored = localStorage.getItem("lokaclean_admin_data");
      if (stored) {
        const parsed = JSON.parse(stored);
        console.log('[AdminLayout] Loaded admin data:', parsed);
        return parsed;
      }
    } catch (err) {
      console.error('[AdminLayout] Error loading admin data:', err);
    }
    return null;
  });
  
  // Refresh admin data on mount (in case it was updated)
  useEffect(() => {
    try {
      const stored = localStorage.getItem("lokaclean_admin_data");
      if (stored) {
        const parsed = JSON.parse(stored);
        setAdminData(parsed);
      }
    } catch (err) {
      console.error('[AdminLayout] Error refreshing admin data:', err);
    }
  }, []);
  
  // Admin notification state
  const [pendingCount, setPendingCount] = useState(0);
  const [latestOrderId, setLatestOrderId] = useState<number | null>(null);
  const [latestUserName, setLatestUserName] = useState<string | null>(null);
  const [latestPaketName, setLatestPaketName] = useState<string | null>(null);
  const [showNotification, setShowNotification] = useState(false);
  const previousOrderIdRef = useRef<number | null>(null);
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const notificationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);


  // Fetch pending orders count and latest order
  const fetchPendingOrders = useCallback(async () => {
    try {
      const resp = await api.get("/admin/orders/pending-count");
      const { count, latestOrder } = resp.data.data;
      
      setPendingCount(count);
      
      // Check for new order
      if (latestOrder && latestOrder.id !== previousOrderIdRef.current) {
        // This is a new order
        if (previousOrderIdRef.current !== null) {
          // Not the first load, show notification
          console.log('[Admin Notifications] New order detected:', latestOrder.id, latestOrder.user_name, latestOrder.paket_name);
          setLatestOrderId(latestOrder.id);
          setLatestUserName(latestOrder.user_name);
          setLatestPaketName(latestOrder.paket_name);
          setShowNotification(true);
          
          // Play sound effect for new notification (real-time)
          console.log('[Admin Notifications] Playing sound...');
          playOrderNotificationSound().catch(err => {
            console.warn('[Admin Notifications] Failed to play sound:', err);
          });
          
          // Speak notification text using AI Text-to-Speech after sound plays
          // Delay TTS to let sound notification play first
          const notificationText = `Pesanan baru dari ${latestOrder.user_name} untuk paket ${latestOrder.paket_name}`;
          console.log('[Admin Notifications] Will speak notification after delay:', notificationText);
          
          // Check if TTS is supported before attempting to speak
          if (isSpeechSynthesisSupported()) {
            // Use a timeout to ensure TTS is called after sound plays
            setTimeout(() => {
              console.log('[Admin Notifications] Speaking notification now:', notificationText);
              try {
                speakNotification(notificationText, 'id')
                  .then(() => {
                    console.log('[Admin Notifications] TTS completed successfully');
                  })
                  .catch(err => {
                    console.error('[Admin Notifications] Failed to speak notification:', err);
                    // Retry once after a short delay if first attempt fails
                    setTimeout(() => {
                      console.log('[Admin Notifications] Retrying TTS...');
                      speakNotification(notificationText, 'id').catch(retryErr => {
                        console.error('[Admin Notifications] TTS retry also failed:', retryErr);
                      });
                    }, 500);
                  });
              } catch (err) {
                console.error('[Admin Notifications] Error calling speakNotification:', err);
              }
            }, 600); // Delay to let sound notification play first
          } else {
            console.warn('[Admin Notifications] TTS not supported in this browser');
          }
          
          // Auto-hide notification after 8 seconds
          if (notificationTimeoutRef.current) {
            clearTimeout(notificationTimeoutRef.current);
          }
          notificationTimeoutRef.current = setTimeout(() => {
            setShowNotification(false);
          }, 8000);
        }
        
        previousOrderIdRef.current = latestOrder.id;
      }
    } catch (err) {
      console.error('[Admin Notifications] Failed to fetch:', err);
    }
  }, []);

  // Setup polling for pending orders (every 5 seconds)
  useEffect(() => {
    // Initial fetch
    fetchPendingOrders();
    
    // Setup polling interval
    pollingIntervalRef.current = setInterval(() => {
      fetchPendingOrders();
    }, 5000); // Poll every 5 seconds
    
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
      if (notificationTimeoutRef.current) {
        clearTimeout(notificationTimeoutRef.current);
      }
    };
  }, [fetchPendingOrders]);

  const handleCloseNotification = () => {
    setShowNotification(false);
    if (notificationTimeoutRef.current) {
      clearTimeout(notificationTimeoutRef.current);
    }
  };

  return (
    <div className="min-h-dvh bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/60 relative overflow-x-hidden scrollbar-hide">
      {/* Animated background particles */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-gradient-to-br from-blue-400/20 to-indigo-500/20 blur-xl"
            style={{
              width: Math.random() * 300 + 100,
              height: Math.random() * 300 + 100,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              x: [0, Math.random() * 200 - 100],
              y: [0, Math.random() * 200 - 100],
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: Math.random() * 20 + 15,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* Premium glassmorphism header - Professional */}
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed top-0 left-0 right-0 z-50 border-b border-slate-200/60 bg-white/95 backdrop-blur-xl backdrop-saturate-200 shadow-sm"
      >
        {/* Subtle header glow */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-blue-500/3 via-indigo-500/3 to-purple-500/3"
          animate={{
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        <div className="relative mx-auto flex w-full items-center justify-between gap-3 sm:gap-4 px-3 sm:px-4 py-2.5 lg:px-6 lg:py-3">
          {/* Logo section */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="flex items-center gap-2 sm:gap-3 cursor-pointer"
            onClick={() => navigate("/admin/orders")}
          >
            <motion.div
              className="relative flex h-14 w-14 sm:h-16 sm:w-16 lg:h-20 lg:w-20 items-center justify-center rounded-lg overflow-hidden bg-white shadow-sm"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.3 }}
            >
              <img
                src="/img/Logo_LokaClean.jpg"
                alt="LokaClean Logo"
                className="h-full w-full object-contain p-0.5 scale-110"
              />
            </motion.div>
            <div className="block">
              <div className="text-[11px] sm:text-xs md:text-sm font-black text-slate-900 leading-tight">
                LokaClean Admin
              </div>
              <div className="text-[9px] sm:text-[10px] md:text-xs font-medium text-slate-500 leading-tight">
                Operations Dashboard
              </div>
            </div>
          </motion.div>

          {/* Navigation items - Desktop only */}
          <nav className="hidden lg:flex items-center gap-1 flex-1 justify-center">
            <NavHeaderItem to="/admin/orders" label="Orders" icon={LayoutDashboard} />
            <NavHeaderItem to="/admin/packages" label="Packages" icon={Package} />
            <NavHeaderItem to="/admin/users" label="Users" icon={Users} />
            <NavHeaderItem to="/admin/revenue" label="Revenue" icon={TrendingUp} />
            <NavHeaderItem to="/admin/ratings" label="Ratings" icon={Star} />
          </nav>

          {/* Notification badge and Logout button - top right */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Admin name display - Show on md and above */}
            {adminData && adminData.full_name && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="hidden md:flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/50 shadow-sm"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-sm">
                  <User className="h-3.5 w-3.5" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[9px] sm:text-[10px] font-medium text-slate-500 leading-tight whitespace-nowrap">Logged in as</span>
                  <span className="text-[10px] sm:text-xs font-black text-slate-900 leading-tight truncate max-w-[120px] sm:max-w-[150px]" title={adminData.full_name}>
                    {adminData.full_name}
                  </span>
                </div>
              </motion.div>
            )}
            
            {/* Pending orders badge */}
            {pendingCount > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="relative"
              >
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  animate={{ 
                    scale: [1, 1.05, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="relative z-10 flex items-center justify-center h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg cursor-pointer border-2 border-white/20"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate("/admin/orders?filter=PENDING");
                  }}
                  title={`${pendingCount} pesanan pending - Klik untuk melihat`}
                >
                  <Bell className="h-4 w-4 sm:h-5 sm:w-5 relative z-10" />
                  {pendingCount > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-md z-20"
                    >
                      {pendingCount > 9 ? '9+' : pendingCount}
                    </motion.span>
                  )}
                </motion.button>
                {/* Pulsing glow effect - behind button */}
                <motion.div
                  className="absolute inset-0 rounded-full bg-amber-400 blur-lg opacity-50 pointer-events-none"
                  animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.5, 0.2, 0.5]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
              </motion.div>
            )}
            
            {/* Logout button */}
            <motion.button
            whileHover={{ scale: 1.05, x: -2 }}
            whileTap={{ scale: 0.95 }}
            className="group relative overflow-hidden flex items-center gap-1.5 sm:gap-2 rounded-xl border-2 border-red-300 bg-gradient-to-r from-red-50 via-rose-50 to-red-50 px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-2.5 text-[11px] sm:text-xs md:text-sm font-bold text-red-700 transition-all hover:border-red-400 hover:shadow-lg hover:shadow-red-200 touch-manipulation"
            onClick={() => {
              // Clear admin data on logout
              localStorage.removeItem("lokaclean_admin_data");
              logout();
              navigate("/admin/login", { replace: true });
            }}
          >
            {/* Button shimmer */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
              animate={{
                x: ["-100%", "200%"],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatDelay: 1.5,
                ease: "linear",
              }}
            />
            <LogOut className="relative z-10 h-3.5 w-3.5 sm:h-4 sm:w-4 transition-transform group-hover:-translate-x-1" />
            <span className="relative z-10 hidden sm:inline">Logout</span>
          </motion.button>
          </div>
        </div>
      </motion.header>

      {/* Main content with smooth fade-in - Professional Layout */}
      <motion.main
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 w-full px-3 sm:px-4 py-4 sm:py-6 pb-20 sm:pb-24 pt-24 sm:pt-28 lg:px-6 lg:py-6 lg:pt-32 lg:pb-6"
      >
        <div className="mx-auto w-full max-w-7xl">
          <Outlet />
        </div>
      </motion.main>

      {/* Bottom Navigation - Professional Clean Theme */}
      <motion.footer
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.2 }}
        className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200/80 bg-white/90 backdrop-blur-2xl backdrop-saturate-200 shadow-2xl shadow-slate-900/10 lg:hidden"
      >
        <div className="mx-auto flex max-w-7xl items-center justify-around gap-0.5 sm:gap-1 px-1 sm:px-2 py-2.5 sm:py-3">
          <BottomNavItem to="/admin/orders" label="Orders" icon={LayoutDashboard} />
          <BottomNavItem to="/admin/packages" label="Packages" icon={Package} />
          <BottomNavItem to="/admin/users" label="Users" icon={Users} />
          <BottomNavItem to="/admin/revenue" label="Revenue" icon={TrendingUp} />
          <BottomNavItem to="/admin/ratings" label="Ratings" icon={Star} />
        </div>
      </motion.footer>

      {/* Scroll to Top Button */}
      <ScrollToTop />
      
      {/* Admin Notification Toast */}
      {showNotification && (
        <AdminNotificationContainer
          orderId={latestOrderId}
          userName={latestUserName}
          paketName={latestPaketName}
          onClose={handleCloseNotification}
        />
      )}
    </div>
  );
}

function NavHeaderItem({ to, label, icon: Icon }: { to: string; label: string; icon: typeof LayoutDashboard }) {
  return (
    <NavLink to={to}>
      {({ isActive }) => (
        <motion.div
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          className={`relative flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-200 ${
            isActive
              ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md shadow-blue-500/20"
              : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
          }`}
        >
          {isActive && (
            <motion.div
              layoutId="adminHeaderActiveNav"
              className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600"
              initial={false}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          )}
          <Icon className={`relative z-10 h-4 w-4 flex-shrink-0 ${isActive ? "text-white" : "text-slate-500"}`} />
          <span className="relative z-10 whitespace-nowrap">{label}</span>
        </motion.div>
      )}
    </NavLink>
  );
}


