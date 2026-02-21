import React from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

interface StickyMobileCTAProps {
  visible?: boolean;
}

export function StickyMobileCTA({ visible = true }: StickyMobileCTAProps) {
  const [compact, setCompact] = React.useState(false);
  const lastScrollY = React.useRef(0);
  const ticking = React.useRef(false);
  const location = useLocation();
  const isHomePage = location.pathname === "/home";

  React.useEffect(() => {
    const handleScroll = () => {
      if (ticking.current) return;
      ticking.current = true;
      window.requestAnimationFrame(() => {
        const currentY = window.scrollY || document.documentElement.scrollTop;
        if (currentY > lastScrollY.current + 8 && !compact) {
          setCompact(true);
        } else if (currentY < lastScrollY.current - 8 && compact) {
          setCompact(false);
        }
        lastScrollY.current = currentY;
        ticking.current = false;
      });
    };
    window.addEventListener("scroll", handleScroll, { passive: true } as AddEventListenerOptions);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const shouldShow = visible && isHomePage;

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ duration: 0.4, ease: [0.22, 0.61, 0.36, 1] }}
          className="fixed bottom-4 left-0 right-0 z-40 sm:hidden flex justify-center px-5"
        >
          <div className="w-full max-w-md">
            <div className="rounded-full bg-white/60 backdrop-blur-md shadow-[0_20px_45px_rgba(15,23,42,0.22)] px-1.5 py-1.5">
          <Link
            to="/orders/new"
            className="block w-[92%] mx-auto rounded-full bg-gradient-to-r from-teal-500 via-teal-600 to-sky-500 text-center text-sm font-semibold text-white shadow-md active:scale-95 transition-transform duration-200"
            style={{
              paddingTop: compact ? 10 : 14,
              paddingBottom: compact ? 10 : 14,
              transform: compact ? "scale(0.96) translateY(2px) translateZ(0)" : "scale(1) translateY(0) translateZ(0)",
            }}
          >
                Pesan Cleaning Sekarang
              </Link>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
