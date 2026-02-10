/**
 * Public landing page - Modern, Attractive & Responsive.
 *
 * - If NOT authenticated: show product intro + Login/Register buttons.
 * - If authenticated: route to the correct dashboard (USER vs ADMIN).
 */

import { useState, useEffect } from "react";
import { Link, Navigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Camera, Star, ArrowRight, Handshake, Leaf, User, Calendar, X, Construction, Shield, Heart, Zap, LogIn, Download, Quote } from "lucide-react";

import { useAuth } from "../lib/auth";
import { Footer } from "../components/Footer";
import { getLanguage, setLanguage, t, useCurrentLanguage } from "../lib/i18n";
import { LanguageSwitcherPill } from "../components/LanguageSwitcher";
import { api } from "../lib/api";
import type { PaketCleaning } from "../types/api";
import { getPackageImage } from "../utils/packageImage";
import { PackageDetailModal } from "../components/PackageDetailModal";
import { LoginRequiredModal } from "../components/LoginRequiredModal";
import { MobileWelcome } from "./MobileWelcome";
import { OptimizedImage } from "../components/ui/OptimizedImage";
import { IOSInstallPrompt } from "../components/IOSInstallPrompt";
import { AndroidInstallPrompt } from "../components/AndroidInstallPrompt";

import { Helmet } from "react-helmet-async";

export function Home() {
  const { token, actor } = useAuth();
  useCurrentLanguage(); // Force re-render on language change

  // PWA Standalone Mode Check
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;

  const [showWelcome, setShowWelcome] = useState(false);
  const [showIOSPrompt, setShowIOSPrompt] = useState(false);
  const [showAndroidPrompt, setShowAndroidPrompt] = useState(false);
  const [packages, setPackages] = useState<PaketCleaning[]>([]);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [selectedPackage, setSelectedPackage] = useState<PaketCleaning | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  useEffect(() => {
    api.get("/packages").then((res) => {
      if (res.data?.data?.items) {
        setPackages((res.data.data.items as PaketCleaning[]).slice(0, 4));
      }
    }).catch(() => {});
  }, []);

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
  if (token) return <Navigate to="/home" replace />;

  // If PWA and NOT logged in, show MobileWelcome instead of standard Home
  if (isStandalone) {
    return <MobileWelcome />;
  }

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
    <div className="min-h-screen bg-white sm:bg-gradient-to-br sm:from-white sm:via-blue-50/30 sm:to-purple-50/20 overflow-hidden relative">
      <Helmet>
        <title>Jasa Kebersihan Lombok & Mandalika | LokaClean</title>
        <meta name="description" content="Jasa cleaning service profesional di Kuta Mandalika & Lombok Tengah. Villa cleaning, home cleaning, daily housekeeping standar hotel. Booking via aplikasi sekarang." />
        
        {/* OpenGraph / Social Media */}
        <meta property="og:title" content="Jasa Kebersihan Lombok & Mandalika | LokaClean" />
        <meta property="og:description" content="Jasa cleaning service profesional di Kuta Mandalika. Villa cleaning, home cleaning, daily housekeeping standar hotel." />
        <meta property="og:image" content="https://lokaclean.com/img/hero.png" />
        <meta property="og:url" content="https://lokaclean.com" />
        <meta property="og:type" content="website" />
        <meta property="og:locale" content="id_ID" />
        <meta property="og:site_name" content="LokaClean" />
        
        <script type="application/ld+json">
          {`
            {
              "@context": "https://schema.org",
              "@type": "LocalBusiness",
              "name": "LokaClean",
              "image": "https://lokaclean.com/img/logo.jpg",
              "address": {
                "@type": "PostalAddress",
                "addressLocality": "Kuta",
                "addressRegion": "Lombok Tengah",
                "addressCountry": "ID"
              },
              "priceRange": "$$"
            }
          `}
        </script>
      </Helmet>
      
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
            <div className="relative overflow-hidden rounded-2xl bg-white/95 sm:backdrop-blur-md p-4 shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-amber-200/50 ring-1 ring-black/5">
              
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

      {/* Subtle animated background particles - Hidden on mobile for performance */}
      <div className="hidden sm:block absolute inset-0 overflow-hidden pointer-events-none">
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
        className="fixed top-0 left-0 right-0 z-50 border-b border-white/20 bg-white/95 sm:bg-white/90 sm:backdrop-blur-xl shadow-sm pt-safe"
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
                >
                  <motion.img
                    src="/img/Logo_LokaClean.jpg"
                    alt="LokaClean Logo"
                    className="h-full w-full object-contain p-1 sm:p-2"
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
               className="relative rounded-lg sm:rounded-xl border-2 border-slate-200 bg-white sm:bg-white/80 sm:backdrop-blur px-2.5 sm:px-4 lg:px-5 py-1 sm:py-2 lg:py-2.5 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all duration-300 shadow-sm overflow-hidden group"
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
               fetchPriority="high"
               loading="eager"
               decoding="async"
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
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="w-full mb-1 sm:hidden flex justify-center will-change-transform"
                >
                  <img 
                    src="/img/hero.png" 
                    alt="LokaClean Hero" 
                    fetchPriority="high"
                    loading="eager"
                    decoding="async"
                    className="h-[270px] w-auto object-contain drop-shadow-2xl filter contrast-110"
                  />
                </motion.div>
                {/* Headlines */}
                <motion.h1
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.5, ease: "easeOut" }}
                  className="text-2xl sm:text-4xl lg:text-5xl font-black leading-[1.1] text-slate-900 mb-1 sm:mb-6 drop-shadow-xl text-center sm:text-left will-change-transform"
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
                  transition={{ delay: 0.2, duration: 0.5, ease: "easeOut" }}
                  className="text-sm sm:text-lg text-slate-800 font-semibold leading-relaxed mb-3 sm:mb-8 max-w-lg drop-shadow-md bg-white/40 sm:bg-white/30 sm:backdrop-blur-md p-3.5 rounded-xl border border-white/40 text-center sm:text-left mx-auto sm:mx-0 will-change-transform"
                >
                  {t("home.hero.subtitle")}
                </motion.p>

                {/* CTA Buttons - Moved to Hero Section */}
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.5, ease: "easeOut" }}
                  className="flex flex-row gap-3 sm:gap-4 justify-center sm:justify-start mb-4 sm:mb-10 will-change-transform"
                >
                  <Link
                    to="/register"
                    className="w-36 sm:w-64 group relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 px-3 sm:px-8 py-2.5 sm:py-3.5 text-xs sm:text-base font-bold text-white shadow-[0_8px_32px_rgba(59,130,246,0.4)] hover:shadow-[0_12px_48px_rgba(59,130,246,0.5)] transition-all duration-300 hover:scale-105 text-center flex items-center justify-center whitespace-nowrap"
                  >
                    <span className="relative z-10 flex items-center gap-1.5 sm:gap-2">
                      {t("home.hero.ctaRegister")}
                      <ArrowRight className="h-3.5 w-3.5 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform" />
                    </span>
                    <motion.div
                      className="hidden sm:block absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
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
                    className="w-36 sm:w-64 relative rounded-xl sm:rounded-2xl border-2 border-slate-300 bg-white/90 sm:backdrop-blur-xl px-3 sm:px-8 py-2.5 sm:py-3.5 text-xs sm:text-base font-bold text-slate-700 hover:bg-white hover:border-slate-400 hover:shadow-lg transition-all duration-300 hover:scale-105 overflow-hidden group text-center block whitespace-nowrap"
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
                  transition={{ delay: 0.4, duration: 0.5, ease: "easeOut" }}
                  className="grid grid-cols-3 gap-2 sm:gap-4 pb-2 sm:pb-0 mx-0 items-stretch w-full max-w-4xl will-change-transform"
                >
                  {/* Item 1 */}
                  <div className="flex flex-col sm:flex-row items-center sm:items-center gap-1.5 sm:gap-3 p-2 sm:p-4 rounded-xl sm:rounded-2xl bg-white sm:bg-white/95 sm:backdrop-blur-xl shadow-sm sm:shadow-md border border-slate-100 hover:shadow-lg transition-all duration-300 group w-full h-full">
                    <div className="flex-shrink-0 flex h-8 w-8 sm:h-12 sm:w-12 items-center justify-center rounded-lg sm:rounded-2xl bg-blue-50 text-blue-600 group-hover:scale-110 transition-transform duration-300">
                      <MapPin className="h-4 w-4 sm:h-6 sm:w-6" strokeWidth={2.5} />
                    </div>
                    <div className="text-center sm:text-left w-full min-w-0 flex flex-col justify-center">
                      <h3 className="font-bold text-slate-900 text-[10px] sm:text-base leading-tight mb-0.5 sm:mb-0.5 whitespace-normal sm:whitespace-nowrap min-h-0 sm:min-h-[2.4em] flex items-center justify-center sm:justify-start">{t("home.hero.feature1.title")}</h3>
                      <p className="text-[9px] sm:text-sm text-slate-500 font-medium leading-tight whitespace-normal sm:whitespace-nowrap">{t("home.hero.feature1.desc")}</p>
                    </div>
                  </div>

                  {/* Item 2 */}
                  <div className="flex flex-col sm:flex-row items-center sm:items-center gap-1.5 sm:gap-3 p-2 sm:p-4 rounded-xl sm:rounded-2xl bg-white sm:bg-white/95 sm:backdrop-blur-xl shadow-sm sm:shadow-md border border-slate-100 hover:shadow-lg transition-all duration-300 group w-full h-full">
                    <div className="flex-shrink-0 flex h-8 w-8 sm:h-12 sm:w-12 items-center justify-center rounded-lg sm:rounded-2xl bg-green-50 text-green-600 group-hover:scale-110 transition-transform duration-300">
                      <Leaf className="h-4 w-4 sm:h-6 sm:w-6" strokeWidth={2.5} />
                    </div>
                    <div className="text-center sm:text-left w-full min-w-0 flex flex-col justify-center">
                      <h3 className="font-bold text-slate-900 text-[10px] sm:text-base leading-tight mb-0.5 sm:mb-0.5 whitespace-normal sm:whitespace-nowrap min-h-0 sm:min-h-[2.4em] flex items-center justify-center sm:justify-start">{t("home.hero.feature2.title")}</h3>
                      <p className="text-[9px] sm:text-sm text-slate-500 font-medium leading-tight whitespace-normal sm:whitespace-nowrap">{t("home.hero.feature2.desc")}</p>
                    </div>
                  </div>

                  {/* Item 3 */}
                  <div className="flex flex-col sm:flex-row items-center sm:items-center gap-1.5 sm:gap-3 p-2 sm:p-4 rounded-xl sm:rounded-2xl bg-white sm:bg-white/95 sm:backdrop-blur-xl shadow-sm sm:shadow-md border border-slate-100 hover:shadow-lg transition-all duration-300 group w-full h-full">
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

        {/* SEO Text Section - Visible for Google */}
        <section className="w-full bg-slate-50 border-y border-slate-200 py-10 px-4 sm:px-6 lg:px-8 mb-12">
          <div className="max-w-4xl mx-auto text-center">
             <h2 className="text-xl font-bold text-slate-800 mb-3">Layanan Kebersihan Profesional Lombok</h2>
             <p className="text-slate-600 text-base leading-relaxed">
               LokaClean melayani jasa kebersihan profesional di Kuta Mandalika dan Lombok Tengah. Menyediakan layanan villa cleaning, home cleaning, dan daily housekeeping dengan standar hotel.
             </p>
          </div>
        </section>

        {/* Content Wrapper for remaining sections */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-12 sm:pb-16 lg:pb-20">

          {/* How It Works - Premium Mobile Style */}
        <div className="mb-12 sm:mb-24 relative z-10">
          <div className="text-center mb-10 sm:mb-16">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-10%" }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="inline-block mb-3 will-change-transform"
            >
              <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-600 text-xs font-bold uppercase tracking-wider">
                {t("home.howItWorks.subtitle") || "Simple Process"}
              </span>
            </motion.div>
            
            <motion.h2 
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-10%" }}
              transition={{ delay: 0.1, duration: 0.5, ease: "easeOut" }}
              className="text-3xl sm:text-4xl font-black text-slate-900 mb-4 tracking-tight will-change-transform"
            >
              {t("home.howItWorks.title")}
            </motion.h2>
            <motion.div 
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.5, ease: "easeOut" }}
              className="w-24 h-1.5 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto rounded-full origin-center will-change-transform" 
            />
          </div>
          
          <div className="block sm:hidden relative px-2">
            <div className="grid grid-cols-4 gap-2">
              {steps.map((step, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-5%" }}
                  transition={{ delay: index * 0.1, duration: 0.4, ease: "easeOut" }}
                  className="relative p-3 rounded-2xl bg-white border border-slate-100 shadow-md flex flex-col items-center will-change-transform"
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
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 shadow-2xl border border-white/10 mb-8 sm:mb-12 will-change-transform"
        >
          {/* Background Effects */}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/95 via-slate-900/80 to-transparent z-10" />
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-30" />
          
          <div className="relative z-20 grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 sm:p-5 items-center">
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-0.5 sm:px-4 sm:py-1.5 text-[10px] sm:text-sm font-bold text-white sm:backdrop-blur-md border border-white/20 shadow-lg">
                  <Star className="h-2.5 w-2.5 sm:h-3.5 sm:w-3.5 text-yellow-400 fill-yellow-400" /> PREMIUM
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/20 px-2.5 py-0.5 sm:px-4 sm:py-1.5 text-[10px] sm:text-sm font-bold text-blue-200 sm:backdrop-blur-md border border-blue-500/30">
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

        {/* Popular Packages List */}
        <section className="mb-12 sm:mb-24 relative z-10">
          <div className="text-center mb-10 sm:mb-16">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-10%" }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="inline-block mb-3 will-change-transform"
            >
              <span className="px-3 py-1 rounded-full bg-teal-100 text-teal-600 text-xs font-bold uppercase tracking-wider">
                {t("home.packages.subtitle") || "Best Value"}
              </span>
            </motion.div>
            
            <motion.h2 
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-10%" }}
              transition={{ delay: 0.1, duration: 0.5, ease: "easeOut" }}
              className="text-3xl sm:text-4xl font-black text-slate-900 mb-4 tracking-tight will-change-transform"
            >
              {t("home.packages.title") || "Layanan Favorit"}
            </motion.h2>
            <motion.div 
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.5, ease: "easeOut" }}
              className="w-24 h-1.5 bg-gradient-to-r from-teal-500 to-emerald-500 mx-auto rounded-full mb-6 origin-center will-change-transform" 
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-6 max-w-7xl mx-auto">
            {packages.map((pkg, index) => (
              <motion.div
                key={pkg.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="group relative flex flex-col overflow-hidden rounded-2xl bg-white shadow-md border border-slate-300 hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.15)] hover:border-teal-500/50 transition-all duration-300"
              >
                <div 
                  className="relative aspect-[4/3] sm:aspect-video overflow-hidden cursor-pointer bg-slate-100"
                  onClick={() => setSelectedPackage(pkg)}
                >
                  <OptimizedImage 
                    src={getPackageImage(pkg.name, pkg.image)} 
                    alt={pkg.name}
                    priority={index < 2} // Preload first 2 packages
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
                  
                  {/* Floating Price Badge */}
                  <div className="absolute bottom-2 left-2 right-auto sm:bottom-3 sm:left-3 bg-white sm:bg-white/90 sm:backdrop-blur-sm px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg shadow-sm border border-white/50">
                     <p className="text-xs sm:text-sm font-bold text-teal-700">
                       Rp {pkg.price.toLocaleString("id-ID")}
                    </p>
                  </div>
                </div>

                <div className="flex flex-1 flex-col p-3 sm:p-5">
                  <div className="mb-2 sm:mb-3">
                    <h3 className="text-sm sm:text-lg font-bold text-slate-800 leading-tight mb-1 line-clamp-1 group-hover:text-teal-600 transition-colors">{pkg.name}</h3>
                    <div className="h-0.5 w-8 sm:w-12 bg-teal-500/30 rounded-full" />
                  </div>
                  
                  <p className="mb-4 text-xs sm:text-sm text-slate-500 line-clamp-2 leading-relaxed">
                    {pkg.description}
                  </p>
                  
                  <button
                    onClick={() => setSelectedPackage(pkg)}
                    className="mt-auto flex items-center justify-center gap-1.5 w-full rounded-xl bg-slate-50 border border-slate-200 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-slate-600 hover:bg-teal-50 hover:text-teal-700 hover:border-teal-200 transition-all duration-300 group/btn"
                  >
                    <span>{t("orders.viewDetails")}</span>
                    <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 opacity-0 -translate-x-2 group-hover/btn:opacity-100 group-hover/btn:translate-x-0 transition-all" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
          
          <div className="mt-10 flex justify-center">
             <Link 
               to="/packages/all"
               className="group flex items-center gap-2 text-teal-600 font-bold hover:text-teal-700 transition-colors"
             >
               Lihat Semua Paket <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
             </Link>
          </div>
        </section>

        {/* Premium Login & Install App CTA - Redesigned */}
        <section className="mb-12 sm:mb-24 px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-10%" }}
            className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 shadow-[0_20px_60px_-15px_rgba(15,23,42,0.6)] transition-all duration-500 isolate group hover:shadow-[0_0_50px_-10px_rgba(20,184,166,0.3)]"
          >
            {/* Animated Dashed Border */}
            <div className="absolute inset-0 z-0 pointer-events-none rounded-[2.5rem]">
               <svg className="absolute inset-0 w-full h-full" style={{ overflow: 'visible' }}>
                 <defs>
                   <linearGradient id="borderGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                     <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.4" />
                     <stop offset="50%" stopColor="#2dd4bf" stopOpacity="1" />
                     <stop offset="100%" stopColor="#14b8a6" stopOpacity="0.4" />
                   </linearGradient>
                 </defs>
                 <motion.rect
                   x="2" y="2"
                   width="calc(100% - 4px)" height="calc(100% - 4px)"
                   rx="38" ry="38"
                   fill="none"
                   stroke="url(#borderGradient)"
                   strokeWidth="3"
                   strokeDasharray="20 15"
                   strokeLinecap="round"
                   initial={{ strokeDashoffset: 0 }}
                   animate={{ strokeDashoffset: -1000 }}
                   transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                 />
               </svg>
            </div>

            {/* Animated Background Elements - Optimized for Mobile (Hidden on small screens) */}
            <div className="hidden sm:block absolute top-0 right-0 -mr-20 -mt-20 w-[30rem] h-[30rem] bg-teal-500/20 rounded-full blur-[80px] opacity-40 mix-blend-screen group-hover:opacity-60 transition-opacity duration-700" />
            <div className="hidden sm:block absolute bottom-0 left-0 -ml-20 -mb-20 w-[25rem] h-[25rem] bg-indigo-500/20 rounded-full blur-[80px] opacity-40 mix-blend-screen group-hover:opacity-60 transition-opacity duration-700" />
            
            {/* Noise Texture & Grid Overlay - Hidden on Mobile for Performance */}
            <div className="hidden sm:block absolute inset-0 opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] brightness-100 contrast-150 mix-blend-overlay pointer-events-none" />
            <div className="hidden sm:block absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_70%)] pointer-events-none" />

            <div className="relative z-10 grid lg:grid-cols-12 gap-8 items-center p-6 sm:p-12 lg:p-16">
              
              {/* Left Content */}
              <div className="lg:col-span-7 text-left space-y-5 sm:space-y-8">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/50 border border-slate-700/50 backdrop-blur-md">
                   <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
                    </span>
                   <span className="text-[10px] sm:text-xs font-bold tracking-widest text-teal-400 uppercase">{t("home.premiumCTA.badge")}</span>
                </div>

                <div className="space-y-3 sm:space-y-4 relative">
                  <div className="flex items-center justify-between gap-2 sm:gap-4">
                     <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight relative z-10">
                       {t("home.premiumCTA.title.part1")} <br/>
                       <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-emerald-400 to-teal-400">{t("home.premiumCTA.title.part2")}</span>
                     </h2>
                     
                     {/* Mobile Only Mini 3D Phone - Smaller & Next to Text */}
                     <div className="lg:hidden block relative w-14 h-20 sm:w-16 sm:h-24 flex-shrink-0" style={{ perspective: "600px" }}>
                       <motion.div 
                          initial={{ rotateY: 12, rotateZ: 6 }}
                          animate={{ rotateY: [12, -12, 12], rotateZ: [6, -6, 6] }}
                          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                          className="relative w-full h-full will-change-transform"
                          style={{ transformStyle: "preserve-3d" }}
                       >
                          <div className="absolute inset-0 bg-slate-900 rounded-lg border-2 border-slate-700/50 shadow-lg flex flex-col overflow-hidden">
                              {/* Fake App UI Mini */}
                              <div className="h-1/3 bg-gradient-to-br from-teal-600 to-emerald-600 p-1 relative overflow-hidden">
                                 <div className="absolute top-0 right-0 w-4 h-4 bg-white/10 rounded-full blur-sm -mr-1 -mt-1" />
                                 <div className="flex items-center justify-between mb-0.5">
                                    <div className="w-1.5 h-1.5 bg-white/20 rounded-full" />
                                    <div className="w-3 h-0.5 bg-white/20 rounded-full" />
                                 </div>
                              </div>
                              <div className="flex-1 bg-slate-800 p-1 space-y-0.5">
                                 <div className="h-3 bg-slate-700/50 rounded animate-pulse" />
                                 <div className="h-3 bg-slate-700/50 rounded animate-pulse delay-75" />
                              </div>
                              {/* Reflection */}
                              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent pointer-events-none" />
                          </div>
                          
                          {/* Mini Floating Icon */}
                          <motion.div 
                            animate={{ y: [0, -2, 0] }}
                            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute -right-1 top-1/4 p-0.5 bg-white/10 backdrop-blur-md rounded border border-white/20 shadow-sm"
                          >
                             <Zap className="w-2 h-2 text-yellow-400 fill-yellow-400" />
                          </motion.div>
                       </motion.div>
                       {/* Mini Glow */}
                       <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-teal-500/20 blur-[10px] -z-10 rounded-full" />
                     </div>
                  </div>

                  <p className="text-slate-400 text-sm sm:text-lg leading-relaxed max-w-lg">
                    {t("home.premiumCTA.description")}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-1 sm:pt-2">
                  <Link
                    to="/login"
                    className="group/btn relative flex items-center justify-center gap-2 sm:gap-3 px-4 sm:px-8 py-2.5 sm:py-4 rounded-xl sm:rounded-2xl bg-white text-slate-900 font-bold transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-teal-50 to-white opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                    <LogIn className="w-4 h-4 sm:w-5 sm:h-5 text-slate-900 relative z-10" />
                    <span className="relative z-10 text-sm sm:text-base">{t("home.premiumCTA.buttons.login")}</span>
                  </Link>
                  
                  <button
                    onClick={() => {
                       if (deferredPrompt) {
                         deferredPrompt.prompt();
                         deferredPrompt.userChoice.then((choiceResult: any) => {
                           if (choiceResult.outcome === "accepted") {
                             setDeferredPrompt(null);
                           }
                         });
                       } else {
                         const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
                         const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream;
                         const isAndroid = /android/i.test(userAgent);

                         if (isIOS) {
                           setShowIOSPrompt(true);
                         } else if (isAndroid) {
                           setShowAndroidPrompt(true);
                         } else {
                           alert("Silakan buka menu browser Anda dan pilih 'Add to Home Screen' atau 'Install App' untuk menginstall LokaClean.");
                         }
                       }
                    }}
                    className="group/btn relative flex items-center justify-center gap-2 sm:gap-3 px-4 sm:px-8 py-2.5 sm:py-4 rounded-xl sm:rounded-2xl bg-white/5 text-white font-bold backdrop-blur-md border border-white/10 transition-all duration-300 hover:bg-white/10 hover:border-white/20 hover:scale-[1.02]"
                  >
                    <Download className="w-4 h-4 sm:w-5 sm:h-5 text-teal-400 group-hover/btn:text-teal-300 transition-colors" />
                    <span className="text-sm sm:text-base">{t("home.premiumCTA.buttons.install")}</span>
                  </button>
                </div>
                
                <div className="flex items-center gap-4 pt-4 border-t border-slate-800/50">
                   <div className="flex -space-x-3">
                      {[1,2,3].map(i => (
                        <div key={i} className="w-8 h-8 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center text-[10px] text-slate-400 overflow-hidden">
                           <User className="w-4 h-4 text-slate-500" />
                        </div>
                      ))}
                      <div className="w-8 h-8 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center text-[10px] text-white font-bold bg-teal-600">
                        +1k
                      </div>
                   </div>
                   <p className="text-xs text-slate-500 font-medium">{t("home.premiumCTA.socialProof")}</p>
                </div>
              </div>

              {/* Right Visual - 3D Abstract Phone Card */}
              <div className="hidden lg:block lg:col-span-5 relative" style={{ perspective: "1000px" }}>
                 <motion.div 
                    initial={{ rotateY: 12, rotateZ: 6 }}
                    whileHover={{ rotateY: 0, rotateZ: 0 }}
                    transition={{ type: "spring", stiffness: 100, damping: 20 }}
                    className="relative w-64 mx-auto aspect-[9/18]"
                    style={{ transformStyle: "preserve-3d" }}
                 >
                    <div className="absolute inset-0 bg-slate-900 rounded-[2rem] border-4 border-slate-700/50 shadow-2xl flex flex-col overflow-hidden">
                        {/* Fake App UI */}
                        <div className="h-1/3 bg-gradient-to-br from-teal-600 to-emerald-600 p-4 relative overflow-hidden">
                           <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10" />
                           <div className="flex items-center justify-between mb-4">
                              <div className="w-8 h-8 bg-white/20 rounded-full backdrop-blur-md" />
                              <div className="w-16 h-4 bg-white/20 rounded-full backdrop-blur-md" />
                           </div>
                           <div className="space-y-2">
                              <div className="w-2/3 h-4 bg-white/20 rounded-full" />
                              <div className="w-1/2 h-3 bg-white/10 rounded-full" />
                           </div>
                        </div>
                        <div className="flex-1 bg-slate-800 p-4 space-y-3">
                           <div className="h-20 bg-slate-700/50 rounded-xl animate-pulse" />
                           <div className="h-20 bg-slate-700/50 rounded-xl animate-pulse delay-75" />
                           <div className="h-20 bg-slate-700/50 rounded-xl animate-pulse delay-150" />
                        </div>
                        
                        {/* Reflection */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none" />
                    </div>
                    
                    {/* Floating Elements */}
                    <motion.div 
                      animate={{ y: [0, -10, 0] }}
                      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                      className="absolute -right-8 top-1/4 p-3 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-lg"
                    >
                       <Zap className="w-6 h-6 text-yellow-400 fill-yellow-400" />
                    </motion.div>
                    
                    <motion.div 
                      animate={{ y: [0, 10, 0] }}
                      transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                      className="absolute -left-8 bottom-1/3 p-3 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-lg"
                    >
                       <Shield className="w-6 h-6 text-teal-400" />
                    </motion.div>
                 </motion.div>
                 
                 {/* Glow behind */}
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-teal-500/30 blur-[60px] -z-10 rounded-full" />
              </div>

            </div>
          </motion.div>
        </section>

        {/* Testimonials - Aligned with How It Works Design */}
        <section className="mb-6 sm:mb-24 relative z-10">
          <div className="text-center mb-10 sm:mb-16">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-10%" }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="inline-block mb-3 will-change-transform"
            >
              <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-600 text-xs font-bold uppercase tracking-wider">
                Testimonials
              </span>
            </motion.div>
            
            <motion.h2 
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-10%" }}
              transition={{ delay: 0.1, duration: 0.5, ease: "easeOut" }}
              className="text-3xl sm:text-4xl font-black text-slate-900 mb-4 tracking-tight will-change-transform"
            >
              {t("home.testimonials.title")}
            </motion.h2>
            <motion.div 
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.5, ease: "easeOut" }}
              className="w-24 h-1.5 bg-gradient-to-r from-purple-500 to-pink-500 mx-auto rounded-full mb-6 origin-center will-change-transform" 
            />
            <motion.p 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="text-slate-600 max-w-2xl mx-auto text-sm sm:text-base will-change-opacity"
            >
              {t("home.testimonials.subtitle")}
            </motion.p>
          </div>
             
          <div className="block sm:hidden px-2">
            <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth -mx-2 px-2 pb-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
              {[
                { name: t("home.testimonials.item1.name"), role: t("home.testimonials.item1.role"), text: t("home.testimonials.item1.text"), rating: 5, initial: "J" },
                { name: t("home.testimonials.item2.name"), role: t("home.testimonials.item2.role"), text: t("home.testimonials.item2.text"), rating: 5, initial: "S" },
                { name: t("home.testimonials.item3.name"), role: t("home.testimonials.item3.role"), text: t("home.testimonials.item3.text"), rating: 5, initial: "E" },
                { name: t("home.testimonials.item4.name"), role: t("home.testimonials.item4.role"), text: t("home.testimonials.item4.text"), rating: 5, initial: "B" }
              ].map((testi, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true, margin: "-5%" }}
                  transition={{ duration: 0.4, delay: i * 0.1, ease: "easeOut" }}
                  className="snap-center min-w-[85%] relative p-6 rounded-[2rem] bg-white border border-slate-100 ring-1 ring-slate-900/5 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.1)] flex flex-col will-change-transform"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 rounded-xl border border-slate-100 shadow-sm flex items-center justify-center relative">
                      <div className={`absolute inset-0 rounded-xl bg-gradient-to-br ${
                        i === 0 ? "from-blue-500/20 to-cyan-500/20" :
                        i === 1 ? "from-purple-500/20 to-pink-500/20" :
                        i === 2 ? "from-orange-500/20 to-yellow-500/20" :
                                  "from-green-500/20 to-emerald-500/20"
                      }`} />
                      <span className={`text-base font-bold bg-clip-text text-transparent bg-gradient-to-br relative z-10 ${
                        i === 0 ? "from-blue-600 to-cyan-600" :
                        i === 1 ? "from-purple-600 to-pink-600" :
                        i === 2 ? "from-orange-600 to-yellow-600" :
                                  "from-green-600 to-emerald-600"
                      }`}>
                        {testi.initial}
                      </span>
                      <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-bold border-2 border-white shadow-sm z-20">
                        <Quote className="h-2.5 w-2.5 fill-white" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-bold text-slate-900 leading-tight">{testi.name}</h3>
                      <p className="text-[10px] font-bold text-purple-600 mb-1 uppercase tracking-wide">{testi.role}</p>
                      <div className="flex gap-0.5">
                        {[...Array(testi.rating)].map((_, j) => (
                          <Star key={j} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 leading-snug italic">
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
                <div className="relative p-8 rounded-[2.5rem] bg-white border border-slate-100 ring-1 ring-slate-900/5 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.1)] hover:shadow-[0_30px_60px_-12px_rgba(0,0,0,0.15)] hover:-translate-y-2 transition-all duration-300 w-full h-full flex flex-col items-center">
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
        {/* Visible SEO Section (Phase 4) */}
        <section className="py-12 px-4 bg-slate-50 border-t border-slate-200">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">LokaClean Lombok</h2>
            <p className="text-slate-600 leading-relaxed">
              LokaClean melayani jasa kebersihan profesional di Kuta Mandalika dan Lombok Tengah. 
              Menyediakan layanan villa cleaning, home cleaning, dan daily housekeeping dengan standar hotel.
            </p>
          </div>
        </section>

      </main>


      {selectedPackage && (
        <PackageDetailModal
          isOpen={!!selectedPackage}
          onClose={() => setSelectedPackage(null)}
          pkg={selectedPackage}
          onBook={() => {
            setSelectedPackage(null);
            setShowLoginModal(true);
          }}
        />
      )}

      <LoginRequiredModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />

      <IOSInstallPrompt 
        isOpen={showIOSPrompt} 
        onClose={() => setShowIOSPrompt(false)} 
      />
      <AndroidInstallPrompt 
        isOpen={showAndroidPrompt} 
        onClose={() => setShowAndroidPrompt(false)} 
      />

      {/* Footer */}
      <Footer variant="all" />
      
    </div>
  );
}
