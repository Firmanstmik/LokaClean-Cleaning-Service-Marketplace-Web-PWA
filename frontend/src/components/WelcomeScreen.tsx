
/**
 * Welcome/Splash Screen - Interactive logo animation for mobile app experience.
 * Shows when user logs in or returns to the app.
 */

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const STORAGE_KEY = "lokaclean_welcome_shown";
const EXIT_DURATION = 500; // Slower smooth exit animation (0.5s)
const WELCOME_DURATION = 2000; // 2s visible (faster)

export function WelcomeScreen({ onComplete }: { onComplete: () => void }) {
  const [show, setShow] = useState(true);

  useEffect(() => {
    // Detect if PWA (Standalone)
    const nav = window.navigator as Navigator & { standalone?: boolean };
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches || !!nav.standalone;
    
    // Use sessionStorage for PWA (show once per launch/session), localStorage for Web (show less frequently)
    const storage = isStandalone ? sessionStorage : localStorage;
    
    // Check if welcome screen was shown recently
    const lastShown = storage.getItem(STORAGE_KEY);
    const now = Date.now();
    const COOLDOWN = isStandalone ? 0 : 5 * 60 * 1000; // No cooldown for PWA session (shows once per session), 5 min for web

    if (lastShown && (now - parseInt(lastShown) < COOLDOWN || isStandalone)) {
      // If PWA: if exists in sessionStorage, it means it was shown this session -> Skip.
      // If Web: if exists and < 5 mins -> Skip.
      if (isStandalone || (now - parseInt(lastShown) < COOLDOWN)) {
          setShow(false);
          onComplete();
          return;
      }
    }

    // Show welcome screen
    const timer = setTimeout(() => {
      setShow(false);
      storage.setItem(STORAGE_KEY, now.toString());
      // Wait for exit animation to complete
      setTimeout(onComplete, EXIT_DURATION);
    }, WELCOME_DURATION);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: EXIT_DURATION / 1000, ease: "easeInOut" }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950"
        >
          {/* Subtle Gradient Background - Static & Fast */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 to-slate-950" />
          
          {/* Simple Radial Glow behind logo */}
          <div className="absolute w-[300px] h-[300px] bg-teal-500/10 rounded-full blur-[80px]" />

          {/* Logo container */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.05, opacity: 0 }}
            transition={{
              duration: 0.8,
              ease: "easeOut"
            }}
            className="relative z-10 flex flex-col items-center"
          >
            <div className="relative w-24 h-24 mb-4 rounded-3xl overflow-hidden shadow-2xl shadow-teal-900/20 ring-1 ring-white/10 bg-slate-900">
              <img 
                src="/img/Logo_LokaClean_fixed.webp" 
                alt="LokaClean" 
                className="w-full h-full object-contain mix-blend-multiply"
              />
            </div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="text-2xl font-bold text-white tracking-tight"
            >
              Loka<span className="text-teal-400">Clean</span>
            </motion.h1>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
