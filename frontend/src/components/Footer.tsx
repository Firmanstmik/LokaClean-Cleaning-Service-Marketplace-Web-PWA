/**
 * Footer component - Modern, responsive footer with contact info and social links.
 */

import { motion } from "framer-motion";
import { Instagram, Facebook, Phone, Mail, Clock, MessageCircle, Youtube, Twitter } from "lucide-react";
import { t, getLanguage } from "../lib/i18n";
import { useEffect, useState } from "react";

interface FooterProps {
  variant?: "all" | "minimal" | "contact-only";
}

export function Footer({ variant = "all" }: FooterProps) {
  const currentYear = new Date().getFullYear();
  const [, setLang] = useState(getLanguage());

  useEffect(() => {
    const handleLanguageChange = () => setLang(getLanguage());
    window.addEventListener("languagechange", handleLanguageChange);
    return () => window.removeEventListener("languagechange", handleLanguageChange);
  }, []);

  return (
    <footer className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden">
      {/* Animated background decoration - Hidden on mobile */}
      <div className="hidden sm:block absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-0 left-1/4 h-64 w-64 rounded-full bg-tropical-500/10 blur-3xl"
          animate={{
            x: [0, 50, 0],
            y: [0, 30, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-0 right-1/4 h-64 w-64 rounded-full bg-ocean-500/10 blur-3xl"
          animate={{
            x: [0, -40, 0],
            y: [0, -30, 0],
            scale: [1, 1.3, 1],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12 pb-28 sm:pb-8 lg:pb-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 lg:gap-12 text-center sm:text-left">
          {/* Brand Section */}
          <div className="space-y-3 sm:space-y-4 flex flex-col items-center sm:items-start">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 sm:h-10 sm:w-10 lg:h-12 lg:w-12 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center overflow-hidden border border-white/20 flex-shrink-0 shadow-lg">
                <img
                  src="/img/Logo_LokaClean.jpg"
                  alt="LokaClean Logo"
                  className="h-full w-full object-contain p-0.5 sm:p-1"
                />
              </div>
              <div className="text-left">
                <h3 className="text-lg sm:text-lg lg:text-xl font-black text-white tracking-tight">LokaClean</h3>
                <p className="text-[10px] sm:text-xs text-slate-300 font-medium">{t('home.footer.tagline')}</p>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-xs sm:max-w-none mx-auto sm:mx-0">
              {t('home.footer.description')}
            </p>
          </div>

          {/* Contact Information */}
          {(variant === "all" || variant === "contact-only") && (
            <div className="space-y-4 sm:space-y-4 flex flex-col items-center sm:items-start">
              <h4 className="text-sm sm:text-base font-bold text-white uppercase tracking-wider bg-white/5 px-3 py-1 rounded-full sm:bg-transparent sm:px-0 sm:py-0 inline-block mb-2 sm:mb-4">{t('home.footer.contactUs')}</h4>
              <div className="space-y-3 w-full max-w-xs sm:max-w-none">
                <div className="flex items-center gap-3 text-sm text-slate-300 bg-white/5 sm:bg-transparent p-2 sm:p-0 rounded-lg sm:rounded-none">
                  <div className="flex-shrink-0 h-8 w-8 rounded-lg bg-tropical-500/20 flex items-center justify-center">
                    <Phone className="h-4 w-4 text-tropical-400" />
                  </div>
                  <a
                    href="tel:+6281236893055"
                    className="hover:text-tropical-400 transition-colors font-medium"
                  >
                    0812-3689-3055
                  </a>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-300 bg-white/5 sm:bg-transparent p-2 sm:p-0 rounded-lg sm:rounded-none">
                  <div className="flex-shrink-0 h-8 w-8 rounded-lg bg-ocean-500/20 flex items-center justify-center">
                    <Mail className="h-4 w-4 text-ocean-400" />
                  </div>
                  <a
                    href="mailto:lokacleanmandalika@gmail.com"
                    className="hover:text-ocean-400 transition-colors break-all font-medium"
                  >
                    lokacleanmandalika@gmail.com
                  </a>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-300 bg-white/5 sm:bg-transparent p-2 sm:p-0 rounded-lg sm:rounded-none">
                  <div className="flex-shrink-0 h-8 w-8 rounded-lg bg-sun-500/20 flex items-center justify-center">
                    <Clock className="h-4 w-4 text-sun-400" />
                  </div>
                  <span className="font-medium">{t('home.footer.hours')}</span>
                </div>
              </div>
            </div>
          )}

          {/* Social Media & Links - Premium Glassmorphism Design */}
          {variant === "all" && (
            <div className="space-y-4 sm:space-y-4 flex flex-col items-center sm:items-start">
              <h4 className="text-sm sm:text-base font-bold text-white uppercase tracking-wider bg-white/5 px-3 py-1 rounded-full sm:bg-transparent sm:px-0 sm:py-0 inline-block mb-2 sm:mb-4">{t('home.footer.followUs')}</h4>
              <div className="flex items-center gap-3 justify-center sm:justify-start">
                {/* Instagram - Premium Glassmorphism */}
                <motion.a
                  href="https://instagram.com/lokaclean"
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ 
                    scale: 1.15, 
                    y: -4,
                    rotate: [0, -5, 5, -5, 0]
                  }}
                  whileTap={{ scale: 0.9 }}
                  className="group relative h-12 w-12 rounded-xl overflow-hidden"
                  aria-label="Instagram"
                >
                  {/* Glassmorphism Background */}
                  <div className="absolute inset-0 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl transition-all duration-300 group-hover:bg-white/15 group-hover:border-white/30" />
                  
                  {/* Gradient Overlay on Hover */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-br from-pink-500/20 via-purple-500/20 to-pink-500/20 opacity-0 group-hover:opacity-100 rounded-xl"
                    transition={{ duration: 0.3 }}
                  />
                  
                  {/* Glow Effect */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-br from-pink-500 to-purple-600 opacity-0 group-hover:opacity-30 blur-xl rounded-xl"
                    transition={{ duration: 0.3 }}
                  />
                  
                  {/* Icon */}
                  <div className="relative z-10 h-full w-full flex items-center justify-center">
                    <Instagram className="h-6 w-6 text-white drop-shadow-lg" />
                  </div>
                </motion.a>

                {/* Twitter/X - Premium Glassmorphism */}
                <motion.a
                  href="https://twitter.com/lokaclean"
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ 
                    scale: 1.15, 
                    y: -4,
                    rotate: [0, 5, -5, 5, 0]
                  }}
                  whileTap={{ scale: 0.9 }}
                  className="group relative h-12 w-12 rounded-xl overflow-hidden"
                  aria-label="Twitter"
                >
                  {/* Glassmorphism Background */}
                  <div className="absolute inset-0 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl transition-all duration-300 group-hover:bg-white/15 group-hover:border-white/30" />
                  
                  {/* Gradient Overlay on Hover */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-br from-sky-500/20 via-blue-500/20 to-sky-500/20 opacity-0 group-hover:opacity-100 rounded-xl"
                    transition={{ duration: 0.3 }}
                  />
                  
                  {/* Glow Effect */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-br from-sky-400 to-blue-500 opacity-0 group-hover:opacity-30 blur-xl rounded-xl"
                    transition={{ duration: 0.3 }}
                  />
                  
                  {/* Icon */}
                  <div className="relative z-10 h-full w-full flex items-center justify-center">
                    <Twitter className="h-6 w-6 text-white drop-shadow-lg" />
                  </div>
                </motion.a>

                {/* YouTube - Premium Glassmorphism with Red on Hover */}
                <motion.a
                  href="https://youtube.com/@lokaclean"
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ 
                    scale: 1.15, 
                    y: -4,
                    rotate: [0, -3, 3, -3, 0]
                  }}
                  whileTap={{ scale: 0.9 }}
                  className="group relative h-12 w-12 rounded-xl overflow-hidden"
                  aria-label="YouTube"
                >
                  {/* Glassmorphism Background */}
                  <div className="absolute inset-0 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl transition-all duration-300 group-hover:bg-white/15 group-hover:border-white/30" />
                  
                  {/* Red Gradient Overlay on Hover */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-br from-red-500/20 via-red-600/20 to-red-500/20 opacity-0 group-hover:opacity-100 rounded-xl"
                    transition={{ duration: 0.3 }}
                  />
                  
                  {/* Red Glow Effect on Hover */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-br from-red-500 to-red-600 opacity-0 group-hover:opacity-40 blur-xl rounded-xl"
                    transition={{ duration: 0.3 }}
                  />
                  
                  {/* Icon */}
                  <div className="relative z-10 h-full w-full flex items-center justify-center">
                    <Youtube className="h-6 w-6 text-white drop-shadow-lg transition-colors duration-300 group-hover:text-red-100" />
                  </div>
                </motion.a>

                {/* WhatsApp - Premium Glassmorphism */}
                <motion.a
                  href="https://wa.me/6281236893055"
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ 
                    scale: 1.15, 
                    y: -4,
                    rotate: [0, -5, 5, -5, 0]
                  }}
                  whileTap={{ scale: 0.9 }}
                  className="group relative h-12 w-12 rounded-xl overflow-hidden"
                  aria-label="WhatsApp"
                >
                  {/* Glassmorphism Background */}
                  <div className="absolute inset-0 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl transition-all duration-300 group-hover:bg-white/15 group-hover:border-white/30" />
                  
                  {/* Gradient Overlay on Hover */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 via-green-500/20 to-emerald-500/20 opacity-0 group-hover:opacity-100 rounded-xl"
                    transition={{ duration: 0.3 }}
                  />
                  
                  {/* Glow Effect */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-green-600 opacity-0 group-hover:opacity-30 blur-xl rounded-xl"
                    transition={{ duration: 0.3 }}
                  />
                  
                  {/* Icon */}
                  <div className="relative z-10 h-full w-full flex items-center justify-center">
                    <MessageCircle className="h-6 w-6 text-white drop-shadow-lg" />
                  </div>
                </motion.a>
              </div>
              <p className="text-xs text-slate-400 mt-2 sm:mt-4 hidden sm:block">
                {t('home.footer.socialText')}
              </p>
            </div>
          )}
        </div>

        {/* Bottom Bar - Copyright & Links */}
        <div className="mt-3 sm:mt-8 lg:mt-12 pt-2.5 sm:pt-6 lg:pt-8 border-t border-white/10 pb-4 sm:pb-0">
          <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-2 sm:gap-4">
            <p className="text-[11px] sm:text-xs lg:text-sm text-white text-center sm:text-left font-semibold leading-tight px-1 py-1">
              © {currentYear} LokaClean. {t('home.footer.rightsReserved')}
            </p>
            <div className="flex items-center gap-2 sm:gap-4 flex-wrap justify-center">
              <a
                href="#"
                className="text-[10px] sm:text-xs lg:text-sm text-slate-400 hover:text-white transition-colors"
                onClick={(e) => {
                  e.preventDefault();
                  // Privacy policy link - can be implemented later
                }}
              >
                {t('home.footer.privacyPolicy')}
              </a>
              <span className="text-slate-600 text-[10px] sm:text-xs">•</span>
              <a
                href="#"
                className="text-[10px] sm:text-xs lg:text-sm text-slate-400 hover:text-white transition-colors"
                onClick={(e) => {
                  e.preventDefault();
                  // Terms of service link - can be implemented later
                }}
              >
                {t('home.footer.termsOfService')}
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
