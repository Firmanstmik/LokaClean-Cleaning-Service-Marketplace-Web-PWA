/**
 * Thank You Animation Component
 * 
 * Displays an animated character with thank you message after rating submission.
 * Different animations for rating only vs rating + tip.
 */

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Sparkles, Gift, Star } from "lucide-react";
import { getLanguage } from "../lib/i18n";
import { playThankYouSound } from "../utils/sound";
import { speakText } from "../utils/textToSpeech";

type ThankYouAnimationProps = {
  isVisible: boolean;
  hasTip: boolean;
  onClose: () => void;
};

export function ThankYouAnimation({ isVisible, hasTip, onClose }: ThankYouAnimationProps) {
  // Play sound and TTS when animation appears
  useEffect(() => {
    if (isVisible) {
      // Play celebratory sound
      playThankYouSound().catch(err => {
        console.warn('[ThankYouAnimation] Failed to play sound:', err);
      });
      
      // Get current language and speak thank you message
      const currentLang = getLanguage();
      const thankYouText = currentLang === 'id' ? 'Terima kasih' : 'Thank you';
      
      // Speak after a short delay to let sound play first
      setTimeout(() => {
        speakText(thankYouText, {
          lang: currentLang === 'id' ? 'id-ID' : 'en-US',
          rate: 0.85,
          pitch: 1.0,
          volume: 0.9
        }).catch(err => {
          console.warn('[ThankYouAnimation] Failed to speak:', err);
        });
      }, 300);
    }
  }, [isVisible]);

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
          />

          {/* Animation Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 50 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="relative w-full max-w-sm pointer-events-auto">
              {/* Main Card */}
              <motion.div
                className={`relative overflow-hidden rounded-3xl shadow-2xl ${
                  hasTip
                    ? "bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 border-2 border-amber-300"
                    : "bg-gradient-to-br from-teal-50 via-blue-50 to-cyan-50 border-2 border-teal-300"
                }`}
              >
                {/* Decorative Background Elements */}
                <div className="absolute inset-0 overflow-hidden">
                  {[...Array(hasTip ? 12 : 8)].map((_, i) => (
                    <motion.div
                      key={i}
                      className={`absolute rounded-full ${
                        hasTip
                          ? "bg-gradient-to-br from-amber-200/30 to-yellow-200/30"
                          : "bg-gradient-to-br from-teal-200/30 to-blue-200/30"
                      }`}
                      style={{
                        width: `${Math.random() * 60 + 20}px`,
                        height: `${Math.random() * 60 + 20}px`,
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                      }}
                      animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0.6, 0.3],
                        rotate: [0, 180, 360],
                      }}
                      transition={{
                        duration: Math.random() * 3 + 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: i * 0.2,
                      }}
                    />
                  ))}
                </div>

                {/* Content */}
                <div className="relative p-8 text-center">
                  {/* Character Icon */}
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.2, type: "spring", damping: 15 }}
                    className="flex justify-center mb-6"
                  >
                    <motion.div
                      className={`relative w-32 h-32 rounded-full flex items-center justify-center ${
                        hasTip
                          ? "bg-gradient-to-br from-amber-400 via-yellow-400 to-orange-400 shadow-lg shadow-amber-500/50"
                          : "bg-gradient-to-br from-teal-400 via-blue-400 to-cyan-400 shadow-lg shadow-teal-500/50"
                      }`}
                      animate={{
                        scale: [1, 1.1, 1],
                        rotate: [0, 5, -5, 0],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    >
                      {/* Face */}
                      <div className="relative z-10">
                        {hasTip ? (
                          <Gift className="w-16 h-16 text-white" />
                        ) : (
                          <Heart className="w-16 h-16 text-white" />
                        )}
                      </div>

                      {/* Sparkles around character */}
                      {[...Array(hasTip ? 6 : 4)].map((_, i) => (
                        <motion.div
                          key={i}
                          className="absolute"
                          style={{
                            width: "100%",
                            height: "100%",
                          }}
                          animate={{
                            rotate: 360,
                          }}
                          transition={{
                            duration: 3 + i * 0.5,
                            repeat: Infinity,
                            ease: "linear",
                          }}
                        >
                          <motion.div
                            className={`absolute top-0 left-1/2 -translate-x-1/2 ${
                              hasTip ? "text-amber-300" : "text-teal-300"
                            }`}
                            style={{
                              transform: `rotate(${i * (360 / (hasTip ? 6 : 4))}deg) translateY(-60px)`,
                            }}
                            animate={{
                              scale: [0.8, 1.2, 0.8],
                              opacity: [0.5, 1, 0.5],
                            }}
                            transition={{
                              duration: 1.5,
                              repeat: Infinity,
                              ease: "easeInOut",
                              delay: i * 0.2,
                            }}
                          >
                            <Sparkles className="w-6 h-6" />
                          </motion.div>
                        </motion.div>
                      ))}
                    </motion.div>
                  </motion.div>

                  {/* Thank You Message */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <motion.h2
                      className={`text-2xl sm:text-3xl font-black mb-3 ${
                        hasTip
                          ? "text-transparent bg-clip-text bg-gradient-to-r from-amber-600 via-yellow-600 to-orange-600"
                          : "text-transparent bg-clip-text bg-gradient-to-r from-teal-600 via-blue-600 to-cyan-600"
                      }`}
                      animate={{
                        scale: [1, 1.05, 1],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    >
                      {hasTip ? (
                        <>
                          Terima Kasih Banyak! <Star className="inline w-6 h-6 text-amber-500" />
                        </>
                      ) : (
                        "Terima Kasih!"
                      )}
                    </motion.h2>

                    <motion.p
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 }}
                      className={`text-sm sm:text-base font-semibold ${
                        hasTip ? "text-amber-700" : "text-teal-700"
                      } mb-2`}
                    >
                      {hasTip ? (
                        <>
                          Ulasan dan tip Anda sangat berarti bagi kami! 💝
                          <br />
                          <span className="text-xs font-medium text-amber-600 mt-1 block">
                            Kami akan terus memberikan pelayanan terbaik!
                          </span>
                        </>
                      ) : (
                        <>
                          Ulasan Anda sangat membantu kami untuk terus berkembang! 🌟
                          <br />
                          <span className="text-xs font-medium text-teal-600 mt-1 block">
                            Kami menghargai setiap feedback dari Anda!
                          </span>
                        </>
                      )}
                    </motion.p>
                  </motion.div>

                  {/* Close Button */}
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    onClick={onClose}
                    className={`mt-6 w-full rounded-xl px-6 py-3 font-bold text-white shadow-lg transition-all ${
                      hasTip
                        ? "bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-500 hover:from-amber-600 hover:via-yellow-600 hover:to-orange-600"
                        : "bg-gradient-to-r from-teal-500 via-blue-500 to-cyan-500 hover:from-teal-600 hover:via-blue-600 hover:to-cyan-600"
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Kembali ke Pesanan Baru
                  </motion.button>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

