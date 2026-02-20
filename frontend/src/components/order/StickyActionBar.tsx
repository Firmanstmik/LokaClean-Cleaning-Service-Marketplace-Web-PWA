import { MessageCircle, Phone, RotateCcw } from "lucide-react";
import { motion } from "framer-motion";
import { t } from "../../lib/i18n";

interface StickyActionBarProps {
  onChat: () => void;
  onCall: () => void;
  onReorder: () => void;
}

export function StickyActionBar({ onChat, onCall, onReorder }: StickyActionBarProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-transparent bg-gradient-to-t from-white via-white/95 to-white/80 pb-safe pt-2">
      <div className="mx-auto max-w-md px-3">
        <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white px-2 py-1.5 shadow-md shadow-slate-900/5">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onChat}
            className="flex flex-1 items-center justify-center gap-1 rounded-xl px-2 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-emerald-600"
          >
            <MessageCircle className="h-4 w-4" />
            <span className="text-[11px]">{t("orderDetail.chatCleaner")}</span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onCall}
            className="flex flex-1 items-center justify-center gap-1 rounded-xl px-2 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-emerald-600"
          >
            <Phone className="h-4 w-4" />
            <span className="text-[11px]">{t("orderDetail.help")}</span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onReorder}
            className="flex flex-1 items-center justify-center gap-1 rounded-xl px-2 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-emerald-600"
          >
            <RotateCcw className="h-4 w-4" />
            <span className="text-[11px]">{t("orderDetail.orderAgain")}</span>
          </motion.button>
        </div>
      </div>
    </div>
  );
}
