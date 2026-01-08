/**
 * Modern LocaClean Mascot - Premium Smart Clean Assistant
 * A professional, modern, tech-inspired mascot for LocaClean
 * Designed for scalability, trust, and user engagement
 * 
 * Design Philosophy:
 * - Modern, minimal, tech-inspired
 * - Semi-flat / soft 3D illustration
 * - Clean shapes, smooth curves, rounded edges
 * - Professional but friendly
 * - Gender-neutral, trustworthy
 */

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ModernMascotProps {
  onDismiss?: () => void;
  className?: string;
  variant?: "default" | "greeting" | "action" | "success" | "reminder" | "help";
  size?: "small" | "medium" | "large";
}

export function ModernMascot({ 
  onDismiss, 
  className = "",
  variant = "default",
  size = "medium"
}: ModernMascotProps) {
  const [isVisible, setIsVisible] = useState(true);
  const navigate = useNavigate();
  const constraintsRef = useRef<HTMLDivElement>(null);
  
  const [currentLanguage, setCurrentLanguage] = useState<"id" | "en">(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("lokaclean_language");
      return (stored === "en" || stored === "id") ? stored : "id";
    }
    return "id";
  });

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

  const sizes = {
    small: { character: 60, bubble: "text-[9px] min-w-[90px]" },
    medium: { character: 80, bubble: "text-[10px] sm:text-sm min-w-[110px] sm:min-w-[170px]" },
    large: { character: 110, bubble: "text-sm sm:text-base min-w-[140px] sm:min-w-[200px]" }
  };

  const currentSize = sizes[size];
  const getInitialPosition = () => {
    if (typeof window !== "undefined") {
      const isMobile = window.innerWidth < 640;
      return {
        x: window.innerWidth - (isMobile ? 90 : 130),
        y: window.innerHeight - (isMobile ? 140 : 130)
      };
    }
    return { x: 0, y: 0 };
  };
  
  const initialPos = getInitialPosition();

  // Animation variants based on state - subtle and professional
  const characterAnimations = {
    default: { y: [0, -6, 0], rotate: 0 },
    greeting: { y: [0, -8, 0], rotate: [0, 1.5, -1.5, 0] },
    action: { y: [0, -5, 0], scale: [1, 1.01, 1] },
    success: { y: [0, -10, 0], rotate: [0, 3, -3, 0] },
    reminder: { y: [0, -5, 0], opacity: [1, 0.95, 1] },
    help: { y: [0, -6, 0], rotate: [0, 2, -2, 0] }
  };

  const animation = characterAnimations[variant] || characterAnimations.default;

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
              e.stopPropagation();
            }}
          >
            {/* Modern WhatsApp-style Speech Bubble */}
            <motion.div
              className="absolute -top-10 sm:-top-12 right-0 z-50 pointer-events-auto"
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ 
                opacity: 1, 
                y: [0, -3, 0],
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
              <div className={`relative bg-white rounded-2xl rounded-tr-none shadow-lg ${currentSize.bubble} max-w-[200px] sm:max-w-[250px]`}>
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
                
                <div className="px-3 py-2 sm:px-4 sm:py-2.5">
                  <motion.p
                    className={`${currentSize.bubble} font-semibold text-slate-800 text-left leading-tight cursor-pointer select-none pointer-events-auto`}
                    onClick={handleClick}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {speechText}
                  </motion.p>
                </div>
                
                {/* Modern tail pointing to character */}
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
              </div>
            </motion.div>

            {/* Premium Modern Character - Smart Clean Assistant */}
            <motion.div
              className="relative cursor-grab active:cursor-grabbing pointer-events-auto z-10"
              onTap={(e, info) => {
                if (Math.abs(info.delta.x) < 5 && Math.abs(info.delta.y) < 5) {
                  handleClick();
                }
              }}
              animate={animation}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              whileHover={{ 
                scale: 1.1, 
                y: -8,
                transition: { duration: 0.2 }
              }}
            >
              {/* Subtle glow - represents cleanliness and quality */}
              <motion.div
                className="absolute inset-0 rounded-full bg-gradient-to-br from-teal-400/15 via-blue-400/15 to-teal-400/15 blur-2xl -z-10"
                animate={{
                  scale: [1, 1.1, 1],
                  opacity: [0.2, 0.35, 0.2],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />

              <svg
                width={currentSize.character}
                height={currentSize.character}
                viewBox="0 0 200 200"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="drop-shadow-lg"
              >
                {/* Modern Premium Character - Semi-flat, Soft 3D Style */}
                
                {/* Head - Modern, rounded, natural proportions */}
                <motion.ellipse
                  cx="100"
                  cy="75"
                  rx="34"
                  ry="36"
                  fill="url(#modern-skin)"
                  animate={{
                    scale: [1, 1.008, 1],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
                
                {/* Tech-inspired headband - Modern, minimal */}
                <motion.path
                  d="M 72 52 Q 100 46 128 52 L 128 68 L 72 68 Z"
                  fill="url(#modern-headband)"
                  animate={{
                    y: [0, -1, 0],
                  }}
                  transition={{
                    duration: 2.5,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
                
                {/* Tech accent indicators - Subtle, modern */}
                <circle cx="90" cy="58" r="2" fill="#1abc9c" opacity="0.7" />
                <circle cx="110" cy="58" r="2" fill="#3498db" opacity="0.7" />
                
                {/* Modern eyes - Professional, friendly, not exaggerated */}
                <motion.g
                  animate={{
                    scaleY: [1, 0.08, 1],
                  }}
                  transition={{
                    duration: 0.15,
                    repeat: Infinity,
                    repeatDelay: 4.5,
                    ease: "easeInOut"
                  }}
                >
                  <ellipse cx="86" cy="70" rx="4.5" ry="5.5" fill="#2c3e50" />
                  <ellipse cx="86" cy="70" rx="1.8" ry="2" fill="#ffffff" />
                </motion.g>
                <ellipse cx="114" cy="70" rx="4.5" ry="5.5" fill="#2c3e50" />
                <ellipse cx="114" cy="70" rx="1.8" ry="2" fill="#ffffff" />
                
                {/* Subtle smile - Professional, warm */}
                <motion.path
                  d="M 84 86 Q 100 91 116 86"
                  stroke="#2c3e50"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  fill="none"
                  animate={{
                    d: [
                      "M 84 86 Q 100 91 116 86",
                      "M 84 87 Q 100 92 116 87",
                      "M 84 86 Q 100 91 116 86",
                    ],
                  }}
                  transition={{
                    duration: 3.5,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
                
                {/* Body - Modern uniform, clean lines, soft 3D effect */}
                <motion.ellipse
                  cx="100"
                  cy="132"
                  rx="46"
                  ry="40"
                  fill="url(#modern-uniform)"
                  animate={{
                    y: [0, -1.5, 0],
                  }}
                  transition={{
                    duration: 2.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.1
                  }}
                />
                
                {/* Subtle body highlight for soft 3D effect */}
                <ellipse
                  cx="100"
                  cy="125"
                  rx="35"
                  ry="25"
                  fill="url(#body-highlight)"
                  opacity="0.3"
                />
                
                {/* Left arm - Modern, clean, professional */}
                <motion.g
                  animate={{
                    x: [0, -4, 0],
                    rotate: [-6, 2, -6],
                  }}
                  transition={{
                    duration: 2.2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <ellipse cx="50" cy="128" rx="9" ry="22" fill="url(#modern-skin)" />
                  <rect x="38" y="120" width="14" height="16" rx="2.5" fill="url(#modern-tool)" />
                  <circle cx="45" cy="133" r="4.5" fill="url(#modern-tool)" />
                </motion.g>
                
                {/* Right arm - Modern, clean, professional */}
                <motion.g
                  animate={{
                    x: [0, 4, 0],
                    rotate: [6, -2, 6],
                  }}
                  transition={{
                    duration: 2.2,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.3
                  }}
                >
                  <ellipse cx="150" cy="128" rx="9" ry="22" fill="url(#modern-skin)" />
                  <rect x="148" y="120" width="14" height="16" rx="2.5" fill="url(#modern-tool)" />
                  <circle cx="155" cy="133" r="4.5" fill="url(#modern-tool)" />
                </motion.g>
                
                {/* Subtle sparkles - Clean, minimal, represents quality */}
                {[1, 2, 3].map((i) => {
                  const angle = (i * 120) * Math.PI / 180;
                  const radius = 62;
                  const x = 100 + Math.cos(angle) * radius;
                  const y = 100 + Math.sin(angle) * radius;
                  
                  return (
                    <motion.circle
                      key={i}
                      cx={x}
                      cy={y}
                      r="1.8"
                      fill="#ffd93d"
                      opacity={0.5}
                      animate={{
                        scale: [0.4, 1.1, 0.4],
                        opacity: [0.2, 0.7, 0.2],
                      }}
                      transition={{
                        duration: 2.5 + i * 0.3,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: i * 0.25
                      }}
                    />
                  );
                })}

                {/* Premium Gradient Definitions - Brand Colors */}
                <defs>
                  {/* Soft Sand / Sun Yellow for skin */}
                  <linearGradient id="modern-skin" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#fff8f0" />
                    <stop offset="50%" stopColor="#ffeacc" />
                    <stop offset="100%" stopColor="#ffdb99" />
                  </linearGradient>
                  
                  {/* Teal / Tropical Green for headband */}
                  <linearGradient id="modern-headband" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#1abc9c" />
                    <stop offset="50%" stopColor="#16a085" />
                    <stop offset="100%" stopColor="#1abc9c" />
                  </linearGradient>
                  
                  {/* Ocean Blue for uniform */}
                  <linearGradient id="modern-uniform" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#3498db" />
                    <stop offset="50%" stopColor="#2980b9" />
                    <stop offset="100%" stopColor="#3498db" />
                  </linearGradient>
                  
                  {/* Body highlight for soft 3D effect */}
                  <linearGradient id="body-highlight" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                  </linearGradient>
                  
                  {/* Teal for cleaning tools */}
                  <linearGradient id="modern-tool" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#1abc9c" />
                    <stop offset="100%" stopColor="#16a085" />
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
