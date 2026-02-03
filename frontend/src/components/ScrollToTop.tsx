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
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          whileTap={{ scale: 0.95 }}
          onClick={scrollToTop}
          className="fixed bottom-24 right-4 z-40 flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-lombok-ocean-600 to-lombok-tropical-600 text-white shadow-lg shadow-lombok-ocean-500/30 backdrop-blur-sm transition-all duration-300 active:scale-95 border border-white/20"
          aria-label="Scroll to top"
        >
          <ArrowUp className="h-5 w-5" strokeWidth={2} />
        </motion.button>
      )}
    </AnimatePresence>
  );
}

