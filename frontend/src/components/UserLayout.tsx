/**
 * USER layout: simple responsive header + content outlet.
 */

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { NavLink, Outlet, useNavigate, Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Package, Plus, List, User as UserIcon, LogOut, Sparkles, Bell, X, CheckCheck, Star, Heart, ArrowRight, Zap, MapPin, CheckCircle2, MessageCircle, Instagram, Facebook, Phone, Mail, Clock, AlertTriangle, Home, History, LayoutGrid, Scan, Wallet } from "lucide-react";

import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import { toAbsoluteUrl } from "../lib/urls";
import { formatDateTimeWITA } from "../utils/date";
import { getNotificationMessage, t, useCurrentLanguage } from "../lib/i18n";
import { NotificationToastContainer } from "./NotificationToast";
import { NotificationDetailModal } from "./NotificationDetailModal";
import { ScrollToTop } from "./ScrollToTop";
import { WelcomeScreen } from "./WelcomeScreen";
import { ModernMascot } from "./ModernMascot";
import { Footer } from "./Footer";
import { playOrderNotificationSound } from "../utils/sound";
import { speakNotification } from "../utils/textToSpeech";
import { getLanguage } from "../lib/i18n";
import { LanguageSwitcherPill } from "./LanguageSwitcher";
import type { User, Notification, Pesanan } from "../types/api";

function NavItem({
  to,
  label,
  icon: Icon,
  exact = false,
  currentPathname,
  badge
}: {
  to: string;
  label: string;
  icon: typeof Package;
  exact?: boolean;
  currentPathname?: string;
  badge?: number;
}) {
  const location = useLocation();
  
  // Calculate active state manually
  const calculateIsActive = (): boolean => {
    const pathname = currentPathname || location.pathname;
    
    // Special logic for /orders route
    if (to === "/orders") {
      // Explicitly NOT active for /orders/new or any /orders/new/* paths
      if (pathname === "/orders/new" || pathname.startsWith("/orders/new/")) {
        return false;
      }
      
      // Only active for exact /orders or /orders/:id (where id is numeric)
      if (pathname === "/orders") {
        return true;
      }
      
      // Check if it's /orders/:id format with numeric ID
      const ordersIdMatch = pathname.match(/^\/orders\/(\d+)$/);
      if (ordersIdMatch) {
        return true;
      }
      
      // Everything else (including /orders/new) is not active
      return false;
    }
    
    // For other routes, use exact matching if specified
    if (exact) {
      return pathname === to;
    }
    
    // Default: check if pathname starts with the route
    return pathname.startsWith(to);
  };
  
  const isActive = calculateIsActive();
  
  // For /orders, we need end={true} to prevent matching /orders/new, but then use custom isActive for /orders/:id
  const shouldEnd = to === "/orders" ? true : exact;
  
  return (
    <NavLink
      to={to}
      end={shouldEnd}
      className={[
        "relative flex items-center gap-2 px-4 py-2 text-sm font-bold transition-colors duration-300",
        isActive
          ? "text-lombok-tropical-600"
          : "text-slate-500 hover:text-lombok-tropical-600"
      ].join(" ")}
    >
      <motion.div
        animate={{ 
          scale: isActive ? 1.1 : 1,
        }}
        whileHover={{ scale: 1.1 }}
        transition={{ 
          duration: 0.2,
          type: "spring",
          stiffness: 400,
          damping: 25
        }}
        className="relative z-10"
      >
        <Icon className="h-5 w-5" />
        {badge && badge > 0 ? (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="pointer-events-none absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white ring-2 ring-white"
          >
            {badge > 9 ? "9+" : badge}
          </motion.div>
        ) : null}
      </motion.div>
      <span className="relative z-10">{label}</span>
      {isActive && (
         <motion.div
           layoutId="activeNavIndicator"
           className="absolute -bottom-[21px] left-0 right-0 h-[3px] bg-gradient-to-r from-lombok-tropical-500 to-lombok-ocean-500 rounded-t-full"
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           transition={{ duration: 0.3 }}
         />
      )}
    </NavLink>
  );
}

export function UserLayout() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unpaidTransferCount, setUnpaidTransferCount] = useState(0);
  const [previousNotificationIds, setPreviousNotificationIds] = useState<Set<number>>(new Set());
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [showNotificationDetail, setShowNotificationDetail] = useState(false);
  const [dismissedToastIds, setDismissedToastIds] = useState<Set<number>>(new Set());
  const [showPromotionalMascot, setShowPromotionalMascot] = useState(() => {
    // Check if user has dismissed it before (stored in localStorage)
    // For testing: temporarily always show, comment out the localStorage check
    // if (typeof window !== "undefined") {
    //   const dismissed = localStorage.getItem("lokaclean_promo_dismissed");
    //   return dismissed !== "true";
    // }
    return true;
  });
  const [reminderOrders, setReminderOrders] = useState<Array<{ id: number; paket_name: string }>>([]); // Orders needing after photo
  const currentLanguage = useCurrentLanguage();
  const [isPageReady, setIsPageReady] = useState(false); // Track if page is ready to show notifications

  const fetchUser = async () => {
    try {
      const resp = await api.get("/users/me");
      setUser(resp.data.data.user as User);
    } catch {
      // Ignore errors - user data will be null
    }
  };

  const fetchUnpaidTransferOrders = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      params.append("page", "1");
      params.append("limit", "50");

      const resp = await api.get(`/orders?${params.toString()}`);
      const data = resp.data.data;
      const orders = (data.items || []) as Pesanan[];
      const now = Date.now();

      const unpaidTransfer = orders.filter((o) => {
        if (
          o.pembayaran.method !== "TRANSFER" ||
          o.pembayaran.status !== "PENDING" ||
          o.status === "CANCELLED"
        ) {
          return false;
        }
        const createdAtMs = new Date(o.created_at).getTime();
        if (!Number.isFinite(createdAtMs)) {
          return true;
        }
        const expiryMs = createdAtMs + 60 * 60 * 1000;
        const remainingMs = expiryMs - now;
        const rawRemainingSeconds = Math.floor(remainingMs / 1000);
        return rawRemainingSeconds > -60;
      });

      setUnpaidTransferCount(unpaidTransfer.length);
    } catch (err) {
      console.error("[UnpaidTransferOrders] Failed to fetch count", err);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchUnpaidTransferOrders();
      const interval = setInterval(fetchUnpaidTransferOrders, 30000);
      return () => clearInterval(interval);
    }
  }, [user, fetchUnpaidTransferOrders]);


  // Initialize unread count from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("lokaclean_unread_count");
      if (stored) {
        const count = parseInt(stored, 10);
        if (!isNaN(count)) {
          setUnreadCount(count);
        }
      }
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    try {
      const resp = await api.get("/notifications");
      const notifs = resp.data.data.notifications as Notification[];
      console.log('[Notifications] Fetched:', notifs.length, 'notifications');
      
      // Filter out notifications for orders that are COMPLETED and already have a rating
      // Only show notifications for orders that are not complete or haven't been rated yet
      const filteredNotifs = notifs.filter((notif) => {
        // If notification doesn't have a pesanan, keep it (might be system notification)
        if (!notif.pesanan) {
          return true;
        }
        
        // If order is COMPLETED and has a rating, hide the notification
        if (notif.pesanan.status === 'COMPLETED' && notif.pesanan.rating) {
          return false;
        }
        
        // Keep all other notifications
        return true;
      });
      
      console.log('[Notifications] Filtered:', filteredNotifs.length, 'notifications (removed completed + rated orders)');
      
      // Detect new notifications by comparing IDs
      setPreviousNotificationIds((prev) => {
        // On first load, prev will be empty, so we just store all IDs without showing notifications
        const isFirstLoad = prev.size === 0;
        const newIds = new Set(notifs.map(n => n.id));
        
        // Only detect new notifications if it's not the first load
        if (!isFirstLoad) {
          const newNotifications = filteredNotifs.filter(n => !prev.has(n.id) && !n.is_read);
          console.log('[Notifications] New notifications detected:', newNotifications.length);
          
          // Check for order confirmation/OTW notifications and play sound
          // Play sound if notification has pesanan with status IN_PROGRESS
          // This covers: "Pesanan Dikonfirmasi", "OTW", "Petugas Ditugaskan", etc.
          const orderConfirmedNotifications = newNotifications.filter(n => {
            // If notification has pesanan with IN_PROGRESS status, play sound and TTS
            // This happens when admin assigns worker (PENDING -> IN_PROGRESS)
            if (n.pesanan && n.pesanan.status === 'IN_PROGRESS') {
              return true;
            }
            // Also check title/message for confirmation keywords
            const titleLower = n.title.toLowerCase();
            const messageLower = n.message.toLowerCase();
            return (
              titleLower.includes('konfirmasi') || 
              titleLower.includes('dikonfirmasi') ||
              titleLower.includes('otw') ||
              titleLower.includes('on the way') ||
              titleLower.includes('ditugaskan') ||
              titleLower.includes('dalam proses') ||
              titleLower.includes('in progress') ||
              messageLower.includes('konfirmasi') ||
              messageLower.includes('dikonfirmasi') ||
              messageLower.includes('otw') ||
              messageLower.includes('on the way') ||
              messageLower.includes('petugas otw') ||
              messageLower.includes('sedang dalam proses') ||
              messageLower.includes('petugas ditugaskan') ||
              messageLower.includes('dalam proses') ||
              messageLower.includes('in progress') ||
              messageLower.includes('petugas sedang') ||
              messageLower.includes('worker assigned')
            );
          });
          
          // Play sound and TTS for order confirmation/OTW notifications
          if (orderConfirmedNotifications.length > 0) {
            console.log('[Notifications] Playing sound for order confirmation/OTW notification', orderConfirmedNotifications);
            
            // Get current language for TTS (bilingual support)
            const currentLang = getLanguage();
            
            // Get the first order confirmation notification to speak
            const firstConfirmedNotif = orderConfirmedNotifications[0];
            if (firstConfirmedNotif) {
              // Get friendly message in current language
              const friendlyMsg = getNotificationMessage(firstConfirmedNotif.title, firstConfirmedNotif.message);
              
              // For Indonesian: Play sound first, then TTS (like admin)
              if (currentLang === 'id') {
                // Play sound notification (same as admin)
                playOrderNotificationSound().catch(err => {
                  console.warn('[Notifications] Failed to play sound:', err);
                });
                
                // Then speak with TTS after a short delay to let sound play
                // Short message: "Pesanan dikonfirmasi" (Order confirmed)
                setTimeout(() => {
                  const ttsMessage = 'Pesanan dikonfirmasi';
                  console.log('[Notifications] Speaking notification with TTS (Indonesian):', ttsMessage);
                  speakNotification(ttsMessage, 'id', true).catch(err => {
                    console.warn('[Notifications] Failed to speak notification:', err);
                  });
                }, 500); // Small delay to let sound notification play first
              } else {
                // For English: Play sound first, then TTS with English voice
                playOrderNotificationSound().catch(err => {
                  console.warn('[Notifications] Failed to play sound:', err);
                });
                
                // Then speak with TTS after a short delay to let sound play
                // Short message: "Order confirmed"
                setTimeout(() => {
                  const ttsMessage = 'Order confirmed';
                  console.log('[Notifications] Speaking notification with TTS (English):', ttsMessage);
                  speakNotification(ttsMessage, 'en', true).catch(err => {
                    console.warn('[Notifications] Failed to speak notification:', err);
                  });
                }, 500); // Small delay to let sound notification play first
              }
            }
          }
          
          // Show browser notification for new unread notifications (works when app is open/background)
          // This will appear on mobile/desktop notification center even when app is in background
          if (newNotifications.length > 0) {
            if ('Notification' in window) {
              if (Notification.permission === 'granted') {
                newNotifications.forEach((notif) => {
                  const friendlyMsg = getNotificationMessage(notif.title, notif.message);
                  console.log('[Notifications] Showing browser notification:', friendlyMsg.title);
                  
                  // Use Service Worker registration to show notification (better for mobile/web)
                  // This works even when app is in background tab
                  if ('serviceWorker' in navigator) {
                    navigator.serviceWorker.ready.then((registration) => {
                      registration.showNotification(friendlyMsg.title, {
                        body: friendlyMsg.message,
                        icon: '/img/Logo_LokaClean.jpg',
                        badge: '/img/Logo_LokaClean.jpg',
                        tag: `notification-${notif.id}`,
                        requireInteraction: false,
                        data: {
                          url: notif.pesanan ? `/orders/${notif.pesanan.id}` : '/orders',
                          id: notif.id
                        },
                        // For mobile, these options help notifications appear properly
                        silent: false,
                        renotify: false
                      } as NotificationOptions);
                    }).catch(() => {
                      // Fallback to direct Notification API if service worker not ready
                  const browserNotification = new Notification(friendlyMsg.title, {
                    body: friendlyMsg.message,
                    icon: '/img/Logo_LokaClean.jpg',
                    badge: '/img/Logo_LokaClean.jpg',
                    tag: `notification-${notif.id}`,
                    requireInteraction: false,
                    data: {
                      url: notif.pesanan ? `/orders/${notif.pesanan.id}` : '/orders',
                      id: notif.id
                    }
                      } as NotificationOptions);

                      browserNotification.onclick = () => {
                        window.focus();
                        if (notif.pesanan) {
                          navigate(`/orders/${notif.pesanan.id}`);
                        } else {
                          navigate('/orders');
                        }
                        browserNotification.close();
                      };
                    });
                  } else {
                    // Fallback to direct Notification API if service worker not supported
                    const browserNotification = new Notification(friendlyMsg.title, {
                      body: friendlyMsg.message,
                      icon: '/img/Logo_LokaClean.jpg',
                      badge: '/img/Logo_LokaClean.jpg',
                      tag: `notification-${notif.id}`,
                      requireInteraction: false,
                      data: {
                        url: notif.pesanan ? `/orders/${notif.pesanan.id}` : '/orders',
                        id: notif.id
                      }
                    } as NotificationOptions);

                  browserNotification.onclick = () => {
                    window.focus();
                    if (notif.pesanan) {
                      navigate(`/orders/${notif.pesanan.id}`);
                    } else {
                      navigate('/orders');
                    }
                    browserNotification.close();
                  };
                  }
                });
              } else {
                console.log('[Notifications] Permission not granted:', Notification.permission);
              }
            } else {
              console.log('[Notifications] Browser notifications not supported');
            }
          }
        } else {
          console.log('[Notifications] First load - skipping notification display');
        }
        
        return newIds;
      });
      
      setNotifications(filteredNotifs);
      const unread = filteredNotifs.filter(n => !n.is_read).length;
      setUnreadCount(unread);
      console.log('[Notifications] Unread count:', unread);
      
      // Store unread count in localStorage for persistence
      if (typeof window !== "undefined") {
        localStorage.setItem("lokaclean_unread_count", unread.toString());
      }
    } catch (err) {
      console.error('[Notifications] Failed to fetch:', err);
      // Don't silently ignore - log for debugging
    }
  }, [navigate]);

  const markAsRead = useCallback(async (id: number) => {
    try {
      // If negative ID, it's a reminder notification - just remove it locally
      if (id < 0) {
        const orderId = -id;
        setReminderOrders(prev => prev.filter(order => order.id !== orderId));
        // Update unread count immediately
        setUnreadCount(prev => Math.max(0, prev - 1));
        return;
      }
      
      await api.patch(`/notifications/${id}/read`);
      // Update unread count immediately for instant feedback
      setUnreadCount(prev => Math.max(0, prev - 1));
      await fetchNotifications(); // Refresh notifications after marking as read
    } catch {
      // Ignore errors
    }
  }, [fetchNotifications]);

  const dismissToast = useCallback((id: number) => {
    // Only dismiss the toast, don't mark as read
    // Notification will remain unread until user explicitly views it
    // This allows the notification to still appear in the notification modal
  }, []);

  const markAllAsRead = async () => {
    try {
      await api.patch("/notifications/read-all");
      // Update unread count immediately
      setUnreadCount(0);
      if (typeof window !== "undefined") {
        localStorage.setItem("lokaclean_unread_count", "0");
      }
      await fetchNotifications();
    } catch {
      // Ignore errors
    }
  };

  const handleViewNotificationDetail = useCallback((notification: Notification) => {
    // If notification has an order, navigate directly to order detail page
    if (notification.pesanan && notification.pesanan.id) {
      // Close notification modal
      setShowNotifications(false);
      // Mark as read if not already read
      if (!notification.is_read) {
        markAsRead(notification.id);
      }
      // Navigate to order detail page
      navigate(`/orders/${notification.pesanan.id}`);
    } else {
      // If no order, show detail modal as before
      setSelectedNotification(notification);
      setShowNotificationDetail(true);
      // Mark as read when viewing detail
      if (!notification.is_read) {
        markAsRead(notification.id);
      }
    }
  }, [markAsRead, navigate]);

  // Track dismissed toast IDs to prevent showing same notification in toast again
  // But keep them in notification modal until they are marked as read
  const handleDismissToast = useCallback((id: number) => {
    // Add to dismissed set so it won't show in toast again
    setDismissedToastIds(prev => new Set(prev).add(id));
  }, []);

  // Register Service Worker and request notification permission
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered:', registration);
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
        });
    }

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then((permission) => {
        console.log('Notification permission:', permission);
      });
    }
  }, []);


  // Check for orders that need after photo upload reminder
  // This function is called every 10 minutes to show reminder notifications
  const checkReminderNotifications = useCallback(async () => {
    try {
      const resp = await api.get("/orders");
      const orders = resp.data.data.items as Array<{ 
        id: number; 
        status: string; 
        room_photo_after: string | null;
        paket: { name: string };
      }>;

      // Find orders with IN_PROGRESS status that don't have after photo
      const ordersNeedingReminder = orders
        .filter(order => order.status === 'IN_PROGRESS' && !order.room_photo_after)
        .map(order => ({ id: order.id, paket_name: order.paket.name }));

      // Update reminder orders - this will trigger reminder notifications to appear
      // Note: Even if reminder was previously dismissed, it will appear again after 10 minutes
      // because we reset dismissedToastIds is not checked here, allowing reminders to re-appear
      setReminderOrders(ordersNeedingReminder);
      
      // Clear dismissed toast IDs for reminders to allow them to appear again
      // This ensures reminder notifications can appear every 10 minutes
      setDismissedToastIds(prev => {
        const newSet = new Set(prev);
        // Remove negative IDs (reminder notification IDs) from dismissed set
        // This allows reminders to re-appear after 10 minutes
        ordersNeedingReminder.forEach(order => {
          newSet.delete(-order.id);
        });
        return newSet;
      });
    } catch (err) {
      console.error('[Reminder Notifications] Failed to check:', err);
    }
  }, []);

  // Reset page ready state when location changes (user navigates to new page)
  useEffect(() => {
    setIsPageReady(false);
    
    // Delay showing notifications until page is ready (5 seconds after navigation)
    // This ensures notifications appear after loading is complete, not during loading
    // We use delay to ensure child pages (like Packages) have finished loading
    const pageReadyTimer = setTimeout(() => {
      setIsPageReady(true);
    }, 5000); // 5 seconds delay after navigation to ensure child pages finish loading first

    return () => {
      clearTimeout(pageReadyTimer);
    };
  }, [location.pathname]); // Reset and restart timer when route changes

  useEffect(() => {
    fetchUser();
    fetchNotifications();
    checkReminderNotifications();

    // Poll for new notifications every 2 seconds for real-time feel
    const interval = setInterval(() => {
      fetchNotifications();
    }, 2000);

    // Check for reminder notifications every 10 minutes (600000ms)
    // This will trigger reminder notifications to appear periodically
    const reminderInterval = setInterval(() => {
      checkReminderNotifications();
    }, 600000); // 10 minutes = 600000 milliseconds

    // Listen for profile update events to refresh navbar photo
    const handleProfileUpdate = () => {
      fetchUser();
    };
    window.addEventListener("profileUpdated", handleProfileUpdate);

    return () => {
      clearInterval(interval);
      clearInterval(reminderInterval);
      window.removeEventListener("profileUpdated", handleProfileUpdate);
    };
  }, [fetchNotifications, checkReminderNotifications]);

  // Refresh notifications when modal is opened
  useEffect(() => {
    if (showNotifications) {
      // Force refresh when modal opens
      fetchNotifications().catch(console.error);
    }
  }, [showNotifications, fetchNotifications]);

  const profilePhotoUrl = user?.profile_photo ? toAbsoluteUrl(user.profile_photo) : null;

  // Get unread notifications including reminders (max 2 to prevent stacking)
  // Auto-dismiss is handled by NotificationToastContainer
  // Exclude notifications that have been dismissed from toast (but still keep them unread for modal)
  // Only show notifications after page is ready (1-2 seconds after loading)
  const activeToasts = useMemo(() => {
    // Don't show notifications until page is ready (after loading delay)
    if (!isPageReady) {
      return [];
    }

    const unreadNotifications = notifications.filter(n => !n.is_read && !dismissedToastIds.has(n.id));
    
    // Create reminder notifications for orders needing after photo upload
    // These are virtual notifications that appear alongside regular notifications
    // Exclude reminders that have been dismissed from toast
    const reminderNotifications: Notification[] = reminderOrders
      .filter(order => !dismissedToastIds.has(-order.id))
      .map(order => ({
        id: -order.id, // Negative ID to distinguish from real notifications
        user_id: 0,
        pesanan_id: order.id,
        title: t("notifications.reminderUploadAfterPhoto.title"),
        message: t("notifications.reminderUploadAfterPhoto.message").replace("{paketName}", order.paket_name),
        is_read: false,
        created_at: new Date().toISOString(),
        pesanan: {
          id: order.id,
          status: 'IN_PROGRESS',
          paket: { name: order.paket_name }
        }
      }));
    
    // Combine regular and reminder notifications, prioritize regular ones
    const allNotifications = [...unreadNotifications, ...reminderNotifications];
    return allNotifications.slice(0, 2);
  }, [notifications, reminderOrders, currentLanguage, dismissedToastIds, isPageReady]); // Include isPageReady to re-evaluate

  // Welcome screen state - PERMANENTLY DISABLED
  const [showWelcome, setShowWelcome] = useState(false);

  return (
    <>
      {/* Welcome/Splash Screen - REMOVED */}
      {showWelcome && (
        <WelcomeScreen onComplete={() => setShowWelcome(false)} />
      )}
      
      {/* Mobile Notifications Modal - Outside header to avoid z-index issues */}
      <AnimatePresence>
        {showNotifications && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('[Notifications] Closing modal from backdrop');
                setShowNotifications(false);
              }}
              className="fixed inset-0 bg-black/50 z-[10000] sm:hidden"
              style={{ position: 'fixed' }}
            />
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, y: "100%" }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="fixed inset-x-0 bottom-0 z-[10001] bg-white rounded-t-3xl shadow-2xl flex flex-col sm:hidden"
              style={{ 
                position: 'fixed',
                maxHeight: '85vh',
                paddingBottom: 'max(env(safe-area-inset-bottom), 16px)'
              }}
            >
              {/* Drag Handle */}
              <div className="flex justify-center pt-2 pb-1 flex-shrink-0">
                <div className="w-12 h-1.5 rounded-full bg-slate-300" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-indigo-50 to-purple-50 px-4 py-3 rounded-t-3xl flex-shrink-0">
                <h3 className="text-base font-black text-slate-900">
                  {t("notifications")}
                </h3>
                <div className="flex items-center gap-1.5">
                  {unreadCount > 0 && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={markAllAsRead}
                      className="flex items-center gap-1 rounded-lg bg-indigo-600 px-2.5 py-1.5 text-[10px] font-bold text-white hover:bg-indigo-700"
                      title="Mark all as read"
                    >
                      <CheckCheck className="h-3 w-3" />
                      <span className="hidden xs:inline">{t("common.markAllAsRead")}</span>
                    </motion.button>
                  )}
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowNotifications(false)}
                    className="text-slate-500 hover:text-slate-700 p-1"
                  >
                    <X className="h-4 w-4" />
                  </motion.button>
                </div>
              </div>
              {/* Content */}
              <div className="flex-1 overflow-y-auto scrollbar-hide px-3 py-3 notification-modal-content">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Bell className="h-16 w-16 text-slate-300 mb-3" />
                    <p className="text-sm font-semibold text-slate-600">{t("common.noNotifications")}</p>
                    <p className="text-xs text-slate-400 mt-1.5">{t("common.allCaughtUp")}</p>
                  </div>
                ) : (
                  <div className="space-y-2.5 pb-3">
                    {notifications.map((notif) => {
                      const friendlyMsg = getNotificationMessage(notif.title, notif.message);
                      return (
                        <motion.div
                          key={notif.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className={`rounded-xl border-2 p-3 transition-colors shadow-[0_4px_12px_rgba(0,0,0,0.12),0_2px_4px_rgba(0,0,0,0.08)] cursor-pointer hover:shadow-lg ${
                            !notif.is_read 
                              ? "border-teal-200 bg-gradient-to-br from-teal-50/80 to-blue-50/80" 
                              : "border-slate-200 bg-slate-50"
                          }`}
                          onClick={() => handleViewNotificationDetail(notif)}
                        >
                          <div className="flex items-start gap-2.5">
                            <div className={`flex-shrink-0 h-2.5 w-2.5 rounded-full mt-1.5 ${
                              !notif.is_read ? "bg-indigo-600" : "bg-slate-300"
                            }`} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 mb-1.5">
                                <h4 
                                  className="text-sm font-black text-slate-900 leading-tight cursor-pointer hover:text-teal-700 transition-colors"
                                  onClick={() => handleViewNotificationDetail(notif)}
                                >
                                  {friendlyMsg.title}
                                </h4>
                                {!notif.is_read && (
                                  <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      markAsRead(notif.id);
                                    }}
                                    className="text-indigo-600 hover:text-indigo-700 p-0.5 flex-shrink-0"
                                    title={t("common.markAsRead")}
                                  >
                                    <X className="h-3.5 w-3.5" />
                                  </motion.button>
                                )}
                              </div>
                              <p 
                                className="text-xs font-medium text-slate-600 mb-2.5 leading-relaxed cursor-pointer hover:text-slate-700 transition-colors line-clamp-2"
                                onClick={() => handleViewNotificationDetail(notif)}
                              >
                                {friendlyMsg.message}
                              </p>
                              <div className="flex items-center justify-between flex-wrap gap-2">
                                <span className="text-[10px] font-medium text-slate-400">
                                  {formatDateTimeWITA(notif.created_at)}
                                </span>
                                {notif.pesanan && (
                                  <Link
                                    to={`/orders/${notif.pesanan.id}`}
                                    onClick={() => {
                                      setShowNotifications(false);
                                      // Mark as read when clicking "View Order" from mobile modal
                                      if (!notif.is_read) {
                                        markAsRead(notif.id);
                                      }
                                    }}
                                    className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 transition-colors whitespace-nowrap"
                                  >
                                    {t("common.viewOrder")} →
                                  </Link>
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    <div className="min-h-dvh flex flex-col bg-gradient-to-br from-tropical-50 via-ocean-50/50 to-sand-50/70 scrollbar-hide overflow-x-hidden relative">
      {/* Animated background particles - Hidden on mobile for performance */}
      <div className="hidden sm:block absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-tropical-200/20 blur-3xl"
          animate={{
            x: [0, 100, 0],
            y: [0, 80, 0],
            scale: [1, 1.3, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-ocean-200/20 blur-3xl"
          animate={{
            x: [0, -80, 0],
            y: [0, -100, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 h-80 w-80 rounded-full bg-sun-200/15 blur-3xl"
          animate={{
            x: [0, 60, 0],
            y: [0, -60, 0],
            scale: [1, 1.4, 1],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>
      
      {/* Modern Premium Mascot - Smart Clean Assistant */}
      {showPromotionalMascot && (
        <ModernMascot
          variant="greeting"
          size="medium"
          onDismiss={() => {
            setShowPromotionalMascot(false);
            if (typeof window !== "undefined") {
              localStorage.setItem("lokaclean_promo_dismissed", "true");
            }
          }}
        />
      )}

      {/* Toast Notifications - Mobile & Desktop */}
      <NotificationToastContainer
        notifications={activeToasts}
        onClose={handleDismissToast}
        onMarkRead={markAsRead}
        onViewDetail={handleViewNotificationDetail}
      />

      {/* Notification Detail Modal */}
      <NotificationDetailModal
        notification={selectedNotification}
        isOpen={showNotificationDetail}
        onClose={() => {
          setShowNotificationDetail(false);
          setSelectedNotification(null);
        }}
        onMarkRead={markAsRead}
      />
      <header className="fixed top-0 left-1/2 -translate-x-1/2 lg:left-0 lg:translate-x-0 w-full max-w-md lg:max-w-full z-40 bg-transparent sm:border-b sm:border-slate-200/70 sm:bg-gradient-to-r sm:from-white/95 sm:via-tropical-50/80 sm:to-white/95 sm:backdrop-blur-2xl sm:shadow-[0_10px_30px_rgba(15,23,42,0.08)] pt-safe">
        <div className="relative mx-auto flex w-full max-w-full items-center justify-between gap-3 sm:gap-4 px-3 sm:px-4 py-2.5 lg:px-6 lg:py-3">
          <NavLink
            to="/packages"
            className="flex items-center gap-2.5 sm:gap-3.5 flex-1 min-w-0 group"
          >
            <motion.div
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              initial={{ opacity: 0, x: -40, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{
                type: "spring",
                damping: 24,
                stiffness: 260,
                duration: 0.5
              }}
              className="relative h-12 w-12 sm:h-14 sm:w-14 flex-shrink-0 rounded-2xl flex items-center justify-center overflow-visible"
            >
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-tropical-400/30 via-ocean-400/25 to-sun-400/30 blur-lg" />
              <motion.div
                className="relative z-10 h-full w-full overflow-hidden rounded-2xl bg-gradient-to-br from-white via-tropical-50/80 to-ocean-50/80 shadow-[0_8px_24px_rgba(15,23,42,0.15)] flex items-center justify-center border border-white/80"
                animate={{
                  y: [0, -1, 0],
                }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <motion.img
                  src="/img/Logo_LokaClean.jpg"
                  alt="LokaClean Logo"
                  className="h-full w-full object-contain p-1.5 sm:p-2"
                  animate={{
                    scale: [1, 1.02, 1],
                  }}
                  transition={{
                    duration: 6,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              </motion.div>
            </motion.div>
            
            {/* Premium Brand Typography */}
            <div className="min-w-0 hidden sm:flex flex-col">
              <motion.div
                className="relative"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                <motion.span
                  className="block text-base sm:text-xl font-black leading-tight bg-gradient-to-r from-tropical-600 via-ocean-600 to-tropical-600 bg-clip-text text-transparent truncate"
                  animate={{
                    backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                  }}
                  transition={{
                    duration: 5,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                  style={{
                    backgroundSize: "200% 100%",
                  }}
                >
                  LokaClean
                </motion.span>
                {/* Subtle underline accent */}
                <motion.div
                  className="absolute -bottom-0.5 left-0 h-0.5 bg-gradient-to-r from-tropical-500 via-ocean-500 to-tropical-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
                />
              </motion.div>
              <motion.div
                className="text-[9px] sm:text-[11px] font-semibold leading-tight bg-gradient-to-r from-slate-600 via-slate-500 to-slate-600 bg-clip-text text-transparent mt-0.5"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.5 }}
              >
                ✨ Clean Comfort, Island Style
              </motion.div>
            </div>
          </NavLink>


          {/* Mobile Notifications Button - Top Right (Hidden on Desktop) */}
          <div className="flex sm:hidden items-center gap-2">
            <LanguageSwitcherPill variant="dark" uniqueId="mobile-nav" />
            
            {/* Mobile Notifications Button */}
            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const newState = !showNotifications;
                  console.log('[Notifications] Toggling modal:', newState);
                  setShowNotifications(newState);
                  if (newState) {
                    // Immediately fetch latest notifications when opening
                    console.log('[Notifications] Fetching notifications on open');
                    fetchNotifications().catch(console.error);
                  }
              }}
              className="relative flex items-center justify-center rounded-lg border-2 border-slate-200 bg-white p-3 text-slate-700 shadow-sm transition-all duration-300 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600 flex-shrink-0"
              title="Notifications"
            >
              <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-red-500 via-rose-500 to-red-600 text-[10px] font-black text-white shadow-lg border-2 border-white"
                  >
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </motion.span>
                )}
              </motion.button>
            </div>
          </div>

          {/* Desktop Navigation - Center (Visible on Desktop) */}
          <nav className="hidden lg:flex items-center gap-4 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            {/* 1. Beranda */}
            <NavItem 
              to="/packages" 
              label={t("home.navbar.home")} 
              icon={Home} 
              exact 
              currentPathname={location.pathname} 
            />
            {/* 2. Paket */}
            <NavItem 
              to="/packages/all" 
              label={t("home.navbar.packages")} 
              icon={LayoutGrid} 
              exact 
              currentPathname={location.pathname} 
            />
            {/* 3. Pesan Baru */}
            <NavItem 
              to="/orders/new" 
              label={t("home.navbar.newOrder")} 
              icon={Scan} 
              exact 
              currentPathname={location.pathname} 
            />
            {/* 4. Pesanan */}
            <NavItem 
              to="/orders" 
              label={t("orders.title")} 
              icon={History} 
              currentPathname={location.pathname} 
              badge={unpaidTransferCount} 
            />
          </nav>
            
          {/* Desktop/Tablet Right Side - Notifications, Profile, Logout (visible on sm and above, but navigation is centered on lg) */}
          <div className="hidden sm:flex items-center gap-2">
            <LanguageSwitcherPill variant="dark" uniqueId="desktop-nav" />

            {/* Notifications Bell */}
            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative flex items-center justify-center rounded-xl border-2 border-slate-200 bg-white p-2 text-slate-700 shadow-sm transition-all duration-300 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600"
                title="Notifications"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-red-500 via-rose-500 to-red-600 text-xs font-black text-white shadow-lg border-2 border-white"
                  >
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </motion.span>
                )}
              </motion.button>

              {/* Notifications Dropdown */}
              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    className="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-hidden rounded-xl border-2 border-slate-200 bg-white shadow-[0_8px_24px_rgba(0,0,0,0.2),0_4px_8px_rgba(0,0,0,0.15),0_2px_4px_rgba(0,0,0,0.1)] z-50"
                  >
                    <div className="flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-indigo-50 to-purple-50 px-4 py-3">
                      <h3 className="text-sm font-black text-slate-900">Notifications</h3>
                      <div className="flex items-center gap-2">
                        {unreadCount > 0 && (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={markAllAsRead}
                            className="flex items-center gap-1 rounded-lg bg-indigo-600 px-2 py-1 text-xs font-bold text-white hover:bg-indigo-700"
                            title="Mark all as read"
                          >
                            <CheckCheck className="h-3 w-3" />
                            Read All
                          </motion.button>
                        )}
                        <motion.button
                          whileHover={{ scale: 1.1, rotate: 90 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setShowNotifications(false)}
                          className="text-slate-500 hover:text-slate-700"
                        >
                          <X className="h-4 w-4" />
                        </motion.button>
                      </div>
                    </div>
                    <div className="max-h-80 overflow-y-auto scrollbar-hide">
                      {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-8 text-center">
                          <Bell className="h-12 w-12 text-slate-300 mb-3" />
                          <p className="text-sm font-semibold text-slate-600">No notifications</p>
                        </div>
                      ) : (
                        notifications.map((notif) => (
                          <motion.div
                            key={notif.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className={`border-b border-slate-100 p-3 transition-colors hover:bg-teal-50/50 cursor-pointer shadow-[0_2px_8px_rgba(0,0,0,0.08),0_1px_3px_rgba(0,0,0,0.06)] ${
                              !notif.is_read ? "bg-gradient-to-r from-teal-50/50 to-blue-50/50" : ""
                            }`}
                            onClick={() => handleViewNotificationDetail(notif)}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`flex-shrink-0 h-2 w-2 rounded-full mt-2 ${
                                !notif.is_read ? "bg-indigo-600" : "bg-slate-300"
                              }`} />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2 mb-1">
                                  <h4 
                                    className="text-xs font-black text-slate-900 cursor-pointer hover:text-teal-700 transition-colors"
                                    onClick={() => handleViewNotificationDetail(notif)}
                                  >
                                    {getNotificationMessage(notif.title, notif.message).title}
                                  </h4>
                                  {!notif.is_read && (
                                    <motion.button
                                      whileHover={{ scale: 1.1 }}
                                      whileTap={{ scale: 0.9 }}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        markAsRead(notif.id);
                                      }}
                                      className="text-indigo-600 hover:text-indigo-700"
                                      title="Mark as read"
                                    >
                                      <X className="h-3 w-3" />
                                    </motion.button>
                                  )}
                                </div>
                                <p 
                                  className="text-xs font-medium text-slate-600 mb-1.5 leading-relaxed cursor-pointer hover:text-slate-700 transition-colors line-clamp-2"
                                  onClick={() => handleViewNotificationDetail(notif)}
                                >
                                  {getNotificationMessage(notif.title, notif.message).message}
                                </p>
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] font-medium text-slate-400">
                                    {formatDateTimeWITA(notif.created_at)}
                                  </span>
                                  {notif.pesanan && (
                                    <Link
                                      to={`/orders/${notif.pesanan.id}`}
                                      onClick={() => {
                                        setShowNotifications(false);
                                        // Mark as read when clicking "View Order" from dropdown
                                        if (!notif.is_read) {
                                          markAsRead(notif.id);
                                        }
                                      }}
                                      className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700"
                                    >
                                      View Order →
                                    </Link>
                                  )}
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            {profilePhotoUrl ? (
              <NavLink
                to="/profile"
                className="h-10 w-10 overflow-hidden rounded-full border-2 border-tropical-200 shadow-sm transition-all duration-300 hover:scale-110 hover:border-tropical-500 hover:shadow-md"
                title="Profile"
              >
                <img
                  className="h-full w-full object-cover"
                  src={profilePhotoUrl}
                  alt="Profile"
                  crossOrigin="anonymous"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = "none";
                    // Show fallback initial
                    const parent = target.parentElement;
                    if (parent) {
                      const fallback = document.createElement("div");
                      fallback.className = "flex h-full w-full items-center justify-center bg-tropical-gradient text-xs font-bold text-white";
                      fallback.textContent = user?.full_name?.[0]?.toUpperCase() ?? "?";
                      parent.appendChild(fallback);
                    }
                  }}
                />
              </NavLink>
            ) : (
              <NavLink
                to="/profile"
                className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-tropical-200 bg-tropical-gradient text-xs font-bold text-white shadow-sm transition-all duration-300 hover:scale-110 hover:shadow-md"
                title="Profile"
              >
                {user?.full_name?.[0]?.toUpperCase() ?? "?"}
              </NavLink>
            )}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-1.5 rounded-xl border-2 border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-600 shadow-sm transition-all duration-300 hover:border-rose-300 hover:bg-rose-50 hover:shadow-md"
              onClick={() => {
                logout();
                navigate("/login", { replace: true });
              }}
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </motion.button>
          </div>
        </div>
      </header>

      {/* Main content with smooth fade-in - Professional Layout */}
      <motion.main
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 w-full px-3 sm:px-4 pb-32 lg:pb-8 pt-14 sm:pt-24 lg:px-6 lg:pt-24 max-w-md lg:max-w-7xl mx-auto bg-gray-50 shadow-2xl lg:shadow-none lg:bg-transparent mt-safe"
      >
        <div className="mx-auto w-full max-w-7xl">
          {unpaidTransferCount > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-3 rounded-xl border border-amber-100 bg-gradient-to-r from-amber-50/90 to-orange-50/90 p-2.5 shadow-sm backdrop-blur-sm"
            >
              <div className="flex items-start gap-2.5">
                <div className="flex-shrink-0 h-7 w-7 rounded-full bg-amber-100 flex items-center justify-center shadow-inner mt-0.5">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold text-amber-800 leading-tight mb-0.5">
                    {unpaidTransferCount} Pesanan Belum Dibayar
                  </p>
                  <p className="text-[9px] sm:text-[10px] text-amber-700/90 leading-relaxed">
                    Pesanan transfer menunggu pembayaran. Selesaikan atau ubah ke tunai di detail pesanan agar segera diproses.
                  </p>
                </div>
                <Link 
                  to="/orders" 
                  className="flex-shrink-0 self-center px-2.5 py-1.5 rounded-lg bg-white border border-amber-200/60 shadow-sm text-[9px] font-bold text-amber-700 hover:bg-amber-50 transition-colors"
                >
                  Cek
                </Link>
              </div>
            </motion.div>
          )}
          <Outlet />
        </div>
      </motion.main>

      {/* Footer Component */}
      <Footer variant="all" />

      {/* Mobile bottom nav - Premium DANA-like Design */}
      <nav className="lg:hidden fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-50 pointer-events-none">
        <div className="pointer-events-auto relative bg-white/95 backdrop-blur-xl border-t border-slate-100 shadow-[0_-5px_20px_-5px_rgba(0,0,0,0.05)] pb-safe rounded-t-2xl">
          <div className="relative mx-auto grid max-w-md grid-cols-5 items-center h-20">
            
            {/* 1. Beranda */}
            <NavLink
              to="/packages"
              end
              onClick={() => window.navigator?.vibrate?.(10)}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-1 transition-all duration-300 ${
                  isActive ? "text-lombok-ocean-600" : "text-slate-600 hover:text-slate-800"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <motion.div
                    whileTap={{ scale: 0.9 }}
                    className="relative"
                  >
                    <Home className={`h-6 w-6 ${isActive ? "fill-current" : "stroke-[1.5px]"}`} />
                  </motion.div>
                  <span className={`text-[10px] font-bold ${isActive ? "font-extrabold" : ""}`}>
                    {t("home.navbar.home")}
                  </span>
                </>
              )}
            </NavLink>

            {/* 2. Paket */}
            <NavLink
              to="/packages/all"
              end
              onClick={() => window.navigator?.vibrate?.(10)}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-1 transition-all duration-300 ${
                  isActive ? "text-lombok-ocean-600" : "text-slate-600 hover:text-slate-800"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <motion.div
                    whileTap={{ scale: 0.9 }}
                    className="relative"
                  >
                    <LayoutGrid className={`h-6 w-6 ${isActive ? "fill-current" : "stroke-[1.5px]"}`} />
                  </motion.div>
                  <span className={`text-[10px] font-bold ${isActive ? "font-extrabold" : ""}`}>
                    {t("home.navbar.packages")}
                  </span>
                </>
              )}
            </NavLink>

            {/* 3. Center - Scan/Pesan Baru */}
            <div className="relative -top-10 flex justify-center">
              <NavLink
                to="/orders/new"
                end
                onClick={() => window.navigator?.vibrate?.(15)}
                className="group flex flex-col items-center justify-center gap-1"
              >
                <motion.div
                  whileHover={{ scale: 1.05, translateY: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-b from-lombok-ocean-500 to-lombok-tropical-600 shadow-xl shadow-lombok-ocean-500/30 ring-[6px] ring-white"
                >
                  <Scan className="h-8 w-8 text-white stroke-[2px]" />
                  {/* Ripple effect */}
                  <div className="absolute inset-0 rounded-full border border-white/20 animate-ping" />
                </motion.div>
                <span className="text-[10px] font-extrabold text-slate-700 group-hover:text-lombok-ocean-600 transition-colors drop-shadow-sm bg-white/50 backdrop-blur-[2px] px-2 rounded-full">
                  {t("home.navbar.newOrder")}
                </span>
              </NavLink>
            </div>

            {/* 4. Pesanan (History) */}
            {(() => {
              const pathname = location.pathname;
              let isOrdersActive = false;
              
              if (pathname === "/orders/new" || pathname.startsWith("/orders/new/")) {
                isOrdersActive = false;
              } else if (pathname === "/orders") {
                isOrdersActive = true;
              } else {
                const ordersIdMatch = pathname.match(/^\/orders\/(\d+)$/);
                if (ordersIdMatch) {
                  isOrdersActive = true;
                }
              }
              
              return (
                <NavLink
                  to="/orders"
                  end={true}
                  onClick={() => window.navigator?.vibrate?.(10)}
                  className={`flex flex-col items-center justify-center gap-1 transition-all duration-300 ${
                    isOrdersActive ? "text-lombok-ocean-600" : "text-slate-600 hover:text-slate-800"
                  }`}
                >
                  <motion.div
                    whileTap={{ scale: 0.9 }}
                    className="relative"
                  >
                    <History className={`h-6 w-6 ${isOrdersActive ? "stroke-[2.5px]" : "stroke-[1.5px]"}`} />
                    {unpaidTransferCount > 0 && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white ring-2 ring-white"
                      >
                        {unpaidTransferCount > 9 ? "9+" : unpaidTransferCount}
                      </motion.div>
                    )}
                  </motion.div>
                  <span className={`text-[10px] font-bold ${isOrdersActive ? "font-extrabold" : ""}`}>
                    {t("orders.title")}
                  </span>
                </NavLink>
              );
            })()}

            {/* 5. Profil */}
            <NavLink
              to="/profile"
              end
              onClick={() => window.navigator?.vibrate?.(10)}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-1 transition-all duration-300 ${
                  isActive ? "text-lombok-ocean-600" : "text-slate-600 hover:text-slate-800"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <motion.div
                    whileTap={{ scale: 0.9 }}
                    className="relative"
                  >
                    {profilePhotoUrl ? (
                      <div className={`h-6 w-6 overflow-hidden rounded-full border transition-all ${isActive ? "border-lombok-ocean-600 ring-1 ring-lombok-ocean-600" : "border-transparent"}`}>
                        <img
                          className="h-full w-full object-cover"
                          src={profilePhotoUrl}
                          alt={t("profile.title")}
                          crossOrigin="anonymous"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = "none";
                          }}
                        />
                      </div>
                    ) : (
                      <UserIcon className={`h-6 w-6 ${isActive ? "fill-current" : "stroke-[1.5px]"}`} />
                    )}
                  </motion.div>
                  <span className={`text-[10px] font-bold ${isActive ? "font-extrabold" : ""}`}>
                    {t("profile.title")}
                  </span>
                </>
              )}
            </NavLink>

          </div>
        </div>
      </nav>

      {/* Scroll to Top Button */}
      <ScrollToTop />
    </div>
    </>
  );
}
