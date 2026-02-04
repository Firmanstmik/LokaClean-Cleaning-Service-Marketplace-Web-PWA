/**
 * Modern LokaClean Mascot - Premium 3D-Style Robot Assistant ("LokaBot")
 * A professional, high-end mascot for LokaClean
 * Designed for "Big App" feel: 3D-ish, fluid animation, expressive.
 */

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { X, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { t, getLanguage } from "../lib/i18n";

// --- Particle Effects Components ---
const SparkleEffect = ({ delay, x, y }: { delay: number; x: number; y: number }) => (
  <motion.div
    className="absolute text-yellow-400 z-20 pointer-events-none"
    style={{ left: x, top: y }}
    initial={{ opacity: 0, scale: 0 }}
    animate={{ 
      opacity: [0, 1, 0], 
      scale: [0, 1.2, 0], 
      rotate: [0, 45, 90]
    }}
    transition={{ 
      duration: 2, 
      repeat: Infinity, 
      delay: delay,
      repeatDelay: Math.random() * 3
    }}
  >
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
    </svg>
  </motion.div>
);

const BubbleEffect = ({ delay, x, y }: { delay: number; x: number; y: number }) => (
  <motion.div
    className="absolute bg-blue-300/60 rounded-full z-0 pointer-events-none border border-blue-100/50"
    style={{ left: x, top: y }}
    initial={{ opacity: 0, y: 0, scale: 0 }}
    animate={{ 
      opacity: [0, 0.8, 0], 
      y: -60, 
      scale: [0.5, 1.2, 0.8] 
    }}
    transition={{ 
      duration: 2.5, 
      repeat: Infinity, 
      delay: delay,
      ease: "easeOut",
      repeatDelay: Math.random() * 2
    }}
  >
    <div className="w-3 h-3 rounded-full" />
  </motion.div>
);

const TypingIndicator = () => (
  <div className="flex space-x-1 justify-center items-center h-5 px-2">
    {[0, 1, 2].map((i) => (
      <motion.div
        key={i}
        className="w-1.5 h-1.5 bg-blue-400 rounded-full"
        animate={{ y: [0, -4, 0], opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
      />
    ))}
  </div>
);

interface ModernMascotProps {
  onDismiss?: () => void;
  className?: string;
  variant?: "default" | "greeting" | "action" | "success" | "reminder" | "help";
  size?: "small" | "medium" | "large";
}

  const sizes = {
    small: { character: 80, bubble: "text-[9px] min-w-[90px]" },
    medium: { character: 120, bubble: "text-[9px] sm:text-xs min-w-[120px] sm:min-w-[160px]" },
    large: { character: 160, bubble: "text-sm sm:text-base min-w-[150px] sm:min-w-[220px]" }
  };

export function ModernMascot({ 
  onDismiss, 
  className = "",
  variant = "default",
  size = "medium"
}: ModernMascotProps) {
  const [isVisible, setIsVisible] = useState(() => {
    try {
      return localStorage.getItem("mascotHidden") !== "1";
    } catch {
      return true;
    }
  });
  const [isHovered, setIsHovered] = useState(false);
  const [isTyping, setIsTyping] = useState(true);
  const navigate = useNavigate();
  
  const [, setLang] = useState(getLanguage());
  
  const [isMobile, setIsMobile] = useState(false);
  const currentSize = isMobile ? sizes.small : sizes[size];

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const handleLanguageChange = () => setLang(getLanguage());
    window.addEventListener("languagechange", handleLanguageChange);
    
    // Typing animation timer
    const typingTimer = setTimeout(() => {
      setIsTyping(false);
    }, 2000);

    return () => {
      window.removeEventListener("languagechange", handleLanguageChange);
      clearTimeout(typingTimer);
    };
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    try {
      localStorage.setItem("mascotHidden", "1");
    } catch {}
    setTimeout(() => {
      onDismiss?.();
    }, 300);
  };

  const handleClick = () => {
    // Add simple interaction animation logic here if needed
    if (!isHovered) { // Prevent accidental clicks when just dragging
       navigate("/packages");
       handleDismiss();
    }
  };

  const speechText = t('home.mascot.speech');

  // --- Animations ---
  
  // Mobile: Static position to look "grounded", no rotation
  const mobileAnimation = {
    y: 0,
    rotate: 0,
    transition: { duration: 0 } // No animation
  };

  // Floating / Hovering (General Idle)
  const hoverAnimation = {
    y: [0, -12, 0],
    rotate: [0, 3, -3, 0], // More fluid sway
    transition: {
      duration: 5,
      repeat: Infinity,
      ease: "easeInOut" as const
    }
  };

  // Greeting / Waving Simulation (Quick wiggle)
  const greetingAnimation = {
    rotate: [0, 15, -10, 10, 0],
    scale: [1, 1.1, 1],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      repeatDelay: 3,
      ease: "easeInOut" as const
    }
  };

  // Mopping Simulation (Side to side slide with tilt)
  const moppingAnimation = {
    x: [-15, 15, -15],
    rotate: [-5, 5, -5],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut" as const
    }
  };

  // Shadow scaling (matches hover)
  const shadowAnimation = {
    scale: [1, 0.85, 1],
    opacity: [0.3, 0.15, 0.3],
    transition: {
      duration: 5,
      repeat: Infinity,
      ease: "easeInOut" as const
    }
  };

  // Determine animation based on variant
  const getAnimation = () => {
    if (isMobile) return mobileAnimation;
    
    switch (variant) {
      case "greeting": return greetingAnimation;
      case "action": return moppingAnimation; // 'action' can be mopping
      default: return hoverAnimation;
    }
  };

  return (
    <div ref={containerRef} className="fixed inset-0 pointer-events-none z-[9999]">
      <AnimatePresence>
        {isVisible && (
          <motion.div
            className={`fixed bottom-[110px] right-[20px] sm:bottom-[180px] sm:right-[150px] ${className} pointer-events-auto`}
            style={{ 
              // Removed drag for mobile to ensure it stays fixed perfectly
              cursor: isMobile ? "default" : "grab", 
              width: currentSize.character, 
              height: currentSize.character, 
              touchAction: "none",
              willChange: "transform", // Optimize for composition
              zIndex: 9999
            }}
            initial={{ 
              opacity: 0, 
              scale: 0.5,
              x: 100,
              y: 100
            }}
            animate={{ 
              opacity: 1, 
              scale: 1,
              x: 0,
              y: 0
            }}
            exit={{ 
              opacity: 0, 
              scale: 0.5,
              rotate: 15 
            }}
            transition={{
              type: "spring",
              damping: 20,
              stiffness: 150
            }}
            drag={!isMobile} // Disable drag on mobile to prevent accidental moves
            dragMomentum={false}
            whileDrag={{ scale: 1.1, cursor: "grabbing" }}
            whileHover={{ scale: 1.05 }}
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
          >
            {/* --- CLOSE BUTTON (Visible on Hover) --- */}
            <AnimatePresence>
              {isHovered && (
                <motion.button
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDismiss();
                  }}
                  className="absolute -top-4 -right-4 z-[60] w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-md hover:bg-rose-600 pointer-events-auto hidden sm:flex"
                >
                  <X className="w-4 h-4" />
                </motion.button>
              )}
            </AnimatePresence>
            {/* Mobile Close Button (always visible) */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDismiss();
              }}
              className="absolute -top-4 -right-4 z-[60] w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-md hover:bg-rose-600 pointer-events-auto sm:hidden"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Speech Bubble */}
            <motion.div
              className="absolute -top-16 sm:-top-20 -right-2 z-50 pointer-events-auto origin-bottom-right"
              initial={{ opacity: 0, y: 10, scale: 0.8, rotate: -5 }}
              animate={{ opacity: 1, y: [0, -5, 0], scale: 1, rotate: 0 }}
              transition={{ 
                opacity: { delay: 0.5, duration: 0.3 },
                y: { duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.5 }
              }}
            >
              <div className={`relative bg-gradient-to-br from-white via-white to-blue-50 backdrop-blur-md rounded-[20px] rounded-br-sm shadow-[0_4px_20px_rgba(0,0,0,0.1)] border border-blue-100 ${currentSize.bubble} p-3 sm:p-4`}>
                
                <div 
                  className="cursor-pointer select-none text-center leading-snug flex items-center justify-center min-h-[24px]"
                  onClick={handleClick}
                >
                  <AnimatePresence mode="wait">
                    {isTyping ? (
                      <motion.div
                        key="typing"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        <TypingIndicator />
                      </motion.div>
                    ) : (
                      <motion.p
                        key="text"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="font-bold text-slate-800"
                      >
                        {speechText}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                {/* Bubble Tail - CSS Shape */}
                <div className="absolute -bottom-[10px] right-[18px] w-0 h-0 
                  border-l-[12px] border-l-transparent
                  border-t-[12px] border-t-blue-50
                  border-r-[0px] border-r-transparent 
                  filter drop-shadow-sm">
                </div>
              </div>
            </motion.div>

            {/* --- MASCOT IMAGE --- */}
            <div className="relative pointer-events-auto" onClick={handleClick}>
              
              {/* Particle Effects (Sparkles & Bubbles) - Desktop Only */}
              {!isMobile && (
                <div className="absolute inset-0 -z-10 pointer-events-none">
                  <SparkleEffect delay={0} x={-20} y={10} />
                  <SparkleEffect delay={1.5} x={currentSize.character + 10} y={20} />
                  <SparkleEffect delay={0.8} x={currentSize.character / 2} y={-30} />
                  
                  <BubbleEffect delay={0.5} x={-10} y={currentSize.character} />
                  <BubbleEffect delay={2.2} x={currentSize.character + 5} y={currentSize.character - 20} />
                </div>
              )}

              {/* Animated Glow/Aura - Reduced for Mobile */}
              <motion.div
                className="absolute inset-0 bg-blue-400/30 rounded-full blur-2xl -z-10"
                animate={isMobile ? { opacity: 0.2 } : { scale: [1, 1.3, 1], opacity: [0.2, 0.5, 0.2] }}
                transition={isMobile ? {} : { duration: 3, repeat: Infinity }}
              />

              <motion.div 
                animate={getAnimation()} 
                whileTap={{ scale: 0.9, rotate: -5 }}
                className="relative z-10"
              >
                 {/* Image Container */}
                 <div className="relative">
                    <img 
                      src="/img/maskot.jpg" 
                      alt="LokaClean Mascot" 
                      draggable={false}
                      style={{ 
                        width: currentSize.character, 
                        height: "auto",
                        objectFit: "contain",
                        mixBlendMode: "multiply" 
                      }}
                      className="block hover:brightness-105 transition-all select-none pointer-events-none"
                    />
                 </div>
              </motion.div>

              {/* --- SHADOW / FLOOR --- */}
              {isMobile ? (
                 // Mobile Floor: A realistic perspective floor
                 <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-[160%] h-8 z-0 pointer-events-none">
                    {/* Main shadow core */}
                    <div className="absolute inset-0 bg-black/30 rounded-[100%] blur-[4px] scale-y-50" />
                    {/* Outer soft shadow */}
                    <div className="absolute inset-0 bg-black/10 rounded-[100%] blur-[8px] scale-y-75 scale-x-110" />
                 </div>
              ) : (
                <motion.div 
                  className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-2/3 h-3 bg-black/20 rounded-full blur-md"
                  animate={shadowAnimation}
                />
              )}

              {/* --- COMPANION ELEMENT (Trash Bin / Bucket) --- */}
              <div className={`absolute -bottom-1 -left-4 z-20 ${isMobile ? 'block' : 'hidden sm:block'}`}>
                  <div className="relative group cursor-pointer" onClick={() => navigate('/packages')}>
                    {/* Trash Bin Icon */}
                    <div className="relative z-10 bg-white p-1.5 rounded-lg border-2 border-slate-200 shadow-sm transform -rotate-6 hover:rotate-0 transition-transform">
                       <Trash2 className="w-5 h-5 text-emerald-500" />
                    </div>
                    {/* Bin Shadow */}
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-full h-1 bg-black/20 blur-[1px] rounded-full" />
                  </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
