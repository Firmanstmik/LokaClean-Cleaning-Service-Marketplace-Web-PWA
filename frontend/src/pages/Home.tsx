/**
 * Public landing page - Modern, Attractive & Responsive.
 *
 * - If NOT authenticated: show product intro + Login/Register buttons.
 * - If authenticated: route to the correct dashboard (USER vs ADMIN).
 */

import { Link, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, CheckCircle2, MapPin, Camera, Star, Zap, Shield, Heart, ArrowRight } from "lucide-react";

import { useAuth } from "../lib/auth";
import { Footer } from "../components/Footer";

export function Home() {
  const { token, actor } = useAuth();

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
    "Register and complete your profile.",
    "Choose a cleaning package and schedule.",
    "Upload a room photo (before) and pin the location.",
    "Track progress until done, then verify and rate."
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-tropical-50 via-ocean-50/50 to-sand-50/70 overflow-hidden relative">
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-tropical-200/20 blur-3xl"
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
          className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-ocean-200/20 blur-3xl"
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
        <motion.div
          className="absolute top-1/2 left-1/2 h-80 w-80 rounded-full bg-sun-200/15 blur-3xl"
          animate={{
            x: [0, 60, 0],
            y: [0, -60, 0],
            scale: [1, 1.4, 1],
          }}
          transition={{
            duration: 18,
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
         className="fixed top-0 left-0 right-0 z-50 border-b border-white/20 bg-white/90 backdrop-blur-xl shadow-sm"
       >
         <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 sm:gap-3 px-3 sm:px-6 lg:px-8 py-2 sm:py-3.5">
           <Link
             to="/packages"
             className="flex items-center gap-2.5 sm:gap-3.5 flex-1 min-w-0 group"
           >
             <motion.div
               whileHover={{ scale: 1.08, rotate: [0, -2, 2, -2, 0] }}
               whileTap={{ scale: 0.95 }}
               initial={{ opacity: 0, x: -50, scale: 0.8 }}
               animate={{ 
                 opacity: 1, 
                 x: 0,
                 scale: 1,
               }}
               transition={{ 
                 type: "spring",
                 damping: 20,
                 stiffness: 300,
                 duration: 0.6
               }}
               className="relative h-11 w-11 sm:h-16 sm:w-16 flex-shrink-0 rounded-2xl flex items-center justify-center overflow-visible"
             >
               {/* Premium Glowing Ring Animation - Multi-layer depth effect */}
               <motion.div
                 className="absolute inset-0 rounded-2xl bg-gradient-to-br from-tropical-400 via-ocean-400 to-sun-400 opacity-0"
                 animate={{
                   opacity: [0, 0.7, 0.4, 0.7, 0],
                   scale: [1, 1.15, 1.25, 1.15, 1],
                   rotate: [0, 90, 180, 270, 360],
                 }}
                 transition={{
                   duration: 3,
                   repeat: Infinity,
                   ease: "easeInOut",
                 }}
                 style={{
                   filter: "blur(10px)",
                 }}
               />
               <motion.div
                 className="absolute inset-0 rounded-2xl bg-gradient-to-br from-ocean-400 via-tropical-400 to-sun-400 opacity-0"
                 animate={{
                   opacity: [0, 0.5, 0.8, 0.5, 0],
                   scale: [1, 1.2, 1.3, 1.2, 1],
                   rotate: [360, 270, 180, 90, 0],
                 }}
                 transition={{
                   duration: 3,
                   repeat: Infinity,
                   ease: "easeInOut",
                   delay: 0.5,
                 }}
                 style={{
                   filter: "blur(14px)",
                 }}
               />
               <motion.div
                 className="absolute inset-0 rounded-2xl bg-gradient-to-br from-sun-400 via-tropical-400 to-ocean-400 opacity-0"
                 animate={{
                   opacity: [0, 0.6, 0.3, 0.6, 0],
                   scale: [1, 1.1, 1.2, 1.1, 1],
                 }}
                 transition={{
                   duration: 2.5,
                   repeat: Infinity,
                   ease: "easeInOut",
                   delay: 1,
                 }}
                 style={{
                   filter: "blur(8px)",
                 }}
               />
               
               {/* Premium Logo Container with Gradient Border */}
               <motion.div
                 className="relative z-10 h-full w-full overflow-hidden rounded-2xl bg-gradient-to-br from-white via-tropical-50/30 to-ocean-50/30 shadow-xl flex items-center justify-center border-2 border-transparent"
                 animate={{
                   boxShadow: [
                     "0 8px 32px rgba(26, 188, 156, 0.25), 0 0 0 0px rgba(26, 188, 156, 0)",
                     "0 12px 48px rgba(52, 152, 219, 0.4), 0 0 0 2px rgba(26, 188, 156, 0.3)",
                     "0 16px 64px rgba(26, 188, 156, 0.5), 0 0 0 3px rgba(52, 152, 219, 0.4)",
                     "0 12px 48px rgba(52, 152, 219, 0.4), 0 0 0 2px rgba(26, 188, 156, 0.3)",
                     "0 8px 32px rgba(26, 188, 156, 0.25), 0 0 0 0px rgba(26, 188, 156, 0)",
                   ],
                   borderColor: [
                     "rgba(26, 188, 156, 0)",
                     "rgba(26, 188, 156, 0.3)",
                     "rgba(52, 152, 219, 0.4)",
                     "rgba(26, 188, 156, 0.3)",
                     "rgba(26, 188, 156, 0)",
                   ],
                 }}
                 transition={{
                   duration: 3,
                   repeat: Infinity,
                   ease: "easeInOut",
                 }}
               >
                 {/* Subtle gradient overlay */}
                 <div className="absolute inset-0 bg-gradient-to-br from-tropical-400/5 via-transparent to-ocean-400/5 pointer-events-none" />
                 
                 <motion.img
                   src="/img/Logo LocaClean2.jpg"
                   alt="LokaClean Logo"
                   className="relative z-10 h-full w-full object-contain p-1.5 sm:p-2 scale-105"
                   animate={{
                     filter: [
                       "brightness(1) saturate(1)",
                       "brightness(1.15) saturate(1.1)",
                       "brightness(1.25) saturate(1.2)",
                       "brightness(1.15) saturate(1.1)",
                       "brightness(1) saturate(1)",
                     ],
                   }}
                   transition={{
                     duration: 3,
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
                   className="block text-base sm:text-xl font-black leading-tight bg-gradient-to-r from-tropical-600 via-ocean-600 to-tropical-600 bg-clip-text text-transparent truncate"
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
                 ✨ Clean Comfort, Island Style
               </motion.div>
             </div>
           </Link>
           <div className="flex items-center gap-2 sm:gap-3">
             <Link
               to="/login"
               className="rounded-lg sm:rounded-xl border-2 border-slate-200 bg-white/80 backdrop-blur px-3 sm:px-4 lg:px-5 py-1.5 sm:py-2 lg:py-2.5 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all duration-300 hover:scale-105 shadow-sm"
             >
               Login
             </Link>
             <Link
               to="/register"
               className="rounded-lg sm:rounded-xl bg-lombok-gradient px-3 sm:px-4 lg:px-5 py-1.5 sm:py-2 lg:py-2.5 text-xs sm:text-sm font-semibold text-white hover:shadow-[0_8px_24px_rgba(26,188,156,0.4)] transition-all duration-300 hover:scale-105 shadow-lg relative overflow-hidden group"
             >
               <span className="relative z-10 flex items-center gap-1.5 sm:gap-2">
                 Register
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

      {/* Main Content - Professional Layout */}
      <main className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 xl:px-12 pt-16 sm:pt-24 lg:pt-28 pb-12 sm:pb-16 lg:pb-20">
        <div className="grid gap-8 lg:gap-12 xl:gap-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          {/* Mobile: Premium Cleaning Service Image - Branding (shown first on mobile) - Floating Design */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="lg:hidden relative"
          >
            {/* Subtle Glow Effect - Floating */}
            <motion.div
              animate={{
                opacity: [0.1, 0.2, 0.1],
                scale: [1, 1.02, 1]
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute -inset-2 bg-gradient-to-br from-tropical-400 via-ocean-400 to-tropical-400 rounded-2xl blur-2xl opacity-20"
            />
            
             {/* Floating Image - No Card */}
             <motion.div
               className="relative"
               whileHover={{ scale: 1.02, y: -4 }}
               transition={{ type: "spring", stiffness: 300 }}
             >
               <img
                 src="/img/packages/clean.png"
                 alt="Professional Cleaning Service - LokaClean"
                 className="w-full h-auto object-contain max-h-56 sm:max-h-64 [filter:drop-shadow(0_10px_30px_rgba(26,188,156,0.4))_drop-shadow(0_4px_12px_rgba(52,152,219,0.3))]"
                 onError={(e) => {
                   const target = e.target as HTMLImageElement;
                   target.style.display = "none";
                 }}
               />
             </motion.div>
          </motion.div>

          {/* Left Side - Hero Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-6 sm:space-y-8"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-2 rounded-full bg-white/90 backdrop-blur-xl border border-tropical-200/60 px-4 py-2 text-xs sm:text-sm font-semibold text-tropical-700 shadow-sm"
            >
              <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-tropical-500" />
              <span>Marketplace • Transparent pricing • Photo verification</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight leading-tight"
            >
              <span className="bg-lombok-gradient bg-clip-text text-transparent">
                Order room cleaning
              </span>
              <br />
              <span className="text-slate-900">
                in minutes—no property-owner calls.
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-base sm:text-lg lg:text-xl text-slate-600 leading-relaxed max-w-2xl"
            >
              LokaClean connects tourists with trusted cleaning operations. Choose a package, pin your location, upload a before photo, and track the job until completion.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-wrap gap-3 sm:gap-4"
            >
              <Link
                to="/register"
                className="group relative overflow-hidden rounded-xl sm:rounded-2xl bg-lombok-gradient px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-base font-bold text-white shadow-[0_8px_32px_rgba(26,188,156,0.4)] hover:shadow-[0_12px_48px_rgba(26,188,156,0.5)] transition-all duration-300 hover:scale-105"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Create an account
                  <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform" />
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
                className="rounded-xl sm:rounded-2xl border-2 border-slate-300 bg-white/90 backdrop-blur-xl px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-base font-bold text-slate-700 hover:bg-white hover:border-slate-400 hover:shadow-lg transition-all duration-300 hover:scale-105"
              >
                I already have an account
              </Link>
            </motion.div>

            {/* Feature Cards Grid - Professional Layout */}
            <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 pt-4">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: feature.delay }}
                    whileHover={{ scale: 1.02, y: -2 }}
                    className="group relative overflow-hidden rounded-xl sm:rounded-2xl border border-white/80 bg-white/80 backdrop-blur-xl p-4 sm:p-5 shadow-md hover:shadow-lg transition-all duration-300"
                  >
                    <motion.div
                      className={`inline-flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg sm:rounded-xl bg-gradient-to-br ${feature.gradient} shadow-md mb-3`}
                      whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
                      transition={{ duration: 0.5 }}
                    >
                      <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                    </motion.div>
                    <div className="text-sm sm:text-base font-bold text-slate-900 mb-1.5">
                      {feature.title}
                    </div>
                    <div className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      {feature.description}
                    </div>
                    <motion.div
                      className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}
                    />
                  </motion.div>
                );
              })}
            </div>

            {/* How it works Card - Mobile Version */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="lg:hidden relative overflow-hidden rounded-2xl border border-white/80 bg-white/90 backdrop-blur-xl p-5 sm:p-6 shadow-xl mt-6"
            >
              {/* Decorative gradient background */}
              <div className="absolute inset-0 bg-gradient-to-br from-tropical-50/40 via-ocean-50/20 to-sun-50/40" />
              
              <div className="relative z-10">
                <motion.div
                  className="flex items-center gap-3 mb-5"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.9 }}
                >
                  <div className="h-9 w-9 rounded-lg bg-lombok-gradient flex items-center justify-center shadow-md">
                    <Zap className="h-4 w-4 text-white" />
                  </div>
                  <div className="text-xl font-bold text-slate-900">How it works</div>
                </motion.div>

                <ol className="space-y-3">
                  {steps.map((step, index) => (
                    <li key={index}>
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 1 + index * 0.1 }}
                        className="group flex items-start gap-3 rounded-lg bg-white/80 backdrop-blur border border-slate-200/50 p-3 hover:bg-white hover:shadow-md transition-all duration-300"
                      >
                        <motion.div
                          className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-lombok-gradient text-xs font-bold text-white shadow-sm"
                          whileHover={{ scale: 1.1, rotate: 5 }}
                          transition={{ type: "spring", stiffness: 400 }}
                        >
                          {index + 1}
                        </motion.div>
                        <div className="flex-1 pt-0.5 text-sm text-slate-700 leading-relaxed">
                          {step}
                        </div>
                        <CheckCircle2 className="h-4 w-4 text-tropical-500 opacity-0 group-hover:opacity-100 transition-opacity mt-0.5 flex-shrink-0" />
                      </motion.div>
                    </li>
                  ))}
                </ol>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.4 }}
                  className="mt-5 rounded-lg border border-ocean-200/50 bg-gradient-to-br from-ocean-50/60 to-tropical-50/60 backdrop-blur p-4 shadow-md"
                >
                  <div className="flex items-start gap-3">
                    <Star className="h-4 w-4 text-ocean-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-sm font-bold text-slate-900 mb-1">Phase 1 note</div>
                      <div className="text-xs text-slate-700 leading-relaxed">
                        Payments are mock-ready. Admin operations are managed in a separate admin area.
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Side - Premium Image & How it works - Professional Layout */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative space-y-6 lg:sticky lg:top-24"
          >
             {/* Premium Cleaning Service Image - Professional Design (Desktop only, mobile shown above) - Floating Design */}
             <motion.div
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               transition={{ duration: 0.6, delay: 0.3 }}
               className="hidden lg:block relative"
             >
               {/* Subtle Glow Effect - Floating */}
               <motion.div
                 animate={{
                   opacity: [0.1, 0.2, 0.1],
                   scale: [1, 1.02, 1]
                 }}
                 transition={{
                   duration: 4,
                   repeat: Infinity,
                   ease: "easeInOut"
                 }}
                 className="absolute -inset-2 bg-gradient-to-br from-tropical-400 via-ocean-400 to-tropical-400 rounded-2xl blur-2xl opacity-20"
               />
               
               {/* Floating Image - No Card */}
               <motion.div
                 className="relative"
                 whileHover={{ scale: 1.02, y: -4 }}
                 transition={{ type: "spring", stiffness: 300 }}
               >
                 <img
                   src="/img/packages/clean.png"
                   alt="Professional Cleaning Service - LokaClean"
                   className="w-full h-auto object-contain [filter:drop-shadow(0_10px_30px_rgba(26,188,156,0.4))_drop-shadow(0_4px_12px_rgba(52,152,219,0.3))]"
                   onError={(e) => {
                     const target = e.target as HTMLImageElement;
                     target.style.display = "none";
                   }}
                 />
               </motion.div>
             </motion.div>

            {/* How it works Card - Professional Design (Desktop only, mobile shown below) */}
            <motion.div
              whileHover={{ scale: 1.01, y: -2 }}
              className="hidden lg:block relative overflow-hidden rounded-2xl sm:rounded-3xl border border-white/80 bg-white/90 backdrop-blur-xl p-6 sm:p-8 shadow-xl hover:shadow-2xl transition-all"
            >
              {/* Decorative gradient background */}
              <div className="absolute inset-0 bg-gradient-to-br from-tropical-50/40 via-ocean-50/20 to-sun-50/40" />
              
              <div className="relative z-10">
                <motion.div
                  className="flex items-center gap-3 mb-6"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-lombok-gradient flex items-center justify-center shadow-md">
                    <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                  </div>
                  <div className="text-xl sm:text-2xl font-bold text-slate-900">How it works</div>
                </motion.div>

                <ol className="space-y-3 sm:space-y-4">
                  {steps.map((step, index) => (
                    <li key={index}>
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.6 + index * 0.1 }}
                        whileHover={{ x: 2 }}
                        className="group flex items-start gap-3 sm:gap-4 rounded-lg sm:rounded-xl bg-white/80 backdrop-blur border border-slate-200/50 p-3 sm:p-4 hover:bg-white hover:shadow-md transition-all duration-300"
                      >
                        <motion.div
                          className="flex h-7 w-7 sm:h-8 sm:w-8 flex-shrink-0 items-center justify-center rounded-lg bg-lombok-gradient text-xs sm:text-sm font-bold text-white shadow-sm"
                          whileHover={{ scale: 1.1, rotate: 5 }}
                          transition={{ type: "spring", stiffness: 400 }}
                        >
                          {index + 1}
                        </motion.div>
                        <div className="flex-1 pt-0.5 sm:pt-1 text-sm sm:text-base text-slate-700 leading-relaxed">
                          {step}
                        </div>
                        <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-tropical-500 opacity-0 group-hover:opacity-100 transition-opacity mt-0.5 sm:mt-1 flex-shrink-0" />
                      </motion.div>
                    </li>
                  ))}
                </ol>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1 }}
                  className="mt-6 sm:mt-8 rounded-lg sm:rounded-xl border border-ocean-200/50 bg-gradient-to-br from-ocean-50/60 to-tropical-50/60 backdrop-blur p-4 sm:p-5 shadow-md"
                >
                  <div className="flex items-start gap-3">
                    <Star className="h-4 w-4 sm:h-5 sm:w-5 text-ocean-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-sm sm:text-base font-bold text-slate-900 mb-1">Phase 1 note</div>
                      <div className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                        Payments are mock-ready. Admin operations are managed in a separate admin area.
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </main>


      {/* Footer */}
      <Footer variant="all" />
    </div>
  );
}

