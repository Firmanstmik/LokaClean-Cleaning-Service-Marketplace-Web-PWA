/**
 * Scroll to top button - Modern and professional design
 * Optimized for Android performance (no heavy animations)
 */

import { useEffect, useState } from "react";
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
    <button
      onClick={scrollToTop}
      className={`fixed bottom-24 right-4 z-40 flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-lombok-ocean-600 to-lombok-tropical-600 text-white shadow-lg shadow-lombok-ocean-500/30 backdrop-blur-sm transition-all duration-300 border border-white/20 ${
        isVisible 
          ? "opacity-100 translate-y-0 scale-100" 
          : "opacity-0 translate-y-4 scale-90 pointer-events-none"
      }`}
      aria-label="Scroll to top"
    >
      <ArrowUp className="h-5 w-5" strokeWidth={2} />
    </button>
  );
}