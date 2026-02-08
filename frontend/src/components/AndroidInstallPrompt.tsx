import { motion, AnimatePresence } from "framer-motion";
import { MoreVertical, Download, X, Info, Smartphone } from "lucide-react";

interface AndroidInstallPromptProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AndroidInstallPrompt({ isOpen, onClose }: AndroidInstallPromptProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />

          {/* Modal */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-[101] bg-[#1e293b] rounded-t-[20px] p-6 pb-10 border-t border-white/10 shadow-2xl max-w-md mx-auto"
          >
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-bold text-white mb-1">Install LokaClean</h3>
                <p className="text-slate-400 text-sm">Install aplikasi untuk akses lebih mudah & cepat.</p>
              </div>
              <button 
                onClick={onClose}
                className="p-1 rounded-full bg-white/10 hover:bg-white/20 text-white/60 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Info Box */}
            <div className="bg-teal-500/10 border border-teal-500/20 rounded-xl p-4 mb-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-teal-500" />
              <div className="flex gap-3">
                <div className="p-2 rounded-lg bg-teal-500/10 shrink-0 h-fit">
                  <Info className="w-5 h-5 text-teal-400" />
                </div>
                <div>
                  <h4 className="text-teal-400 font-bold text-sm mb-1">Pengguna Android</h4>
                  <p className="text-slate-400 text-xs leading-relaxed">
                    Jika instalasi otomatis tidak muncul, silakan ikuti langkah manual di bawah ini.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {/* Step 1 */}
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 shrink-0">
                  <MoreVertical className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-white font-medium mb-1">1. Klik Menu Browser</p>
                  <p className="text-slate-400 text-xs leading-relaxed">
                    Cari ikon titik tiga (menu) di pojok kanan atas browser Chrome Anda.
                  </p>
                </div>
              </div>

              <div className="w-full h-px bg-white/5" />

              {/* Step 2 */}
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 shrink-0">
                  <Download className="w-6 h-6 text-teal-400" />
                </div>
                <div>
                  <p className="text-white font-medium mb-1">2. Pilih 'Install App'</p>
                  <p className="text-slate-400 text-xs leading-relaxed">
                    Pilih menu "Install app" atau "Tambahkan ke Layar Utama" pada daftar opsi.
                  </p>
                </div>
              </div>
            </div>

            {/* Visual Arrow for Chrome Top Right (Optional hint) */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="absolute -top-12 right-4 flex flex-col items-end gap-2 pointer-events-none"
            >
              <div className="text-white/80 text-xs font-medium bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm border border-white/10 whitespace-nowrap mb-1">
                Menu ada di sini
              </div>
              <div className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-b-[10px] border-b-teal-500 filter drop-shadow-[0_0_8px_rgba(20,184,166,0.5)]" />
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
