/**
 * ADMIN layout: premium glassmorphism header with advanced animations and visual effects.
 */

import { useEffect, useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  LogOut,
  Users,
  TrendingUp,
  Bell,
  Star,
  User,
  ClipboardList,
} from "lucide-react";

import { useAuth } from "../lib/auth";
import { ScrollToTop } from "./ScrollToTop";
import { api } from "../lib/api";
import { AdminNotificationContainer } from "./AdminNotificationToast";
import { playOrderNotificationSound } from "../utils/sound";
import { speakNotification, isSpeechSynthesisSupported } from "../utils/textToSpeech";

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
    <div className="relative min-h-dvh overflow-x-hidden bg-slate-50 scrollbar-hide">
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-md">
        <div className="relative mx-auto flex w-full items-center justify-between gap-3 px-3 py-2.5 sm:px-4 sm:py-3 lg:px-6">
          {/* Logo section - match user layout style (compact, modern) */}
          <button
            type="button"
            className="flex cursor-pointer items-center gap-2 sm:gap-3"
            onClick={() => navigate("/admin/dashboard")}
          >
            <div className="relative h-9 w-9 flex-shrink-0 rounded-xl sm:h-11 sm:w-11 flex items-center justify-center overflow-visible">
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-tropical-400/30 via-ocean-400/25 to-sun-400/30 blur-lg" />
              <div className="relative z-10 h-full w-full overflow-hidden rounded-xl bg-gradient-to-br from-white via-slate-50 to-white shadow-[0_4px_10px_rgba(15,23,42,0.08)] flex items-center justify-center border border-white">
                <img
                  src="/img/logo.jpg"
                  alt="LokaClean Logo"
                  loading="lazy"
                  className="h-full w-full object-cover mix-blend-multiply"
                />
              </div>
            </div>
            <div className="flex min-w-0 flex-col text-left">
              <span className="text-sm font-black leading-tight text-slate-900 sm:text-base">
                LokaClean Admin
              </span>
              <span className="text-[10px] font-medium leading-tight text-slate-500 sm:text-xs">
                Panel Operasional
              </span>
            </div>
          </button>

          {/* Navigation items - Desktop only */}
          <nav className="hidden flex-1 items-center justify-center gap-1 lg:flex">
            <NavHeaderItem to="/admin/dashboard" label="Dashboard" icon={LayoutDashboard} />
            <NavHeaderItem to="/admin/orders" label="Pesanan" icon={ClipboardList} />
            <NavHeaderItem to="/admin/packages" label="Paket" icon={Package} />
            <NavHeaderItem to="/admin/users" label="Pengguna" icon={Users} />
            <NavHeaderItem to="/admin/revenue" label="Pendapatan" icon={TrendingUp} />
            <NavHeaderItem to="/admin/ratings" label="Rating" icon={Star} />
          </nav>

          {/* Right section */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Admin name display - Show on md and above */}
            {adminData && adminData.full_name && (
              <div className="hidden items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-700 shadow-sm md:flex">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600 text-white shadow-sm">
                  <User className="h-3.5 w-3.5" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[9px] font-medium leading-tight text-slate-500 whitespace-nowrap sm:text-[10px]">
                    Masuk sebagai
                  </span>
                  <span
                    className="truncate text-[10px] font-bold leading-tight text-slate-900 sm:text-xs"
                    title={adminData.full_name}
                  >
                    {adminData.full_name}
                  </span>
                </div>
              </div>
            )}
            
            {/* Pending orders badge */}
            {pendingCount > 0 && (
              <button
                className="relative flex h-9 w-9 items-center justify-center rounded-full border border-amber-200 bg-amber-50 text-amber-700 shadow-sm sm:h-10 sm:w-10"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate("/admin/orders?filter=PENDING");
                  }}
                  title={`${pendingCount} pesanan menunggu - klik untuk melihat`}
                >
                  <Bell className="h-4 w-4 sm:h-5 sm:w-5 relative z-10" />
                  {pendingCount > 0 && (
                    <span className="absolute -right-1 -top-1 z-20 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-md">
                      {pendingCount > 9 ? '9+' : pendingCount}
                    </span>
                  )}
                </button>
            )}
            
            {/* Logout button */}
            <button
              className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-[11px] font-semibold text-red-700 shadow-sm transition-colors hover:border-red-300 hover:bg-red-100 sm:px-3 sm:text-xs"
              onClick={() => {
                localStorage.removeItem("lokaclean_admin_data");
                logout();
                navigate("/adminlokacleanmandalika/login", { replace: true });
              }}
            >
              <LogOut className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>

          </div>
        </div>
      </header>

      <main className="relative z-10 w-full px-3 pb-10 pt-20 sm:px-4 sm:pb-16 sm:pt-24 lg:px-6 lg:pb-12 lg:pt-24">
        <div className="mx-auto w-full max-w-7xl">
          <Outlet />
        </div>
      </main>

      {/* Mobile bottom nav - inspired by user layout, simplified for performance */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white shadow-[0_-4px_16px_rgba(15,23,42,0.08)] pb-safe lg:hidden">
        <div className="mx-auto flex h-[60px] items-center justify-between px-2">
          <AdminBottomNavItem to="/admin/dashboard" label="Dashboard" icon={LayoutDashboard} />
          <AdminBottomNavItem to="/admin/orders" label="Pesanan" icon={ClipboardList} />
          <AdminBottomNavItem to="/admin/packages" label="Paket" icon={Package} />
          <AdminBottomNavItem to="/admin/users" label="Pengguna" icon={Users} />
          <AdminBottomNavItem to="/admin/ratings" label="Rating" icon={Star} />
        </div>
      </nav>

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
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          className={`relative flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-semibold transition-all duration-150 ${
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

interface AdminBottomNavItemProps {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
}

function AdminBottomNavItem({ to, label, icon: Icon }: AdminBottomNavItemProps) {
  return (
    <NavLink
      to={to}
      end={to === "/admin/dashboard"}
      className="flex h-full flex-1 items-center justify-center"
    >
      {({ isActive }) => (
        <div className="flex flex-col items-center justify-center gap-0.5">
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-medium transition-all ${
              isActive
                ? "bg-slate-900 text-white shadow-md shadow-slate-900/30"
                : "bg-slate-50 text-slate-500"
            }`}
          >
            <Icon
              className={`h-4 w-4 transition-colors ${
                isActive ? "text-white" : "text-slate-500"
              }`}
            />
          </div>
          <span
            className={`text-[10px] font-medium ${
              isActive ? "text-slate-900" : "text-slate-500"
            }`}
          >
            {label}
          </span>
        </div>
      )}
    </NavLink>
  );
}


