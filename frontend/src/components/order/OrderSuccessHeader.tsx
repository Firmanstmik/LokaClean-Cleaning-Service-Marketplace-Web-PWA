import { CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

interface OrderSuccessHeaderProps {
  orderNumber: string;
  title?: string;
  subtitle?: string;
}

const confettiPieces = [
  { top: "-6px", left: "8%", color: "bg-emerald-300", delay: 0 },
  { top: "0px", left: "92%", color: "bg-teal-300", delay: 0.05 },
  { top: "72%", left: "100%", color: "bg-sky-300", delay: 0.12 },
  { top: "85%", left: "10%", color: "bg-emerald-400", delay: 0.18 },
  { top: "-10px", left: "50%", color: "bg-lime-300", delay: 0.22 },
  { top: "20%", left: "-4%", color: "bg-cyan-300", delay: 0.27 }
];

export function OrderSuccessHeader({ orderNumber, title = "Pesanan Berhasil Dibuat 🎉", subtitle = "Staff kami sedang bersiap menuju lokasi Anda" }: OrderSuccessHeaderProps) {
  return (
    <div className="flex flex-col items-center justify-center pt-7 pb-5 px-4 text-center">
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 22 }}
        className="relative"
      >
        <div className="absolute inset-0 rounded-full bg-emerald-100/60 scale-150 animate-pulse" />
        <div className="absolute inset-0 rounded-full bg-emerald-200/40 blur-xl" />
        <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-white shadow-lg shadow-emerald-100">
          <CheckCircle2 className="w-14 h-14 text-emerald-500" />
          <div className="pointer-events-none absolute inset-0">
            {confettiPieces.map((piece, index) => (
              <motion.span
                key={index}
                className={`absolute h-1.5 w-1.5 rounded-full ${piece.color}`}
                style={{ top: piece.top, left: piece.left }}
                initial={{ scale: 0, opacity: 0, y: 4 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                transition={{ delay: 0.35 + piece.delay, duration: 0.35, type: "spring", stiffness: 260, damping: 20 }}
              />
            ))}
          </div>
        </div>
      </motion.div>
      
      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="mt-6 mb-2 text-[22px] font-semibold text-slate-900"
      >
        {title}
      </motion.h1>
      
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.32 }}
        className="max-w-xs text-sm text-slate-500"
      >
        {subtitle}
      </motion.p>
      
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-4 rounded-full border border-emerald-100 bg-emerald-50 px-4 py-1.5 text-xs font-medium text-emerald-700"
      >
        Order ID: {orderNumber}
      </motion.div>
    </div>
  );
}
