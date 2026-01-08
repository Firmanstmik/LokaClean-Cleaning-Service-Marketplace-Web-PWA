/**
 * Innovative promo badge component with cleaning theme animations.
 * Features liquid wave effects, floating particles, and interactive animations.
 * LokaClean Identity: Professional, Mobile-First, Premium.
 */

import { motion } from "framer-motion";
import { Sparkles, TrendingDown, Zap, Star } from "lucide-react";

import { t } from "../lib/i18n";

interface PromoBadgeProps {
  label?: string;
  variant?: "discount" | "cashback" | "new" | "popular" | "save";
}

export function PromoBadge({ label, variant = "discount" }: PromoBadgeProps) {
  const variants = {
    discount: {
      gradient: "from-rose-500/90 via-red-500/90 to-orange-500/90",
      shadow: "shadow-rose-500/30",
      border: "border-rose-200/50",
      glow: "rgba(244, 63, 94, 0.3)",
      icon: TrendingDown,
      particles: "from-rose-200 to-white",
      defaultLabel: t("packages.popular")
    },
    cashback: {
      gradient: "from-emerald-500/90 via-teal-500/90 to-cyan-500/90",
      shadow: "shadow-emerald-500/30",
      border: "border-emerald-200/50",
      glow: "rgba(16, 185, 129, 0.3)",
      icon: Zap,
      particles: "from-emerald-200 to-white",
      defaultLabel: t("packages.save")
    },
    new: {
      gradient: "from-blue-500/90 via-indigo-500/90 to-violet-500/90",
      shadow: "shadow-blue-500/30",
      border: "border-blue-200/50",
      glow: "rgba(59, 130, 246, 0.3)",
      icon: Sparkles,
      particles: "from-blue-200 to-white",
      defaultLabel: "NEW"
    },
    popular: {
      gradient: "from-violet-500/90 via-purple-500/90 to-fuchsia-500/90",
      shadow: "shadow-violet-500/30",
      border: "border-violet-200/50",
      glow: "rgba(139, 92, 246, 0.3)",
      icon: Star,
      particles: "from-violet-200 to-white",
      defaultLabel: t("packages.popular")
    },
    save: {
      gradient: "from-amber-500/90 via-orange-500/90 to-red-500/90",
      shadow: "shadow-amber-500/30",
      border: "border-amber-200/50",
      glow: "rgba(245, 158, 11, 0.3)",
      icon: TrendingDown,
      particles: "from-amber-200 to-white",
      defaultLabel: t("packages.save")
    }
  };

  const variantStyle = variants[variant];
  const Icon = variantStyle.icon;
  const displayLabel = label || variantStyle.defaultLabel;

  return (
    <motion.div
      initial={{ scale: 0, y: -10, opacity: 0 }}
      animate={{ scale: 1, y: 0, opacity: 1 }}
      transition={{ 
        delay: 0.3, 
        type: "spring", 
        stiffness: 400, 
        damping: 15 
      }}
      whileHover={{ 
        scale: 1.05,
        y: -2,
        transition: { duration: 0.2 }
      }}
      className="absolute top-3 right-3 z-30 pointer-events-none"
    >
      {/* LokaClean Signature Badge - Glassmorphism Pill with Premium Effects */}
      <div className={`relative flex items-center gap-1.5 pl-2 pr-3 py-1.5 rounded-full bg-gradient-to-br ${variantStyle.gradient} backdrop-blur-md border ${variantStyle.border} ${variantStyle.shadow} shadow-lg group overflow-hidden`}>
        
        {/* Animated Background Texture */}
        <motion.div
          className="absolute inset-0 z-0 opacity-30"
          style={{
            background: `linear-gradient(135deg, rgba(255,255,255,0.2) 0%, transparent 50%, rgba(255,255,255,0.1) 100%)`,
            backgroundSize: "200% 200%"
          }}
          animate={{
            backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Floating Particles inside badge */}
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={`particle-${i}`}
            className={`absolute rounded-full bg-gradient-to-br ${variantStyle.particles} blur-sm z-0`}
            style={{
              width: `${4 + i * 2}px`,
              height: `${4 + i * 2}px`,
              left: `${20 + i * 25}%`,
              top: `${30 + (i % 2) * 20}%`,
            }}
            animate={{
              y: [0, -8, 0],
              x: [0, Math.random() * 4 - 2, 0],
              opacity: [0.4, 0.8, 0.4],
              scale: [1, 1.3, 1],
            }}
            transition={{
              duration: 2 + i * 0.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.3,
            }}
          />
        ))}

        {/* Sweeping Shimmer Effect - Like cleaning motion */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent z-10"
          style={{
            width: "60%",
            transform: "skewX(-15deg)",
          }}
          animate={{
            x: ["-150%", "250%"],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatDelay: 1.5,
            ease: "easeInOut"
          }}
        />

        {/* Content Container */}
        <div className="relative z-20 flex items-center gap-1.5">
          {/* Animated Icon Container */}
          <div className="relative flex items-center justify-center w-4 h-4">
             {(variant === "new" || variant === "popular") ? (
                // POPULER - Star with spinning sparkles
                <>
                  <motion.div
                    animate={{
                      rotate: [0, 360],
                      scale: [1, 1.15, 1],
                    }}
                    transition={{
                      rotate: { duration: 3, repeat: Infinity, ease: "linear" },
                      scale: { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
                    }}
                  >
                    <Star className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-white drop-shadow-lg fill-white" />
                  </motion.div>
                  {/* Sparkles */}
                  {[...Array(3)].map((_, i) => {
                    const angle = (i * 120) * Math.PI / 180;
                    return (
                      <motion.div
                        key={`sparkle-${i}`}
                        className="absolute"
                        animate={{
                          opacity: [0, 1, 0],
                          scale: [0, 1, 0],
                          x: [0, Math.cos(angle) * 8],
                          y: [0, Math.sin(angle) * 8],
                        }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          delay: i * 0.5,
                          ease: "easeOut"
                        }}
                      >
                        <Sparkles className="h-1.5 w-1.5 text-white" />
                      </motion.div>
                    );
                  })}
                </>
              ) : (variant === "discount" || variant === "save") ? (
                // HEMAT - Bouncing Arrow with particles
                <>
                  <motion.div
                    animate={{
                      y: [0, -2, 0],
                    }}
                    transition={{
                      duration: 1.2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  >
                    <TrendingDown className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-white drop-shadow-lg" />
                  </motion.div>
                </>
              ) : (
                // Default / Cashback - Pulse
                <motion.div
                  animate={{
                    scale: [1, 1.2, 1],
                  }}
                  transition={{
                    duration: 1.2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <Icon className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-white drop-shadow-lg" />
                </motion.div>
              )}
          </div>

          {/* Text with subtle glow */}
          <motion.span 
            className="text-[10px] sm:text-[11px] font-bold text-white tracking-wide uppercase text-shadow-sm"
            animate={{
              textShadow: [
                "0 0 4px rgba(255,255,255,0.3)",
                "0 0 8px rgba(255,255,255,0.6)",
                "0 0 4px rgba(255,255,255,0.3)"
              ]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            {displayLabel}
          </motion.span>
        </div>
      </div>
    </motion.div>
  );
}
