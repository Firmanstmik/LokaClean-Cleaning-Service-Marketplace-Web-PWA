
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { LogIn, ArrowRight, Sparkles, CheckCircle2, Gift, Zap, Shield } from "lucide-react";
import { t } from "../lib/i18n";
import { LanguageSwitcherPill } from "../components/LanguageSwitcher";

export function MobileWelcome() {
  return (
    <div className="relative min-h-screen w-full bg-slate-900 overflow-hidden flex flex-col font-sans selection:bg-teal-500/30">
      
      {/* Language Switcher - Absolute Top Right */}
      <div className="absolute top-6 right-6 z-50">
        <LanguageSwitcherPill variant="light" />
      </div>

      {/* --- PREMIUM BACKGROUND LAYER --- */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[#0B1121]" />
        
        {/* Animated Aurora / Orbs */}
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.4, 0.2],
            rotate: [0, 10, 0]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-[20%] -left-[10%] w-[150%] h-[80%] bg-teal-600/20 rounded-[100%] blur-[120px] mix-blend-screen" 
        />
        <motion.div 
          animate={{ 
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.5, 0.2],
            rotate: [0, -15, 0]
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute top-[10%] -right-[20%] w-[120%] h-[70%] bg-indigo-600/20 rounded-[100%] blur-[100px] mix-blend-screen" 
        />
        
        {/* Moving Perspective Grid (Retro-Futuristic) */}
        <div className="absolute inset-0 perspective-[500px]">
           <motion.div 
             initial={{ backgroundPosition: "0px 0px" }}
             animate={{ backgroundPosition: "0px 100px" }}
             transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
             className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:linear-gradient(to_bottom,transparent_0%,black_40%,transparent_100%)]" 
             style={{ transform: "rotateX(20deg) scale(1.5)" }}
           />
        </div>

        {/* Noise Texture for Texture */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay brightness-100 contrast-150" />
        
        {/* Floating Particles */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-white/30 blur-[1px]"
            style={{
              width: Math.random() * 4 + 1 + "px",
              height: Math.random() * 4 + 1 + "px",
              left: Math.random() * 100 + "%",
              top: "100%",
            }}
            animate={{
              y: -1000,
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: Math.random() * 10 + 15,
              repeat: Infinity,
              delay: Math.random() * 10,
              ease: "linear",
            }}
          />
        ))}
      </div>

      {/* --- MAIN CONTENT --- */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 pt-20 pb-12 text-center">
        
        {/* Logo Section with 3D Float Effect */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 1, type: "spring", bounce: 0.5 }}
          className="mb-10 relative perspective-[1000px] group"
        >
          <motion.div 
             animate={{ rotateY: [0, 10, 0, -10, 0], rotateX: [0, 5, 0, 5, 0] }}
             transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
             className="relative w-36 h-36 mx-auto mb-8 transform-style-3d"
          >
            {/* Glow behind logo */}
            <div className="absolute inset-0 bg-teal-500/40 blur-[40px] rounded-full animate-pulse" />
            
            <div className="relative w-full h-full bg-gradient-to-br from-slate-800 to-slate-950 rounded-[2rem] border border-slate-700/50 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.5)] flex items-center justify-center p-1.5 overflow-hidden ring-1 ring-white/10 backdrop-blur-xl">
                <img 
                  src="/img/Logo_LokaClean.jpg" 
                  alt="LokaClean Logo" 
                  className="w-full h-full object-cover rounded-[1.7rem] opacity-95"
                />
                {/* Shine effect */}
                <motion.div 
                    animate={{ x: ["-100%", "200%"] }}
                    transition={{ duration: 3, repeat: Infinity, repeatDelay: 3, ease: "easeInOut" }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12"
                />
            </div>
            
            {/* Floating Badge - Premium */}
            <motion.div 
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-4 -right-4 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-400 bg-[length:200%_auto] text-white text-[10px] font-black tracking-widest px-3 py-1.5 rounded-full shadow-[0_8px_16px_-4px_rgba(245,158,11,0.5)] border border-white/20 flex items-center gap-1.5 animate-shimmer"
                style={{ backgroundSize: "200% auto" }}
            >
                <Sparkles className="w-3 h-3 text-white fill-white" />
                {t("mobileWelcome.premiumBadge")}
            </motion.div>
          </motion.div>

          <h1 className="text-5xl font-black text-white tracking-tighter mb-4 drop-shadow-2xl">
            Loka<span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-emerald-400 to-teal-400 animate-text-shimmer bg-[length:200%_auto]">Clean</span>
          </h1>
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
            className="text-slate-300/90 text-lg font-medium max-w-xs mx-auto leading-relaxed drop-shadow-sm"
          >
            {t("mobileWelcome.subtitle")}
          </motion.p>
        </motion.div>

        {/* Feature Cards - Glassmorphism */}
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="w-full max-w-sm space-y-3 mb-8"
        >
            {[
              { icon: <Zap className="w-5 h-5 text-yellow-400" />, title: t("mobileWelcome.features.tracking"), color: "bg-yellow-400/10" },
              { icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" />, title: t("mobileWelcome.features.easy"), color: "bg-emerald-400/10" },
              { icon: <Gift className="w-5 h-5 text-pink-400" />, title: t("mobileWelcome.features.promo"), color: "bg-pink-400/10" }
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ x: -30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.5 + (i * 0.15), type: "spring" }}
                className="group relative bg-slate-800/40 backdrop-blur-md border border-white/5 hover:border-white/10 rounded-2xl p-4 flex items-center gap-4 transition-all duration-300 hover:bg-slate-800/60 shadow-lg hover:shadow-xl"
              >
                <div className={`p-2.5 rounded-xl ${feature.color} ring-1 ring-white/5`}>
                  {feature.icon}
                </div>
                <h3 className="text-slate-100 font-bold text-sm tracking-wide">{feature.title}</h3>
                
                {/* Subtle shine on hover */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              </motion.div>
            ))}
        </motion.div>
      </div>

      {/* --- BOTTOM ACTIONS --- */}
      <div className="relative z-20 p-6 pb-12 bg-gradient-to-t from-[#0B1121] via-[#0B1121]/95 to-transparent pt-20">
        <motion.div 
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.8, type: "spring", bounce: 0.4 }}
            className="flex flex-col gap-4 max-w-sm mx-auto"
        >
          {/* Primary Action */}
          <Link 
              to="/register"
              className="w-full group relative flex items-center justify-center gap-3 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-white font-bold py-4 px-6 rounded-2xl shadow-[0_10px_30px_-5px_rgba(20,184,166,0.4)] transition-all active:scale-[0.98] overflow-hidden"
          >
            <span className="relative z-10 tracking-wide">{t("mobileWelcome.ctaRegister")}</span>
            <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
            
            {/* Shine overlay */}
            <div className="absolute inset-0 rounded-2xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            </div>
          </Link>

          {/* Secondary Action */}
          <Link 
              to="/login"
              className="w-full flex items-center justify-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 font-bold py-4 px-6 rounded-2xl backdrop-blur-sm transition-all active:scale-[0.98] hover:text-white group"
          >
            <LogIn className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
            <span className="tracking-wide">{t("mobileWelcome.ctaLogin")}</span>
          </Link>

          <p className="text-center text-[10px] text-slate-500 mt-2 font-medium">
            {t("mobileWelcome.terms.prefix")} <span className="text-slate-400 underline decoration-slate-600 underline-offset-2">{t("mobileWelcome.terms.link")}</span> {t("mobileWelcome.terms.suffix")}
          </p>
        </motion.div>
      </div>
    </div>
  );
}
