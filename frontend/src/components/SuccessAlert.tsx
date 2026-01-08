/**
 * Professional and Modern Success Alert Component
 * With smooth animations and premium design
 */

import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, X, Sparkles } from "lucide-react";

interface SuccessAlertProps {
  isVisible: boolean;
  message: string;
  onClose?: () => void;
  duration?: number; // Auto-close duration in ms (0 = no auto-close)
  topOffset?: number; // Top offset in pixels (default: 16px for top-4)
}

export function SuccessAlert({
  isVisible,
  message,
  onClose,
  duration = 5000,
  topOffset = 16 // Default top-4 (16px)
}: SuccessAlertProps) {
  // Auto-close if duration is set
  if (duration > 0 && isVisible && onClose) {
    setTimeout(() => {
      onClose();
    }, duration);
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop (optional, for modal-like feel) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[99998] pointer-events-none"
          />

          {/* Alert Container - Fixed at top center with custom offset */}
          <div 
            className="fixed left-1/2 -translate-x-1/2 z-[99999] w-full max-w-md px-4 pointer-events-none"
            style={{ top: `${topOffset}px` }}
          >
            <motion.div
              initial={{ opacity: 0, y: -50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -50, scale: 0.9 }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 30,
                duration: 0.4
              }}
              className="relative pointer-events-auto"
            >
              {/* Main Alert Card */}
              <div className="relative overflow-hidden rounded-2xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 via-teal-50 to-green-50 shadow-2xl shadow-emerald-500/20">
                {/* Animated gradient border */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-emerald-400 via-teal-400 to-green-400 opacity-20"
                  animate={{
                    backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                  style={{
                    backgroundSize: "200% 200%",
                  }}
                />

                {/* Content */}
                <div className="relative p-4 sm:p-5">
                  <div className="flex items-start gap-3 sm:gap-4">
                    {/* Icon Container with Animation */}
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{
                        type: "spring",
                        stiffness: 200,
                        damping: 15,
                        delay: 0.1
                      }}
                      className="relative flex-shrink-0"
                    >
                      {/* Outer glow rings */}
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-br from-emerald-400 via-teal-500 to-green-600 rounded-full"
                        animate={{
                          scale: [1, 1.2, 1],
                          opacity: [0.5, 0.3, 0.5],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                        style={{ filter: "blur(8px)" }}
                      />
                      
                      {/* Icon container */}
                      <div className="relative flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 via-teal-500 to-green-600 shadow-lg shadow-emerald-500/50">
                        <CheckCircle2 className="h-6 w-6 sm:h-7 sm:w-7 text-white drop-shadow-lg" />
                        
                        {/* Sparkle effects */}
                        {[...Array(3)].map((_, i) => (
                          <motion.div
                            key={i}
                            className="absolute rounded-full bg-white/80"
                            style={{
                              width: "4px",
                              height: "4px",
                              top: `${20 + i * 30}%`,
                              left: `${15 + (i % 2) * 70}%`,
                            }}
                            animate={{
                              opacity: [0, 1, 0],
                              scale: [0, 1.5, 0],
                              y: [0, -10, -20],
                            }}
                            transition={{
                              duration: 1.5,
                              repeat: Infinity,
                              ease: "easeOut",
                              delay: i * 0.2,
                            }}
                          />
                        ))}
                      </div>
                    </motion.div>

                    {/* Message */}
                    <div className="flex-1 min-w-0 pt-1">
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="flex items-center gap-2 mb-1"
                      >
                        <Sparkles className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                        <h3 className="text-sm sm:text-base font-black text-emerald-900">
                          Success!
                        </h3>
                      </motion.div>
                      <motion.p
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.25 }}
                        className="text-xs sm:text-sm font-semibold text-emerald-800 leading-relaxed"
                      >
                        {message}
                      </motion.p>
                    </div>

                    {/* Close Button */}
                    {onClose && (
                      <motion.button
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 }}
                        whileHover={{ scale: 1.1, rotate: 90 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={onClose}
                        className="flex-shrink-0 flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors"
                        aria-label="Close alert"
                      >
                        <X className="h-4 w-4" />
                      </motion.button>
                    )}
                  </div>

                  {/* Progress bar for auto-close */}
                  {duration > 0 && onClose && (
                    <motion.div
                      className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-200"
                      initial={{ scaleX: 1 }}
                      animate={{ scaleX: 0 }}
                      transition={{ duration: duration / 1000, ease: "linear" }}
                    />
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

