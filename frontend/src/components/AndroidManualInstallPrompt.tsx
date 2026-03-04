import { motion, AnimatePresence } from "framer-motion";
import { Download, MoreVertical, X, Info, PlusSquare } from "lucide-react";

interface AndroidManualInstallPromptProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AndroidManualInstallPrompt({ isOpen, onClose }: AndroidManualInstallPromptProps) {
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
            className="fixed bottom-0 left-0 right-0 z-[101] bg-white rounded-t-[20px] p-6 pb-10 shadow-2xl max-w-md mx-auto"
          >
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-1">Install LokaClean</h3>
                <p className="text-slate-500 text-sm">Tambahkan ke Layar Utama untuk akses lebih cepat.</p>
              </div>
              <button 
                onClick={onClose}
                className="p-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
              <div className="flex gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10 shrink-0 h-fit">
                  <Info className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <h4 className="text-blue-700 font-bold text-sm mb-1">Browser ini butuh instalasi manual</h4>
                  <p className="text-slate-600 text-xs leading-relaxed">
                    Browser Anda tidak mendukung instalasi otomatis. Silakan ikuti langkah mudah di bawah ini.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {/* Step 1 */}
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-slate-100 border border-slate-200 shrink-0">
                  <MoreVertical className="w-6 h-6 text-slate-700" />
                </div>
                <div>
                  <p className="text-slate-900 font-medium mb-1">1. Buka Menu Browser</p>
                  <p className="text-slate-500 text-xs leading-relaxed">
                    Ketuk ikon titik tiga <strong>(⋮)</strong> di pojok kanan atas atau bawah layar browser Anda.
                  </p>
                </div>
              </div>

              <div className="w-full h-px bg-slate-100" />

              {/* Step 2 */}
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-slate-100 border border-slate-200 shrink-0">
                  <Download className="w-6 h-6 text-slate-900" />
                </div>
                <div>
                  <p className="text-slate-900 font-medium mb-1">2. Pilih 'Install App'</p>
                  <p className="text-slate-500 text-xs leading-relaxed">
                    Cari dan pilih menu <strong>"Install App"</strong> atau <strong>"Tambahkan ke Layar Utama"</strong>.
                  </p>
                </div>
              </div>
            </div>

            {/* Button */}
            <div className="mt-8">
              <button
                onClick={onClose}
                className="w-full py-3.5 bg-slate-900 text-white rounded-xl font-semibold shadow-lg shadow-slate-900/20 active:scale-[0.98] transition-transform"
              >
                Saya Mengerti
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
