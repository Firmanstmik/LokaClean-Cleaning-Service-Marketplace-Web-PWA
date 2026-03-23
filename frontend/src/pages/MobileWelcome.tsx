
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { LogIn, ArrowRight, ShieldCheck, Sparkles, Zap } from "lucide-react";
import { t } from "../lib/i18n";
import { LanguageSwitcherPill } from "../components/LanguageSwitcher";

export function MobileWelcome() {
  return (
    <div className="relative min-h-screen w-full bg-slate-950 flex flex-col font-sans selection:bg-teal-500/30 overflow-hidden">
      
      {/* Language Switcher - Absolute Top Right */}
      <div className="absolute top-6 right-6 z-30">
        <LanguageSwitcherPill variant="light" />
      </div>

      {/* --- BACKGROUND --- */}
      {/* Simple, high-performance background with subtle gradient */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950" />
        {/* Subtle radial gradient for depth */}
        <div className="absolute top-0 inset-x-0 h-[500px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-teal-900/20 via-slate-900/0 to-transparent" />
      </div>

      {/* --- MAIN CONTENT --- */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 pt-12 pb-8 text-center">
        
        {/* Logo Section - Static & Clean */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="mb-8 flex flex-col items-center"
        >
          <div className="relative w-28 h-28 mb-6 rounded-[2rem] shadow-2xl shadow-slate-950/50 overflow-hidden ring-1 ring-white/10 bg-slate-900">
             <img 
               src="/img/Logo_LokaClean_fixed.webp" 
               alt="LokaClean Logo" 
               className="w-full h-full object-contain mix-blend-multiply"
             />
          </div>

          <h1 className="text-4xl font-bold text-white tracking-tight mb-3">
            Loka<span className="text-teal-400">Clean</span>
          </h1>
          
          <p className="text-slate-400 text-base font-medium max-w-[280px] leading-relaxed">
            {t("mobileWelcome.subtitle")}
          </p>
        </motion.div>

        {/* Feature Highlights - Static Grid (High Performance) */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="grid grid-cols-3 gap-4 w-full max-w-sm mb-10"
        >
          <div className="flex flex-col items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center ring-1 ring-teal-500/20">
              <Sparkles className="w-5 h-5 text-teal-400" />
            </div>
            <span className="text-[10px] font-semibold text-slate-300 uppercase tracking-wide">Premium</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center ring-1 ring-blue-500/20">
              <ShieldCheck className="w-5 h-5 text-blue-400" />
            </div>
            <span className="text-[10px] font-semibold text-slate-300 uppercase tracking-wide">Terpercaya</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center ring-1 ring-amber-500/20">
              <Zap className="w-5 h-5 text-amber-400" />
            </div>
            <span className="text-[10px] font-semibold text-slate-300 uppercase tracking-wide">Cepat</span>
          </div>
        </motion.div>
      </div>

      {/* --- BOTTOM ACTIONS --- */}
      <div className="relative z-20 p-6 pb-10 bg-slate-950/80 backdrop-blur-sm border-t border-white/5">
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="flex flex-col gap-3 max-w-sm mx-auto"
        >
          {/* Primary Action */}
          <Link 
              to="/register"
              className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-500 text-white font-semibold py-3.5 px-6 rounded-xl shadow-lg shadow-teal-900/20 transition-all active:scale-[0.98]"
          >
            <span>{t("mobileWelcome.ctaRegister")}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          {/* Secondary Action */}
          <Link 
              to="/login"
              className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold py-3.5 px-6 rounded-xl transition-all active:scale-[0.98]"
          >
            <LogIn className="w-4 h-4" />
            <span>{t("mobileWelcome.ctaLogin")}</span>
          </Link>

          <p className="text-center text-[10px] text-slate-500 mt-4">
            {t("mobileWelcome.terms.prefix")} <span className="text-slate-400">{t("mobileWelcome.terms.link")}</span>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
