/**
 * Scroll to top button - Modern and professional design
 */

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp } from "lucide-react";

export function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      // Show button when page is scrolled down 300px
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", toggleVisibility);

    return () => {
      window.removeEventListener("scroll", toggleVisibility);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          initial={{ opacity: 0, scale: 0.5, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.5, y: 20 }}
          whileHover={{ scale: 1.1, y: -4 }}
          whileTap={{ scale: 0.95 }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 20
          }}
          onClick={scrollToTop}
          className="fixed bottom-20 sm:bottom-24 right-4 sm:right-6 z-50 flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-gradient-to-br from-lombok-ocean-500 via-lombok-tropical-500 to-lombok-sunset-500 text-white shadow-2xl shadow-lombok-ocean-500/50 hover:shadow-lombok-ocean-500/70 transition-all duration-300 group"
          aria-label="Scroll to top"
        >
          {/* Animated glow effect */}
          <motion.div
            className="absolute inset-0 rounded-full bg-gradient-to-br from-lombok-ocean-400 via-lombok-tropical-400 to-lombok-sunset-400 opacity-0 group-hover:opacity-100 blur-xl"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0, 0.5, 0]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          
          {/* Shimmer effect */}
          <motion.div
            className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/30 to-transparent"
            animate={{
              x: ["-100%", "200%"]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatDelay: 1,
              ease: "linear"
            }}
          />

          {/* Icon */}
          <motion.div
            animate={{
              y: [0, -3, 0]
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="relative z-10"
          >
            <ArrowUp className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={2.5} />
          </motion.div>
        </motion.button>
      )}
    </AnimatePresence>
  );
}

