/**
 * Notification Detail Modal - Full text view for notifications
 */

import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle2, AlertCircle, Info, Clock, Upload, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { getNotificationMessage, t } from "../lib/i18n";
import { formatDateTimeWITA } from "../utils/date";
import type { Notification } from "../types/api";

interface NotificationDetailModalProps {
  notification: Notification | null;
  isOpen: boolean;
  onClose: () => void;
  onMarkRead: (id: number) => void;
}

export function NotificationDetailModal({ 
  notification, 
  isOpen, 
  onClose,
  onMarkRead 
}: NotificationDetailModalProps) {
  if (!notification) return null;

  const friendlyMsg = getNotificationMessage(notification.title, notification.message);
  const isUnread = !notification.is_read;

  const getIcon = () => {
    const titleLower = notification.title.toLowerCase();
    
    if (titleLower.includes("upload") || titleLower.includes("pengingat") || titleLower.includes("reminder")) {
      return <Upload className="h-6 w-6 text-amber-600" />;
    }
    
    if (titleLower.includes("konfirmasi") || titleLower.includes("dikonfirmasi") || titleLower.includes("selesai") || titleLower.includes("completed")) {
      return <CheckCircle2 className="h-6 w-6 text-emerald-600" />;
    }
    
    if (titleLower.includes("error") || titleLower.includes("gagal") || titleLower.includes("failed")) {
      return <AlertCircle className="h-6 w-6 text-rose-600" />;
    }
    
    if (titleLower.includes("proses") || titleLower.includes("progress")) {
      return <Clock className="h-6 w-6 text-blue-600" />;
    }
    
    return <Info className="h-6 w-6 text-indigo-600" />;
  };

  const handleClose = () => {
    // Mark as read when closing modal (user has viewed it)
    if (!notification.is_read) {
      onMarkRead(notification.id);
    }
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[10001]"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{
              type: "spring",
              damping: 25,
              stiffness: 300
            }}
            className="fixed inset-0 z-[10002] flex items-center justify-center p-4 pointer-events-none"
          >
            <motion.div
              className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-hidden pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className={`relative p-5 sm:p-6 border-b-2 ${
                isUnread 
                  ? "bg-gradient-to-r from-teal-50 via-blue-50 to-teal-50 border-teal-200" 
                  : "bg-white border-slate-200"
              }`}>
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className={`flex-shrink-0 p-3 rounded-2xl ${
                    isUnread 
                      ? "bg-gradient-to-br from-teal-100 to-blue-100" 
                      : "bg-slate-100"
                  }`}>
                    {getIcon()}
                  </div>

                  {/* Title & Date */}
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">
                      {friendlyMsg.title}
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500">
                      {formatDateTimeWITA(notification.created_at)}
                    </p>
                  </div>

                  {/* Close Button */}
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleClose}
                    className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-900 transition-colors"
                    aria-label={t("common.close")}
                  >
                    <X className="h-5 w-5" />
                  </motion.button>
                </div>
              </div>

              {/* Content */}
              <div className="p-5 sm:p-6 overflow-y-auto max-h-[calc(85vh-200px)]">
                <p className="text-sm sm:text-base font-medium text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {friendlyMsg.message}
                </p>

                {/* Order Info */}
                {notification.pesanan && (
                  <div className="mt-6 pt-6 border-t border-slate-200">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-bold text-slate-900">
                        {t("orderDetail.orderNumber")}
                      </h3>
                      <span className="text-sm font-semibold text-slate-600">
                        #{notification.pesanan.id}
                      </span>
                    </div>
                    
                    {notification.pesanan.paket && (
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold text-slate-900">
                          {t("orderDetail.package")}
                        </h3>
                        <span className="text-sm font-medium text-slate-600">
                          {notification.pesanan.paket.name}
                        </span>
                      </div>
                    )}

                    {notification.pesanan.status && (
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-slate-900">
                          {t("orderDetail.status")}
                        </h3>
                        <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                          notification.pesanan.status === 'COMPLETED' 
                            ? "bg-emerald-100 text-emerald-700"
                            : notification.pesanan.status === 'IN_PROGRESS'
                            ? "bg-blue-100 text-blue-700"
                            : notification.pesanan.status === 'PENDING'
                            ? "bg-amber-100 text-amber-700"
                            : "bg-slate-100 text-slate-700"
                        }`}>
                          {notification.pesanan.status}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              <div className="p-5 sm:p-6 border-t border-slate-200 bg-slate-50">
                {notification.pesanan ? (
                  <Link
                    to={`/orders/${notification.pesanan.id}`}
                    onClick={handleClose}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 text-white font-bold py-3 px-4 transition-all active:scale-95 shadow-lg shadow-teal-500/30"
                  >
                    {t("common.viewOrder")}
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                ) : (
                  <Link
                    to="/orders"
                    onClick={handleClose}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 text-white font-bold py-3 px-4 transition-all active:scale-95 shadow-lg shadow-teal-500/30"
                  >
                    {t("common.viewOrder")}
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                )}
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

