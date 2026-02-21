import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface SplashScreenProps {
  visible: boolean;
  onFinished: () => void;
}

export function SplashScreen({ visible, onFinished }: SplashScreenProps) {
  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => {
      onFinished();
    }, 2000);
    return () => clearTimeout(timer);
  }, [visible, onFinished]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[999] flex items-center justify-center bg-gradient-to-br from-white via-teal-50 to-teal-100"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        >
          <motion.div
            className="relative flex flex-col items-center justify-center px-8"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.98, opacity: 0 }}
            transition={{ duration: 0.7, ease: [0.33, 1, 0.68, 1] }}
          >
            <div className="relative mb-6">
              <div className="absolute inset-0 rounded-3xl bg-teal-400/30 blur-3xl" />
              <div className="relative rounded-3xl bg-white/90 shadow-[0_18px_60px_rgba(15,23,42,0.18)] border border-white/80 px-6 py-4 flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-teal-50 flex items-center justify-center shadow-inner border border-teal-100 overflow-hidden">
                  <img
                    src="/img/Logo_LokaClean.jpg"
                    alt="LokaClean"
                    className="h-10 w-10 object-contain"
                    loading="eager"
                  />
                </div>
                <div className="flex flex-col">
                  <span className="text-lg font-extrabold tracking-tight text-slate-900">
                    LokaClean
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-600">
                    Clean Comfort, Island Style
                  </span>
                </div>
              </div>
            </div>

            <motion.div
              className="relative w-40 h-1.5 rounded-full overflow-hidden bg-white/80 border border-teal-100 shadow-inner"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.4 }}
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-teal-400 via-emerald-400 to-sky-400"
                initial={{ x: "-100%" }}
                animate={{ x: ["-100%", "0%", "100%"] }}
                transition={{ duration: 1.8, ease: "easeInOut" }}
              />
            </motion.div>

            <motion.p
              className="mt-5 text-xs font-medium tracking-wide text-slate-500"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ delay: 0.2, duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            >
              Menyiapkan pengalaman bersih terbaik di Lombok
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

