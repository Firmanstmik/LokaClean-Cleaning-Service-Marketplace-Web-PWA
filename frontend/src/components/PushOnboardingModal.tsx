import { motion, AnimatePresence } from "framer-motion";

interface PushOnboardingModalProps {
  open: boolean;
  loading: boolean;
  onEnable: () => void;
  onLater: () => void;
}

export function PushOnboardingModal(props: PushOnboardingModalProps) {
  const { open, loading, onEnable, onLater } = props;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] bg-slate-950/70 backdrop-blur-sm"
            onClick={onLater}
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 260, damping: 28 }}
            className="fixed inset-x-0 bottom-0 z-[91] mx-auto max-w-md rounded-t-3xl bg-slate-900 px-5 pb-7 pt-5 shadow-[0_-18px_60px_rgba(15,23,42,0.85)] border-t border-slate-800"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-800">
                <span className="text-lg">🔔</span>
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-white">
                  Aktifkan Notifikasi?
                </div>
                <div className="mt-1 text-xs text-slate-400">
                  Dapatkan update promo dan status layanan secara real-time.
                </div>
              </div>
            </div>
            <div className="mt-5 flex flex-col gap-2.5">
              <motion.button
                whileTap={{ scale: 0.96 }}
                type="button"
                disabled={loading}
                onClick={onEnable}
                className="inline-flex h-10 w-full items-center justify-center rounded-2xl bg-emerald-500 text-xs font-semibold text-white shadow-sm hover:bg-emerald-400 disabled:opacity-60"
              >
                {loading ? "Mengaktifkan..." : "Aktifkan Sekarang"}
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.96 }}
                type="button"
                disabled={loading}
                onClick={onLater}
                className="inline-flex h-10 w-full items-center justify-center rounded-2xl border border-slate-700 text-xs font-medium text-slate-300 hover:bg-slate-800 disabled:opacity-60"
              >
                Nanti Saja
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

