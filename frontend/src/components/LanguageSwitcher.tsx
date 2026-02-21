import { motion } from "framer-motion";
import { getLanguage, setLanguage } from "../lib/i18n";
import { useEffect, useState } from "react";

export function LanguageSwitcher() {
  const [language, setInternalLanguage] = useState(getLanguage());

  useEffect(() => {
    const handleLanguageChange = () => setInternalLanguage(getLanguage());
    window.addEventListener("languagechange", handleLanguageChange);
    return () => window.removeEventListener("languagechange", handleLanguageChange);
  }, []);

  const toggleLanguage = () => {
    const newLang = language === "id" ? "en" : "id";
    setLanguage(newLang);
  };

  return (
    <button
      onClick={toggleLanguage}
      className="relative flex items-center gap-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-full p-1 cursor-pointer hover:bg-white/20 transition-colors"
      aria-label="Switch Language"
    >
      <div className="relative z-10 flex items-center justify-center px-2 py-1 text-[10px] font-bold text-white min-w-[28px]">
        ID
      </div>
      <div className="relative z-10 flex items-center justify-center px-2 py-1 text-[10px] font-bold text-white min-w-[28px]">
        EN
      </div>
      
      {/* Sliding Background */}
      <motion.div
        className="absolute top-1 bottom-1 bg-white rounded-full shadow-sm"
        initial={false}
        animate={{
          x: language === "id" ? 4 : 36,
          width: 28
        }}
        transition={{
          type: "spring",
          stiffness: 400,
          damping: 30
        }}
      />
      
      {/* Active Text Color Overlay (Optional - usually difficult with this structure, so we just use mix-blend or simple text color change if needed. 
          For simplicity, we let the white background sit behind the text. 
          To make text readable on white, we need to change text color dynamically.
      ) */}
    </button>
  );
}

// Improved version with text color handling
interface LanguageSwitcherPillProps {
  variant?: "light" | "dark";
  uniqueId?: string;
}

export function LanguageSwitcherPill({ variant = "light", uniqueId = "lang-switch" }: LanguageSwitcherPillProps) {
  const [language, setInternalLanguage] = useState(getLanguage());

  useEffect(() => {
    const handleLanguageChange = () => setInternalLanguage(getLanguage());
    window.addEventListener("languagechange", handleLanguageChange);
    return () => window.removeEventListener("languagechange", handleLanguageChange);
  }, []);

  const containerClass = variant === "light"
    ? "bg-white/10 backdrop-blur-md border border-white/30 shadow-[0_0_0_1px_rgba(255,255,255,0.4)]"
    : "bg-white/90 border border-slate-200 shadow-[0_6px_16px_rgba(15,23,42,0.12)]";

  const inactiveTextClass = variant === "light"
    ? "text-slate-200 hover:text-white"
    : "text-slate-500 hover:text-slate-900";

  return (
    <div className={`flex items-center px-1 py-0.5 rounded-full ${containerClass}`}>
      <button
        onClick={() => setLanguage("id")}
        className="relative px-2.5 py-1 rounded-full text-[9px] font-bold transition-all duration-300 overflow-hidden"
      >
        {language === "id" && (
          <motion.div
            layoutId={`activeLang-${uniqueId}`}
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: 'url(https://flagcdn.com/w80/id.png)' }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px]" />
          </motion.div>
        )}
        <span className={`relative z-10 ${language === "id" ? "text-white drop-shadow-md" : inactiveTextClass}`}>ID</span>
      </button>
      <button
        onClick={() => setLanguage("en")}
        className="relative px-2.5 py-1 rounded-full text-[9px] font-bold transition-all duration-300 overflow-hidden"
      >
        {language === "en" && (
          <motion.div
            layoutId={`activeLang-${uniqueId}`}
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: 'url(https://flagcdn.com/w80/gb.png)' }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px]" />
          </motion.div>
        )}
        <span className={`relative z-10 ${language === "en" ? "text-white drop-shadow-md" : inactiveTextClass}`}>EN</span>
      </button>
    </div>
  );
}
