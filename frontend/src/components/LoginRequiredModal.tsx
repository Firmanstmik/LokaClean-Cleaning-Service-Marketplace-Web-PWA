import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { LockKeyhole, LogIn, UserPlus } from "lucide-react";

interface LoginRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LoginRequiredModal({ isOpen, onClose }: LoginRequiredModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl"
          >
            {/* Header with gradient */}
            <div className="bg-gradient-to-br from-teal-600 to-emerald-600 px-6 py-8 text-center relative overflow-hidden">
              <motion.div 
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md shadow-inner border border-white/30"
              >
                <LockKeyhole className="h-8 w-8 text-white drop-shadow-md" />
              </motion.div>
              <h3 className="text-xl font-bold text-white drop-shadow-sm">
                Akses Terbatas
              </h3>
              <p className="mt-2 text-sm text-white/90 font-medium leading-relaxed">
                Silakan login untuk melakukan pemesanan dan mengakses fitur lengkap aplikasi.
              </p>
            </div>
            {/* Content */}
            <div className="flex flex-col gap-3 p-6">
              <Link
                to="/login"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 px-4 py-3.5 font-bold text-white shadow-lg shadow-teal-500/20 transition-all hover:shadow-xl hover:shadow-teal-500/30 active:scale-[0.98]"
              >
                <LogIn className="h-5 w-5" />
                <span>Masuk Sekarang</span>
              </Link>
              <Link
                to="/register"
                className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-slate-100 bg-white px-4 py-3.5 font-bold text-slate-700 transition-colors hover:bg-slate-50 hover:border-slate-200 active:scale-[0.98]"
              >
                <UserPlus className="h-5 w-5" />
                <span>Daftar Akun Baru</span>
              </Link>
              <button
                onClick={onClose}
                className="mt-2 text-sm font-medium text-slate-400 hover:text-slate-600 transition-colors"
              >
                Lihat-lihat Dulu
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
