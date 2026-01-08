/**
 * Reusable Premium Page Header Card Component
 * Consistent design across all pages with organic shapes and animations
 */

import { motion } from "framer-motion";
import { LucideIcon, Sparkles } from "lucide-react";

interface PageHeaderCardProps {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  gradientFrom: string;
  gradientVia: string;
  gradientTo: string;
  iconGradientFrom: string;
  iconGradientVia: string;
  iconGradientTo: string;
  glowColor: string;
}

export function PageHeaderCard({
  icon: Icon,
  title,
  subtitle,
  gradientFrom,
  gradientVia,
  gradientTo,
  iconGradientFrom,
  iconGradientVia,
  iconGradientTo,
  glowColor,
}: PageHeaderCardProps) {
  return (
    <div className="sticky top-[64px] sm:top-[80px] lg:top-[64px] z-30">
      <div className="max-w-7xl mx-auto px-2 sm:px-5 lg:px-6 pt-3 sm:pt-5 lg:pt-6">
        {/* Professional Card with Premium Shadow & Border */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-opacity-30"
          style={{
            background: `linear-gradient(to bottom right, ${gradientFrom}, ${gradientVia}, ${gradientTo})`,
            boxShadow: `0 10px 40px ${glowColor}40, 0 4px 16px ${glowColor}30`,
          }}
        >
          {/* Animated gradient overlay */}
          <motion.div
            className="absolute inset-0 rounded-2xl sm:rounded-3xl pointer-events-none"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0.15) 100%)',
              backgroundSize: '200% 200%',
            }}
            animate={{
              backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "linear",
            }}
          />
          
          {/* Content Container */}
          <div className="relative z-10 px-3 sm:px-6 lg:px-8 py-3 sm:py-5 lg:py-6">
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="flex items-center gap-2 sm:gap-4 lg:gap-5 flex-1 min-w-0">
                {/* Premium Icon with Organic Shape - Mobile Optimized */}
                <motion.div
                  initial={{ scale: 0.8, opacity: 0, rotate: -180 }}
                  animate={{ scale: 1, opacity: 1, rotate: 0 }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 200, 
                    damping: 20,
                    delay: 0.1 
                  }}
                  whileHover={{ 
                    scale: 1.1,
                    rotate: [0, -5, 5, -5, 0],
                    transition: { duration: 0.5 }
                  }}
                  className="relative flex-shrink-0"
                >
                  {/* Outer glow rings */}
                  <motion.div
                    className="absolute inset-0 opacity-0"
                    animate={{
                      opacity: [0, 0.4, 0.6, 0.4, 0],
                      scale: [1, 1.2, 1.4, 1.2, 1],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    style={{ 
                      background: `linear-gradient(to bottom right, ${iconGradientFrom}, ${iconGradientVia}, ${iconGradientTo})`,
                      filter: "blur(12px)",
                      borderRadius: "30% 70% 70% 30% / 30% 30% 70% 70%"
                    }}
                  />
                  <motion.div
                    className="absolute -inset-1 opacity-0"
                    animate={{
                      opacity: [0, 0.3, 0.5, 0.3, 0],
                      scale: [1, 1.15, 1.3, 1.15, 1],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: 0.5,
                    }}
                    style={{ 
                      background: `linear-gradient(to bottom right, ${iconGradientVia}, ${iconGradientFrom}, ${iconGradientTo})`,
                      filter: "blur(10px)",
                      borderRadius: "60% 40% 30% 70% / 60% 30% 70% 40%"
                    }}
                  />
                  
                  {/* Main icon container with organic blob shape */}
                  <motion.div
                    className="relative flex h-10 w-10 sm:h-14 sm:w-14 lg:h-16 lg:w-16 items-center justify-center shadow-[0_6px_24px_rgba(0,0,0,0.4),0_3px_12px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.4)] flex-shrink-0"
                    style={{
                      background: `linear-gradient(to bottom right, ${iconGradientFrom}, ${iconGradientVia}, ${iconGradientTo})`,
                    }}
                    animate={{
                      borderRadius: [
                        "30% 70% 70% 30% / 30% 30% 70% 70%",
                        "60% 40% 30% 70% / 60% 30% 70% 40%",
                        "30% 70% 70% 30% / 30% 30% 70% 70%"
                      ],
                    }}
                    transition={{
                      duration: 8,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  >
                    {/* Inner shine effect - organic */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-transparent"
                      animate={{
                        opacity: [0.3, 0.6, 0.3],
                        borderRadius: [
                          "60% 40% 30% 70% / 60% 30% 70% 40%",
                          "30% 70% 70% 30% / 30% 30% 70% 70%",
                          "60% 40% 30% 70% / 60% 30% 70% 40%"
                        ],
                      }}
                      transition={{
                        opacity: { duration: 2, repeat: Infinity },
                        borderRadius: { duration: 8, repeat: Infinity, ease: "easeInOut" },
                      }}
                    />
                  
                    {/* Icon with subtle animation */}
                    <motion.div
                      animate={{
                        y: [0, -2, 0],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    >
                      <Icon className="h-4 w-4 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.3)]" />
                    </motion.div>
                    
                    {/* Floating sparkles - Mobile optimized */}
                    {[...Array(2)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="absolute rounded-full bg-white/80"
                        style={{
                          width: "3px",
                          height: "3px",
                          top: `${25 + i * 50}%`,
                          left: `${20 + (i % 2) * 60}%`,
                        }}
                        animate={{
                          opacity: [0, 1, 0],
                          scale: [0, 1.5, 0],
                          y: [0, -12, -24],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeOut",
                          delay: i * 0.4,
                        }}
                      />
                    ))}
                  </motion.div>
                </motion.div>
              
              {/* Premium Typography Section - Mobile Optimized */}
              <div className="min-w-0 flex-1 overflow-hidden">
                <motion.h1
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  className="text-lg sm:text-2xl lg:text-3xl xl:text-4xl font-bold text-white leading-tight sm:leading-[1.2] tracking-tight sm:tracking-[-0.02em] font-display line-clamp-2 sm:line-clamp-none"
                  style={{
                    textShadow: "0 2px 4px rgba(0,0,0,0.2)",
                  }}
                >
                  {title}
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                  className="text-xs sm:text-base lg:text-lg text-white/90 mt-1 sm:mt-2 font-medium flex items-start sm:items-center gap-1 sm:gap-2 leading-snug sm:leading-relaxed"
                >
                  <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 text-yellow-300 flex-shrink-0 mt-0.5 sm:mt-0" />
                  <span className="line-clamp-2 sm:line-clamp-none break-words">{subtitle}</span>
                </motion.p>
              </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

