
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { LogIn, UserPlus, ArrowRight, Sparkles } from "lucide-react";
import { t } from "../lib/i18n";

export function MobileWelcome() {
  return (
    <div className="relative min-h-screen w-full bg-slate-900 overflow-hidden flex flex-col">
      {/* Animated Premium Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 left-0 w-full h-full bg-[#0f172a]" />
        
        {/* Animated Orbs */}
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
            x: [0, 50, 0],
            y: [0, -50, 0]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-20 -right-20 w-96 h-96 bg-teal-600/30 rounded-full blur-[100px]" 
        />
        <motion.div 
          animate={{ 
            scale: [1.2, 1, 1.2],
            opacity: [0.3, 0.6, 0.3],
            x: [0, -30, 0],
            y: [0, 40, 0]
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute top-1/3 -left-20 w-80 h-80 bg-indigo-600/30 rounded-full blur-[80px]" 
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute -bottom-20 right-0 w-[30rem] h-[30rem] bg-emerald-600/20 rounded-full blur-[120px]" 
        />
        
        {/* Grid Overlay */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay brightness-100 contrast-150" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-12 text-center">
        
        {/* Logo Section */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="mb-12 relative"
        >
          <div className="relative w-32 h-32 mx-auto mb-6">
            {/* Glow behind logo */}
            <div className="absolute inset-0 bg-teal-500/30 blur-2xl rounded-full" />
            <div className="relative w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl border border-slate-700/50 shadow-2xl flex items-center justify-center p-1 overflow-hidden">
                <img 
                  src="/img/Logo_LokaClean.jpg" 
                  alt="LokaClean Logo" 
                  className="w-full h-full object-cover rounded-2xl opacity-90"
                />
                {/* Shine effect */}
                <motion.div 
                    animate={{ x: ["-100%", "200%"] }}
                    transition={{ duration: 3, repeat: Infinity, repeatDelay: 2, ease: "easeInOut" }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"
                />
            </div>
            {/* Floating badge */}
            <motion.div 
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-3 -right-3 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg border border-white/20 flex items-center gap-1"
            >
                <Sparkles className="w-3 h-3" />
                PREMIUM
            </motion.div>
          </div>

          <h1 className="text-4xl font-black text-white tracking-tight mb-3 drop-shadow-lg">
            Loka<span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-400">Clean</span>
          </h1>
          <p className="text-slate-400 text-lg font-medium max-w-xs mx-auto leading-relaxed">
            Clean Comfort, <br/> Island Style.
          </p>
        </motion.div>

        {/* Value Prop Cards Carousel (Simplified) */}
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="w-full max-w-sm space-y-3 mb-12"
        >
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-teal-500/20 flex items-center justify-center text-teal-400">
                    <Sparkles className="w-5 h-5" />
                </div>
                <div className="text-left">
                    <h3 className="text-white font-bold text-sm">Premium Service</h3>
                    <p className="text-slate-400 text-xs">Standard kebersihan hotel bintang 5</p>
                </div>
            </div>
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex items-center gap-4">
                 <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                    <UserPlus className="w-5 h-5" />
                </div>
                <div className="text-left">
                    <h3 className="text-white font-bold text-sm">Professional Team</h3>
                    <p className="text-slate-400 text-xs">Terlatih, terpercaya & terverifikasi</p>
                </div>
            </div>
        </motion.div>
      </div>

      {/* Bottom Actions */}
      <div className="relative z-20 p-6 pb-10 bg-gradient-to-t from-slate-900 via-slate-900/90 to-transparent">
        <motion.div 
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.8, type: "spring" }}
            className="flex flex-col gap-4 max-w-sm mx-auto"
        >
            <Link 
                to="/register"
                className="w-full group relative flex items-center justify-center gap-3 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-white font-bold py-4 px-6 rounded-2xl shadow-lg shadow-teal-500/25 transition-all active:scale-[0.98]"
            >
                <span className="relative z-10">Buat Akun Baru</span>
                <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
                {/* Shine overlay */}
                <div className="absolute inset-0 rounded-2xl overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                </div>
            </Link>

            <Link 
                to="/login"
                className="w-full flex items-center justify-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold py-4 px-6 rounded-2xl backdrop-blur-sm transition-all active:scale-[0.98]"
            >
                <LogIn className="w-5 h-5" />
                <span>Masuk ke Akun</span>
            </Link>

            <p className="text-center text-xs text-slate-500 mt-2">
                Dengan masuk, Anda menyetujui <span className="text-slate-400 underline">Syarat & Ketentuan</span> LokaClean.
            </p>
        </motion.div>
      </div>
    </div>
  );
}
