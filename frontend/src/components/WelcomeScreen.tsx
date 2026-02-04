/**
 * Welcome/Splash Screen - Interactive logo animation for mobile app experience.
 * Shows when user logs in or returns to the app.
 */

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CircularLoader } from "./ui/CircularLoader";

const STORAGE_KEY = "lokaclean_welcome_shown";
const EXIT_DURATION = 500; // Slower smooth exit animation (0.5s)
const WELCOME_DURATION = 2500; // 2.5s visible + 0.5s exit = exactly 3 seconds total

export function WelcomeScreen({ onComplete }: { onComplete: () => void }) {
  const [show, setShow] = useState(true);

  useEffect(() => {
    // Detect if PWA (Standalone)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    
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
          transition={{ duration: EXIT_DURATION / 1000, ease: "easeOut" }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-gradient-to-br from-tropical-500 via-ocean-500 to-sun-400"
        >
          {/* Animated background particles */}
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={`particle-${i}`}
                className="absolute rounded-full bg-white/20"
                style={{
                  width: Math.random() * 20 + 10,
                  height: Math.random() * 20 + 10,
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                animate={{
                  y: [0, -100, 0],
                  x: [0, Math.random() * 50 - 25, 0],
                  opacity: [0.2, 0.5, 0.2],
                  scale: [1, 1.5, 1],
                }}
                transition={{
                  duration: Math.random() * 3 + 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.1,
                }}
              />
            ))}
          </div>

          {/* Logo container */}
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.98, opacity: 0 }}
            transition={{
              scale: {
                type: "spring",
                stiffness: 600,
                damping: 35,
                duration: EXIT_DURATION / 1000,
              },
              opacity: { duration: EXIT_DURATION / 1000, ease: "easeOut" },
            }}
            className="relative z-10 flex flex-col items-center justify-center w-full"
          >
            {/* Glow effect behind logo */}
            <motion.div
              className="absolute -inset-8 rounded-3xl bg-white/20 blur-3xl"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.2, 0.4, 0.2],
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />

            {/* Logo */}
            <motion.div
              className="relative h-32 w-32 sm:h-40 sm:w-40 rounded-3xl bg-white shadow-2xl flex items-center justify-center"
              animate={{
                y: [0, -6, 0],
              }}
              transition={{
                y: {
                  duration: 2.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                },
              }}
            >
              <div className="relative w-full h-full flex items-center justify-center p-3 sm:p-4">
                <img
                  src="/img/Logo_LokaClean.jpg"
                  alt="LokaClean Logo"
                  className="max-w-full max-h-full w-auto h-auto object-contain"
                  style={{ 
                    objectPosition: 'center center'
                  }}
                />
              </div>
              
              {/* Shimmer effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent"
                animate={{
                  x: ["-100%", "200%"],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatDelay: 1,
                  ease: "linear",
                }}
              />
            </motion.div>

            {/* App name */}
            <motion.div
              initial={{ y: 15, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.4 }}
              className="mt-6 text-center"
            >
              <motion.h1
                className="text-3xl sm:text-4xl font-bold text-white drop-shadow-lg"
              >
                LokaClean
              </motion.h1>
              <motion.p
                initial={{ y: 8, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.25, duration: 0.4 }}
                className="mt-2 text-base sm:text-lg text-white/90 font-medium"
              >
                Clean Comfort, Island Style
              </motion.p>
            </motion.div>

            {/* Circular Loader */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.35 }}
              className="mt-8"
            >
              <CircularLoader size="lg" variant="white" />
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

