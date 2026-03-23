import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Search, Tag, ArrowRight, Star, Plus, Sparkles
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
    const loadData = async () => {
      try {
        setLoading(true);
        const [packagesResp] = await Promise.allSettled([
          api.get("/packages"),
        ]);

        if (packagesResp.status === "fulfilled") {
          setItems(packagesResp.value.data.data.items as PaketCleaning[]);
        }
      } catch (err) {
        console.error("Failed to load packages", err);
        setError(t("common.error"));
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [t]);

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
                src="/img/herolokacleanutama.webp" 
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {items.map((pkg, index) => {
              const name = isEnglish && pkg.name_en ? pkg.name_en : pkg.name;
              const description = isEnglish && pkg.description_en ? pkg.description_en : pkg.description;
              const image = getPackageImage(pkg.name, pkg.image);
              const alt = getPackageImageAlt(name);
              const displayPrice = pkg.final_price > 0 ? pkg.final_price : pkg.base_price;
              const hasDiscount =
                pkg.discount_percentage > 0 && pkg.base_price > 0 && displayPrice > 0;
              const discountEdition = pkg.discount_edition?.trim();

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
                    className="relative aspect-[4/3] overflow-hidden cursor-pointer bg-slate-100"
                    onClick={() => navigate(`/orders/new?paket_id=${pkg.id}`)}
                  >
                    <OptimizedImage 
                      src={image} 
                      alt={alt}
                      priority={index < 2} 
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-40 group-hover:opacity-20 transition-opacity" />
                    
                    {/* Top Right: Discount Badge */}
                    {hasDiscount && (
                      <div className="absolute top-2 right-2 z-20">
                        <div className="bg-rose-100/90 backdrop-blur-sm border border-rose-200 px-2 py-0.5 rounded-lg shadow-sm">
                          <span className="text-[11px] font-black text-rose-600">
                            -{pkg.discount_percentage}%
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Bottom Right: Promo Edition Badge */}
                    {discountEdition && (
                      <div className="absolute bottom-2 right-2 z-20">
                        <div className="flex items-center gap-1 rounded-full bg-gradient-to-r from-orange-500 via-rose-500 to-rose-600 px-2 py-1 text-[9px] font-black tracking-tight text-white uppercase shadow-lg shadow-rose-500/30 border border-white/40 backdrop-blur-sm animate-pulse-subtle">
                          <Tag className="w-2.5 h-2.5 text-white fill-white/10" />
                          <span>PROMO {discountEdition}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-1 flex-col p-3.5 sm:p-4">
                    <div className="mb-2">
                      <h3 className="text-sm sm:text-base font-black text-slate-900 leading-tight mb-1 line-clamp-1 group-hover:text-teal-600 transition-colors tracking-tight">{name}</h3>
                      <div className="h-0.5 w-8 bg-teal-500 rounded-full" />
                    </div>
                    
                    <p className="mb-2 text-[11px] sm:text-xs text-slate-500 line-clamp-2 leading-relaxed font-medium">
                      {description}
                    </p>

                    {/* Price Section below description */}
                    <div className="mb-3">
                      <div className="flex flex-wrap items-baseline gap-2 leading-tight">
                        {displayPrice > 0 ? (
                          <>
                            <span className="text-base font-black text-teal-700 tracking-tight">
                              Rp {displayPrice.toLocaleString("id-ID")}
                            </span>
                            {hasDiscount && (
                              <span className="text-[10px] font-bold text-slate-400 line-through">
                                Rp {pkg.base_price.toLocaleString("id-ID")}
                              </span>
                            )}
                            {pkg.pricing_note && (
                              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded italic">
                                {pkg.pricing_note}
                              </span>
                            )}
                          </>
                        ) : (
                          <p className="text-[11px] font-black text-teal-700 italic bg-teal-50 px-2 py-1 rounded-lg border border-teal-100">
                            {pkg.pricing_note || (isEnglish ? "Contact us for pricing" : "Hubungi kami untuk harga")}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="mt-auto flex items-center gap-2">
                      <button
                        onClick={() => setSelectedPackage(pkg)}
                        className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-slate-50 border border-slate-200 py-2 text-[11px] font-black text-slate-600 hover:bg-teal-50 hover:text-teal-700 hover:border-teal-200 transition-all duration-300 group/btn"
                      >
                        <span>{t("orders.viewDetails")}</span>
                        <ArrowRight className="w-3 h-3 group-hover/btn:translate-x-1 transition-transform" />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/orders/new?paket_id=${pkg.id}`);
                        }}
                        className="flex items-center justify-center w-9 h-9 rounded-xl bg-teal-600 text-white shadow-lg shadow-teal-600/30 hover:bg-teal-500 hover:scale-105 active:scale-95 transition-all duration-300"
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
