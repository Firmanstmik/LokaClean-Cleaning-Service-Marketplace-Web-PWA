import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Package, Search, Sparkles, ArrowRight, ShieldCheck, Star } from "lucide-react";
import { api } from "../../lib/api";
import { getApiErrorMessage } from "../../lib/apiError";
import { PageHeaderCard } from "../../components/PageHeaderCard";
import { getPackageImage, getPackageImageAlt } from "../../utils/packageImage";
import { getPackageGradient } from "../../utils/packageIcon";
import { PackageRatingDisplay } from "../../components/PackageRatingDisplay";
import { t, getLanguage } from "../../lib/i18n";
import { PackageDetailModal } from "../../components/PackageDetailModal";
import { LoginRequiredModal } from "../../components/LoginRequiredModal";
import { useAuth } from "../../lib/auth";
import type { PaketCleaning } from "../../types/api";

export function AllPackagesPage() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);

  const handleInteraction = (action: () => void) => {
    if (!token) {
      setShowLoginModal(true);
    } else {
      action();
    }
  };

  const [language, setLanguage] = useState(getLanguage());
  useEffect(() => {
    const handleLanguageChange = () => setLanguage(getLanguage());
    window.addEventListener("languagechange", handleLanguageChange);
    return () => window.removeEventListener("languagechange", handleLanguageChange);
  }, []);
  const isEnglish = language === "en";

  const [items, setItems] = useState<PaketCleaning[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<PaketCleaning | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const resp = await api.get("/packages");
        const next = resp.data.data.items as PaketCleaning[];
        if (alive) setItems(next);
      } catch (err) {
        if (alive) setError(getApiErrorMessage(err));
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariant = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-tropical-50 via-ocean-50/50 to-sand-50/70 relative overflow-hidden">
      {/* Animated background particles - Matching Home.tsx */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-tropical-200/20 blur-3xl"
          animate={{
            x: [0, 100, 0],
            y: [0, 80, 0],
            scale: [1, 1.3, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-ocean-200/20 blur-3xl"
          animate={{
            x: [0, -80, 0],
            y: [0, -100, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 h-80 w-80 rounded-full bg-sun-200/15 blur-3xl"
          animate={{
            x: [0, 60, 0],
            y: [0, -60, 0],
            scale: [1, 1.4, 1],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      <div className="relative z-10 pt-0 sm:pt-0">
        <PageHeaderCard
          icon={Package}
          title={isEnglish ? "All Packages" : "Semua Paket"}
          subtitle={isEnglish ? "Premium cleaning services tailored for you" : "Layanan kebersihan premium khusus untuk Anda"}
          gradientFrom="#1abc9c"
          gradientVia="#3498db"
          gradientTo="#1abc9c"
          iconGradientFrom="#3498db"
          iconGradientVia="#1abc9c"
          iconGradientTo="#3498db"
          glowColor="#1abc9c"
        />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-4 sm:py-6 lg:py-8">
          {/* Section Title & Filter */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-4 border-b border-slate-200/60 pb-4">
            <div>
              <motion.h2 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-xl sm:text-2xl font-bold text-slate-800 flex items-center gap-3"
              >
                {isEnglish ? "Choose Your Service" : "Pilih Layanan Anda"}
                <div className="hidden sm:flex h-8 w-8 items-center justify-center rounded-full bg-amber-100">
                  <Sparkles className="h-4 w-4 text-amber-500 fill-amber-500 animate-pulse" />
                </div>
              </motion.h2>
              <motion.p 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="text-slate-500 mt-2 max-w-2xl text-base leading-relaxed"
              >
                {isEnglish 
                  ? "Experience the best cleaning service with professional staff, transparent pricing, and satisfaction guarantee." 
                  : "Nikmati layanan kebersihan terbaik dengan staff profesional, harga transparan, dan jaminan kepuasan pelanggan."}
              </motion.p>
            </div>
            
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-2 text-sm font-semibold text-emerald-700 bg-emerald-50/80 backdrop-blur-md px-5 py-2.5 rounded-2xl border border-emerald-100 shadow-sm"
            >
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
              <span>{isEnglish ? "Verified Professionals" : "Profesional Terverifikasi"}</span>
            </motion.div>
          </div>

          {loading && (
            <div className="flex flex-col items-center justify-center py-20">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                className="relative h-16 w-16"
              >
                <div className="absolute inset-0 rounded-full border-4 border-slate-200"></div>
                <div className="absolute inset-0 rounded-full border-4 border-t-tropical-500 border-r-transparent border-b-transparent border-l-transparent"></div>
              </motion.div>
              <p className="mt-6 text-sm text-slate-500 font-medium animate-pulse">{t("packages.loading")}</p>
            </div>
          )}

          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mx-auto max-w-lg rounded-3xl border border-rose-200/60 bg-white/80 backdrop-blur-xl p-8 text-center shadow-lg shadow-rose-500/5"
            >
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-100 mb-4">
                <Search className="h-7 w-7 text-rose-500" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">Oops!</h3>
              <p className="text-slate-600 mb-2">{error}</p>
              <button 
                onClick={() => window.location.reload()}
                className="text-sm font-semibold text-rose-600 hover:text-rose-700 hover:underline"
              >
                {isEnglish ? "Try Again" : "Coba Lagi"}
              </button>
            </motion.div>
          )}

          {!loading && !error && (
            <motion.div 
              variants={container}
              initial="hidden"
              animate="show"
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8"
            >
              <AnimatePresence>
                {items.map((pkg) => {
                  const name = isEnglish && pkg.name_en ? pkg.name_en : pkg.name;
                  const desc = isEnglish && pkg.description_en ? pkg.description_en : pkg.description;
                  const image = getPackageImage(pkg.name, pkg.image);
                  const alt = getPackageImageAlt(name);
                  const gradient = getPackageGradient(pkg.name);

                  return (
                    <motion.div
                      key={pkg.id}
                      layout
                      variants={itemVariant}
                      whileHover={{ y: -8, transition: { duration: 0.3 } }}
                      className="group relative flex flex-col rounded-2xl sm:rounded-[2rem] border border-white/60 bg-white/90 backdrop-blur-xl shadow-sm hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] transition-all duration-300 overflow-hidden"
                    >
                      {/* Image Section */}
                      <div className="relative h-32 sm:h-56 lg:h-64 overflow-hidden">
                        <motion.img 
                          src={image} 
                          alt={alt} 
                          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" 
                          crossOrigin="anonymous" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-80" />
                        
                        {/* Floating Price Tag */}
                        <div className="absolute top-3 right-3 sm:top-4 sm:right-4 rounded-xl bg-white/95 backdrop-blur-md px-3 py-1.5 text-[10px] sm:text-xs font-bold text-slate-800 shadow-lg border border-white/50">
                          {isEnglish ? "From" : "Mulai"} <span className="text-tropical-600 text-sm">Rp {pkg.price.toLocaleString("id-ID")}</span>
                        </div>

                        {/* Category/Rating Overlay - Simplified for Mobile */}
                        <div className="absolute bottom-3 left-3 right-3 sm:bottom-5 sm:left-5 sm:right-5 flex items-end justify-between text-white">
                          <div className="w-full">
                            <div className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-amber-300 mb-2 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-lg w-fit border border-white/10">
                              <Sparkles className="h-3.5 w-3.5 fill-amber-300" />
                              {isEnglish ? "Premium Service" : "Layanan Unggulan"}
                            </div>
                            <h3 className="text-sm sm:text-xl font-bold leading-tight drop-shadow-md line-clamp-2">{name}</h3>
                          </div>
                        </div>
                      </div>

                      {/* Content Section */}
                      <div className="flex flex-1 flex-col p-4 sm:p-6">
                        <div className="mb-4 sm:mb-6 flex-1">
                          <p className="hidden sm:line-clamp-2 text-sm text-slate-600 leading-relaxed mb-3">
                            {desc}
                          </p>
                          <PackageRatingDisplay
                            averageRating={pkg.averageRating}
                            totalReviews={pkg.totalReviews}
                            size="sm"
                          />
                        </div>

                        {/* Action Buttons */}
                        <div className="grid grid-cols-2 gap-3 mt-auto">
                          <button
                            onClick={() => setSelectedPackage(pkg)}
                            className="group/btn relative overflow-hidden rounded-xl bg-slate-50 border border-slate-200 py-2.5 sm:py-3 text-xs sm:text-sm font-bold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-all duration-300"
                          >
                            <span className="relative z-10">{isEnglish ? "Details" : "Detail"}</span>
                          </button>
                          
                          <button
                            onClick={() => handleInteraction(() => navigate(`/orders/new?paket_id=${pkg.id}`))}
                            className="relative overflow-hidden rounded-xl bg-gradient-to-r from-tropical-500 to-ocean-500 py-2.5 sm:py-3 text-xs sm:text-sm font-bold text-white shadow-lg shadow-tropical-500/20 hover:shadow-tropical-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 text-center flex items-center justify-center gap-2 group/book"
                          >
                            <span>{isEnglish ? "Book Now" : "Pesan"}</span>
                            <ArrowRight className="h-3.5 w-3.5 group-hover/book:translate-x-1 transition-transform" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </div>

      {selectedPackage && (
        <PackageDetailModal
          isOpen={!!selectedPackage}
          onClose={() => setSelectedPackage(null)}
          pkg={selectedPackage}
          onBook={() => handleInteraction(() => navigate(`/orders/new?paket_id=${selectedPackage.id}`))}
        />
      )}
      
      <LoginRequiredModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)} 
      />
    </div>
  );
}
