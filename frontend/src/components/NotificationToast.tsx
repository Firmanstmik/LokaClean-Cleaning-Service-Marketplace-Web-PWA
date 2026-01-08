/**
 * Modern Toast Notification Component for LocaClean
 * 
 * FEATURES:
 * - Auto-close after 2.5 seconds (configurable)
 * - Each notification controls its own timer (useRef + useEffect)
 * - Timer pauses on hover, resumes after hover ends
 * - Reminder notifications never auto-close
 * - Modern UI with gradients and smooth animations
 * - Smooth fade-in/slide-down on appear, fade-out on close
 */

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { X, CheckCircle2, AlertCircle, Info, Clock, Upload } from "lucide-react";
import { Link } from "react-router-dom";
import { getNotificationMessage, t } from "../lib/i18n";
import { playOrderNotificationSound } from "../utils/sound";
import type { Notification } from "../types/api";

interface NotificationToastProps {
  notification: Notification;
  onClose: () => void;
  onMarkRead: (id: number) => void;
  onViewDetail?: (notification: Notification) => void;
  autoCloseDelay?: number; // Default: 2500ms
}

/**
 * Individual Notification Toast Item
 * 
 * LIFECYCLE:
 * 1. On mount: Start auto-close timer (if not reminder)
 * 2. On hover: Pause timer, clear timeout
 * 3. On hover end: Resume timer, set new timeout
 * 4. On manual close: Clear timer, call onClose
 * 5. On unmount: Cleanup timer (useEffect cleanup)
 * 
 * TIMER MANAGEMENT:
 * - useRef stores the timeout ID (survives re-renders)
 * - useEffect manages timer lifecycle
 * - Timer only starts if notification should auto-close
 */
export function NotificationToast({ 
  notification, 
  onClose, 
  onMarkRead,
  onViewDetail,
  autoCloseDelay = 2500 // 2.5 seconds default
}: NotificationToastProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  // CRITICAL: useRef to store timeout ID - survives re-renders
  // This prevents timer reset when parent component re-renders
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasPlayedSoundRef = useRef(false);

  // Determine if this is a reminder notification
  // Note: Reminder notifications now also auto-close after 3 seconds
  const isReminder = notification.id < 0 || 
    notification.title.toLowerCase().includes("reminder") ||
    notification.title.toLowerCase().includes("pengingat") ||
    notification.title.toLowerCase().includes("upload");

  // Clear timer helper - used on hover, manual close, and unmount
  const clearAutoCloseTimer = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  // Start auto-close timer for all notifications (including reminders)
  // All notifications auto-close after 3 seconds
  const startAutoCloseTimer = () => {
    // Don't start timer if:
    // 1. Currently hovered (user is reading)
    // 2. Timer already exists
    if (isHovered || timeoutRef.current) {
      return;
    }

    // Set timeout to auto-close after delay (3 seconds for all notifications)
    timeoutRef.current = setTimeout(() => {
      // Only close if still not hovered (double-check to prevent race condition)
      if (!isHovered) {
        clearAutoCloseTimer();
        onClose(); // Parent handles exit animation via AnimatePresence
      }
    }, autoCloseDelay);
  };

  // Handle hover start - pause timer
  const handleMouseEnter = () => {
    setIsHovered(true);
    clearAutoCloseTimer(); // Pause auto-close
  };

  // Handle hover end - resume timer
  const handleMouseLeave = () => {
    setIsHovered(false);
    // Resume auto-close timer after hover ends (will be started in useEffect)
  };

  // Handle manual close (X button click)
  const handleManualClose = () => {
    clearAutoCloseTimer(); // Clear timer
    onClose(); // Parent handles exit animation via AnimatePresence
  };

  // Initialize timer on mount (all notifications auto-close, including reminders)
  useEffect(() => {
    startAutoCloseTimer();

    // Cleanup: Clear timer on unmount
    return () => {
      clearAutoCloseTimer();
    };
  }, []); // Only run on mount

  // Re-start timer when hover state changes (resume after hover)
  useEffect(() => {
    if (!isHovered) {
      startAutoCloseTimer();
    }
  }, [isHovered]);

  // Play sound on mount for order confirmation notifications
  useEffect(() => {
    if (hasPlayedSoundRef.current) return;

    const shouldPlaySound = 
      (notification.pesanan && notification.pesanan.status === 'IN_PROGRESS') ||
      notification.title.toLowerCase().includes('konfirmasi') ||
      notification.title.toLowerCase().includes('dikonfirmasi') ||
      notification.title.toLowerCase().includes('otw') ||
      notification.message.toLowerCase().includes('konfirmasi') ||
      notification.message.toLowerCase().includes('otw');

    if (shouldPlaySound) {
      hasPlayedSoundRef.current = true;
      playOrderNotificationSound().catch(err => {
        console.warn('[NotificationToast] Failed to play sound:', err);
      });
    }
  }, []);

  // Icon selection based on notification type
  const getIcon = () => {
    const titleLower = notification.title.toLowerCase();
    
    if (titleLower.includes("upload") || titleLower.includes("pengingat") || titleLower.includes("reminder")) {
      return <Upload className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600" />;
    }
    
    if (titleLower.includes("konfirmasi") || titleLower.includes("dikonfirmasi") || titleLower.includes("selesai") || titleLower.includes("completed")) {
      return <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />;
    }
    
    if (titleLower.includes("error") || titleLower.includes("gagal") || titleLower.includes("failed")) {
      return <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-rose-600" />;
    }
    
    if (titleLower.includes("proses") || titleLower.includes("progress")) {
      return <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />;
    }
    
    return <Info className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-600" />;
  };

  const friendlyMsg = getNotificationMessage(notification.title, notification.message);
  const isUnread = !notification.is_read;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.9 }}
      transition={{
        duration: 0.3,
        ease: [0.4, 0, 0.2, 1] // Smooth ease-out
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`w-full rounded-2xl border-2 shadow-xl overflow-hidden backdrop-blur-sm transition-all duration-300 ${
        isUnread 
          ? "border-teal-300 bg-gradient-to-br from-teal-50/95 via-blue-50/95 to-teal-50/95 shadow-teal-500/20" 
          : "border-slate-200 bg-white/95 shadow-slate-500/10"
      }`}
    >
      <div className="flex items-start gap-3 sm:gap-4 p-4 sm:p-4.5">
        {/* Icon with modern styling */}
        <div className="flex-shrink-0 mt-0.5">
          <div className={`p-2 rounded-xl ${
            isUnread 
              ? "bg-gradient-to-br from-teal-100 to-blue-100" 
              : "bg-slate-100"
          }`}>
            {getIcon()}
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h4 
              className={`text-sm sm:text-base font-bold text-slate-900 leading-tight cursor-pointer hover:text-teal-700 transition-colors ${
                isUnread ? "pr-2" : ""
              }`}
              onClick={() => {
                if (onViewDetail) {
                  onViewDetail(notification);
                }
              }}
            >
              {friendlyMsg.title}
            </h4>
            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleManualClose}
              className="flex-shrink-0 text-slate-400 hover:text-slate-600 p-1 -mt-1 -mr-1 rounded-lg hover:bg-slate-100 transition-colors"
              title={t("common.close")}
            >
              <X className="h-4 w-4 sm:h-5 sm:w-5" />
            </motion.button>
          </div>
          <p 
            className={`text-xs sm:text-sm font-medium text-slate-600 mb-3 leading-relaxed line-clamp-2 cursor-pointer hover:text-slate-700 transition-colors ${
              onViewDetail ? "hover:underline" : ""
            }`}
            onClick={() => {
              if (onViewDetail) {
                onViewDetail(notification);
              }
            }}
          >
            {friendlyMsg.message}
          </p>
          {notification.pesanan && (
            <Link
              to={`/orders/${notification.pesanan.id}`}
              onClick={() => {
                handleManualClose();
                // Mark as read when user clicks "View Order" button
                onMarkRead(notification.id);
              }}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-teal-600 hover:text-teal-700 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-gradient-to-r from-teal-50 to-blue-50 hover:from-teal-100 hover:to-blue-100 border border-teal-200 hover:border-teal-300 transition-all active:scale-95 shadow-sm"
            >
              {t("common.viewOrder")}
              <span>→</span>
            </Link>
          )}
        </div>
      </div>
      
      {/* Hover indicator - subtle overlay */}
      {isHovered && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-blue-500/5 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />
      )}
    </motion.div>
  );
}

interface NotificationToastContainerProps {
  notifications: Notification[];
  onClose: (id: number) => void;
  onMarkRead: (id: number) => void;
  onViewDetail?: (notification: Notification) => void;
}

/**
 * Notification Toast Container
 * 
 * RESPONSIBILITIES:
 * - Render up to 2 visible notifications
 * - Handle animation layout (AnimatePresence)
 * - Delegate auto-close logic to individual NotificationToast components
 * - Track dismissed notifications
 */
export function NotificationToastContainer({ 
  notifications, 
  onClose, 
  onMarkRead,
  onViewDetail
}: NotificationToastContainerProps) {
  const [dismissedIds, setDismissedIds] = useState<Set<number>>(new Set());

  // Filter out dismissed notifications
  const visibleNotifications = notifications.filter(n => !dismissedIds.has(n.id));

  // Handle notification close (dismiss from toast, but keep unread)
  const handleClose = (id: number) => {
    setDismissedIds(prev => new Set(prev).add(id));
    onClose(id); // Notify parent (doesn't mark as read)
  };

  // Handle view detail (mark as read when viewing)
  const handleViewDetail = (notification: Notification) => {
    if (!notification.is_read) {
      onMarkRead(notification.id);
    }
    if (onViewDetail) {
      onViewDetail(notification);
    }
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-[10000] pointer-events-none px-3 sm:px-4 pt-16 sm:pt-20">
      <div className="relative max-w-md mx-auto sm:mx-0 sm:ml-auto">
        <AnimatePresence mode="popLayout">
          {visibleNotifications.slice(0, 2).map((notif, index) => (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, x: 300, scale: 0.9, y: -20 }}
              animate={{ 
                opacity: 1, 
                x: 0,
                scale: 1,
                y: 0,
              }}
              exit={{ 
                opacity: 0, 
                x: 400,
                scale: 0.85,
                y: -30,
              }}
              transition={{ 
                type: "spring",
                damping: 25,
                stiffness: 300,
                delay: index * 0.1,
                duration: 0.4
              }}
              className="mb-3 pointer-events-auto"
            >
              <NotificationToast
                notification={notif}
                onClose={() => handleClose(notif.id)}
                onMarkRead={onMarkRead}
                onViewDetail={handleViewDetail}
                autoCloseDelay={3000} // 3 seconds for all notifications
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
