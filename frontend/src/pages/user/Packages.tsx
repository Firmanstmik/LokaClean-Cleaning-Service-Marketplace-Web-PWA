/**
 * USER package browsing page - Premium Mobile App Design
 * Inspired by Gojek, Brimo, and modern mobile apps
 */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Package, ArrowRight, CheckCircle2, Plus, Star, Sparkles, Clock, Shield, Zap, Eye, X, Info, Square, Droplets, Bed, Box, Home, Wand2, ChevronLeft, ChevronRight, Banknote, Flame, Crown, Gem, Tag, Trophy, UserCheck, CalendarCheck, Truck, Quote, ShoppingCart, ShieldCheck, Check, MapPin, Handshake, Leaf } from "lucide-react";

import { api } from "../../lib/api";
import { getApiErrorMessage } from "../../lib/apiError";
import { PromoBadge } from "../../components/PromoBadge";
import { PackageRatingDisplay } from "../../components/PackageRatingDisplay";
import { PageHeaderCard } from "../../components/PageHeaderCard";
import { getPackageGradient } from "../../utils/packageIcon";
import { getPackageImage, getPackageImageAlt } from "../../utils/packageImage";
import { t, getLanguage } from "../../lib/i18n";
import { CircularLoader } from "../../components/ui/CircularLoader";
import type { PaketCleaning } from "../../types/api";

export function PackagesPage() {
  const navigate = useNavigate();

  const [language, setLanguage] = useState(getLanguage());
  useEffect(() => {
    const handleLanguageChange = () => setLanguage(getLanguage());
    window.addEventListener("languagechange", handleLanguageChange);
    return () => window.removeEventListener("languagechange", handleLanguageChange);
  }, []);
  const isEnglish = language === "en";

  const [items, setItems] = useState<PaketCleaning[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<PaketCleaning | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoScrolling, setIsAutoScrolling] = useState(true);

  // Mobile Carousel State
  const [mobileCurrentIndex, setMobileCurrentIndex] = useState(0);
  const [isMobileAutoScrolling, setIsMobileAutoScrolling] = useState(true);

  const bannerTiltX = useMotionValue(0);
  const bannerTiltY = useMotionValue(0);
  const bannerTiltXSpring = useSpring(bannerTiltX, { stiffness: 150, damping: 20 });
  const bannerTiltYSpring = useSpring(bannerTiltY, { stiffness: 150, damping: 20 });
  const bannerRotateX = useTransform(bannerTiltYSpring, [-40, 40], [8, -8]);
  const bannerRotateY = useTransform(bannerTiltXSpring, [-40, 40], [-8, 8]);
  const bannerScale = useSpring(1, { stiffness: 200, damping: 18 });

  const steps = [
    {
      title: isEnglish ? "Select Package" : "Pilih Paket",
      desc: isEnglish ? "Choose the service that fits your needs." : "Pilih layanan kebersihan sesuai kebutuhan Anda.",
      icon: Package
    },
    {
      title: isEnglish ? "Set Schedule" : "Atur Jadwal",
      desc: isEnglish ? "Pick a date and time that works for you." : "Tentukan waktu dan lokasi pembersihan.",
      icon: CalendarCheck
    },
    {
      title: isEnglish ? "Secure Payment" : "Bayar Aman",
      desc: isEnglish ? "Secure payment with various methods." : "Lakukan pembayaran dengan metode aman.",
      icon: Banknote
    },
    {
      title: isEnglish ? "Relax" : "Terima Beres",
      desc: isEnglish ? "Our team will handle the rest." : "Petugas kami datang, rumah Anda bersih!",
      icon: Sparkles
    }
  ];

  useEffect(() => {
    if (!isMobileAutoScrolling || items.length <= 1) return;
    const interval = setInterval(() => {
      setMobileCurrentIndex((prev) => (prev + 1) % items.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [isMobileAutoScrolling, items.length]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const resp = await api.get("/packages");
        const next = resp.data.data.items as PaketCleaning[];
        if (alive) {
          setItems(next);
          // Auto-focus on "3 Kamar" or "Premium" package for better initial impression
          const premiumIndex = next.findIndex(item => 
            item.name.toLowerCase().includes("3 kamar") || 
            item.name.toLowerCase().includes("premium")
          );
          if (premiumIndex !== -1) {
            setCurrentIndex(premiumIndex);
          }
        }
      } catch (err) {
        if (alive) setError(getApiErrorMessage(err));
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const filteredItems = items;

  // Ensure enough items for smooth infinite rolling (at least 9 items)
  // This allows for a proper buffer on both sides for the carousel logic
  let carouselItems = [...filteredItems];
  if (carouselItems.length > 0) {
    // Keep duplicating until we have enough items for a smooth loop
    // We need enough items so that "dist" calculation doesn't jump visibly
    // For a range of +/- 3 visible items, we need at least 7 items.
    // We use 9 to be safe and smooth.
    while (carouselItems.length < 9) {
      carouselItems = [...carouselItems, ...filteredItems];
    }
  }

  // Carousel logic - Circular
  const itemCount = carouselItems.length;
  // Use modulo for infinite cycling logic on index
  const safeIndex = itemCount > 0 ? currentIndex % itemCount : 0;
  
  // Auto-scroll effect
  useEffect(() => {
    if (!isAutoScrolling || itemCount <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => prev + 1);
    }, 3000); // Auto-scroll every 3 seconds

    return () => clearInterval(interval);
  }, [isAutoScrolling, itemCount]);

  const goToNext = () => {
    setIsAutoScrolling(false);
    setCurrentIndex((prev) => prev + 1);
  };

  const goToPrev = () => {
    setIsAutoScrolling(false);
    setCurrentIndex((prev) => prev - 1);
  };

  const goToIndex = (index: number) => {
    setIsAutoScrolling(false);
    // Find closest visual index to keep transition smooth
    // For now, simple set is fine as we rely on modulo
    setCurrentIndex(index);
  };

  // Extract features from package description
  const extractFeatures = (description: string) => {
    const features: Array<{ text: string; icon: typeof Square; color: string; bgColor: string }> = [];
    const desc = description.toLowerCase();
    
    // Feature mappings with icons and colors (ordered by priority - more specific first)
    const featureMap: Array<{
      keywords: string[];
      text: string;
      icon: typeof Square;
      color: string;
      bgColor: string;
    }> = [
      {
        keywords: ["kamar mandi", "bathroom", "wc", "toilet"],
        text: t("packages.feature.bathroom"),
        icon: Droplets,
        color: "text-cyan-700",
        bgColor: "bg-cyan-50 border-cyan-200/50"
      },
      {
        keywords: ["area tidur", "kamar tidur"],
        text: t("packages.feature.bedroom"),
        icon: Bed,
        color: "text-purple-700",
        bgColor: "bg-purple-50 border-purple-200/50"
      },
      {
        keywords: ["lantai", "floor"],
        text: t("packages.feature.floor"),
        icon: Square,
        color: "text-blue-700",
        bgColor: "bg-blue-50 border-blue-200/50"
      },
      {
        keywords: ["penataan", "organizing", "rapikan", "tata"],
        text: t("packages.feature.organizing"),
        icon: Box,
        color: "text-emerald-700",
        bgColor: "bg-emerald-50 border-emerald-200/50"
      },
      {
        keywords: ["dapur", "kitchen"],
        text: t("packages.feature.kitchen"),
        icon: Sparkles,
        color: "text-amber-700",
        bgColor: "bg-amber-50 border-amber-200/50"
      },
      {
        keywords: ["menyeluruh", "seluruh", "komprehensif"],
        text: t("packages.feature.deepClean"),
        icon: Home,
        color: "text-indigo-700",
        bgColor: "bg-indigo-50 border-indigo-200/50"
      },
      {
        keywords: ["detail", "mendalam", "deep"],
        text: t("packages.feature.detailClean"),
        icon: Wand2,
        color: "text-pink-700",
        bgColor: "bg-pink-50 border-pink-200/50"
      }
    ];

    // Check each feature (check longer phrases first)
    for (const feature of featureMap) {
      // Sort keywords by length (longest first) to match more specific phrases first
      const sortedKeywords = [...feature.keywords].sort((a, b) => b.length - a.length);
      
      for (const keyword of sortedKeywords) {
        if (desc.includes(keyword)) {
          // Check if already added
          if (!features.find(f => f.text === feature.text)) {
            features.push({
              text: feature.text,
              icon: feature.icon,
              color: feature.color,
              bgColor: feature.bgColor
            });
            break;
          }
        }
      }
    }

    // If no features found, add default ones
    if (features.length === 0) {
      features.push(
        { text: "Professional", icon: CheckCircle2, color: "text-blue-700", bgColor: "bg-blue-50 border-blue-200/50" },
        { text: "Fast", icon: Zap, color: "text-indigo-700", bgColor: "bg-indigo-50 border-indigo-200/50" }
      );
    }

    // Limit to 4 features max for better display
    return features.slice(0, 4);
  };

  return (
    <div className="w-full bg-gradient-to-br from-tropical-50 via-ocean-50/50 to-sand-50/70">
      <div className="hidden">
        <div className="max-w-7xl mx-auto px-2 sm:px-5 lg:px-6 pt-3 sm:pt-5 lg:pt-6">
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="flex-1 min-w-0">
              <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-opacity-30"
                style={{
                  background: 'linear-gradient(to bottom right, #1abc9c, #3498db, #1abc9c)',
                  boxShadow: '0 10px 40px rgba(26,188,156,0.4), 0 4px 16px rgba(26,188,156,0.3)',
                }}
              >
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
                <div className="relative z-10 px-3 sm:px-6 lg:px-8 py-3 sm:py-5 lg:py-6">
                  <div className="flex items-center gap-2 sm:gap-4 lg:gap-5 flex-1 min-w-0">
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0, rotate: -180 }}
                      animate={{ scale: 1, opacity: 1, rotate: 0 }}
                      transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.1 }}
                      className="relative flex-shrink-0"
                    >
                      <motion.div
                        className="absolute inset-0 opacity-0"
                        animate={{ opacity: [0, 0.4, 0.6, 0.4, 0], scale: [1, 1.2, 1.4, 1.2, 1] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                        style={{ 
                          background: 'linear-gradient(to bottom right, #1abc9c, #3498db, #1abc9c)',
                          filter: "blur(12px)",
                          borderRadius: "30% 70% 70% 30% / 30% 30% 70% 70%"
                        }}
                      />
                      <motion.div
                        className="absolute -inset-1 opacity-0"
                        animate={{ opacity: [0, 0.3, 0.5, 0.3, 0], scale: [1, 1.15, 1.3, 1.15, 1] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                        style={{ 
                          background: 'linear-gradient(to bottom right, #3498db, #1abc9c, #3498db)',
                          filter: "blur(10px)",
                          borderRadius: "60% 40% 30% 70% / 60% 30% 70% 40%"
                        }}
                      />
                      <motion.div
                        className="relative flex h-10 w-10 sm:h-14 sm:w-14 lg:h-16 lg:w-16 items-center justify-center shadow-[0_6px_24px_rgba(0,0,0,0.4),0_3px_12px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.4)] flex-shrink-0 hidden sm:flex"
                        style={{ background: 'linear-gradient(to bottom right, #1abc9c, #3498db, #1abc9c)' }}
                        animate={{
                          borderRadius: [
                            "30% 70% 70% 30% / 30% 30% 70% 70%",
                            "60% 40% 30% 70% / 60% 30% 70% 40%",
                            "30% 70% 70% 30% / 30% 30% 70% 70%"
                          ],
                        }}
                        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                      >
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
                        <motion.div
                          animate={{ y: [0, -2, 0] }}
                          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        >
                          <Package className="h-4 w-4 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.3)]" />
                        </motion.div>
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
                    <div className="min-w-0 flex-1 overflow-hidden">
                      <motion.h1
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2, duration: 0.5 }}
                        className="hidden sm:block text-lg sm:text-2xl lg:text-3xl xl:text-4xl font-bold text-white leading-tight sm:leading-[1.2] tracking-tight sm:tracking-[-0.02em] font-display line-clamp-2 sm:line-clamp-none"
                        style={{ textShadow: "0 2px 4px rgba(0,0,0,0.2)" }}
                      >
                        {t("packages.title")}
                      </motion.h1>
                      <motion.p
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3, duration: 0.5 }}
                        className="hidden sm:block text-xs sm:text-base lg:text-lg text-white/90 mt-1 sm:mt-2 font-medium flex items-start sm:items-center gap-1 sm:gap-2 leading-snug sm:leading-relaxed"
                      >
                        <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 text-yellow-300 flex-shrink-0 mt-0.5 sm:mt-0" />
                        <span className="line-clamp-2 sm:line-clamp-none break-words">{t("packages.subtitle")}</span>
                      </motion.p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Premium CTA Button with Organic Shape - Mobile Optimized */}
            <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ 
                      opacity: 1, 
                      scale: 1,
                      borderRadius: [
                        "50px 20px 50px 20px / 40px 15px 40px 15px",
                        "20px 50px 20px 50px / 15px 40px 15px 40px",
                        "50px 20px 50px 20px / 40px 15px 40px 15px"
                      ],
                    }}
                    transition={{ 
                      delay: 0.4, 
                      type: "spring", 
                      stiffness: 200,
                      borderRadius: {
                        duration: 6,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }
                    }}
                    whileTap={{ scale: 0.98 }}
                    className="hidden group relative flex items-center gap-1 sm:gap-2.5 lg:gap-3 bg-gradient-to-r from-tropical-500 via-ocean-500 to-tropical-600 px-2 sm:px-5 lg:px-6 xl:px-7 py-1.5 sm:py-2.5 lg:py-3 text-[10px] sm:text-sm lg:text-base font-black text-white shadow-[0_6px_20px_rgba(26,188,156,0.35),0_3px_10px_rgba(52,152,219,0.25)] hover:shadow-[0_10px_28px_rgba(26,188,156,0.45),0_5px_14px_rgba(52,152,219,0.35)] transition-all flex-shrink-0 overflow-hidden"
                    onClick={() => navigate("/orders/new")}
                  >
                    {/* Animated gradient overlay */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-tropical-400 via-ocean-500 to-tropical-600 opacity-0 group-hover:opacity-100"
                      transition={{ duration: 0.3 }}
                    />
                    
                    {/* Shimmer effect */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                      animate={{
                        x: ["-100%", "200%"],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        repeatDelay: 1,
                        ease: "linear",
                      }}
                    />
                    
                    {/* Button content */}
                    <motion.div
                      className="relative z-10 flex items-center gap-1 sm:gap-2"
                    >
                      <motion.div
                        animate={{ rotate: [0, 90, 0] }}
                        transition={{ duration: 0.5 }}
                      >
                        <Plus className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5" />
                      </motion.div>
                      <span className="hidden sm:inline whitespace-nowrap">{t("packages.newOrder")}</span>
                      <span className="sm:hidden whitespace-nowrap">{t("packages.newOrder")}</span>
                    </motion.div>
                    
                    {/* Pulsing glow effect - organic shape */}
                    <motion.div
                      className="absolute -inset-1 bg-gradient-to-r from-tropical-400 via-ocean-500 to-tropical-500 opacity-0 group-hover:opacity-50 blur-lg sm:blur-xl"
                      style={{
                        borderRadius: "60px 30px 60px 30px / 50px 25px 50px 25px"
                      }}
                      animate={{
                        opacity: [0, 0.2, 0],
                        scale: [1, 1.2, 1],
                        borderRadius: [
                          "60px 30px 60px 30px / 50px 25px 50px 25px",
                          "30px 60px 30px 60px / 25px 50px 25px 50px",
                          "60px 30px 60px 30px / 50px 25px 50px 25px"
                        ],
                      }}
                      transition={{
                        opacity: { duration: 2, repeat: Infinity },
                        scale: { duration: 2, repeat: Infinity },
                        borderRadius: { duration: 6, repeat: Infinity, ease: "easeInOut" },
                      }}
                    />
                  </motion.button>
                </div>
              </div>
            </div>

      <div className="hidden sticky top-[64px] sm:top-[80px] lg:top-[64px] z-20">
        <div className="max-w-7xl mx-auto px-2 sm:px-5 lg:px-6 pt-2 sm:pt-3 lg:pt-4">
          <div className="flex justify-end">
            <div className="flex flex-col items-end">
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  borderRadius: [
                    "50px 20px 50px 20px / 40px 15px 40px 15px",
                    "20px 50px 20px 50px / 15px 40px 15px 40px",
                    "50px 20px 50px 20px / 40px 15px 40px 15px",
                  ],
                }}
                transition={{
                  delay: 0.2,
                  type: "spring",
                  stiffness: 200,
                  borderRadius: {
                    duration: 6,
                    repeat: Infinity,
                    ease: "easeInOut",
                  },
                }}
                whileTap={{ scale: 0.98 }}
                className="group relative flex items-center gap-1 sm:gap-2.5 lg:gap-3 bg-gradient-to-r from-tropical-500 via-ocean-500 to-tropical-600 px-3 sm:px-5 lg:px-6 xl:px-7 py-1.5 sm:py-2.5 lg:py-3 text-[10px] sm:text-sm lg:text-base font-black text-white shadow-[0_6px_20px_rgba(26,188,156,0.35),0_3px_10px_rgba(52,152,219,0.25)] hover:shadow-[0_10px_28px_rgba(26,188,156,0.45),0_5px_14px_rgba(52,152,219,0.35)] transition-all flex-shrink-0 overflow-hidden"
                onClick={() => navigate("/orders/new")}
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r.from-tropical-400 via-ocean-500 to-tropical-600 opacity-0 group-hover:opacity-100"
                  transition={{ duration: 0.3 }}
                />
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                  animate={{
                    x: ["-100%", "200%"],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatDelay: 1,
                    ease: "linear",
                  }}
                />
                <motion.div className="relative z-10 flex items-center gap-1 sm:gap-2">
                  <motion.div
                    animate={{ rotate: [0, 90, 0] }}
                    transition={{ duration: 0.5 }}
                  >
                    <Plus className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5" />
                  </motion.div>
                  <span className="hidden sm:inline whitespace-nowrap">
                    {t("packages.newOrder")}
                  </span>
                  <span className="sm:hidden whitespace-nowrap">
                    {t("packages.newOrder")}
                  </span>
                </motion.div>
                <motion.div
                  className="absolute -inset-1 bg-gradient-to-r from-tropical-400 via-ocean-500 to-tropical-500 opacity-0 group-hover:opacity-50 blur-lg sm:blur-xl"
                  style={{
                    borderRadius:
                      "60px 30px 60px 30px / 50px 25px 50px 25px",
                  }}
                  animate={{
                    opacity: [0, 0.2, 0],
                    scale: [1, 1.2, 1],
                    borderRadius: [
                      "60px 30px 60px 30px / 50px 25px 50px 25px",
                      "30px 60px 30px 60px / 25px 50px 25px 50px",
                      "60px 30px 60px 30px / 50px 25px 50px 25px",
                    ],
                  }}
                  transition={{
                    opacity: { duration: 2, repeat: Infinity },
                    scale: { duration: 2, repeat: Infinity },
                    borderRadius: {
                      duration: 6,
                      repeat: Infinity,
                      ease: "easeInOut",
                    },
                  }}
                />
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-5 lg:px-6 pt-0 pb-5 sm:pb-6 lg:pb-7 sm:pt-0 lg:pt-0">
        {/* Hero / Branding Section - Premium & Modern */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mb-8 sm:mb-10 lg:mb-12"
        >
          <div className="relative overflow-hidden rounded-3xl sm:rounded-[2.5rem] bg-gradient-to-br from-white via-blue-50/40 to-purple-50/30 border border-blue-100/50 shadow-[0_8px_32px_rgba(0,0,0,0.08)] backdrop-blur-sm">
            {/* Subtle animated background gradient */}
            <motion.div
              className="absolute inset-0 opacity-20"
              animate={{
                background: [
                  "radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.15), transparent 50%)",
                  "radial-gradient(circle at 80% 50%, rgba(147, 51, 234, 0.15), transparent 50%)",
                  "radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.15), transparent 50%)",
                ],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            
            {/* Content Container */}
            <div className="relative z-10 px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
              {/* Logo & Nama Aplikasi - Pojok Kiri Atas */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.5 }}
                className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6"
              >
                {/* Logo Rumah dengan Wajah Senyum */}
                <motion.div
                  whileHover={{ scale: 1.05, rotate: [0, -5, 5, 0] }}
                  transition={{ duration: 0.3 }}
                  className="relative flex-shrink-0"
                >
                  <div className="flex h-10 w-10 sm:h-12 sm:w-12 lg:h-14 lg:w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 via-purple-500 to-blue-600 shadow-lg">
                    <Home className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-white" />
                  </div>
                  {/* Decorative smile indicator */}
                  <motion.div
                    className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full bg-yellow-400 border-2 border-white shadow-sm"
                    animate={{
                      scale: [1, 1.1, 1],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                </motion.div>
                
                {/* Text LokaClean */}
                <motion.h2
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent"
                >
                  LokaClean
                </motion.h2>
              </motion.div>

              {/* Mobile Hero Illustration - Shown First on Mobile */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.6 }}
                className="relative lg:hidden mb-6"
              >
                <div className="relative">
                  <motion.div
                    className="absolute -inset-2 bg-gradient-to-br from-blue-400/15 via-purple-400/15 to-blue-400/15 rounded-2xl blur-xl"
                    animate={{
                      opacity: [0.2, 0.4, 0.2],
                      scale: [1, 1.03, 1],
                    }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                  <div className="relative rounded-xl overflow-hidden bg-gradient-to-br from-blue-50/50 to-purple-50/50 p-4 shadow-md">
                    <img
                      src="/img/hero.png"
                      alt="LokaClean - Professional Cleaning Service"
                      className="w-full h-auto object-contain max-h-48 sm:max-h-56"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = "none";
                      }}
                    />
                  </div>
                </div>
              </motion.div>

              {/* Main Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-6 sm:gap-8 lg:gap-10 items-center">
                {/* Left: Text Content */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2, duration: 0.6 }}
                  className="space-y-4 sm:space-y-5 lg:space-y-6"
                >
                  {/* Headline */}
                  <motion.h1
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.6 }}
                    className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold leading-tight tracking-tight text-slate-900"
                  >
                    <span className="text-slate-900">LokaClean</span>
                    <span className="text-slate-600"> — </span>
                    <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
                      Layanan Kebersihan Profesional di Lokasi Anda
                    </span>
                  </motion.h1>
                  
                  {/* Subheadline */}
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.6 }}
                    className="text-sm sm:text-base lg:text-lg text-slate-600 leading-relaxed max-w-2xl"
                  >
                    Menggabungkan sentuhan lokal dengan standar kebersihan modern, LokaClean hadir langsung ke tempat Anda untuk kenyamanan maksimal.
                  </motion.p>
                  
                  {/* 3 Highlight Value Cards */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.6 }}
                    className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 pt-2"
                  >
                    {/* Card 1: Datang ke Lokasi Anda */}
                    <motion.div
                      whileHover={{ scale: 1.02, y: -2 }}
                      className="relative overflow-hidden rounded-2xl bg-white/80 backdrop-blur-sm border border-red-100/50 p-4 sm:p-5 shadow-sm hover:shadow-md transition-all duration-300"
                    >
                      <div className="flex flex-col items-start gap-3">
                        <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-red-600 shadow-md">
                          <MapPin className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-sm sm:text-base font-bold text-slate-900 mb-1">
                            Datang ke Lokasi Anda
                          </h3>
                          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                            Layanan fleksibel & dekat dengan pengguna
                          </p>
                        </div>
                      </div>
                    </motion.div>
                    
                    {/* Card 2: Standar Bersih Profesional */}
                    <motion.div
                      whileHover={{ scale: 1.02, y: -2 }}
                      className="relative overflow-hidden rounded-2xl bg-white/80 backdrop-blur-sm border border-green-100/50 p-4 sm:p-5 shadow-sm hover:shadow-md transition-all duration-300"
                    >
                      <div className="flex flex-col items-start gap-3">
                        <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-md">
                          <Leaf className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-sm sm:text-base font-bold text-slate-900 mb-1">
                            Standar Bersih Profesional
                          </h3>
                          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                            Proses terstandar & terpercaya
                          </p>
                        </div>
                      </div>
                    </motion.div>
                    
                    {/* Card 3: Dipercaya Lokal & Turis */}
                    <motion.div
                      whileHover={{ scale: 1.02, y: -2 }}
                      className="relative overflow-hidden rounded-2xl bg-white/80 backdrop-blur-sm border border-blue-100/50 p-4 sm:p-5 shadow-sm hover:shadow-md transition-all duration-300"
                    >
                      <div className="flex flex-col items-start gap-3">
                        <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-md">
                          <Handshake className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-sm sm:text-base font-bold text-slate-900 mb-1">
                            Dipercaya Lokal & Turis
                          </h3>
                          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                            Cocok untuk warga lokal maupun wisatawan
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  </motion.div>
                </motion.div>
                
                {/* Right: Hero Illustration - Desktop Only */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3, duration: 0.6 }}
                  className="relative hidden lg:block"
                >
                  <div className="relative">
                    {/* Decorative glow */}
                    <motion.div
                      className="absolute -inset-4 bg-gradient-to-br from-blue-400/20 via-purple-400/20 to-blue-400/20 rounded-3xl blur-2xl"
                      animate={{
                        opacity: [0.3, 0.5, 0.3],
                        scale: [1, 1.05, 1],
                      }}
                      transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    />
                    
                    {/* Hero Image Container */}
                    <motion.div
                      whileHover={{ scale: 1.02, y: -4 }}
                      transition={{ type: "spring", stiffness: 300 }}
                      className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-blue-50/50 to-purple-50/50 p-4 sm:p-6 shadow-lg"
                    >
                      <img
                        src="/img/hero.png"
                        alt="LokaClean - Professional Cleaning Service"
                        className="w-full h-auto object-contain max-h-64 sm:max-h-80 lg:max-h-96"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = "none";
                        }}
                      />
                    </motion.div>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-16 sm:py-20">
            <CircularLoader size="xl" />
            <p className="mt-4 text-xs sm:text-sm text-slate-600 font-medium">{t("packages.loading")}</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl border border-rose-200/60 bg-gradient-to-br from-rose-50/80 to-pink-50/80 backdrop-blur-sm p-5 text-sm text-rose-700 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-rose-100/60">
                <svg className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="font-medium">{error}</span>
            </div>
          </motion.div>
        )}

        {/* Mobile View - Conversion-First Hero Package Carousel (Visible only on Mobile) */}
        <div className="block sm:hidden mb-8 w-full">
           {/* Carousel Container */}
           <div className="relative w-full overflow-hidden pb-4">
              <motion.div 
                className="flex h-full"
                animate={{ x: `-${mobileCurrentIndex * 100}%` }}
               transition={{ type: "spring", stiffness: 300, damping: 30 }}
               drag="x"
               dragConstraints={{ left: 0, right: 0 }}
               dragElastic={0.2}
               onDragEnd={(_, { offset }) => {
                 const swipe = offset.x;
                 if (swipe < -50) {
                   setMobileCurrentIndex((prev) => (prev + 1) % items.length);
                   setIsMobileAutoScrolling(false);
                 } else if (swipe > 50) {
                   setMobileCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
                   setIsMobileAutoScrolling(false);
                 }
               }}
             >
                {items.map((pkg, index) => {
                  const displayName = isEnglish && pkg.name_en ? pkg.name_en : pkg.name;
                  const displayPrice = pkg.price;
                  
                  // Dynamic Badge Logic
                  const getBadgeConfig = () => {
                    // Priority 1: High Social Proof (Best Seller)
                    if ((pkg.totalReviews || 0) > 20 && (pkg.averageRating || 0) >= 4.5) {
                        return {
                            label: "BEST SELLER",
                            icon: <Flame className="w-3.5 h-3.5 fill-current" />,
                            className: "bg-gradient-to-r from-orange-500 to-red-600",
                            textColor: "text-white"
                        };
                    }
                    
                    // Priority 2: Specific Service Type (Deep Clean / Total)
                    const lowerName = pkg.name.toLowerCase();
                    if (lowerName.includes("deep") || lowerName.includes("total") || lowerName.includes("komplit") || lowerName.includes("besar")) {
                         return {
                            label: "DEEP CLEAN",
                            icon: <Sparkles className="w-3.5 h-3.5 fill-current" />,
                            className: "bg-gradient-to-r from-violet-600 to-indigo-600",
                            textColor: "text-white"
                        };
                    }

                    // Priority 3: Value/Economy (Hemat)
                    if (pkg.price < 150000) { 
                         return {
                            label: "HEMAT",
                            icon: <Tag className="w-3.5 h-3.5 fill-current" />,
                            className: "bg-gradient-to-r from-emerald-500 to-teal-600",
                            textColor: "text-white"
                        };
                    }
                    
                    // Priority 4: Premium/Luxury
                    if (pkg.price > 400000) {
                         return {
                            label: "PREMIUM",
                            icon: <Crown className="w-3.5 h-3.5 fill-current" />,
                            className: "bg-gradient-to-r from-slate-800 to-black",
                            textColor: "text-white"
                        };
                    }

                    // Priority 5: High Rating (Recommended)
                    if ((pkg.averageRating || 0) >= 4.7) {
                        return {
                            label: "RECOMMENDED",
                            icon: <Trophy className="w-3.5 h-3.5 fill-current" />,
                            className: "bg-gradient-to-r from-blue-500 to-cyan-600",
                            textColor: "text-white"
                        };
                    }

                    // Default: New or Standard
                    return {
                        label: "TERBARU",
                        icon: <Sparkles className="w-3.5 h-3.5 fill-current" />,
                        className: "bg-gradient-to-r from-pink-500 to-rose-600",
                        textColor: "text-white"
                    };
                  };

                  const badge = getBadgeConfig();

                  return (
                    <div
                      key={pkg.id}
                      className="min-w-full px-4 pt-2 pb-4"
                      onClick={() => setSelectedPackage(pkg)}
                    >
                      <div className="relative w-full rounded-[2.5rem] overflow-hidden shadow-[0_25px_50px_-12px_rgba(79,70,229,0.4)] bg-white">
                        
                        {/* 1. Background Image Area (Dominant - 70% visual weight) */}
                        <div className="relative h-[280px] w-full bg-slate-100">
                          <img 
                            src={getPackageImage(pkg.name, pkg.image)} 
                            alt={displayName}
                            className="w-full h-full object-contain object-center scale-100"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                            }}
                          />
                          
                          {/* Gradient Overlay for Text Readability */}
                          <div className="absolute inset-0 bg-gradient-to-t from-[#1e1b4b] via-[#312e81]/80 to-transparent pt-32" />
                          
                          {/* Floating Badge - Dynamic */}
                          <div className="absolute top-5 left-5 z-20">
                             <div className={`${badge.className} ${badge.textColor} text-[10px] font-black px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 transform -rotate-2 border border-white/20`}>
                                {badge.icon}
                                <span className="tracking-wide uppercase">{badge.label}</span>
                             </div>
                          </div>
                          
                          {/* Rating Badge */}
                          <div className="absolute top-5 right-5 z-20">
                            <div className="bg-white/95 backdrop-blur-md text-slate-900 text-[10px] font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 border border-slate-100">
                               <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                               <span>{pkg.averageRating ? Number(pkg.averageRating).toFixed(1) : "Baru"}</span>
                               {pkg.totalReviews ? (
                                 <span className="text-slate-500 font-medium border-l border-slate-300 pl-1.5">{pkg.totalReviews} Ulasan</span>
                               ) : null}
                            </div>
                          </div>

                          {/* Content Overlay */}
                          <div className="absolute bottom-0 left-0 right-0 p-6 z-20 flex flex-col items-start text-left">
                             {/* Title - Sales Copy */}
                             <h2 className="text-[28px] font-black text-white leading-[1.1] mb-3 font-display drop-shadow-lg w-[90%] line-clamp-2">
                               {displayName}
                             </h2>

                             {/* Benefits - Quick Scan */}
                             <div className="flex flex-col gap-2 mb-5 w-full">
                               <div className="flex items-center gap-2.5 text-white/95">
                                  <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                                    <Zap className="w-3.5 h-3.5 text-yellow-300" />
                                  </div>
                                  <span className="text-sm font-semibold">Pro Staff Berpengalaman</span>
                               </div>
                               <div className="flex items-center gap-2.5 text-white/95">
                                  <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                                    <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
                                  </div>
                                  <span className="text-sm font-semibold">Alat & Cairan Lengkap</span>
                               </div>
                             </div>
                          </div>
                        </div>

                        {/* 2. Action Area (White Background) */}
                        <div className="bg-white p-6 pt-2 pb-6 relative z-30 -mt-4 rounded-t-3xl">
                           <div className="flex items-end justify-between mb-5">
                              <div className="flex flex-col">
                                <span className="text-slate-500 text-[11px] font-bold uppercase tracking-wider mb-1">Penawaran Spesial</span>
                                <div className="flex flex-col">
                                  <span className="text-xs text-slate-400 font-medium">Mulai dari</span>
                                  <div className="flex items-baseline gap-1">
                                    <span className="text-xs text-slate-700 font-bold -mt-1">Rp</span>
                                    <span className="text-3xl font-extrabold text-slate-900 font-display tracking-tight">
                                      {(displayPrice / 1000).toLocaleString("id-ID")}
                                      <span className="text-lg text-slate-500 font-bold">.000</span>
                                    </span>
                                  </div>
                                  <span className="text-[10px] text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded-md w-fit mt-1">
                                    Solusi Cerdas: Hemat Waktu & Tenaga
                                  </span>
                                </div>
                              </div>
                           </div>

                           {/* CTA Button - Conversion Trigger */}
                           <button 
                             onClick={() => navigate(`/orders/new?paket_id=${pkg.id}`)}
                             className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 active:scale-[0.98] transition-all py-4 rounded-2xl shadow-[0_8px_25px_-8px_rgba(79,70,229,0.5)] group relative overflow-hidden"
                           >
                              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                              <div className="flex items-center justify-center gap-2 relative z-10">
                                <span className="text-white font-extrabold text-lg tracking-wide">Pesan Sekarang</span>
                                <ArrowRight className="w-5 h-5 text-white group-hover:translate-x-1 transition-transform" />
                              </div>
                           </button>

                           {/* Trust & Guarantee - Microcopy */}
                           <div className="flex items-center justify-center gap-4 mt-4 pt-3 border-t border-slate-100">
                              <div className="flex items-center gap-1.5">
                                <Shield className="w-3.5 h-3.5 text-slate-400" />
                                <span className="text-[10px] font-semibold text-slate-500">Garansi Kepuasan</span>
                              </div>
                              <div className="w-1 h-1 rounded-full bg-slate-300" />
                              <div className="flex items-center gap-1.5">
                                <Zap className="w-3.5 h-3.5 text-slate-400" />
                                <span className="text-[10px] font-semibold text-slate-500">Respon Cepat</span>
                              </div>
                           </div>
                        </div>

                      </div>
                    </div>
                  );
               })}
             </motion.div>
             
             {/* Dots Indicator */}
             <div className="flex justify-center gap-2 mt-2 mb-2">
                {items.map((_, idx) => (
                  <div 
                    key={idx} 
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      idx === mobileCurrentIndex ? "bg-indigo-600 w-6" : "bg-slate-300 w-1.5"
                    }`} 
                  />
                ))}
             </div>

             {/* Mobile View - All Packages Button */}
             <div className="flex w-full justify-start pl-6 relative z-20 mt-1 mb-4">
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  onClick={() => navigate('/packages/all')}
                  className="relative overflow-hidden flex items-center gap-3 px-5 py-2.5 bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 rounded-full shadow-lg shadow-indigo-500/30 border border-white/20 group"
                >
                  {/* Glass Shine Effect */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/20 to-white/0 translate-x-[-100%] animate-[shimmer_2.5s_infinite] pointer-events-none" />
                  
                  <span className="font-bold text-white text-[11px] tracking-wider uppercase drop-shadow-sm">Lihat Semua</span>
                  
                  <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md border border-white/30 group-hover:bg-white group-hover:scale-110 transition-all duration-300">
                    <ArrowRight className="w-3 h-3 text-white group-hover:text-indigo-600 transition-colors" />
                  </div>
                </motion.button>
             </div>
           </div>

           {/* Quick Menu Icons - Removed as per request */}
        </div>

        {/* Desktop View - Responsive Grid (Visible on Desktop) */}
        {/* Desktop View - Rotating 3D Carousel */}
        <div 
          className="hidden sm:flex justify-center items-start h-[700px] w-full relative -mt-10 mb-32 perspective-[1200px] z-10"
          onMouseEnter={() => setIsAutoScrolling(false)}
          onMouseLeave={() => setIsAutoScrolling(true)}
        >
             {/* Navigation Buttons */}
             <div className="absolute inset-0 flex items-center justify-between px-4 sm:px-10 pointer-events-none z-50 max-w-7xl mx-auto top-[-100px]">
                <motion.button
                  whileHover={{ scale: 1.1, x: -5 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    goToPrev();
                  }}
                  className="pointer-events-auto w-14 h-14 rounded-full bg-white/80 backdrop-blur-md shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-white flex items-center justify-center text-slate-700 hover:text-indigo-600 hover:bg-white transition-colors"
                >
                  <ChevronLeft className="w-8 h-8" />
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.1, x: 5 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    goToNext();
                  }}
                  className="pointer-events-auto w-14 h-14 rounded-full bg-white/80 backdrop-blur-md shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-white flex items-center justify-center text-slate-700 hover:text-indigo-600 hover:bg-white transition-colors"
                >
                  <ChevronRight className="w-8 h-8" />
                </motion.button>
             </div>
             {/* Carousel Track */}
             <div className="absolute inset-0 flex items-center justify-center">
               <AnimatePresence initial={false} mode="popLayout">
                 {carouselItems.map((pkg, index) => {
                    const itemCount = carouselItems.length;
                    const normalizedCurrent = ((currentIndex % itemCount) + itemCount) % itemCount;
                    
                    let dist = (index - normalizedCurrent);
                    if (dist > itemCount / 2) dist -= itemCount;
                    if (dist < -itemCount / 2) dist += itemCount;

                    // Only render items within a safe visual range to prevent DOM overload
                    // But keep enough to animate smooth entrances/exits
                    if (Math.abs(dist) > 3) return null;

                    const isCenter = dist === 0;
                    const absDist = Math.abs(dist);
                    const displayName = isEnglish && pkg.name_en ? pkg.name_en : pkg.name;
                    const displayPrice = pkg.price;

                    // Badge Config
                    const getBadgeConfig = () => {
                      if ((pkg.totalReviews || 0) > 20 && (pkg.averageRating || 0) >= 4.5) return { label: "BEST SELLER", icon: <Flame className="w-3.5 h-3.5 fill-current" />, className: "bg-gradient-to-r from-orange-500 to-red-600", textColor: "text-white" };
                      const lowerName = pkg.name.toLowerCase();
                      if (lowerName.includes("deep") || lowerName.includes("total") || lowerName.includes("komplit") || lowerName.includes("besar")) return { label: "DEEP CLEAN", icon: <Sparkles className="w-3.5 h-3.5 fill-current" />, className: "bg-gradient-to-r from-violet-600 to-indigo-600", textColor: "text-white" };
                      if (pkg.price < 150000) return { label: "HEMAT", icon: <Tag className="w-3.5 h-3.5 fill-current" />, className: "bg-gradient-to-r from-emerald-500 to-teal-600", textColor: "text-white" };
                      if (pkg.price > 400000) return { label: "PREMIUM", icon: <Crown className="w-3.5 h-3.5 fill-current" />, className: "bg-gradient-to-r from-slate-800 to-black", textColor: "text-white" };
                      if ((pkg.averageRating || 0) >= 4.7) return { label: "RECOMMENDED", icon: <Trophy className="w-3.5 h-3.5 fill-current" />, className: "bg-gradient-to-r from-blue-500 to-cyan-600", textColor: "text-white" };
                      return { label: "TERBARU", icon: <Sparkles className="w-3.5 h-3.5 fill-current" />, className: "bg-gradient-to-r from-pink-500 to-rose-600", textColor: "text-white" };
                    };
                    const badge = getBadgeConfig();

                    // 3D Transform values - Optimized for "3 on screen, center focused"
                    // Center item is z-index 50, sides are lower.
                    const zIndex = isCenter ? 50 : 30 - absDist;
                    
                    // X Offset calculation - Increased spacing to show full cards
                    // Center is 0. 
                    // Immediate neighbors (+/- 1) are pushed further out to avoid overlap
                    const xOffset = dist * 380; // Increased spacing for larger center item

                    return (
                      <motion.div
                        key={`${pkg.id}-${index}`}
                        layout
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ 
                          scale: isCenter ? 1.15 : 0.85, // Stronger contrast: Center larger, sides smaller
                          opacity: isCenter ? 1 : (absDist === 1 ? 0.8 : 0), // Side items slightly transparent
                          zIndex,
                          x: xOffset, 
                          y: 0,
                          z: isCenter ? 0 : -100,
                          rotateY: dist * -20, // Reduced rotation for cleaner look
                          filter: isCenter ? "blur(0px) contrast(1.05) brightness(1.1) drop-shadow(0 25px 50px rgba(0,0,0,0.3))" : (absDist === 1 ? "blur(2px) brightness(0.9)" : "blur(10px) opacity(0)"),
                        }}
                        exit={{ scale: 0.5, opacity: 0 }}
                        transition={{ 
                          duration: 0.8,
                          ease: [0.16, 1, 0.3, 1] // Ultra smooth spring-like ease
                        }}
                        className={`absolute top-[100px] -translate-x-1/2 cursor-pointer w-[300px] flex-shrink-0 will-change-transform`}
                        style={{ 
                          transformStyle: "preserve-3d",
                        }}
                        onClick={() => {
                           if(isCenter) setSelectedPackage(pkg);
                           else {
                             goToIndex(index);
                           }
                        }}
                      >
                        <motion.div 
                          whileHover={{ y: -8 }}
                          transition={{ type: "spring", stiffness: 300 }}
                          className="relative w-full rounded-[2.5rem] overflow-hidden shadow-[0_25px_50px_-12px_rgba(79,70,229,0.3)] bg-white border border-slate-100/50 cursor-pointer h-[540px] flex flex-col"
                        >
                          
                          {/* 1. Background Image Area */}
                          <div className="relative h-[320px] w-full bg-slate-100">
                            <img 
                              src={getPackageImage(pkg.name, pkg.image)} 
                              alt={displayName}
                              className="w-full h-full object-contain object-center scale-100"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                              }}
                            />
                            
                            {/* Gradient Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-[#1e1b4b] via-[#312e81]/80 to-transparent pt-32" />
                            
                            {/* Floating Badge */}
                            <div className="absolute top-5 left-5 z-20">
                               <div className={`${badge.className} ${badge.textColor} text-[10px] font-black px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 transform -rotate-2 border border-white/20`}>
                                  {badge.icon}
                                  <span className="tracking-wide uppercase">{badge.label}</span>
                               </div>
                            </div>
                            
                            {/* Rating Badge */}
                            <div className="absolute top-5 right-5 z-20">
                              <div className="bg-white/95 backdrop-blur-md text-slate-900 text-[10px] font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 border border-slate-100">
                                 <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                                 <span>{pkg.averageRating ? Number(pkg.averageRating).toFixed(1) : "Baru"}</span>
                                 {pkg.totalReviews ? (
                                   <span className="text-slate-500 font-medium border-l border-slate-300 pl-1.5">{pkg.totalReviews} Ulasan</span>
                                 ) : null}
                              </div>
                            </div>

                            {/* Content Overlay */}
                            <div className="absolute bottom-0 left-0 right-0 p-6 z-20 flex flex-col items-start text-left">
                               <h2 className="text-[24px] font-black text-white leading-[1.1] mb-3 font-display drop-shadow-lg w-[90%] line-clamp-2">
                                 {displayName}
                               </h2>

                               {/* Benefits */}
                               <div className="flex flex-col gap-2 mb-2 w-full">
                                 <div className="flex items-center gap-2.5 text-white/95">
                                    <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                                      <Zap className="w-3.5 h-3.5 text-yellow-300" />
                                    </div>
                                    <span className="text-sm font-semibold">Pro Staff Berpengalaman</span>
                                 </div>
                                 <div className="flex items-center gap-2.5 text-white/95">
                                    <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                                      <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
                                    </div>
                                    <span className="text-sm font-semibold">Alat & Cairan Lengkap</span>
                                 </div>
                               </div>
                            </div>
                          </div>

                          {/* 2. Action Area */}
                          <div className="bg-white p-6 pt-2 pb-6 relative z-30 -mt-4 rounded-t-3xl flex-1 flex flex-col justify-between">
                             <div className="flex items-end justify-between mb-2">
                                <div className="flex flex-col">
                                  <span className="text-slate-500 text-[11px] font-bold uppercase tracking-wider mb-1">Penawaran Spesial</span>
                                  <div className="flex flex-col">
                                    <span className="text-xs text-slate-400 font-medium">Mulai dari</span>
                                    <div className="flex items-baseline gap-1">
                                      <span className="text-xs text-slate-700 font-bold -mt-1">Rp</span>
                                      <span className="text-3xl font-extrabold text-slate-900 font-display tracking-tight">
                                        {(displayPrice / 1000).toLocaleString("id-ID")}
                                        <span className="text-lg text-slate-500 font-bold">.000</span>
                                      </span>
                                    </div>
                                    <span className="text-[10px] text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded-md w-fit mt-1">
                                      Solusi Cerdas: Hemat Waktu & Tenaga
                                    </span>
                                  </div>
                                </div>
                             </div>

                             <button 
                               onClick={(e) => {
                                 e.stopPropagation();
                                 navigate(`/orders/new?paket_id=${pkg.id}`);
                               }}
                               className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 active:scale-[0.98] transition-all py-3.5 rounded-2xl shadow-[0_8px_25px_-8px_rgba(79,70,229,0.5)] group relative overflow-hidden mt-1"
                             >
                                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                                <div className="flex items-center justify-center gap-2 relative z-10">
                                  <span className="text-white font-extrabold text-lg tracking-wide">Pesan Sekarang</span>
                                  <ArrowRight className="w-5 h-5 text-white group-hover:translate-x-1 transition-transform" />
                                </div>
                             </button>

                             <div className="flex items-center justify-center gap-4 mt-4 pt-3 border-t border-slate-100">
                                <div className="flex items-center gap-1.5">
                                  <Shield className="w-3.5 h-3.5 text-slate-400" />
                                  <span className="text-[10px] font-semibold text-slate-500">Garansi Kepuasan</span>
                                </div>
                                <div className="w-1 h-1 rounded-full bg-slate-300" />
                                <div className="flex items-center gap-1.5">
                                  <Zap className="w-3.5 h-3.5 text-slate-400" />
                                  <span className="text-[10px] font-semibold text-slate-500">Respon Cepat</span>
                                </div>
                             </div>
                          </div>
                        </motion.div>
                      </motion.div>
                    );
                 })}
               </AnimatePresence>
             </div>
        </div>

        {/* Desktop View - Action Buttons */}
        <div className="hidden sm:flex w-full justify-center relative z-20 -mt-36 mb-24">
            {/* Lihat Semua Paket Button (Matches Mobile Design) */}
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
              onClick={() => navigate('/packages/all')}
              className="relative overflow-hidden flex items-center gap-4 px-8 py-4 bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 rounded-full shadow-2xl shadow-indigo-500/30 border border-white/20 group"
            >
              {/* Glass Shine Effect */}
              <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/20 to-white/0 translate-x-[-100%] animate-[shimmer_2.5s_infinite] pointer-events-none" />
              
              <span className="font-bold text-white text-lg tracking-wide uppercase drop-shadow-sm">Lihat Semua Paket</span>
              
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md border border-white/30 group-hover:bg-white group-hover:scale-110 transition-all duration-300">
                <ArrowRight className="w-4 h-4 text-white group-hover:text-indigo-600 transition-colors" />
              </div>
            </motion.button>
        </div>

        {/* --- NEW SECTION: TRUST & SUPPORT (MOBILE FIRST) --- */}
        <div className="block w-full pb-12">
          
          {/* 1. Trust Builder - Kenapa Pilih LokaClean? (Ultra Premium) */}
          <section className="px-6 mb-12">
            <div className="flex flex-col items-center mb-8 text-center">
               <motion.div 
                 initial={{ width: 0 }}
                 whileInView={{ width: 60 }}
                 className="h-1.5 bg-gradient-to-r from-teal-400 via-blue-500 to-purple-600 rounded-full mb-4"
               />
               <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900">
                 Kenapa LokaClean?
               </h3>
               <p className="text-xs text-slate-500 mt-2 font-medium max-w-[250px]">Standar kebersihan hotel bintang 5 untuk rumah Anda</p>
            </div>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
               {[
                 { 
                   icon: ShieldCheck, 
                   color: "text-blue-600",
                   gradient: "from-blue-50 to-indigo-50",
                   border: "border-blue-100",
                   title: "100% Garansi", 
                   desc: "Tidak puas? Kami bersihkan ulang gratis" 
                 },
                 { 
                   icon: Clock, 
                   color: "text-teal-600", 
                   gradient: "from-teal-50 to-emerald-50",
                   border: "border-teal-100",
                   title: "Tepat Waktu", 
                   desc: "Voucher diskon jika kami terlambat" 
                 },
                 { 
                   icon: UserCheck, 
                   color: "text-purple-600", 
                   gradient: "from-purple-50 to-pink-50",
                   border: "border-purple-100",
                   title: "Staff Ahli", 
                   desc: "Terlatih, bersertifikat & background checked" 
                 },
                 { 
                   icon: Sparkles, 
                   color: "text-amber-600", 
                   gradient: "from-amber-50 to-orange-50",
                   border: "border-amber-100",
                   title: "Alat Pro", 
                   desc: "Chemical aman & peralatan lengkap standar hotel" 
                 }
               ].map((item, i) => (
                 <motion.div 
                   key={i} 
                   initial={{ opacity: 0, y: 30 }}
                   whileInView={{ opacity: 1, y: 0 }}
                   viewport={{ once: true }}
                   transition={{ delay: i * 0.15, type: "spring", stiffness: 100 }}
                   className={`group bg-gradient-to-br ${item.gradient} p-5 rounded-[2rem] border ${item.border} hover:shadow-[0_10px_40px_rgba(0,0,0,0.05)] transition-all duration-500 relative overflow-hidden`}
                 >
                    {/* Glass Shine Effect */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/30 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" style={{ transform: 'skewX(-20deg)' }} />
                    
                    <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300 relative z-10">
                      <item.icon className={`w-6 h-6 ${item.color}`} />
                    </div>
                    
                    <div className="relative z-10">
                      <h4 className="text-sm font-bold text-slate-800 leading-tight mb-1.5">{item.title}</h4>
                      <p className="text-[10px] text-slate-500 leading-relaxed font-medium">{item.desc}</p>
                    </div>
                 </motion.div>
               ))}
            </div>
          </section>

          {/* 3. Cara Kerja - Premium Dark Card (Restored & Enhanced) */}
          <section className="px-4 sm:px-6 mb-12 relative z-10">
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-10 text-white relative overflow-hidden shadow-2xl shadow-slate-900/20">
               {/* Animated Background */}
               <motion.div 
                 animate={{ rotate: 360 }}
                 transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                 className="absolute -top-32 -right-32 w-80 h-80 bg-indigo-500/20 rounded-full blur-[80px]"
               />
               <motion.div 
                 animate={{ rotate: -360 }}
                 transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                 className="absolute -bottom-32 -left-32 w-80 h-80 bg-teal-500/10 rounded-full blur-[80px]"
               />
               
               <div className="relative z-10 text-center mb-8 sm:mb-12">
                  <h3 className="text-xl sm:text-2xl font-bold mb-2">Cara Kerja Simpel</h3>
                  <p className="text-slate-400 text-xs sm:text-sm max-w-md mx-auto">Pesan layanan kebersihan profesional hanya dalam 4 langkah mudah</p>
               </div>

               <div className="relative z-10">
                  {/* Connecting Line - Desktop Only */}
                  <div className="hidden sm:block absolute top-8 left-[10%] right-[10%] h-0.5 bg-gradient-to-r from-white/5 via-white/20 to-white/5 -z-10" />
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-8">
                     {steps.map((step, i) => (
                       <div key={i} className={`flex flex-col items-center gap-3 text-center relative group ${
                         i === 2 || i === 3 ? "mt-2" : ""
                       }`}>
                          {/* Mobile Connectors - The "Tree" Layout (Neat & Clean) */}
                          {/* Horizontal: Connects 1-2 and 3-4 */}
                          {(i === 0 || i === 2) && (
                            <div className="sm:hidden absolute top-[1.75rem] left-[50%] w-[calc(100%+1rem)] h-[2px] bg-gradient-to-r from-white/20 via-white/40 to-white/20 z-0" />
                          )}
                          
                          {/* Vertical: Connects Center of Row 1 to Center of Row 2 */}
                          {(i === 0) && (
                             <div className="sm:hidden absolute top-[1.75rem] -right-[0.5rem] w-[2px] h-[calc(100%+2rem)] bg-gradient-to-b from-white/40 via-white/20 to-white/40 z-0" />
                          )}

                          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-[0_0_20px_rgba(255,255,255,0.05)] group-hover:scale-110 group-hover:bg-white/20 transition-all duration-300 relative z-10">
                            <step.icon className="w-6 h-6 sm:w-7 sm:h-7 text-white" strokeWidth={1.5} />
                            {/* Number Badge */}
                            <div className="absolute -top-2 -right-2 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white flex items-center justify-center text-[10px] sm:text-xs font-bold border-2 border-slate-900 shadow-lg">
                              {i + 1}
                            </div>
                          </div>
                          
                          <div className="flex flex-col gap-1 w-full">
                            <span className="text-sm sm:text-base font-bold tracking-wide text-white/95">{step.title}</span>
                            <span className="text-[10px] sm:text-xs text-slate-400 leading-snug px-1">{step.desc}</span>
                          </div>
                       </div>
                     ))}
                  </div>
               </div>
            </div>
          </section>

        {/* Testimonials - Aligned with How It Works Design */}
        <section className="mb-12 sm:mb-24 relative z-10 px-4 sm:px-0">
          <div className="text-center mb-10 sm:mb-16">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-block mb-3"
            >
              <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-600 text-xs font-bold uppercase tracking-wider">
                Testimonials
              </span>
            </motion.div>
            
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mb-4 tracking-tight">
              {t("home.testimonials.title")}
            </h2>
            <div className="w-24 h-1.5 bg-gradient-to-r from-purple-500 to-pink-500 mx-auto rounded-full mb-6" />
            <p className="text-slate-600 max-w-2xl mx-auto text-sm sm:text-base">
              {t("home.testimonials.subtitle")}
            </p>
          </div>
             
          <div className="block sm:hidden px-2">
            <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory scroll-smooth -mx-2 px-2 pb-1">
              {[
                { name: t("home.testimonials.item1.name"), role: t("home.testimonials.item1.role"), text: t("home.testimonials.item1.text"), rating: 5, initial: "J" },
                { name: t("home.testimonials.item2.name"), role: t("home.testimonials.item2.role"), text: t("home.testimonials.item2.text"), rating: 5, initial: "S" },
                { name: t("home.testimonials.item3.name"), role: t("home.testimonials.item3.role"), text: t("home.testimonials.item3.text"), rating: 5, initial: "E" },
                { name: t("home.testimonials.item4.name"), role: t("home.testimonials.item4.role"), text: t("home.testimonials.item4.text"), rating: 5, initial: "B" }
              ].map((testi, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                  className="snap-center min-w-[85%] relative p-4 rounded-2xl bg-white/80 backdrop-blur-sm border border-white/60 shadow-md flex flex-col"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 rounded-xl bg-white border border-slate-100 shadow-sm flex items-center justify-center relative">
                      <span className={`text-base font-bold bg-clip-text text-transparent bg-gradient-to-br ${
                        i === 0 ? "from-blue-600 to-cyan-600" :
                        i === 1 ? "from-purple-600 to-pink-600" :
                        i === 2 ? "from-orange-600 to-yellow-600" :
                                  "from-green-600 to-emerald-600"
                      }`}>
                        {testi.initial}
                      </span>
                      <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-bold border-2 border-white shadow-sm">
                        <Quote className="h-2.5 w-2.5 fill-white" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-bold text-slate-900 leading-tight">{testi.name}</h3>
                      <div className="flex gap-0.5">
                        {[...Array(Math.min(4, testi.rating))].map((_, j) => (
                          <Star key={j} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 leading-snug">
                    "{testi.text}"
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
          <div className="hidden sm:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 px-4 sm:px-0">
            {[
              { 
                name: t("home.testimonials.item1.name"), 
                role: t("home.testimonials.item1.role"), 
                text: t("home.testimonials.item1.text"), 
                rating: 5, 
                initial: "J" 
              },
              { 
                name: t("home.testimonials.item2.name"), 
                role: t("home.testimonials.item2.role"), 
                text: t("home.testimonials.item2.text"), 
                rating: 5, 
                initial: "S" 
              },
              { 
                name: t("home.testimonials.item3.name"), 
                role: t("home.testimonials.item3.role"), 
                text: t("home.testimonials.item3.text"), 
                rating: 5, 
                initial: "E" 
              },
              { 
                name: t("home.testimonials.item4.name"), 
                role: t("home.testimonials.item4.role"), 
                text: t("home.testimonials.item4.text"), 
                rating: 5, 
                initial: "B" 
              }
            ].map((testi, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.6, ease: "easeOut" }}
                className="relative flex flex-col items-center text-center group h-full"
              >
                <div className="relative p-6 rounded-3xl bg-white/50 backdrop-blur-sm border border-white/60 shadow-lg hover:shadow-xl hover:-translate-y-2 transition-all duration-300 w-full h-full flex flex-col items-center">
                  <div className="w-20 h-20 mx-auto rounded-2xl bg-white border border-slate-100 shadow-md flex items-center justify-center mb-4 relative z-10 group-hover:scale-110 transition-transform duration-300">
                    <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${
                      i === 0 ? "from-blue-500/20 to-cyan-500/20" :
                      i === 1 ? "from-purple-500/20 to-pink-500/20" :
                      i === 2 ? "from-orange-500/20 to-yellow-500/20" :
                                "from-green-500/20 to-emerald-500/20"
                    } opacity-100`} />
                    <span className={`text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-br ${
                      i === 0 ? "from-blue-600 to-cyan-600" :
                      i === 1 ? "from-purple-600 to-pink-600" :
                      i === 2 ? "from-orange-600 to-yellow-600" :
                                "from-green-600 to-emerald-600"
                    }`}>
                      {testi.initial}
                    </span>
                    <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center border-2 border-white shadow-sm">
                      <Quote className="h-3 w-3 fill-white" />
                    </div>
                  </div>
                  <div className="flex gap-0.5 mb-3">
                    {[...Array(testi.rating)].map((_, j) => (
                      <Star key={j} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-1">{testi.name}</h3>
                  <p className="text-xs font-bold text-purple-600 mb-3 uppercase tracking-wide">{testi.role}</p>
                  <p className="text-sm text-slate-500 leading-relaxed italic relative px-2">"{testi.text}"</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        </div>

        {/* Premium Package Cards Carousel - Pyramid Layout (Desktop Only) */}
        <div className="hidden">
          {/* Navigation Buttons - Floating */}
          {itemCount > 1 && (
            <>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={goToPrev}
                className="flex absolute left-1 sm:left-4 top-1/2 -translate-y-1/2 z-40 items-center justify-center w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-white/90 backdrop-blur-sm shadow-lg border-2 border-teal-200 text-teal-600 hover:bg-teal-50 hover:border-teal-400 transition-all"
                aria-label="Previous"
              >
                <ChevronLeft className="h-4 w-4 sm:h-6 sm:w-6" />
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={goToNext}
                className="flex absolute right-1 sm:right-4 top-1/2 -translate-y-1/2 z-40 items-center justify-center w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-white/90 backdrop-blur-sm shadow-lg border-2 border-teal-200 text-teal-600 hover:bg-teal-50 hover:border-teal-400 transition-all"
                aria-label="Next"
              >
                <ChevronRight className="h-4 w-4 sm:h-6 sm:w-6" />
              </motion.button>
            </>
          )}

          {/* Carousel Container */}
          <div className="relative overflow-hidden px-0 sm:px-16 lg:px-20">
            {/* Carousel Container - Adjusted gap for depth effect */}
            <div className="flex items-center justify-center gap-0 sm:gap-2 lg:gap-4 py-4 sm:py-8">
              <AnimatePresence mode="popLayout" initial={false}>
                {carouselItems.map((pkg, index) => {
                  // Calculate circular distance
                  // dist is the relative position from current index in circular buffer
                  // Range: -itemCount/2 to +itemCount/2
                  
                  // Calculate normalized index (0 to itemCount-1)
                  // Handle negative currentIndex by adding multiples of itemCount
                  const normalizedCurrent = ((currentIndex % itemCount) + itemCount) % itemCount;
                  
                  // Shortest distance logic
                  let dist = (index - normalizedCurrent);
                  if (dist > itemCount / 2) dist -= itemCount;
                  if (dist < -itemCount / 2) dist += itemCount;

                  const absDist = Math.abs(dist);
                  
                  // Logic to show 3 cards: center, left, right
                  const isCenter = dist === 0;
                  const isVisible = absDist <= 1; 
                  
                  if (!isVisible) return null;

                  // Enhanced Depth Effect Logic
                  // Active: 1.1 scale, 1 opacity, high z-index
                  // Side: 0.9 scale, 0.7 opacity, low z-index, blur
                  const scale = isCenter ? 1.1 : 0.9;
                  const opacity = isCenter ? 1 : 0.7;
                  const zIndex = isCenter ? 50 : 30 - absDist * 10;
                  const filter = isCenter ? "blur(0px) contrast(1)" : "blur(2px) contrast(0.85)";
                      const x = isCenter ? 0 : (dist < 0 ? "10%" : "-10%"); // Pull side cards closer by 10%

                  const displayName = isEnglish && pkg.name_en ? pkg.name_en : pkg.name;
                  const displayDesc = isEnglish && pkg.description_en ? pkg.description_en : pkg.description;

                  const packageImage = getPackageImage(pkg.name, pkg.image);
                  const packageImageAlt = getPackageImageAlt(displayName);
                  const gradientClass = getPackageGradient(pkg.name);
                  
                  return (
                    <motion.div
                      key={`${pkg.id}-${index}`}
                      layout
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ 
                        scale: isCenter ? 1.05 : 0.9, 
                        opacity: isCenter ? 1 : 0.6, 
                        zIndex,
                        x, // Apply overlap offset
                        filter: isCenter ? "blur(0px) contrast(1)" : "blur(2px) contrast(0.9)", // Reduced blur for performance
                        y: 0 
                      }}
                      exit={{ scale: 0.9, opacity: 0 }}
                      transition={{ 
                        duration: 0.8, // Faster, snappier transition
                        ease: [0.16, 1, 0.3, 1] 
                      }}
                      className={`group perspective-1000 origin-center w-[65vw] sm:w-full max-w-[240px] sm:max-w-[380px] flex-shrink-0 will-change-transform ${
                        isCenter 
                          ? "relative z-50" 
                          : `absolute top-1/2 -translate-y-1/2 z-30 ${
                              dist < 0 
                                ? "left-[2%] sm:left-[10%] lg:left-[calc(50%-340px)]" 
                                : "right-[2%] sm:right-[10%] lg:right-[calc(50%-340px)]"
                            }`
                      }`}
                      style={{ 
                        perspective: "1000px",
                        order: dist // -1, 0, 1
                      }}
                    >
                      {/* Premium Card Container with Wave Design */}
                      <motion.div 
                        className="card-lombok relative h-full overflow-hidden will-change-transform"
                        animate={{
                          boxShadow: isCenter 
                            ? "0 30px 60px -12px rgba(26, 188, 156, 0.3), 0 18px 36px -18px rgba(0, 0, 0, 0.1)" // Strong shadow for active
                            : "0 10px 15px -3px rgba(0, 0, 0, 0.1)" // Weak shadow for sides
                        }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                      >
                    {/* Animated Wave Background - Top (Only animate center card) */}
                    <div className="absolute top-0 left-0 right-0 h-24 sm:h-32 overflow-hidden pointer-events-none z-0">
                      <svg 
                        className="absolute top-0 left-0 w-full h-full"
                        viewBox="0 0 1200 120"
                        preserveAspectRatio="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <motion.path
                          d="M0,60 Q300,20 600,60 T1200,60 L1200,0 L0,0 Z"
                          fill={`url(#wave-gradient-${pkg.id})`}
                          animate={isCenter ? {
                            d: [
                              "M0,60 Q300,20 600,60 T1200,60 L1200,0 L0,0 Z",
                              "M0,60 Q300,40 600,60 T1200,60 L1200,0 L0,0 Z",
                              "M0,60 Q300,20 600,60 T1200,60 L1200,0 L0,0 Z"
                            ]
                          } : {}}
                          transition={{
                            duration: 4,
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                        />
                        <defs>
                          <linearGradient id={`wave-gradient-${pkg.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="rgba(26, 188, 156, 0.15)" />
                            <stop offset="50%" stopColor="rgba(52, 152, 219, 0.12)" />
                            <stop offset="100%" stopColor="rgba(139, 92, 246, 0.1)" />
                          </linearGradient>
                        </defs>
                      </svg>
                    </div>

                    {/* Animated Wave Background - Bottom (Only animate center card) */}
                    <div className="absolute bottom-0 left-0 right-0 h-20 sm:h-28 overflow-hidden pointer-events-none z-0 rotate-180">
                      <svg 
                        className="absolute bottom-0 left-0 w-full h-full"
                        viewBox="0 0 1200 120"
                        preserveAspectRatio="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <motion.path
                          d="M0,40 Q300,80 600,40 T1200,40 L1200,120 L0,120 Z"
                          fill={`url(#wave-gradient-bottom-${pkg.id})`}
                          animate={isCenter ? {
                            d: [
                              "M0,40 Q300,80 600,40 T1200,40 L1200,120 L0,120 Z",
                              "M0,40 Q300,60 600,40 T1200,40 L1200,120 L0,120 Z",
                              "M0,40 Q300,80 600,40 T1200,40 L1200,120 L0,120 Z"
                            ]
                          } : {}}
                          transition={{
                            duration: 5,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: 0.5
                          }}
                        />
                        <defs>
                          <linearGradient id={`wave-gradient-bottom-${pkg.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="rgba(139, 92, 246, 0.1)" />
                            <stop offset="50%" stopColor="rgba(52, 152, 219, 0.12)" />
                            <stop offset="100%" stopColor="rgba(26, 188, 156, 0.15)" />
                          </linearGradient>
                        </defs>
                      </svg>
                    </div>

                    {/* Floating Particles Effect - Reduced count & conditional animation */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                      {isCenter && [...Array(3)].map((_, i) => (
                        <motion.div
                          key={i}
                          className="absolute w-2 h-2 rounded-full bg-gradient-to-br from-teal-400/30 to-blue-400/30 blur-sm"
                          style={{
                            left: `${15 + i * 25}%`,
                            top: `${20 + (i % 3) * 30}%`,
                          }}
                          animate={{
                            y: [0, -20, 0],
                            x: [0, 10, 0],
                            opacity: [0.3, 0.6, 0.3],
                            scale: [1, 1.2, 1]
                          }}
                          transition={{
                            duration: 3 + i * 0.5,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: i * 0.3
                          }}
                        />
                      ))}
                    </div>

                    {/* Decorative Corner Accent - Top Right */}
                    <div className="absolute top-0 right-0 w-32 h-32 sm:w-40 sm:h-40 overflow-hidden pointer-events-none z-0">
                      <div className={`absolute -top-16 -right-16 w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-gradient-to-br ${gradientClass} opacity-10 blur-2xl`} />
                      <motion.div
                        className={`absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br ${gradientClass} opacity-5 rounded-full`}
                        animate={isCenter ? {
                          scale: [1, 1.2, 1],
                          rotate: [0, 90, 0]
                        } : {}}
                        transition={{
                          duration: 8,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      />
                    </div>

                    {/* Decorative Corner Accent - Bottom Left */}
                    <div className="absolute bottom-0 left-0 w-28 h-28 sm:w-36 sm:h-36 overflow-hidden pointer-events-none z-0">
                      <div className={`absolute -bottom-14 -left-14 w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-gradient-to-br ${gradientClass} opacity-8 blur-xl`} />
                    </div>

                    {/* Premium Glassmorphism Overlay on Hover */}
                    <motion.div 
                      className="absolute inset-0 pointer-events-none z-0 backdrop-blur-sm"
                      initial={{ opacity: 0 }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                      style={{
                        background: "linear-gradient(135deg, rgba(26, 188, 156, 0.12) 0%, rgba(52, 152, 219, 0.08) 50%, rgba(139, 92, 246, 0.06) 100%)",
                        backdropFilter: "blur(8px)"
                      }}
                    />

                    {/* Animated Border Glow on Hover */}
                    <motion.div
                      className="absolute inset-0 rounded-2xl sm:rounded-3xl pointer-events-none z-10"
                      initial={{ opacity: 0 }}
                      style={{
                        background: `linear-gradient(135deg, 
                          rgba(26, 188, 156, 0.4) 0%, 
                          rgba(52, 152, 219, 0.3) 25%, 
                          rgba(139, 92, 246, 0.3) 50%, 
                          rgba(52, 152, 219, 0.3) 75%, 
                          rgba(26, 188, 156, 0.4) 100%)`,
                        backgroundSize: "200% 200%",
                        mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                        maskComposite: "xor",
                        WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                        WebkitMaskComposite: "xor",
                        padding: "2px",
                        filter: "blur(1px)"
                      }}
                      animate={{
                        backgroundPosition: ["0% 0%", "100% 100%", "0% 0%"]
                      }}
                      transition={{
                        opacity: { duration: 0.4 },
                        backgroundPosition: {
                          duration: 3,
                          repeat: Infinity,
                          ease: "linear"
                        }
                      }}
                    />

                    {/* Floating Light Orbs on Hover */}
                    <motion.div
                      className="absolute inset-0 pointer-events-none z-0"
                      initial={{ opacity: 0 }}
                      transition={{ duration: 0.5 }}
                    >
                      {[...Array(4)].map((_, i) => (
                        <motion.div
                          key={i}
                          className="absolute w-20 h-20 sm:w-32 sm:h-32 rounded-full blur-2xl"
                          style={{
                            background: `radial-gradient(circle, ${
                              i % 2 === 0 
                                ? "rgba(26, 188, 156, 0.3)" 
                                : "rgba(52, 152, 219, 0.25)"
                            } 0%, transparent 70%)`,
                            left: `${20 + i * 25}%`,
                            top: `${15 + (i % 2) * 60}%`,
                          }}
                          animate={{
                            scale: [1, 1.3, 1],
                            opacity: [0.3, 0.5, 0.3],
                            x: [0, 20, 0],
                            y: [0, -15, 0]
                          }}
                          transition={{
                            duration: 4 + i,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: i * 0.5
                          }}
                        />
                      ))}
                    </motion.div>
                    
                    {/* Badge */}
                    {index === 0 && (
                      <motion.div 
                        className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20"
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ delay: index * 0.08 + 0.2, type: "spring", stiffness: 200 }}
                      >
                        <PromoBadge variant="popular" />
                      </motion.div>
                    )}
                    {index === 1 && (
                      <motion.div 
                        className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20"
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ delay: index * 0.08 + 0.2, type: "spring", stiffness: 200 }}
                      >
                        <PromoBadge variant="save" />
                      </motion.div>
                    )}

                    {/* LokaClean Identity Badge */}
                    <motion.div 
                      className="absolute top-3 left-3 sm:top-4 sm:left-4 z-20"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <div className="flex items-center gap-1.5 pl-1 pr-2.5 py-1 rounded-full bg-gradient-to-r from-white/95 to-white/90 backdrop-blur-md border border-teal-100/50 shadow-[0_4px_12px_rgba(0,0,0,0.05)] group/badge hover:shadow-teal-500/10 transition-all duration-300">
                        <div className="relative flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gradient-to-br from-teal-500 to-emerald-500 shadow-sm overflow-hidden">
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/30 to-transparent"
                            animate={{ rotate: [0, 360] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                          />
                          <Shield className="relative w-3 h-3 sm:w-3.5 sm:h-3.5 text-white fill-white/20" />
                        </div>
                        <span className="text-[10px] sm:text-xs font-bold text-slate-700 tracking-wide group-hover:text-teal-600 transition-colors">
                          LokaClean
                        </span>
                      </div>
                    </motion.div>

                    <div className="relative z-10 p-3 sm:p-5 lg:p-6">
                      {/* Package Image Section - Modern Wave Style */}
                      <div className="mb-3 sm:mb-5">
                        <motion.div
                          transition={{ type: "spring", stiffness: 300, duration: 0.5 }}
                          className="relative w-full"
                        >
                          {/* Multi-layer Animated Glow Effect (Conditional) */}
                          {isCenter && (
                            <>
                              <motion.div
                                animate={{
                                  opacity: [0.15, 0.3, 0.15],
                                  scale: [1, 1.08, 1],
                                  rotate: [0, 5, 0]
                                }}
                                transition={{
                                  duration: 5,
                                  repeat: Infinity,
                                  ease: "easeInOut"
                                }}
                                className={`absolute -inset-2 sm:-inset-3 bg-gradient-to-br ${gradientClass} rounded-3xl blur-2xl sm:blur-3xl opacity-20`}
                              />
                              <motion.div
                                animate={{
                                  opacity: [0.1, 0.2, 0.1],
                                  scale: [1, 1.05, 1],
                                  rotate: [0, -3, 0]
                                }}
                                transition={{
                                  duration: 4,
                                  repeat: Infinity,
                                  ease: "easeInOut",
                                  delay: 0.5
                                }}
                                className={`absolute -inset-1 sm:-inset-2 bg-gradient-to-br ${gradientClass} rounded-2xl sm:rounded-3xl blur-xl opacity-15`}
                              />
                            </>
                          )}
                          
                          {/* Image Container with Premium Hover Effects */}
                          <motion.div 
                            className="relative overflow-hidden rounded-2xl sm:rounded-3xl border-2 border-white/40 shadow-2xl bg-gradient-to-br from-slate-100 via-white to-slate-50 backdrop-blur-sm h-40 sm:h-52 lg:h-60"
                            transition={{ duration: 0.4, ease: "easeOut" }}
                          >
                            {/* Wave Pattern Overlay */}
                            <div className="absolute inset-0 opacity-5 pointer-events-none">
                              <svg className="w-full h-full" viewBox="0 0 400 300" preserveAspectRatio="none">
                                <defs>
                                  <pattern id={`wave-pattern-${pkg.id}`} x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                                    <path d="M0,50 Q25,0 50,50 T100,50" stroke="currentColor" fill="none" strokeWidth="2" />
                                  </pattern>
                                </defs>
                                <rect width="100%" height="100%" fill={`url(#wave-pattern-${pkg.id})`} className="text-teal-500" />
                              </svg>
                            </div>

                            <motion.img
                              src={packageImage}
                              alt={packageImageAlt}
                              className="relative w-full h-full object-cover"
                              transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect fill='%23e2e8f0' width='400' height='300'/%3E%3Ctext x='50%25' y='50%25' font-family='Arial' font-size='20' fill='%2394a3b8' text-anchor='middle' dominant-baseline='middle'%3E${encodeURIComponent(displayName)}%3C/text%3E%3C/svg%3E`;
                              }}
                            />
                            
                            {/* Dynamic Gradient Overlay (Conditional) */}
                            {isCenter && (
                              <motion.div 
                                className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none"
                                animate={{
                                  opacity: [0.1, 0.2, 0.1]
                                }}
                                transition={{
                                  duration: 3,
                                  repeat: Infinity,
                                  ease: "easeInOut"
                                }}
                              />
                            )}
                            
                            {/* Premium Shimmer Effect on Hover (Conditional) */}
                            <motion.div
                              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent pointer-events-none"
                              initial={{ x: "-100%", opacity: 0 }}
                              transition={{ 
                                duration: 1.2, 
                                ease: "easeInOut",
                                repeat: Infinity,
                                repeatDelay: 2
                              }}
                            />
                            
                            {/* Subtle Vignette on Hover */}
                            <motion.div
                              className="absolute inset-0 pointer-events-none"
                              initial={{ opacity: 0 }}
                              transition={{ duration: 0.4 }}
                              style={{
                                background: "radial-gradient(circle at center, transparent 0%, rgba(0, 0, 0, 0.05) 100%)"
                              }}
                            />
                          </motion.div>
                        </motion.div>
                      </div>

                      {/* Package Info - Professional Clean Layout */}
                      <div className="mb-2 sm:mb-4">
                        <motion.h3 
                          className="text-lg sm:text-2xl font-bold text-slate-800 mb-1 leading-snug tracking-tight line-clamp-2"
                          transition={{ duration: 0.2 }}
                        >
                          {displayName}
                        </motion.h3>
                        <PackageRatingDisplay
                          averageRating={pkg.averageRating}
                          totalReviews={pkg.totalReviews}
                          size="sm"
                        />
                      </div>

                      {/* Description with Premium Hover Effect */}
                      <motion.div 
                        className="relative mb-2 sm:mb-5"
                        transition={{ duration: 0.3 }}
                      >
                        <motion.p 
                          className="text-[10px] sm:text-sm text-slate-600 leading-relaxed line-clamp-2 min-h-[1.75rem] sm:min-h-[2.5rem] relative z-10"
                          transition={{ duration: 0.3 }}
                        >
                          {displayDesc}
                        </motion.p>
                        {/* Enhanced wave underline effect on hover */}
                        <motion.div
                          className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-teal-400/30 via-blue-400/30 to-purple-400/30 rounded-full"
                          initial={{ width: 0 }}
                          whileInView={{ width: "100%" }}
                          viewport={{ once: true }}
                          transition={{ duration: 1, delay: index * 0.1 }}
                        />
                      </motion.div>

                      {/* Price Card - Currency Style Redesign */}
                      <motion.div 
                        className="relative mb-2 sm:mb-5 overflow-hidden rounded-xl sm:rounded-2xl p-[2px] shadow-xl group/price"
                        transition={{ duration: 0.4 }}
                      >
                         {/* Outer Gradient Border */}
                         <div className="absolute inset-0 bg-gradient-to-br from-teal-400 via-emerald-500 to-cyan-600 rounded-xl sm:rounded-2xl opacity-70" />
                         
                         {/* Main Card Content */}
                         <div className="relative h-full bg-gradient-to-br from-teal-900 via-teal-950 to-emerald-950 rounded-[10px] sm:rounded-[14px] overflow-hidden p-2.5 sm:p-5">
                            
                            {/* Currency Pattern Background (Guilloche-style) */}
                            <div className="absolute inset-0 opacity-15 pointer-events-none mix-blend-overlay">
                               <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                                  <defs>
                                     <pattern id={`guilloche-${pkg.id}`} x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                                        <path d="M0 20 Q10 0 20 20 T40 20" stroke="white" fill="none" strokeWidth="0.5" />
                                        <path d="M0 20 Q10 40 20 20 T40 20" stroke="white" fill="none" strokeWidth="0.5" />
                                        <circle cx="20" cy="20" r="2" fill="white" />
                                     </pattern>
                                  </defs>
                                  <rect width="100%" height="100%" fill={`url(#guilloche-${pkg.id})`} />
                               </svg>
                            </div>

                            {/* Decorative Lines & Glows */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-teal-500/20 to-transparent rounded-bl-full pointer-events-none blur-xl" />
                            <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-emerald-500/20 to-transparent rounded-tr-full pointer-events-none blur-xl" />

                            {/* Watermark Icon */}
                            <div className="absolute -bottom-6 -right-6 opacity-[0.07] rotate-12 pointer-events-none">
                               <Banknote className="w-32 h-32 text-white" />
                            </div>

                            <div className="relative z-10">
                              <div className="flex items-center justify-between mb-1 sm:mb-2">
                                <span className="text-[9px] sm:text-xs font-bold text-teal-200/80 uppercase tracking-[0.2em] border-b border-teal-500/30 pb-0.5 sm:pb-1">
                                  {t("packages.startingFrom")}
                                </span>
                                {/* Holographic/Security Seal */}
                                <motion.div 
                                  className="w-5 h-5 sm:w-7 sm:h-7 rounded-full bg-gradient-to-tr from-yellow-300 via-yellow-100 to-yellow-500 shadow-lg flex items-center justify-center border border-white/40"
                                  animate={{ 
                                    boxShadow: ["0 0 0px rgba(234, 179, 8, 0)", "0 0 10px rgba(234, 179, 8, 0.5)", "0 0 0px rgba(234, 179, 8, 0)"]
                                  }}
                                  transition={{ duration: 3, repeat: Infinity }}
                                >
                                   <div className="w-3.5 h-3.5 sm:w-5 sm:h-5 rounded-full border border-yellow-600/30 flex items-center justify-center bg-yellow-400/20 backdrop-blur-[1px]">
                                     <Shield className="w-2 h-2 sm:w-3 sm:h-3 text-yellow-700 fill-yellow-500/20" />
                                  </div>
                               </motion.div>
                             </div>
                             
                             <div className="flex items-start gap-1 sm:gap-1.5 text-white">
                               <span className="text-[10px] sm:text-base font-serif font-bold text-emerald-400 mt-1 sm:mt-1.5 select-none drop-shadow-sm">Rp</span>
                               <motion.span 
                                 className="text-lg sm:text-3xl font-black tracking-tight drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)] text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-teal-100"
                               >
                                 {pkg.price.toLocaleString("id-ID")}
                               </motion.span>
                             </div>
                            </div>

                            {/* Security Thread / Holographic Bar */}
                            <div className="absolute top-0 bottom-0 right-16 w-[1px] bg-gradient-to-b from-transparent via-teal-200/50 to-transparent" />
                            
                            {/* Moving Shine Effect (Currency Sheen) */}
                            <motion.div
                              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12"
                              initial={{ x: "-150%" }}
                              animate={{ x: "150%" }}
                              transition={{ 
                                duration: 3, 
                                repeat: Infinity, 
                                repeatDelay: 3,
                                ease: "easeInOut" 
                              }}
                            />
                         </div>
                      </motion.div>

                      {/* Features Pills - Modern Wave Style */}
                      <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-2 sm:mb-5">
                        <motion.div 
                          className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-700 text-[9px] sm:text-xs font-bold border border-blue-200/60 shadow-sm relative overflow-hidden"
                          transition={{ type: "spring", stiffness: 400 }}
                        >
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-cyan-400/20"
                            initial={{ x: "-100%" }}
                            transition={{ duration: 0.5 }}
                          />
                          <CheckCircle2 className="h-2.5 w-2.5 sm:h-3 sm:w-3 flex-shrink-0 relative z-10" />
                          <span className="relative z-10 font-display tracking-tight">{t("packages.professional")}</span>
                        </motion.div>
                        <motion.div 
                          className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 text-[9px] sm:text-xs font-bold border border-indigo-200/60 shadow-sm relative overflow-hidden"
                          transition={{ type: "spring", stiffness: 400 }}
                        >
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-indigo-400/20 to-purple-400/20"
                            initial={{ x: "-100%" }}
                            transition={{ duration: 0.5 }}
                          />
                          <CheckCircle2 className="h-2.5 w-2.5 sm:h-3 sm:w-3 flex-shrink-0 relative z-10" />
                          <span className="relative z-10 font-display tracking-tight">{t("packages.fast")}</span>
                        </motion.div>
                      </div>

                      {/* Action Buttons - Redesigned Premium Look */}
                      <div className="flex items-center gap-1.5 sm:gap-3 mt-2 sm:mt-4">
                        {/* Detail Button - Elegant & Clean */}
                        <motion.button
                          whileTap={{ scale: 0.98 }}
                          className="flex-[0.8] relative overflow-hidden rounded-lg sm:rounded-xl border border-teal-100 bg-white px-2 py-2 sm:px-3 sm:py-3 text-[10px] sm:text-sm font-bold text-teal-700 shadow-sm hover:shadow-md hover:border-teal-200 hover:bg-teal-50/30 transition-all duration-300 group"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPackage(pkg);
                          }}
                        >
                           <div className="relative z-10 flex items-center justify-center gap-1.5 sm:gap-2">
                            <Eye className="h-3 w-3 sm:h-4 sm:w-4 text-teal-500 transition-transform group-hover:scale-110" />
                            <span>Detail</span>
                          </div>
                        </motion.button>

                        {/* Book Now / Add to Cart Button */}
                        {(pkg.stock === undefined || pkg.stock > 0) ? (
                          <motion.button
                            whileTap={{ scale: 0.98 }}
                            className="flex-[1.2] relative overflow-hidden rounded-lg sm:rounded-xl bg-gradient-to-r from-teal-500 via-teal-600 to-blue-600 px-2.5 py-2 sm:px-4 sm:py-3 text-[10px] sm:text-sm font-bold text-white shadow-lg shadow-teal-500/25 transition-all.duration-300 group"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/orders/new?paket_id=${pkg.id}`);
                            }}
                          >
                            <div className="relative z-10 flex items-center justify-center gap-1.5 sm:gap-2">
                              <span>
                                {pkg.category === "SERVICE" ? "Pesan" : "Keranjang"}
                              </span>
                              {pkg.category === "SERVICE" ? (
                                <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 transition-transform group-hover:translate-x-1" />
                              ) : (
                                <ShoppingCart className="h-3 w-3 sm:h-4 sm:w-4 transition-transform group-hover:translate-x-1" />
                              )}
                            </div>
                            
                            {/* Shimmer Effect */}
                            <motion.div
                              className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent"
                              animate={{ translateX: ["-100%", "200%"] }}
                              transition={{
                                duration: 1.5,
                                repeat: Infinity,
                                repeatDelay: 3,
                                ease: "easeInOut"
                              }}
                            />
                          </motion.button>
                        ) : (
                           <div className="flex-[1.2] flex items-center justify-center rounded-lg sm:rounded-xl bg-slate-100 px-2.5 py-2 sm:px-4 sm:py-3 text-[10px] sm:text-sm font-bold text-slate-400 border border-slate-200 cursor-not-allowed">
                             Habis
                           </div>
                        )}
                      </div>
                    </div>

                    {/* Premium Animated Wave Bottom Accent with Hover Effect */}
                    <motion.div 
                      className="absolute bottom-0 left-0 right-0 h-2 overflow-hidden"
                      transition={{ duration: 0.4, ease: "easeOut" }}
                    >
                      <motion.div
                        className="h-full bg-gradient-to-r from-teal-500 via-cyan-500 via-blue-500 to-purple-500"
                        animate={{
                          backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"]
                        }}
                        transition={{
                          duration: 4,
                          repeat: Infinity,
                          ease: "linear"
                        }}
                        style={{
                          backgroundSize: "200% 200%"
                        }}
                      />
                      {/* Enhanced Wave Pattern on Hover */}
                      <motion.svg 
                        className="absolute top-0 left-0 w-full h-full" 
                        viewBox="0 0 400 8" 
                        preserveAspectRatio="none"
                      >
                        <path d="M0,4 Q100,0 200,4 T400,4 L400,8 L0,8 Z" fill="rgba(255,255,255,0.3)" />
                      </motion.svg>
                    </motion.div>
                  </motion.div>
                </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>

          {/* Carousel Indicators */}
          {itemCount > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6 sm:mt-8">
              {filteredItems.map((_, index) => {
                // Determine active state based on circular currentIndex
                // We show indicators for unique items (filteredItems)
                // But currentIndex iterates over potential duplicates (carouselItems)
                // So we need to map currentIndex back to original range
                const uniqueCount = filteredItems.length;
                const activeIndex = currentIndex % uniqueCount;
                const isActive = index === activeIndex;

                return (
                  <motion.button
                    key={index}
                    onClick={() => {
                      // Find the nearest index corresponding to this original item
                      // We want to jump to the instance of this item that is closest to current view
                      // But simply jumping to 'index' works because we handle modulo in logic
                      goToIndex(index);
                    }}
                    className={`h-2 sm:h-2.5 rounded-full transition-all ${
                      isActive
                        ? "w-8 sm:w-10 bg-gradient-to-r from-teal-500 to-blue-500"
                        : "w-2 sm:w-2.5 bg-slate-300 hover:bg-slate-400"
                    }`}
                    whileTap={{ scale: 0.9 }}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* Trust Badges Section - Removed as per request */}

        {/* Package Detail Modal */}
        <AnimatePresence>
          {selectedPackage && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-start sm:items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto pt-16 sm:pt-20"
              onClick={() => setSelectedPackage(null)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-lg bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/30 rounded-xl sm:rounded-2xl shadow-2xl overflow-hidden my-4 sm:my-8 max-h-[90vh] sm:max-h-[85vh] flex flex-col"
              >
                {/* Close Button */}
                <button
                  type="button"
                  onClick={() => setSelectedPackage(null)}
                  className="absolute top-3 right-3 z-20 p-2 rounded-full bg-white/95 backdrop-blur-sm text-slate-600 hover:bg-white hover:text-slate-900 shadow-lg transition-all"
                  aria-label="Close"
                >
                  <X className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>

                {/* Scrollable Content */}
                <div className="overflow-y-auto flex-1">
                  {/* Package Image - Compact */}
                  <div className="relative w-full h-32 sm:h-40 overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200">
                    <img
                      src={getPackageImage(selectedPackage.name, selectedPackage.image)}
                      alt={getPackageImageAlt(isEnglish && selectedPackage.name_en ? selectedPackage.name_en : selectedPackage.name)}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        const name = isEnglish && selectedPackage.name_en ? selectedPackage.name_en : selectedPackage.name;
                        target.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='300'%3E%3Crect fill='%23e2e8f0' width='600' height='300'/%3E%3Ctext x='50%25' y='50%25' font-family='Arial' font-size='18' fill='%2394a3b8' text-anchor='middle' dominant-baseline='middle'%3E${encodeURIComponent(name)}%3C/text%3E%3C/svg%3E`;
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
                    
                    {/* Package Name Overlay - Compact */}
                    <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 bg-gradient-to-t from-black/70 to-transparent">
                      <h2 className="text-lg sm:text-xl font-black text-white mb-1 line-clamp-1 font-display">
                        {isEnglish && selectedPackage.name_en ? selectedPackage.name_en : selectedPackage.name}
                      </h2>
                      <PackageRatingDisplay
                        averageRating={selectedPackage.averageRating}
                        totalReviews={selectedPackage.totalReviews}
                        size="sm"
                        className="text-white/90"
                      />
                    </div>
                  </div>

                  {/* Package Details - Compact */}
                  <div className="p-4 sm:p-5 space-y-4">
                    {/* Price Section - Compact */}
                    <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 sm:p-5 shadow-lg border border-slate-700/50">
                      <div className="absolute inset-0 bg-gradient-to-br from-teal-500/10 to-blue-500/10" />
                      <div className="relative">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wide">
                            {t("packages.startingFrom")}
                          </span>
                        </div>
                        <div className="flex items-baseline gap-2 flex-wrap">
                          <span className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                            Rp {selectedPackage.price.toLocaleString("id-ID")}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Description Section - Compact */}
                    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 sm:p-5 border border-slate-200/50 shadow-sm">
                      <div className="flex items-center gap-1.5 sm:gap-2 mb-2">
                        <Info className="h-4 w-4 sm:h-5 sm:w-5 text-teal-600 flex-shrink-0" />
                        <h3 className="text-base sm:text-lg font-bold text-slate-900">{t("packages.description")}</h3>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                        {isEnglish && selectedPackage.description_en ? selectedPackage.description_en : selectedPackage.description}
                      </p>
                    </div>

                    {/* Features Section - Dynamic from Description */}
                    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 sm:p-5 border border-slate-200/50 shadow-sm">
                      <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-3">{t("packages.serviceFeatures")}</h3>
                      <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
                        {extractFeatures(isEnglish && selectedPackage.description_en ? selectedPackage.description_en : selectedPackage.description).map((feature, idx) => {
                          const Icon = feature.icon;
                          // Get icon color (one shade lighter than text)
                          const iconColor = feature.color.replace('-700', '-600');
                          return (
                            <motion.div
                              key={idx}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: idx * 0.05 }}
                              className={`flex items-center gap-2 sm:gap-2.5 p-3 sm:p-3.5 rounded-lg sm:rounded-xl border ${feature.bgColor}`}
                            >
                              <Icon className={`h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 ${iconColor}`} />
                              <span className={`text-xs sm:text-sm font-semibold ${feature.color} whitespace-normal`}>
                                {feature.text}
                              </span>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* CTA Button - Sticky at Bottom */}
                <div className="p-4 sm:p-5 pt-0 border-t border-slate-200/40 bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/30">
                  <motion.button
                    whileTap={{ scale: 0.99 }}
                    className="w-full group/btn relative overflow-hidden rounded-xl bg-gradient-to-r from-teal-500 via-teal-600 to-blue-600 px-4 sm:px-6 py-3 sm:py-3.5 text-sm sm:text-base font-bold text-white shadow-lg shadow-teal-500/25 hover:shadow-xl hover:shadow-teal-500/40 transition-all"
                    onClick={() => {
                      setSelectedPackage(null);
                      navigate(`/orders/new?paket_id=${selectedPackage.id}`);
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-teal-400 to-blue-500 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300" />
                    <div className="relative flex items-center justify-center gap-2">
                      <span>{t("packages.bookNow")}</span>
                      <motion.div
                        animate={{ x: [0, 3, 0] }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      >
                        <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
                      </motion.div>
                    </div>
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty State */}
        {!loading && !error && items.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-16 sm:py-20 rounded-2xl sm:rounded-3xl bg-white border-2 border-dashed border-slate-200/60"
          >
            <div className="flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-full bg-gradient-to-br from-slate-100 to-slate-200 mb-4">
              <Package className="h-10 w-10 sm:h-12 sm:w-12 text-slate-400" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-2">
              {t("packages.noPackages")}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 text-center px-4">
              {t("packages.willAppearSoon")}
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
