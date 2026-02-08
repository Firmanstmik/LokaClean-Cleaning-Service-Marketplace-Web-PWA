import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  Package, Search, Sparkles, ArrowRight, ShieldCheck, Star, 
  CheckCircle2, Zap, Trophy, Users
} from "lucide-react";
import { api } from "../../lib/api";
import { getApiErrorMessage } from "../../lib/apiError";
import { getPackageImage, getPackageImageAlt } from "../../utils/packageImage";
import { t, getLanguage } from "../../lib/i18n";
import { PackageDetailModal } from "../../components/PackageDetailModal";
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

  return (
    <div className="min-h-screen w-full bg-teal-50 pb-24 selection:bg-teal-200 selection:text-teal-900">
      
      {/* 1. TOP HERO SECTION */}
      <div className="pt-20 px-4 sm:px-6 lg:px-8 pb-6">
        <div className="max-w-7xl mx-auto">
          {/* Gradient Card */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-teal-600 to-blue-600 p-6 sm:p-8 shadow-sm text-white">
            {/* Background Decoration */}
            <div className="absolute top-0 right-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-white/10 blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 -mb-10 -ml-10 h-40 w-40 rounded-full bg-teal-400/20 blur-2xl pointer-events-none" />

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-white/20 p-2 rounded-xl backdrop-blur-none">
                  <Package className="h-6 w-6 text-white" />
                </div>
                <span className="text-xs font-bold tracking-wider uppercase text-teal-100 bg-teal-800/30 px-2 py-1 rounded-lg">
                  {isEnglish ? "Premium Service" : "Layanan Premium"}
                </span>
              </div>
              
              <h1 className="text-2xl sm:text-3xl font-bold mb-2 tracking-tight">
                {isEnglish ? "All Packages" : "Semua Paket"}
              </h1>
              <p className="text-teal-50 text-sm sm:text-base max-w-lg leading-relaxed opacity-90">
                {isEnglish ? "Premium cleaning services tailored for you" : "Layanan kebersihan premium khusus untuk Anda di Lombok"}
              </p>

              {/* Trust Chips */}
              <div className="flex flex-wrap gap-2 sm:gap-3 mt-6">
                <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-none border border-white/20 px-3 py-1.5 rounded-full">
                  <CheckCircle2 className="h-3.5 w-3.5 text-teal-200" />
                  <span className="text-xs font-semibold">{isEnglish ? "Professional" : "Profesional"}</span>
                </div>
                <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-none border border-white/20 px-3 py-1.5 rounded-full">
                  <ShieldCheck className="h-3.5 w-3.5 text-teal-200" />
                  <span className="text-xs font-semibold">{isEnglish ? "Verified" : "Terverifikasi"}</span>
                </div>
                <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-none border border-white/20 px-3 py-1.5 rounded-full">
                  <Trophy className="h-3.5 w-3.5 text-teal-200" />
                  <span className="text-xs font-semibold">{isEnglish ? "Guaranteed" : "Garansi"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. MAIN CONTENT */}
      <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            {isEnglish ? "Choose Service" : "Pilih Layanan"}
            <span className="h-1.5 w-1.5 rounded-full bg-teal-500"></span>
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            {isEnglish ? "Select the package that suits your needs" : "Pilih paket yang sesuai dengan kebutuhan Anda"}
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600"></div>
            <p className="mt-4 text-sm text-slate-500 font-medium">{t("packages.loading")}</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="max-w-md mx-auto bg-white rounded-2xl p-8 text-center shadow-sm border border-slate-100">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 mb-4">
              <Search className="h-6 w-6 text-rose-500" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Oops!</h3>
            <p className="text-slate-500 text-sm mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="text-sm font-bold text-teal-600 hover:text-teal-700 hover:underline"
            >
              {isEnglish ? "Try Again" : "Coba Lagi"}
            </button>
          </div>
        )}

        {/* 3. PACKAGE GRID - Mobile 2 Columns */}
        {!loading && !error && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
            {items.map((pkg) => {
              const name = isEnglish && pkg.name_en ? pkg.name_en : pkg.name;
              const image = getPackageImage(pkg.name, pkg.image);
              const alt = getPackageImageAlt(name);
              const isNew = pkg.id > 2; // Simple logic for "New" badge example
              const isPopular = pkg.price > 400000; // Logic for "Popular"

              return (
                <div 
                  key={pkg.id}
                  className="group relative flex flex-col bg-white rounded-2xl border border-slate-100 shadow-sm hover:scale-[1.01] transition-transform duration-300 overflow-hidden"
                >
                  {/* Image Top Full Width */}
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
                    <img 
                      src={image} 
                      alt={alt} 
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" 
                    />
                    
                    {/* Gradient Overlay Bottom */}
                    <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/80 to-transparent opacity-90" />
                    
                    {/* Top Right Floating Price Pill */}
                    <div className="absolute top-2 right-2 bg-white/95 px-2.5 py-1 rounded-full shadow-sm border border-slate-100 z-10">
                      <div className="flex flex-col items-end leading-none">
                        <span className="text-[9px] text-slate-500 font-medium mb-0.5">{isEnglish ? "Starts from" : "Mulai"}</span>
                        <span className="text-xs font-bold text-teal-700">Rp {pkg.price.toLocaleString("id-ID")}</span>
                      </div>
                    </div>

                    {/* Popular Badge */}
                    {isPopular && (
                      <div className="absolute top-2 left-2 bg-amber-400 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-sm flex items-center gap-1">
                        <Star className="w-3 h-3 fill-white" />
                        POPULAR
                      </div>
                    )}

                    {/* Content inside Image Overlay (Bottom) */}
                    <div className="absolute bottom-3 left-3 right-3 text-white">
                      <h3 className="text-sm sm:text-base font-bold leading-tight drop-shadow-sm line-clamp-2 mb-1">
                        {name}
                      </h3>
                      
                      {/* Under Title Chips */}
                      <div className="flex items-center gap-2">
                        {isNew && (
                          <span className="flex items-center gap-1 text-[10px] font-semibold bg-emerald-500/90 px-1.5 py-0.5 rounded text-white backdrop-blur-none">
                            <Sparkles className="w-3 h-3" /> New
                          </span>
                        )}
                        <span className="flex items-center gap-1 text-[10px] font-medium text-slate-200">
                          <Users className="w-3 h-3" /> 2 Staff
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Button Row - Bottom of Card */}
                  <div className="p-3 mt-auto grid grid-cols-[1fr_1.5fr] gap-2">
                    <button
                      onClick={() => setSelectedPackage(pkg)}
                      className="rounded-xl border border-slate-200 py-2 text-[10px] sm:text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                      {isEnglish ? "Detail" : "Detail"}
                    </button>
                    
                    <Link
                      to={`/orders/new?paket_id=${pkg.id}`}
                      className="rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 py-2 text-[10px] sm:text-xs font-bold text-white shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-1"
                    >
                      <span>{isEnglish ? "Book" : "Pesan"}</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
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
