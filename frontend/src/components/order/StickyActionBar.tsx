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
    <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-100 p-2 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-50">
      <div className="max-w-md mx-auto grid grid-cols-3 gap-3">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onChat}
          className="flex flex-col items-center justify-center gap-1 p-3 rounded-xl hover:bg-slate-50 text-slate-600 hover:text-emerald-600 transition-colors"
        >
          <MessageCircle className="w-6 h-6" />
          <span className="text-[10px] font-medium">{t('orderDetail.chatCleaner')}</span>
        </motion.button>
        
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onCall}
          className="flex flex-col items-center justify-center gap-1 p-3 rounded-xl hover:bg-slate-50 text-slate-600 hover:text-emerald-600 transition-colors"
        >
          <Phone className="w-6 h-6" />
          <span className="text-[10px] font-medium">{t('orderDetail.help')}</span>
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onReorder}
          className="flex flex-col items-center justify-center gap-1 p-3 rounded-xl hover:bg-slate-50 text-slate-600 hover:text-emerald-600 transition-colors"
        >
          <RotateCcw className="w-6 h-6" />
          <span className="text-[10px] font-medium">{t('orderDetail.orderAgain')}</span>
        </motion.button>
      </div>
    </div>
  );
}
