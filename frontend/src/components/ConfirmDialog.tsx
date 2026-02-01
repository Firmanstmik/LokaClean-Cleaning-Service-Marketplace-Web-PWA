/**
 * Modern, Creative, and Interactive Confirmation Dialog
 * Mobile-first design with smooth animations
 */

import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X, CheckCircle2, Trash2 } from "lucide-react";
import type { MouseEvent as ReactMouseEvent } from "react";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
  isLoading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Ya, Lanjutkan",
  cancelText = "Batal",
  variant = "danger",
  isLoading = false
}: ConfirmDialogProps) {
  const variantStyles = {
    danger: {
      icon: Trash2,
      iconBg: "bg-gradient-to-br from-rose-100 to-red-100",
      iconColor: "text-rose-600",
      buttonBg: "bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700",
      buttonShadow: "shadow-rose-500/30 hover:shadow-rose-500/50",
      accent: "from-rose-50 to-red-50"
    },
    warning: {
      icon: AlertTriangle,
      iconBg: "bg-gradient-to-br from-amber-100 to-orange-100",
      iconColor: "text-amber-600",
      buttonBg: "bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700",
      buttonShadow: "shadow-amber-500/30 hover:shadow-amber-500/50",
      accent: "from-amber-50 to-orange-50"
    },
    info: {
      icon: CheckCircle2,
      iconBg: "bg-gradient-to-br from-blue-100 to-indigo-100",
      iconColor: "text-blue-600",
      buttonBg: "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700",
      buttonShadow: "shadow-blue-500/30 hover:shadow-blue-500/50",
      accent: "from-blue-50 to-indigo-50"
    }
  };

  const style = variantStyles[variant];
  const Icon = style.icon;

  const handleConfirm = () => {
    if (!isLoading) {
      onConfirm();
    }
  };

  const handleBackdropClick = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !isLoading) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop with blur effect */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleBackdropClick}
            className="fixed inset-0 z-[99999] bg-black/50 backdrop-blur-sm"
            style={{ position: 'fixed' }}
          />

          {/* Dialog Container */}
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 30,
                duration: 0.3
              }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md pointer-events-auto"
            >
              {/* Dialog Card */}
              <div className="relative bg-white rounded-3xl shadow-2xl overflow-hidden">
                {/* Gradient accent top border */}
                <div className={`h-1.5 bg-gradient-to-r ${style.accent}`} />

                {/* Content */}
                <div className="p-6 sm:p-8">
                  {/* Icon Container */}
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                    className={`relative mx-auto mb-5 w-16 h-16 sm:w-20 sm:h-20 rounded-2xl ${style.iconBg} flex items-center justify-center`}
                  >
                    <Icon className={`w-8 h-8 sm:w-10 sm:h-10 ${style.iconColor}`} />
                    
                    {/* Pulse animation for danger variant */}
                    {variant === "danger" && (
                      <motion.div
                        className={`absolute inset-0 rounded-2xl ${style.iconBg}`}
                        animate={{
                          scale: [1, 1.2, 1],
                          opacity: [0.5, 0, 0.5]
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      />
                    )}
                  </motion.div>

                  {/* Title */}
                  <motion.h3
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="text-xl sm:text-2xl font-black text-slate-900 text-center mb-3"
                  >
                    {title}
                  </motion.h3>

                  {/* Message */}
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-sm sm:text-base text-slate-600 text-center leading-relaxed whitespace-pre-line mb-6"
                  >
                    {message}
                  </motion.p>

                  {/* Action Buttons */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    className="flex flex-col sm:flex-row gap-3"
                  >
                    {/* Cancel Button */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={onClose}
                      disabled={isLoading}
                      className="flex-1 px-5 py-3.5 rounded-2xl border-2 border-slate-200 bg-white text-slate-700 font-bold text-sm sm:text-base shadow-sm hover:border-slate-300 hover:bg-slate-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                    >
                      {cancelText}
                    </motion.button>

                    {/* Confirm Button */}
                    <motion.button
                      whileHover={{ scale: isLoading ? 1 : 1.02 }}
                      whileTap={{ scale: isLoading ? 1 : 0.98 }}
                      onClick={handleConfirm}
                      disabled={isLoading}
                      className={`flex-1 px-5 py-3.5 rounded-2xl ${style.buttonBg} text-white font-black text-sm sm:text-base shadow-lg ${style.buttonShadow} transition-all disabled:opacity-60 disabled:cursor-not-allowed touch-manipulation relative overflow-hidden`}
                    >
                      {isLoading ? (
                        <motion.div
                          className="flex items-center justify-center gap-2"
                        >
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                          />
                          <span>Memproses...</span>
                        </motion.div>
                      ) : (
                        confirmText
                      )}
                      
                      {/* Shimmer effect on hover */}
                      {!isLoading && (
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                          initial={{ x: "-100%" }}
                          whileHover={{ x: "100%" }}
                          transition={{ duration: 0.5 }}
                        />
                      )}
                    </motion.button>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

