import { motion, AnimatePresence } from "framer-motion";
import { Share, PlusSquare, X } from "lucide-react";

interface IOSInstallPromptProps {
  isOpen: boolean;
  onClose: () => void;
}

export function IOSInstallPrompt({ isOpen, onClose }: IOSInstallPromptProps) {
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
            className="fixed bottom-0 left-0 right-0 z-[101] bg-[#1c1c1e] rounded-t-[20px] p-6 pb-10 border-t border-white/10 shadow-2xl max-w-md mx-auto"
          >
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-bold text-white mb-1">Install LokaClean</h3>
                <p className="text-slate-400 text-sm">Tambahkan ke Home Screen untuk pengalaman terbaik.</p>
              </div>
              <button 
                onClick={onClose}
                className="p-1 rounded-full bg-white/10 hover:bg-white/20 text-white/60 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Step 1 */}
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 shrink-0">
                  <Share className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-white font-medium mb-1">1. Klik tombol Share</p>
                  <p className="text-slate-400 text-xs leading-relaxed">
                    Cari ikon Share di bagian bawah layar browser Safari Anda.
                  </p>
                </div>
              </div>

              <div className="w-full h-px bg-white/5" />

              {/* Step 2 */}
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 shrink-0">
                  <PlusSquare className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-white font-medium mb-1">2. Pilih 'Add to Home Screen'</p>
                  <p className="text-slate-400 text-xs leading-relaxed">
                    Scroll ke bawah pada menu opsi dan pilih menu "Add to Home Screen" atau "Tambah ke Layar Utama".
                  </p>
                </div>
              </div>
            </div>

            {/* Visual Arrow for Safari Bottom Bar */}
            <motion.div 
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -bottom-4 left-1/2 -translate-x-1/2 translate-y-full flex flex-col items-center gap-2"
            >
              <div className="text-white/80 text-xs font-medium bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm border border-white/10 whitespace-nowrap mb-1">
                Tap di sini
              </div>
              <div className="w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[14px] border-t-blue-500 filter drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
