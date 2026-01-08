/**
 * Admin notification toast component with sound effect
 */

import { motion, AnimatePresence } from "framer-motion";
import { X, Package, Bell } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useRef } from "react";

interface AdminNotificationToastProps {
  orderId: number;
  userName: string;
  paketName: string;
  onClose: () => void;
}

/**
 * Play notification sound using Web Audio API
 */
function playNotificationSound() {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Professional notification sound: two-tone chime
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.1);
    
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);

    // Cleanup
    oscillator.onended = () => {
      audioContext.close();
    };
  } catch (err) {
    console.error('Failed to play notification sound:', err);
  }
}

export function AdminNotificationToast({ orderId, userName, paketName, onClose }: AdminNotificationToastProps) {
  // Sound is now played in AdminLayout when notification is triggered
  // This component just displays the notification

  return (
    <motion.div
      initial={{ opacity: 0, x: 300, scale: 0.9 }}
      animate={{ 
        opacity: 1, 
        x: 0,
        scale: 1,
        transition: { 
          type: "spring",
          damping: 25,
          stiffness: 300
        }
      }}
      exit={{ 
        opacity: 0, 
        x: 300,
        scale: 0.9,
        transition: { duration: 0.2 }
      }}
      className="w-full rounded-xl border-2 border-amber-300 bg-gradient-to-r from-amber-50/95 to-orange-50/95 shadow-2xl overflow-hidden backdrop-blur-sm"
    >
      <div className="flex items-start gap-2.5 sm:gap-3 p-3 sm:p-3.5">
        {/* Icon with animation */}
        <motion.div 
          className="flex-shrink-0 mt-0.5"
          animate={{ 
            rotate: [0, -10, 10, -10, 0],
            scale: [1, 1.2, 1]
          }}
          transition={{ 
            duration: 0.5,
            ease: "easeInOut"
          }}
        >
          <div className="relative">
            <Bell className="h-5 w-5 sm:h-6 sm:w-6 text-amber-600" />
            {/* Pulsing glow effect */}
            <motion.div
              className="absolute inset-0 bg-amber-400 rounded-full blur-md opacity-50"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.5, 0.2, 0.5]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </div>
        </motion.div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <h4 className="text-xs sm:text-sm font-black text-slate-900 leading-tight pr-2">
              Pesanan Baru Masuk! 🎉
            </h4>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="flex-shrink-0 text-slate-400 hover:text-slate-600 p-0.5 -mt-0.5 -mr-1"
              title="Close"
            >
              <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </motion.button>
          </div>
          <p className="text-[11px] sm:text-xs font-medium text-slate-600 mb-2 leading-relaxed">
            <span className="font-bold text-amber-700">{userName}</span> telah membuat pesanan baru: <span className="font-semibold">{paketName}</span>
          </p>
          <Link
            to={`/admin/orders/${orderId}`}
            onClick={onClose}
            className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-bold text-amber-700 hover:text-amber-800 px-2.5 py-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 transition-colors active:scale-95"
          >
            <Package className="h-3 w-3" />
            Lihat Pesanan →
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

interface AdminNotificationContainerProps {
  orderId: number | null;
  userName: string | null;
  paketName: string | null;
  onClose: () => void;
}

export function AdminNotificationContainer({ orderId, userName, paketName, onClose }: AdminNotificationContainerProps) {
  if (!orderId || !userName || !paketName) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[10000] pointer-events-none px-3 sm:px-4 pt-20 sm:pt-24">
      <div className="relative max-w-md mx-auto sm:mx-0 sm:ml-auto">
        <AnimatePresence>
          <AdminNotificationToast
            orderId={orderId}
            userName={userName}
            paketName={paketName}
            onClose={onClose}
          />
        </AnimatePresence>
      </div>
    </div>
  );
}

