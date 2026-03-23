import { motion, AnimatePresence } from "framer-motion";
import { Download } from "lucide-react";
import type { InstallPlatform } from "../hooks/usePWAInstall";

interface PWAInstallPromptProps {
  open: boolean;
  platform: InstallPlatform;
  onInstall: () => void;
  onDismiss: () => void;
}

export function PWAInstallPrompt(props: PWAInstallPromptProps) {
  const { open, onInstall, onDismiss } = props;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 40, opacity: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="fixed inset-x-0 bottom-3 z-[80] flex justify-center px-3 sm:px-4 pointer-events-none"
        >
          <div className="pointer-events-auto flex max-w-md items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-[0_18px_60px_rgba(15,23,42,0.25)] border border-slate-100">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900/90">
              <img
                src="/img/logo.jpg"
                alt="LokaClean"
                className="h-10 w-10 rounded-xl object-cover"
                loading="lazy"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-slate-900">
                Install LokaClean App
              </div>
              <div className="mt-0.5 text-[11px] text-slate-500">
                Akses lebih cepat dan notifikasi layanan real-time.
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={onDismiss}
                className="rounded-xl px-2.5 py-1.5 text-[11px] font-medium text-slate-500 hover:bg-slate-50"
              >
                Nanti
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={onInstall}
                className="inline-flex items-center gap-1 rounded-xl bg-slate-900 px-3 py-1.5 text-[11px] font-semibold text-white shadow-sm hover:bg-slate-800"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Install</span>
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

