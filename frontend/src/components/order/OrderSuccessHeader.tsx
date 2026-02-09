import { CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

interface OrderSuccessHeaderProps {
  orderNumber: string;
  title?: string;
  subtitle?: string;
}

export function OrderSuccessHeader({ orderNumber, title = "Pesanan Berhasil Dibuat 🎉", subtitle = "Staff kami sedang bersiap menuju lokasi Anda" }: OrderSuccessHeaderProps) {
  return (
    <div className="flex flex-col items-center justify-center pt-8 pb-6 px-4 text-center">
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        className="relative"
      >
        <div className="absolute inset-0 bg-green-100 rounded-full scale-150 animate-pulse opacity-50" />
        <CheckCircle2 className="w-20 h-20 text-emerald-500 relative z-10 fill-white" />
      </motion.div>
      
      <motion.h1 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-2xl font-bold text-slate-800 mt-6 mb-2"
      >
        {title}
      </motion.h1>
      
      <motion.p 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-slate-500 text-sm max-w-xs"
      >
        {subtitle}
      </motion.p>
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-4 px-4 py-1.5 bg-slate-100 rounded-full text-xs font-medium text-slate-600 border border-slate-200"
      >
        Order ID: {orderNumber}
      </motion.div>
    </div>
  );
}
