/**
 * Animated Mascot Component - Professional Vector Animation
 * A friendly cleaning character that appears across all user pages as brand identity
 */

import { motion } from "framer-motion";

interface AnimatedMascotProps {
  size?: number;
  className?: string;
  variant?: "default" | "small" | "large";
}

export function AnimatedMascot({ size = 120, className = "", variant = "default" }: AnimatedMascotProps) {
  const sizes = {
    small: 80,
    default: 120,
    large: 160
  };
  
  const finalSize = variant !== "default" ? sizes[variant] : size;

  return (
    <motion.div
      className={`relative ${className}`}
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{
        type: "spring",
        damping: 20,
        stiffness: 200,
        duration: 0.8
      }}
      whileHover={{ scale: 1.05, y: -5 }}
    >
      <svg
        width={finalSize}
        height={finalSize}
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-2xl"
      >
        {/* Background glow effect */}
        <motion.g
          animate={{
            opacity: [0.2, 0.4, 0.2],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <circle
            cx="100"
            cy="100"
            r="90"
            fill="url(#gradient-glow)"
            opacity={0.2}
          />
        </motion.g>

        {/* Character Body - Rounded friendly shape */}
        <motion.g
          animate={{
            y: [0, -3, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <ellipse
            cx="100"
            cy="140"
            rx="55"
            ry="45"
            fill="url(#body-gradient)"
            stroke="url(#stroke-gradient)"
            strokeWidth="3"
          />
        </motion.g>

        {/* Head */}
        <motion.g
          animate={{
            y: [0, -2, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.1
          }}
        >
          <circle
            cx="100"
            cy="80"
            r="45"
            fill="url(#head-gradient)"
            stroke="url(#stroke-gradient)"
            strokeWidth="3"
          />
        </motion.g>

        {/* Left Eye */}
        <motion.g
          animate={{
            scale: [1, 1.2, 1],
            opacity: [1, 0.8, 1],
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <circle cx="85" cy="75" r="8" fill="#1a1a1a" />
        </motion.g>
        <circle cx="85" cy="75" r="4" fill="#ffffff" />

        {/* Right Eye */}
        <motion.g
          animate={{
            scale: [1, 1.2, 1],
            opacity: [1, 0.8, 1],
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.1
          }}
        >
          <circle cx="115" cy="75" r="8" fill="#1a1a1a" />
        </motion.g>
        <circle cx="115" cy="75" r="4" fill="#ffffff" />

        {/* Smile */}
        <motion.g
          animate={{
            y: [0, 2, 0],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <path
            d="M 80 95 Q 100 105 120 95"
            stroke="#1a1a1a"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
          />
        </motion.g>

        {/* Cleaning Sponge/Tool - Left Hand */}
        <motion.g
          animate={{
            x: [0, -5, 0],
            rotate: [-5, 5, -5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <rect x="35" y="110" width="20" height="25" rx="4" fill="url(#sponge-gradient)" />
          <circle cx="45" cy="135" r="8" fill="url(#sponge-gradient)" />
          <rect x="40" y="115" width="10" height="8" rx="2" fill="#ffffff" opacity="0.6" />
        </motion.g>

        {/* Cleaning Sponge/Tool - Right Hand */}
        <motion.g
          animate={{
            x: [0, 5, 0],
            rotate: [5, -5, 5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.3
          }}
        >
          <rect x="145" y="110" width="20" height="25" rx="4" fill="url(#sponge-gradient)" />
          <circle cx="155" cy="135" r="8" fill="url(#sponge-gradient)" />
          <rect x="150" y="115" width="10" height="8" rx="2" fill="#ffffff" opacity="0.6" />
        </motion.g>

        {/* Tropical Hat/Headband */}
        <motion.g
          animate={{
            y: [0, -2, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <path
            d="M 60 60 Q 100 50 140 60 L 140 75 L 60 75 Z"
            fill="url(#hat-gradient)"
          />
          <circle cx="90" cy="62" r="4" fill="#ff6b6b" />
          <circle cx="110" cy="62" r="4" fill="#4ecdc4" />
        </motion.g>

        {/* Sparkles/Stars around character */}
        {Array.from({ length: 6 }).map((_, i) => {
          const angle = (i * 60) * Math.PI / 180;
          const radius = 75;
          const x = 100 + Math.cos(angle) * radius;
          const y = 100 + Math.sin(angle) * radius;
          
          // Defensive check
          const safeX = (x === undefined || isNaN(x)) ? 100 : x;
          const safeY = (y === undefined || isNaN(y)) ? 100 : y;

          return (
            <motion.g 
              key={i}
              animate={{
                scale: [0.8, 1.2, 0.8],
                opacity: [0.4, 0.9, 0.4],
                rotate: [0, 180, 360],
              }}
              transition={{
                duration: 2 + i * 0.3,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.2
              }}
            >
              <path
                d={`M ${safeX} ${safeY} L ${safeX + 4} ${safeY - 8} L ${safeX + 8} ${safeY} L ${safeX + 4} ${safeY + 8} Z`}
                fill="#ffd93d"
                opacity={0.7}
              />
            </motion.g>
          );
        })}

        {/* Gradient Definitions */}
        <defs>
          <linearGradient id="gradient-glow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1abc9c" />
            <stop offset="50%" stopColor="#3498db" />
            <stop offset="100%" stopColor="#1abc9c" />
          </linearGradient>

          <linearGradient id="body-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fff5e6" />
            <stop offset="100%" stopColor="#ffe0b3" />
          </linearGradient>

          <linearGradient id="head-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffeacc" />
            <stop offset="100%" stopColor="#ffdb99" />
          </linearGradient>

          <linearGradient id="sponge-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1abc9c" />
            <stop offset="100%" stopColor="#16a085" />
          </linearGradient>

          <linearGradient id="hat-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3498db" />
            <stop offset="100%" stopColor="#2980b9" />
          </linearGradient>

          <linearGradient id="stroke-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#34495e" />
            <stop offset="100%" stopColor="#2c3e50" />
          </linearGradient>
        </defs>
      </svg>
    </motion.div>
  );
}

