/**
 * Promotional Mascot Component - Professional Animated Character with Speech Bubble
 * A friendly cleaning character with cultural value that encourages users to book orders
 * Features: Speech bubble, free draggable movement, swipe to dismiss
 */

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface PromotionalMascotProps {
  onDismiss?: () => void;
  className?: string;
}

export function PromotionalMascot({ onDismiss, className = "" }: PromotionalMascotProps) {
  const [isVisible, setIsVisible] = useState(true);
  const navigate = useNavigate();
  const constraintsRef = useRef<HTMLDivElement>(null);
  
  // Get current language from localStorage
  const [currentLanguage, setCurrentLanguage] = useState<"id" | "en">(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("lokaclean_language");
      return (stored === "en" || stored === "id") ? stored : "id";
    }
    return "id";
  });

  // Listen for language changes
  useEffect(() => {
    const handleLanguageChange = () => {
      const stored = localStorage.getItem("lokaclean_language");
      setCurrentLanguage((stored === "en" || stored === "id") ? stored : "id");
    };
    window.addEventListener("languagechange", handleLanguageChange);
    return () => window.removeEventListener("languagechange", handleLanguageChange);
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(() => {
      onDismiss?.();
    }, 300);
  };

  const handleClick = () => {
    navigate("/packages");
    handleDismiss();
  };

  const speechText = currentLanguage === "en" 
    ? "Ready to Clean? 🧹✨" 
    : "Siap Bersihkan? 🧹✨";

  // Initial position - bottom right (responsive)
  const getInitialPosition = () => {
    if (typeof window !== "undefined") {
      const isMobile = window.innerWidth < 640; // sm breakpoint
      return {
        x: window.innerWidth - (isMobile ? 100 : 140),
        y: window.innerHeight - (isMobile ? 150 : 140)
      };
    }
    return { x: 0, y: 0 };
  };
  
  const initialPos = getInitialPosition();

  return (
    <div ref={constraintsRef} className="fixed inset-0 pointer-events-none z-40 overflow-hidden">
      <AnimatePresence>
        {isVisible && (
          <motion.div
            className={`absolute ${className}`}
            initial={{ 
              opacity: 0, 
              scale: 0.8,
              x: initialPos.x + 50,
              y: initialPos.y + 50
            }}
            animate={{ 
              opacity: 1, 
              scale: 1,
              x: initialPos.x,
              y: initialPos.y
            }}
            exit={{ 
              opacity: 0, 
              scale: 0.8,
              x: initialPos.x + 300,
              y: initialPos.y,
              rotate: 15 
            }}
            transition={{
              type: "spring",
              damping: 25,
              stiffness: 300,
              duration: 0.6
            }}
            drag
            dragConstraints={constraintsRef}
            dragElastic={0.05}
            dragMomentum={false}
            whileDrag={{ 
              cursor: "grabbing",
              scale: 1.1,
              zIndex: 50
            }}
            style={{
              cursor: "grab"
            }}
            onDragStart={(e) => {
              // Prevent click event during drag
              e.stopPropagation();
            }}
          >
            {/* Speech Bubble - WhatsApp Style */}
            <motion.div
              className="absolute -top-16 sm:-top-20 right-0 z-50 pointer-events-auto"
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ 
                opacity: 1, 
                y: [0, -4, 0],
                scale: 1
              }}
              transition={{ 
                delay: 0.4, 
                duration: 0.5,
                y: {
                  duration: 2.5,
                  repeat: Infinity,
                  ease: "easeInOut"
                }
              }}
            >
              {/* WhatsApp-style message bubble */}
              <div className="relative bg-white rounded-2xl rounded-tr-none shadow-xl min-w-[110px] sm:min-w-[170px] max-w-[200px] sm:max-w-[250px]">
                {/* Close button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDismiss();
                  }}
                  className="absolute -top-2 -right-2 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gradient-to-br from-rose-500 to-rose-600 text-white flex items-center justify-center hover:from-rose-600 hover:to-rose-700 transition-all shadow-lg z-20 hover:scale-110 active:scale-95 pointer-events-auto"
                  aria-label="Close"
                >
                  <X className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                </button>
                
                {/* Bubble content */}
                <div className="px-3 py-2 sm:px-4 sm:py-2.5">
                  <motion.p
                    className="text-[10px] sm:text-sm font-semibold text-slate-800 text-left leading-tight cursor-pointer select-none pointer-events-auto"
                    onClick={handleClick}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {speechText}
                  </motion.p>
                </div>
                
                {/* WhatsApp-style tail pointing down to character */}
                <div className="absolute -bottom-2 right-4 sm:right-5">
                  <svg 
                    width="12" 
                    height="8" 
                    viewBox="0 0 12 8" 
                    className="sm:w-4 sm:h-3"
                  >
                    <path 
                      d="M0,0 L12,0 L8,8 Z" 
                      fill="white"
                      className="drop-shadow-sm"
                    />
                  </svg>
                </div>
                
                {/* Subtle glow effect */}
                <div className="absolute inset-0 rounded-2xl rounded-tr-none bg-gradient-to-br from-tropical-100/30 to-ocean-100/30 -z-10 blur-sm"></div>
              </div>
            </motion.div>

            {/* Animated Character - Modern with Cultural Value */}
            <motion.div
              className="relative cursor-grab active:cursor-grabbing pointer-events-auto z-10"
              onTap={() => {
                handleClick();
              }}
              animate={{
                y: [0, -10, 0],
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              whileHover={{ 
                scale: 1.15, 
                y: -8,
                transition: { duration: 0.2 }
              }}
            >
              {/* Glow ring around character */}
              <motion.div
                className="absolute inset-0 rounded-full bg-gradient-to-br from-tropical-400/30 via-ocean-400/30 to-tropical-400/30 blur-xl -z-10"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.4, 0.6, 0.4],
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />

              <svg
                width="80"
                height="80"
                viewBox="0 0 220 220"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="drop-shadow-2xl sm:w-[110px] sm:h-[110px]"
              >
                {/* Background glow circle */}
                <motion.circle
                  cx="110"
                  cy="110"
                  r="95"
                  fill="url(#mascot-glow)"
                  opacity={0.2}
                  animate={{
                    opacity: [0.2, 0.35, 0.2],
                    scale: [1, 1.15, 1],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />

                {/* Character Body - Modern rounded shape */}
                <g>
                  {/* Head */}
                  <motion.ellipse
                    cx="110"
                    cy="80"
                    rx="38"
                    ry="42"
                    fill="url(#skin-gradient)"
                    stroke="url(#stroke-grad)"
                    strokeWidth="2.5"
                    animate={{
                      y: [0, -3, 0],
                      scale: [1, 1.02, 1],
                    }}
                    transition={{
                      duration: 2.5,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                  
                  {/* Modern Headband with Cultural Pattern */}
                  <motion.path
                    d="M 75 55 Q 110 45 145 55 L 145 75 L 75 75 Z"
                    fill="url(#headband-gradient)"
                    stroke="url(#stroke-grad)"
                    strokeWidth="2"
                    animate={{
                      y: [0, -3, 0],
                    }}
                    transition={{
                      duration: 2.5,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                  {/* Cultural decorative elements */}
                  <motion.circle 
                    cx="95" 
                    cy="62" 
                    r="4" 
                    fill="#ff6b6b"
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.8, 1, 0.8]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                  <motion.circle 
                    cx="125" 
                    cy="62" 
                    r="4" 
                    fill="#4ecdc4"
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.8, 1, 0.8]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: 0.3
                    }}
                  />
                  
                  {/* Eyes - Friendly and animated */}
                  <motion.g
                    animate={{
                      scaleY: [1, 0.15, 1],
                    }}
                    transition={{
                      duration: 0.25,
                      repeat: Infinity,
                      repeatDelay: 3.5,
                      ease: "easeInOut"
                    }}
                  >
                    <ellipse cx="95" cy="75" rx="6" ry="7" fill="#1a1a1a" />
                    <ellipse cx="95" cy="75" rx="3" ry="3.5" fill="#ffffff" />
                  </motion.g>
                  <ellipse cx="125" cy="75" rx="6" ry="7" fill="#1a1a1a" />
                  <ellipse cx="125" cy="75" rx="3" ry="3.5" fill="#ffffff" />
                  
                  {/* Friendly Smile */}
                  <motion.path
                    d="M 88 90 Q 110 98 132 90"
                    stroke="#1a1a1a"
                    strokeWidth="3"
                    strokeLinecap="round"
                    fill="none"
                    animate={{
                      d: [
                        "M 88 90 Q 110 98 132 90",
                        "M 88 92 Q 110 100 132 92",
                        "M 88 90 Q 110 98 132 90",
                      ],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                  
                  {/* Body - Modern cleaning uniform */}
                  <motion.ellipse
                    cx="110"
                    cy="140"
                    rx="50"
                    ry="45"
                    fill="url(#uniform-gradient)"
                    stroke="url(#stroke-grad)"
                    strokeWidth="2.5"
                    animate={{
                      y: [0, -3, 0],
                    }}
                    transition={{
                      duration: 2.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: 0.15
                    }}
                  />
                  
                  {/* Left Arm with Cleaning Sponge */}
                  <motion.g
                    animate={{
                      x: [0, -8, 0],
                      rotate: [-12, 6, -12],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    <ellipse cx="55" cy="135" rx="12" ry="28" fill="url(#skin-gradient)" />
                    <rect x="35" y="120" width="20" height="22" rx="4" fill="url(#sponge-gradient)" />
                    <circle cx="45" cy="142" r="7" fill="url(#sponge-gradient)" />
                    <rect x="38" y="123" width="10" height="8" rx="2" fill="#ffffff" opacity="0.6" />
                    {/* Bubbles from sponge */}
                    <motion.circle
                      cx="42"
                      cy="115"
                      r="3"
                      fill="#87ceeb"
                      opacity={0.6}
                      animate={{
                        y: [0, -8, 0],
                        opacity: [0.6, 0, 0.6],
                        scale: [1, 1.3, 1]
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeOut"
                      }}
                    />
                  </motion.g>
                  
                  {/* Right Arm with Cleaning Sponge */}
                  <motion.g
                    animate={{
                      x: [0, 8, 0],
                      rotate: [12, -6, 12],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: 0.4
                    }}
                  >
                    <ellipse cx="165" cy="135" rx="12" ry="28" fill="url(#skin-gradient)" />
                    <rect x="165" y="120" width="20" height="22" rx="4" fill="url(#sponge-gradient)" />
                    <circle cx="175" cy="142" r="7" fill="url(#sponge-gradient)" />
                    <rect x="168" y="123" width="10" height="8" rx="2" fill="#ffffff" opacity="0.6" />
                    {/* Bubbles from sponge */}
                    <motion.circle
                      cx="178"
                      cy="115"
                      r="3"
                      fill="#87ceeb"
                      opacity={0.6}
                      animate={{
                        y: [0, -8, 0],
                        opacity: [0.6, 0, 0.6],
                        scale: [1, 1.3, 1]
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeOut",
                        delay: 0.2
                      }}
                    />
                  </motion.g>
                </g>

                {/* Sparkles/Stars around character */}
                {Array.from({ length: 5 }).map((_, i) => {
                  const angle = (i * 72) * Math.PI / 180;
                  const radius = 70;
                  const xPos = 110 + Math.cos(angle) * radius;
                  const yPos = 110 + Math.sin(angle) * radius;
                  
                  // Defensive check to prevent "M undefined undefined" error
                  const safeX = (xPos === undefined || isNaN(xPos)) ? 110 : xPos;
                  const safeY = (yPos === undefined || isNaN(yPos)) ? 110 : yPos;
                  
                  return (
                    <motion.g
                      key={i}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{
                        scale: [0.4, 1.4, 0.4],
                        opacity: [0.2, 0.95, 0.2],
                        rotate: [0, 180, 360],
                      }}
                      transition={{
                        duration: 2.5 + i * 0.3,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: i * 0.25
                      }}
                    >
                      <path
                        d={`M ${safeX} ${safeY} L ${safeX + 3} ${safeY - 6} L ${safeX + 6} ${safeY} L ${safeX + 3} ${safeY + 6} Z`}
                        fill="#ffd93d"
                        opacity={0.9}
                      />
                    </motion.g>
                  );
                })}

                {/* Gradient Definitions */}
                <defs>
                  <linearGradient id="mascot-glow" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#1abc9c" />
                    <stop offset="50%" stopColor="#3498db" />
                    <stop offset="100%" stopColor="#1abc9c" />
                  </linearGradient>
                  <linearGradient id="skin-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ffeacc" />
                    <stop offset="50%" stopColor="#fff5e6" />
                    <stop offset="100%" stopColor="#ffdb99" />
                  </linearGradient>
                  <linearGradient id="headband-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#3498db" />
                    <stop offset="50%" stopColor="#2980b9" />
                    <stop offset="100%" stopColor="#3498db" />
                  </linearGradient>
                  <linearGradient id="uniform-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#1abc9c" />
                    <stop offset="50%" stopColor="#16a085" />
                    <stop offset="100%" stopColor="#1abc9c" />
                  </linearGradient>
                  <linearGradient id="sponge-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#27ae60" />
                    <stop offset="100%" stopColor="#229954" />
                  </linearGradient>
                  <linearGradient id="stroke-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#34495e" />
                    <stop offset="100%" stopColor="#2c3e50" />
                  </linearGradient>
                </defs>
              </svg>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
