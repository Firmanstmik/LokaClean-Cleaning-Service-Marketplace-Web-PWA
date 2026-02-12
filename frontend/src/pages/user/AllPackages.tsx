import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Search, Sparkles, ArrowRight, Star, Plus
} from "lucide-react";
import { api } from "../../lib/api";
import { getApiErrorMessage } from "../../lib/apiError";
import { getPackageImage, getPackageImageAlt } from "../../utils/packageImage";
import { t, getLanguage } from "../../lib/i18n";
import { PackageDetailModal } from "../../components/PackageDetailModal";
import { OptimizedImage } from "../../components/ui/OptimizedImage";
import type { PaketCleaning } from "../../types/api";

export function AllPackagesPage() {
  const navigate = useNavigate();
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
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [packagesResp, userResp] = await Promise.allSettled([
          api.get("/packages"),
          api.get("/users/me")
        ]);

        if (alive) {
          if (packagesResp.status === "fulfilled") {
            setItems(packagesResp.value.data.data.items as PaketCleaning[]);
          } else {
            setError(getApiErrorMessage(packagesResp.reason));
          }

          if (userResp.status === "fulfilled") {
             // Handle nested user object if present (common in this codebase)
             const userData = userResp.value.data.data;
             const name = userData?.user?.full_name || userData?.full_name;
             setUserName(name);
          }
        }
      } catch (err) {
        if (alive) setError(getApiErrorMessage(err));
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  return (
    <div className="min-h-screen w-full bg-[#F8FAFC] pb-24 selection:bg-teal-200 selection:text-teal-900">
      
      {/* 1. TOP HERO SECTION */}
      <div className="pt-4 px-4 sm:px-6 lg:px-8 pb-6">
        <div className="max-w-7xl mx-auto">
          {/* Gradient Card with Personalized Welcome */}
          <div className="relative overflow-hidden rounded-2xl bg-slate-900 p-5 sm:p-8 shadow-lg shadow-slate-900/20 text-white isolate border border-white/15 group">
            {/* Background Image & Overlay */}
            <div className="absolute inset-0 z-0">
              <img 
                src="/img/hero.png" 
                alt="Welcome Background" 
                className="w-full h-full object-cover opacity-40 group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-br from-slate-900/95 via-slate-900/80 to-slate-800/90 mix-blend-multiply" />
            </div>

            {/* Background Effects */}
            <div className="absolute top-0 right-0 -mt-20 -mr-20 h-96 w-96 rounded-full bg-teal-500/20 blur-[80px] pointer-events-none z-0" />
            <div className="absolute bottom-0 left-0 -mb-20 -ml-20 h-80 w-80 rounded-full bg-blue-500/20 blur-[60px] pointer-events-none z-0" />
            
            {/* Content */}
            <div className="relative z-10 flex flex-col items-start gap-2">
               <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 shadow-lg">
                  <Sparkles className="w-3 h-3 text-yellow-300 fill-yellow-300" />
                  <span className="text-[9px] font-bold tracking-wide uppercase text-slate-200">
                    {isEnglish ? "Premium Service" : "Layanan Premium"}
                  </span>
               </div>
               
               <div>
                  <h1 className="text-lg sm:text-2xl md:text-3xl font-black tracking-tight mb-1 leading-tight drop-shadow-lg">
                    {isEnglish ? "Welcome," : "Selamat Datang,"} <br/>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-200 via-white to-blue-200">
                       {userName ? userName : (isEnglish ? "Guest" : "Kak")}! 👋
                    </span>
                  </h1>
                  <p className="text-xs sm:text-base text-slate-300 max-w-lg leading-relaxed font-medium">
                    {isEnglish 
                      ? "Ready to make your space sparkle? Choose your perfect cleaning package below." 
                      : "Siap membuat ruanganmu berkilau? Pilih paket kebersihan premium di bawah ini dan biarkan kami yang bekerja."}
                  </p>
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. MAIN CONTENT */}
      <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
              {isEnglish ? "Available Packages" : "Pilihan Paket"}
              <span className="h-1.5 w-1.5 rounded-full bg-teal-500 animate-pulse"></span>
            </h2>
            <p className="text-slate-500 text-xs sm:text-sm mt-0.5 font-medium">
              {isEnglish ? "Select the package that suits your needs" : "Pilih paket yang sesuai dengan kebutuhan Anda"}
            </p>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600 mb-4"></div>
            <p className="text-xs text-slate-500 font-bold">{t("packages.loading")}</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="max-w-md mx-auto bg-white rounded-2xl p-6 text-center shadow-lg shadow-slate-200/50 border border-slate-100">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 mb-3 ring-4 ring-rose-50/50">
              <Search className="h-6 w-6 text-rose-500" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">Oops!</h3>
            <p className="text-slate-500 text-xs mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-5 py-2 rounded-full bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/20"
            >
              {isEnglish ? "Try Again" : "Coba Lagi"}
            </button>
          </div>
        )}

        {/* 3. PACKAGE GRID - Home Page Design */}
        {!loading && !error && (
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
            {items.map((pkg, index) => {
              const name = isEnglish && pkg.name_en ? pkg.name_en : pkg.name;
              const image = getPackageImage(pkg.name, pkg.image);
              const alt = getPackageImageAlt(name);

              return (
                <motion.div
                  key={pkg.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  className="group relative flex flex-col overflow-hidden rounded-2xl bg-white shadow-md border border-slate-300 hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.15)] hover:border-teal-500/50 transition-all duration-300"
                >
                  <div 
                    className="relative aspect-[4/3] sm:aspect-video overflow-hidden cursor-pointer bg-slate-100"
                    onClick={() => navigate(`/orders/new?paket_id=${pkg.id}`)}
                  >
                    <OptimizedImage 
                      src={image} 
                      alt={alt}
                      priority={index < 2} 
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
                    
                    {/* Floating Price Badge */}
                    <div className="absolute bottom-2 left-2 right-auto sm:bottom-3 sm:left-3 bg-white sm:bg-white/90 sm:backdrop-blur-sm px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg shadow-sm border border-white/50">
                       <p className="text-xs sm:text-sm font-bold text-teal-700">
                         Rp {pkg.price.toLocaleString("id-ID")}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col p-3 sm:p-5">
                    <div className="mb-2 sm:mb-3">
                      <h3 className="text-sm sm:text-lg font-bold text-slate-800 leading-tight mb-1 line-clamp-1 group-hover:text-teal-600 transition-colors">{name}</h3>
                      <div className="h-0.5 w-8 sm:w-12 bg-teal-500/30 rounded-full" />
                    </div>
                    
                    <p className="mb-4 text-xs sm:text-sm text-slate-500 line-clamp-2 leading-relaxed">
                      {pkg.description}
                    </p>
                    
                    <div className="mt-auto flex items-center gap-2">
                      <button
                        onClick={() => setSelectedPackage(pkg)}
                        className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-slate-50 border border-slate-200 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-slate-600 hover:bg-teal-50 hover:text-teal-700 hover:border-teal-200 transition-all duration-300 group/btn"
                      >
                        <span>{t("orders.viewDetails")}</span>
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/orders/new?paket_id=${pkg.id}`);
                        }}
                        className="flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-teal-600 text-white shadow-lg shadow-teal-600/20 hover:bg-teal-500 hover:scale-105 active:scale-95 transition-all duration-300"
                        title={isEnglish ? "Book Now" : "Pesan Sekarang"}
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedPackage && (
        <PackageDetailModal
          isOpen={!!selectedPackage}
          onClose={() => setSelectedPackage(null)}
          pkg={selectedPackage}
        />
      )}
    </div>
  );
}
