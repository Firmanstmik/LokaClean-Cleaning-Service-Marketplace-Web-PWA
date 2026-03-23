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
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.98, opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <div className="relative mb-8 flex flex-col items-center">
              <div className="absolute inset-0 rounded-full bg-teal-400/20 blur-3xl animate-pulse" />
              
              <div className="relative flex flex-col items-center gap-4 text-center">
                <div className="h-24 w-24 sm:h-28 sm:w-28 rounded-3xl flex items-center justify-center overflow-hidden transition-transform duration-500 hover:scale-105">
                  <img
                    src="/img/Logo_LokaClean_fixed.webp"
                    alt="LokaClean"
                    className="h-full w-full object-contain mix-blend-multiply"
                    loading="eager"
                  />
                </div>
                
                <div className="flex flex-col items-center">
                  <span className="text-2xl sm:text-3xl font-black tracking-tighter text-slate-900 leading-none">
                    LokaClean
                  </span>
                  <span className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.3em] text-teal-600 mt-2">
                    Clean Comfort, Island Style
                  </span>
                </div>
              </div>
            </div>

            <div className="relative w-48 h-1.5 rounded-full overflow-hidden bg-slate-200/50 backdrop-blur-sm border border-white/20">
              <motion.div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-teal-500 via-emerald-400 to-teal-500"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ 
                  duration: 2, 
                  ease: "easeInOut",
                  repeat: Infinity,
                  repeatType: "loop"
                }}
              />
            </div>

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
