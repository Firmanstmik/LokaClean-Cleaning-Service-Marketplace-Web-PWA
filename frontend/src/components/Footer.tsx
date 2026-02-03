/**
 * Footer component - Modern, compact responsive footer.
 * Optimized for Android mobile view (small text, clean layout).
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
      {/* Animated background decoration - Hidden on mobile to save performance */}
      <div className="hidden sm:block absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 h-64 w-64 rounded-full bg-tropical-500/10 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 h-64 w-64 rounded-full bg-ocean-500/10 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12 pb-24 sm:pb-8 lg:pb-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-8 lg:gap-12 text-center sm:text-left">
          {/* Brand Section */}
          <div className="space-y-2 sm:space-y-4 flex flex-col items-center sm:items-start">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center overflow-hidden border border-white/20 flex-shrink-0 shadow-lg">
                <img
                  src="/img/Logo_LokaClean.jpg"
                  alt="LokaClean Logo"
                  className="h-full w-full object-contain p-0.5 sm:p-1"
                />
              </div>
              <div className="text-left">
                <h3 className="text-sm sm:text-lg lg:text-xl font-black text-white tracking-tight">LokaClean</h3>
                <p className="text-[8px] sm:text-xs text-slate-300 font-medium">{t('home.footer.tagline')}</p>
              </div>
            </div>
            <p className="text-[9px] sm:text-sm text-slate-300 leading-relaxed max-w-xs sm:max-w-none mx-auto sm:mx-0">
              {t('home.footer.description')}
            </p>
          </div>

          {/* Contact Information - Compact for Mobile */}
          {(variant === "all" || variant === "contact-only") && (
            <div className="space-y-2 sm:space-y-4 flex flex-col items-center sm:items-start">
              <h4 className="text-[10px] sm:text-base font-bold text-white uppercase tracking-wider bg-white/5 px-2 py-0.5 rounded-full sm:bg-transparent sm:px-0 sm:py-0 inline-block mb-1 sm:mb-4">{t('home.footer.contactUs')}</h4>
              <div className="space-y-1.5 w-full max-w-[260px] sm:max-w-none">
                {/* Phone */}
                <div className="flex items-center gap-2.5 text-[10px] sm:text-sm text-slate-300 bg-white/5 sm:bg-transparent p-1.5 sm:p-0 rounded-lg sm:rounded-none border border-white/5 sm:border-none">
                  <div className="flex-shrink-0 h-5 w-5 sm:h-7 sm:w-7 rounded-md sm:rounded-lg bg-tropical-500/20 flex items-center justify-center">
                    <Phone className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-tropical-400" />
                  </div>
                  <a
                    href="tel:+6281236893055"
                    className="hover:text-tropical-400 transition-colors font-medium"
                  >
                    0812-3689-3055
                  </a>
                </div>
                
                {/* Email */}
                <div className="flex items-center gap-2.5 text-[10px] sm:text-sm text-slate-300 bg-white/5 sm:bg-transparent p-1.5 sm:p-0 rounded-lg sm:rounded-none border border-white/5 sm:border-none">
                  <div className="flex-shrink-0 h-5 w-5 sm:h-7 sm:w-7 rounded-md sm:rounded-lg bg-ocean-500/20 flex items-center justify-center">
                    <Mail className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-ocean-400" />
                  </div>
                  <a
                    href="mailto:lokacleanmandalika@gmail.com"
                    className="hover:text-ocean-400 transition-colors break-all font-medium"
                  >
                    lokacleanmandalika@gmail.com
                  </a>
                </div>

                {/* Hours */}
                <div className="flex items-center gap-2.5 text-[10px] sm:text-sm text-slate-300 bg-white/5 sm:bg-transparent p-1.5 sm:p-0 rounded-lg sm:rounded-none border border-white/5 sm:border-none">
                  <div className="flex-shrink-0 h-5 w-5 sm:h-7 sm:w-7 rounded-md sm:rounded-lg bg-sun-500/20 flex items-center justify-center">
                    <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-sun-400" />
                  </div>
                  <span className="font-medium">{t('home.footer.hours')}</span>
                </div>
              </div>
            </div>
          )}

          {/* Social Media & Links */}
          {variant === "all" && (
            <div className="space-y-2 sm:space-y-4 flex flex-col items-center sm:items-start">
              <h4 className="text-[10px] sm:text-base font-bold text-white uppercase tracking-wider bg-white/5 px-2 py-0.5 rounded-full sm:bg-transparent sm:px-0 sm:py-0 inline-block mb-1 sm:mb-4">{t('home.footer.followUs')}</h4>
              <div className="flex items-center gap-3 justify-center sm:justify-start">
                {/* Instagram */}
                <a
                  href="https://instagram.com/lokaclean"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative h-9 w-9 sm:h-12 sm:w-12 rounded-xl overflow-hidden bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center transition-transform active:scale-95"
                  aria-label="Instagram"
                >
                  <Instagram className="h-4 w-4 sm:h-6 sm:w-6 text-white drop-shadow-lg" />
                </a>

                {/* Twitter */}
                <a
                  href="https://twitter.com/lokaclean"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative h-9 w-9 sm:h-12 sm:w-12 rounded-xl overflow-hidden bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center transition-transform active:scale-95"
                  aria-label="Twitter"
                >
                  <Twitter className="h-4 w-4 sm:h-6 sm:w-6 text-white drop-shadow-lg" />
                </a>

                {/* YouTube */}
                <a
                  href="https://youtube.com/@lokaclean"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative h-9 w-9 sm:h-12 sm:w-12 rounded-xl overflow-hidden bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center transition-transform active:scale-95"
                  aria-label="YouTube"
                >
                  <Youtube className="h-4 w-4 sm:h-6 sm:w-6 text-white drop-shadow-lg" />
                </a>

                {/* WhatsApp */}
                <a
                  href="https://wa.me/6281236893055"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative h-9 w-9 sm:h-12 sm:w-12 rounded-xl overflow-hidden bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center transition-transform active:scale-95"
                  aria-label="WhatsApp"
                >
                  <MessageCircle className="h-4 w-4 sm:h-6 sm:w-6 text-white drop-shadow-lg" />
                </a>
              </div>
              <p className="text-[10px] text-slate-400 mt-2 hidden sm:block">
                {t('home.footer.socialText')}
              </p>
            </div>
          )}
        </div>

        {/* Bottom Bar */}
        <div className="mt-4 sm:mt-8 lg:mt-12 pt-3 sm:pt-6 lg:pt-8 border-t border-white/10 pb-4 sm:pb-0">
          <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-2 sm:gap-4">
            <p className="text-[9px] sm:text-xs lg:text-sm text-slate-400 text-center sm:text-left font-medium leading-tight px-1">
              © {currentYear} LokaClean. {t('home.footer.rightsReserved')}
            </p>
            <div className="flex items-center gap-2 sm:gap-4 flex-wrap justify-center">
              <a href="#" className="text-[9px] sm:text-xs lg:text-sm text-slate-500 hover:text-white transition-colors">
                {t('home.footer.privacyPolicy')}
              </a>
              <span className="text-slate-600 text-[9px] sm:text-xs">•</span>
              <a href="#" className="text-[9px] sm:text-xs lg:text-sm text-slate-500 hover:text-white transition-colors">
                {t('home.footer.termsOfService')}
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}