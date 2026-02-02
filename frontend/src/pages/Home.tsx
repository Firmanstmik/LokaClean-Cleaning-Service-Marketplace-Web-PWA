/**
 * Public landing page - Modern, Attractive & Responsive.
 *
 * - If NOT authenticated: show product intro + Login/Register buttons.
 * - If authenticated: route to the correct dashboard (USER vs ADMIN).
 */

import { useState, useEffect } from "react";
import { Link, Navigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, CheckCircle2, MapPin, Camera, Star, Zap, Shield, Heart, ArrowRight, Handshake, Leaf, Globe, User, Calendar, Clock, Home as HomeIcon, Quote, Check, X, Construction } from "lucide-react";

import { useAuth } from "../lib/auth";
import { Footer } from "../components/Footer";
import { getLanguage, setLanguage, t, useCurrentLanguage } from "../lib/i18n";
import { LanguageSwitcherPill } from "../components/LanguageSwitcher";

export function Home() {
  const { token, actor } = useAuth();
  useCurrentLanguage(); // Force re-render on language change

  // Welcome Alert State
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    // Show alert after a short delay for better effect
    const timerStart = setTimeout(() => setShowWelcome(true), 1000);
    
    // Auto hide after 6 seconds
    const timerEnd = setTimeout(() => setShowWelcome(false), 7000);

    return () => {
      clearTimeout(timerStart);
      clearTimeout(timerEnd);
    };
  }, []);

  // Logged-in users should not see the marketing landing page again.
  if (actor === "ADMIN") return <Navigate to="/admin/orders" replace />;
  if (token) return <Navigate to="/packages" replace />;

  const features = [
    {
      icon: Shield,
      title: "Transparent packages",
      description: "Clear pricing & estimated duration up front.",
      gradient: "from-tropical-500 to-tropical-600",
      delay: 0.1
    },
    {
      icon: MapPin,
      title: "Map-based location",
      description: "Pin the exact room location for faster ops.",
      gradient: "from-ocean-500 to-ocean-600",
      delay: 0.2
    },
    {
      icon: Camera,
      title: "Photo verification",
      description: "Before & after photos to confirm quality.",
      gradient: "from-sun-400 to-sun-500",
      delay: 0.3
    },
    {
      icon: Heart,
      title: "Rating & tipping",
      description: "Close the loop and support local workers.",
      gradient: "from-pink-500 to-rose-500",
      delay: 0.4
    }
  ];

  const steps = [
    {
      title: t("home.howItWorks.step1.title"),
      desc: t("home.howItWorks.step1.desc"),
      icon: User
    },
    {
      title: t("home.howItWorks.step2.title"),
      desc: t("home.howItWorks.step2.desc"),
      icon: Calendar
    },
    {
      title: t("home.howItWorks.step3.title"),
      desc: t("home.howItWorks.step3.desc"),
      icon: Camera
    },
    {
      title: t("home.howItWorks.step4.title"),
      desc: t("home.howItWorks.step4.desc"),
      icon: Star
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50/30 to-purple-50/20 overflow-hidden relative">
      
      {/* Welcome Alert - Floating Top Right */}
      <AnimatePresence>
        {showWelcome && (
          <motion.div
            initial={{ opacity: 0, x: 50, y: 20 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, x: 50, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed bottom-4 right-4 z-50 w-[90%] max-w-sm sm:w-auto"
          >
            <div className="relative overflow-hidden rounded-2xl bg-white/95 backdrop-blur-md p-4 shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-amber-200/50 ring-1 ring-black/5">
              
              {/* Decorative gradient line */}
              <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-amber-400 via-orange-500 to-yellow-500" />

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 p-2 shadow-inner">
                  <Construction className="h-5 w-5 text-amber-600" />
                </div>
                
                <div className="flex-1 pt-0.5">
                  <h3 className="text-sm font-bold text-slate-800">
                    {t("home.welcome.title") || "Tahap Pengembangan 🚧"}
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-slate-600">
                    {t("home.welcome.desc") || "Mohon maaf jika aplikasi belum maksimal, saat ini sedang dalam pengembangan awal."}
                  </p>
                </div>

                <button 
                  onClick={() => setShowWelcome(false)}
                  className="ml-2 -mr-1 -mt-1 rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Subtle animated background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-blue-100/20 blur-3xl"
          animate={{
            x: [0, 100, 0],
            y: [0, 80, 0],
            scale: [1, 1.3, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-purple-100/20 blur-3xl"
          animate={{
            x: [0, -80, 0],
            y: [0, -100, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

       {/* Header - Fixed Navbar */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="fixed top-0 left-0 right-0 z-50 border-b border-white/20 bg-white/90 backdrop-blur-xl shadow-sm pt-safe"
      >
        <div className="w-full flex items-center justify-between gap-2 sm:gap-3 px-3 sm:px-6 lg:px-8 py-2 sm:py-3.5">
          <Link
             to="/packages"
             className="flex items-center gap-2 sm:gap-3.5 flex-1 min-w-0 group"
           >
            <motion.div
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              initial={{ opacity: 0, x: -40, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{
                type: "spring",
                damping: 24,
                stiffness: 260,
                duration: 0.5
              }}
              className="relative h-10 w-10 sm:h-14 sm:w-14 flex-shrink-0 rounded-xl sm:rounded-2xl flex items-center justify-center overflow-visible"
            >
              <div className="absolute inset-0 rounded-xl sm:rounded-2xl bg-gradient-to-br from-tropical-400/30 via-ocean-400/25 to-sun-400/30 blur-lg" />
              <motion.div
                className="relative z-10 h-full w-full overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-br from-white via-tropical-50/80 to-ocean-50/80 shadow-[0_8px_24px_rgba(15,23,42,0.15)] flex items-center justify-center border border-white/80"
                animate={{
                  y: [0, -1, 0],
                }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <motion.img
                  src="/img/Logo_LokaClean.jpg"
                  alt="LokaClean Logo"
                  className="h-full w-full object-contain p-1 sm:p-2"
                  animate={{
                    scale: [1, 1.02, 1],
                  }}
                  transition={{
                    duration: 6,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              </motion.div>
            </motion.div>
            
            {/* Premium Brand Typography */}
            <div className="min-w-0 flex flex-col">
              <motion.div
                className="relative"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                <motion.span
                  className="block text-lg sm:text-2xl font-black leading-tight bg-gradient-to-r from-tropical-600 via-ocean-600 to-tropical-600 bg-clip-text text-transparent truncate"
                  animate={{
                    backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                  }}
                  transition={{
                    duration: 5,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                  style={{
                    backgroundSize: "200% 100%",
                  }}
                >
                  LokaClean
                </motion.span>
                {/* Subtle underline accent */}
                <motion.div
                  className="absolute -bottom-0.5 left-0 h-0.5 bg-gradient-to-r from-tropical-500 via-ocean-500 to-tropical-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
                />
              </motion.div>
              <motion.div
                className="text-[9px] sm:text-[11px] font-semibold leading-tight bg-gradient-to-r from-slate-600 via-slate-500 to-slate-600 bg-clip-text text-transparent mt-0.5"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.5 }}
              >
                ✨ {t("home.footer.tagline")}
              </motion.div>
            </div>
           </Link>
           <div className="flex items-center gap-2 sm:gap-3">
             {/* Language Switcher */}
             <LanguageSwitcherPill variant="dark" uniqueId="home-navbar" />

             <Link
               to="/login"
               className="relative rounded-lg sm:rounded-xl border-2 border-slate-200 bg-white/80 backdrop-blur px-2.5 sm:px-4 lg:px-5 py-1 sm:py-2 lg:py-2.5 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all duration-300 shadow-sm overflow-hidden group"
             >
               <span className="relative z-10">{t("home.navbar.login")}</span>
               <motion.div
                 className="absolute inset-0 bg-slate-100"
                 initial={{ x: "-100%" }}
                 whileHover={{ x: 0 }}
                 transition={{ duration: 0.3 }}
               />
             </Link>
             <Link
               to="/register"
               className="hidden sm:flex rounded-lg sm:rounded-xl bg-lombok-gradient px-3 sm:px-4 lg:px-5 py-1.5 sm:py-2 lg:py-2.5 text-xs sm:text-sm font-semibold text-white hover:shadow-[0_8px_24px_rgba(26,188,156,0.4)] transition-all duration-300 hover:scale-105 shadow-lg relative overflow-hidden group"
             >
               <span className="relative z-10 flex items-center gap-1.5 sm:gap-2">
                 {t("home.navbar.register")}
                 <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 group-hover:translate-x-1 transition-transform" />
               </span>
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
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
            </Link>
          </div>
        </div>
      </motion.header>

      {/* Main Content - Hero Section */}
      <main className="relative z-10 w-full pt-12 sm:pt-20 lg:pt-24 pb-0 mt-safe">
        {/* Hero / Branding Section - Full Bleed */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative w-full mb-8 sm:mb-12 min-h-[calc(100vh-80px)] sm:min-h-0 sm:h-[700px] overflow-visible sm:overflow-hidden group"
        >
          {/* 1. Full Background Image (Covering Everything) */}
          <div className="absolute inset-0 z-0 bg-blue-50/50">
             <img 
               src="/img/hero.png" 
               alt="LokaClean Hero" 
               className="hidden sm:block w-full h-full object-contain sm:object-contain object-bottom sm:object-right-bottom transition-transform duration-[10s] ease-in-out group-hover:scale-105"
             />
             {/* Gradient Overlay for Readability on Mobile */}
             <div className="absolute inset-0 bg-gradient-to-b from-white/90 via-white/60 to-transparent sm:bg-gradient-to-r sm:from-white/90 sm:via-white/50 sm:to-transparent" />
             <div className="absolute inset-0 bg-slate-900/5 sm:bg-transparent" />
          </div>

          {/* 2. Mascot Integration (Sidekick style) - REMOVED to avoid duplication */}
          
          {/* 3. Content Overlay (Text on top of Image) */}
          <div className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex flex-col justify-center sm:justify-end pb-8 sm:pb-12 lg:pb-20">
            <div className="max-w-5xl pt-0 sm:pt-0">
                {/* Mobile Hero Image (Top Position) */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                  className="w-full mb-1 sm:hidden flex justify-center"
                >
                  <motion.img 
                    src="/img/hero.png" 
                    alt="LokaClean Hero" 
                    className="h-[270px] w-auto object-contain drop-shadow-2xl filter contrast-110"
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{
                      duration: 10,
                      ease: "easeInOut",
                      repeat: Infinity,
                    }}
                  />
                </motion.div>
                {/* Headlines */}
                <motion.h1
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.6 }}
                  className="text-3xl sm:text-4xl lg:text-5xl font-black leading-[1.1] text-slate-900 mb-1 sm:mb-6 drop-shadow-xl text-center sm:text-left"
                >
                  <span className="inline-block">
                    {t("home.hero.titlePart1")}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-cyan-500 to-blue-500">
                      {t("home.hero.titleHighlight1")}
                    </span>
                  </span>
                  <br className="hidden lg:block" />
                  <span className="inline-block">
                    {t("home.hero.titlePart2")}
                  </span>{" "}
                  <br className="hidden lg:block" />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
                    {t("home.hero.titleHighlight2")}
                  </span>
                  {t("home.hero.titlePart3")}
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.6 }}
                  className="text-sm sm:text-lg text-slate-800 font-semibold leading-relaxed mb-3 sm:mb-8 max-w-lg drop-shadow-md bg-white/40 sm:bg-white/30 backdrop-blur-md p-3.5 rounded-xl border border-white/40 text-center sm:text-left mx-auto sm:mx-0"
                >
                  {t("home.hero.subtitle")}
                </motion.p>

                {/* CTA Buttons - Moved to Hero Section */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.6 }}
                  className="flex flex-row gap-3 sm:gap-4 justify-center sm:justify-start mb-4 sm:mb-10"
                >
                  <Link
                    to="/register"
                    className="flex-1 sm:flex-none sm:w-64 group relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 px-4 sm:px-8 py-3 sm:py-3.5 text-xs sm:text-base font-bold text-white shadow-[0_8px_32px_rgba(59,130,246,0.4)] hover:shadow-[0_12px_48px_rgba(59,130,246,0.5)] transition-all duration-300 hover:scale-105 text-center flex items-center justify-center"
                  >
                    <span className="relative z-10 flex items-center gap-1.5 sm:gap-2">
                      {t("home.hero.ctaRegister")}
                      <ArrowRight className="h-3.5 w-3.5 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform" />
                    </span>
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                      animate={{
                        x: ["-100%", "200%"],
                      }}
                      transition={{
                        duration: 2.5,
                        repeat: Infinity,
                        repeatDelay: 1.5,
                        ease: "linear",
                      }}
                    />
                  </Link>
                  <Link
                    to="/login"
                    className="flex-1 sm:flex-none sm:w-64 relative rounded-xl sm:rounded-2xl border-2 border-slate-300 bg-white/90 backdrop-blur-xl px-4 sm:px-8 py-3 sm:py-3.5 text-xs sm:text-base font-bold text-slate-700 hover:bg-white hover:border-slate-400 hover:shadow-lg transition-all duration-300 hover:scale-105 overflow-hidden group text-center block"
                  >
                    <span className="relative z-10">{t("home.hero.ctaLogin")}</span>
                    <motion.div
                      className="absolute inset-0 bg-slate-100"
                      initial={{ x: "-100%" }}
                      whileHover={{ x: 0 }}
                      transition={{ duration: 0.3 }}
                      />
                  </Link>
                </motion.div>

                {/* Highlight Values (Floating Cards on Image) - Grid on Mobile */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.6 }}
                  className="grid grid-cols-3 gap-2 sm:gap-4 pb-2 sm:pb-0 mx-0 items-stretch w-full max-w-4xl"
                >
                  {/* Item 1 */}
                  <div className="flex flex-col sm:flex-row items-center sm:items-center gap-1.5 sm:gap-3 p-2 sm:p-4 rounded-xl sm:rounded-2xl bg-white/95 backdrop-blur-xl shadow-sm sm:shadow-md border border-slate-100 hover:shadow-lg transition-all duration-300 group w-full h-full">
                    <div className="flex-shrink-0 flex h-8 w-8 sm:h-12 sm:w-12 items-center justify-center rounded-lg sm:rounded-2xl bg-blue-50 text-blue-600 group-hover:scale-110 transition-transform duration-300">
                      <MapPin className="h-4 w-4 sm:h-6 sm:w-6" strokeWidth={2.5} />
                    </div>
                    <div className="text-center sm:text-left w-full min-w-0 flex flex-col justify-center">
                      <h3 className="font-bold text-slate-900 text-[10px] sm:text-base leading-tight mb-0.5 sm:mb-0.5 whitespace-normal sm:whitespace-nowrap min-h-0 sm:min-h-[2.4em] flex items-center justify-center sm:justify-start">{t("home.hero.feature1.title")}</h3>
                      <p className="text-[9px] sm:text-sm text-slate-500 font-medium leading-tight whitespace-normal sm:whitespace-nowrap">{t("home.hero.feature1.desc")}</p>
                    </div>
                  </div>

                  {/* Item 2 */}
                  <div className="flex flex-col sm:flex-row items-center sm:items-center gap-1.5 sm:gap-3 p-2 sm:p-4 rounded-xl sm:rounded-2xl bg-white/95 backdrop-blur-xl shadow-sm sm:shadow-md border border-slate-100 hover:shadow-lg transition-all duration-300 group w-full h-full">
                    <div className="flex-shrink-0 flex h-8 w-8 sm:h-12 sm:w-12 items-center justify-center rounded-lg sm:rounded-2xl bg-green-50 text-green-600 group-hover:scale-110 transition-transform duration-300">
                      <Leaf className="h-4 w-4 sm:h-6 sm:w-6" strokeWidth={2.5} />
                    </div>
                    <div className="text-center sm:text-left w-full min-w-0 flex flex-col justify-center">
                      <h3 className="font-bold text-slate-900 text-[10px] sm:text-base leading-tight mb-0.5 sm:mb-0.5 whitespace-normal sm:whitespace-nowrap min-h-0 sm:min-h-[2.4em] flex items-center justify-center sm:justify-start">{t("home.hero.feature2.title")}</h3>
                      <p className="text-[9px] sm:text-sm text-slate-500 font-medium leading-tight whitespace-normal sm:whitespace-nowrap">{t("home.hero.feature2.desc")}</p>
                    </div>
                  </div>

                  {/* Item 3 */}
                  <div className="flex flex-col sm:flex-row items-center sm:items-center gap-1.5 sm:gap-3 p-2 sm:p-4 rounded-xl sm:rounded-2xl bg-white/95 backdrop-blur-xl shadow-sm sm:shadow-md border border-slate-100 hover:shadow-lg transition-all duration-300 group w-full h-full">
                    <div className="flex-shrink-0 flex h-8 w-8 sm:h-12 sm:w-12 items-center justify-center rounded-lg sm:rounded-2xl bg-purple-50 text-purple-600 group-hover:scale-110 transition-transform duration-300">
                      <Handshake className="h-4 w-4 sm:h-6 sm:w-6" strokeWidth={2.5} />
                    </div>
                    <div className="text-center sm:text-left w-full min-w-0 flex flex-col justify-center">
                      <h3 className="font-bold text-slate-900 text-[10px] sm:text-base leading-tight mb-0.5 sm:mb-0.5 whitespace-normal sm:whitespace-nowrap min-h-0 sm:min-h-[2.4em] flex items-center justify-center sm:justify-start">{t("home.hero.feature3.title")}</h3>
                      <p className="text-[9px] sm:text-sm text-slate-500 font-medium leading-tight whitespace-normal sm:whitespace-nowrap">{t("home.hero.feature3.desc")}</p>
                    </div>
                  </div>
                </motion.div>

              </div>
            </div>
        </motion.section>

        {/* Content Wrapper for remaining sections */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-12 sm:pb-16 lg:pb-20">

          {/* How It Works - Premium Mobile Style */}
        <div className="mb-12 sm:mb-24 relative z-10">
          <div className="text-center mb-10 sm:mb-16">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-block mb-3"
            >
              <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-600 text-xs font-bold uppercase tracking-wider">
                {t("home.howItWorks.subtitle") || "Simple Process"}
              </span>
            </motion.div>
            
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mb-4 tracking-tight">
              {t("home.howItWorks.title")}
            </h2>
            <div className="w-24 h-1.5 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto rounded-full" />
          </div>
          
          <div className="block sm:hidden relative px-2">
            <div className="grid grid-cols-4 gap-2">
              {steps.map((step, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  className="relative p-3 rounded-2xl bg-white/70 backdrop-blur-sm border border-white/60 shadow-md flex flex-col items-center"
                >
                  <div className="w-12 h-12 rounded-xl bg-white border border-slate-100 shadow-sm flex items-center justify-center mb-2 relative">
                    <div className={`absolute inset-0 rounded-xl bg-gradient-to-br ${
                      index === 0 ? "from-blue-500/10 to-cyan-500/10" :
                      index === 1 ? "from-purple-500/10 to-pink-500/10" :
                      index === 2 ? "from-orange-500/10 to-yellow-500/10" :
                                    "from-green-500/10 to-emerald-500/10"
                    }`} />
                    <step.icon className={`h-6 w-6 ${
                      index === 0 ? "text-blue-600" :
                      index === 1 ? "text-purple-600" :
                      index === 2 ? "text-orange-600" :
                                    "text-green-600"
                    }`} strokeWidth={1.5} />
                    <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-bold border-2 border-white shadow-sm">
                      {index + 1}
                    </div>
                  </div>
                  <h3 className="text-[11px] font-bold text-slate-900 text-center leading-snug truncate w-full">{step.title}</h3>
                </motion.div>
              ))}
            </div>
            <div className="absolute left-6 right-6 top-[28px] h-0.5 bg-gradient-to-r from-blue-200 via-purple-200 to-blue-200 -z-10 rounded-full" />
          </div>

          <div className="hidden sm:grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 relative px-4 sm:px-0">
            <div className="hidden lg:block absolute top-16 left-[12%] right-[12%] h-0.5 bg-gradient-to-r from-blue-200 via-purple-200 to-blue-200 -z-10" />
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15, duration: 0.6, ease: "easeOut" }}
                className="relative flex flex-col items-center text-center group"
              >
                <div className="relative p-6 rounded-3xl bg-white/50 backdrop-blur-sm border border-white/60 shadow-lg hover:shadow-xl hover:-translate-y-2 transition-all duration-300 w-full h-full flex flex-col items-center">
                  <div className="w-20 h-20 mx-auto rounded-2xl bg-white border border-slate-100 shadow-md flex items-center justify-center mb-6 relative z-10">
                    <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${
                      index === 0 ? "from-blue-500/10 to-cyan-500/10" :
                      index === 1 ? "from-purple-500/10 to-pink-500/10" :
                      index === 2 ? "from-orange-500/10 to-yellow-500/10" :
                                    "from-green-500/10 to-emerald-500/10"
                    } opacity-100`} />
                    <step.icon className={`h-10 w-10 ${
                      index === 0 ? "text-blue-600" :
                      index === 1 ? "text-purple-600" :
                      index === 2 ? "text-orange-600" :
                                    "text-green-600"
                    }`} strokeWidth={1.5} />
                    <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-sm font-bold border-4 border-white shadow-sm">
                      {index + 1}
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">{step.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Featured Package - Pembersihan Rumah Baru */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.6 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 shadow-2xl border border-white/10 mb-8 sm:mb-12"
        >
          {/* Background Effects */}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/95 via-slate-900/80 to-transparent z-10" />
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-30" />
          
          <div className="relative z-20 grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 sm:p-5 items-center">
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-0.5 sm:px-4 sm:py-1.5 text-[10px] sm:text-sm font-bold text-white backdrop-blur-md border border-white/20 shadow-lg">
                  <Star className="h-2.5 w-2.5 sm:h-3.5 sm:w-3.5 text-yellow-400 fill-yellow-400" /> PREMIUM
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/20 px-2.5 py-0.5 sm:px-4 sm:py-1.5 text-[10px] sm:text-sm font-bold text-blue-200 backdrop-blur-md border border-blue-500/30">
                  {t("home.featured.newHome.badge")}
                </span>
              </div>
              
              <h3 className="text-lg sm:text-3xl lg:text-4xl font-bold text-white leading-tight">
                {t("home.featured.newHome.title")}
              </h3>
              <p className="text-slate-300 text-[11px] sm:text-base lg:text-lg leading-relaxed max-w-xl">
                {t("home.featured.newHome.desc")}
              </p>
              
              <Link
                to="/packages"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-xs sm:text-base font-bold text-slate-900 hover:bg-blue-50 transition-colors duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
              >
                {t("home.featured.newHome.cta")}
                <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4" />
              </Link>
            </div>
            
            <div className="relative hidden sm:flex sm:h-48 lg:h-80 items-end justify-center sm:justify-end overflow-visible">
               {/* Mascot Illustration Placeholder - Mascot moved to global scope */}
            </div>
          </div>
        </motion.div>



        {/* Testimonials - Aligned with How It Works Design */}
        <section className="mb-12 sm:mb-24 relative z-10">
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
      </main>


      {/* Footer */}
      <Footer variant="all" />
      
    </div>
  );
}
