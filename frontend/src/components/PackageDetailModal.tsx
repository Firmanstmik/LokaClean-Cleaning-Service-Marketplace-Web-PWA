import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Star, Sparkles, CheckCircle2, ShieldCheck, Zap, Droplets, Bed, ArrowRight, Wallet, Home, Square, Box, Wand2 } from "lucide-react";
import { PaketCleaning } from "../types/api";
import { getPackageImage, getPackageImageAlt } from "../utils/packageImage";
import { Link, useNavigate } from "react-router-dom";
import { getLanguage, t } from "../lib/i18n";

interface PackageDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  pkg: PaketCleaning;
  onBook?: () => void;
}

export function PackageDetailModal({ isOpen, onClose, pkg, onBook }: PackageDetailModalProps) {
  const navigate = useNavigate();
  const currentLanguage = getLanguage();
  const isEnglish = currentLanguage === "en";

  const name = isEnglish && pkg.name_en ? pkg.name_en : pkg.name;
  const description = isEnglish && pkg.description_en ? pkg.description_en : pkg.description;
  const image = getPackageImage(pkg.name, pkg.image);
  const alt = getPackageImageAlt(name);
  
  // Extract features (simplified logic for modal)
  const features = React.useMemo(() => {
    const list: Array<{ text: string; icon: typeof Square; color: string; bgColor: string }> = [];
    const desc = description.toLowerCase();
    
    // Feature mappings with icons and colors (ordered by priority - more specific first)
    const featureMap: Array<{
      keywords: string[];
      text: string;
      icon: typeof Square;
      color: string;
      bgColor: string;
    }> = [
      {
        keywords: ["kamar mandi", "bathroom", "wc", "toilet"],
        text: t("packages.feature.bathroom"),
        icon: Droplets,
        color: "text-cyan-700",
        bgColor: "bg-cyan-50 border-cyan-200/50"
      },
      {
        keywords: ["area tidur", "kamar tidur"],
        text: t("packages.feature.bedroom"),
        icon: Bed,
        color: "text-purple-700",
        bgColor: "bg-purple-50 border-purple-200/50"
      },
      {
        keywords: ["lantai", "floor"],
        text: t("packages.feature.floor"),
        icon: Square,
        color: "text-blue-700",
        bgColor: "bg-blue-50 border-blue-200/50"
      },
      {
        keywords: ["penataan", "organizing", "rapikan", "tata"],
        text: t("packages.feature.organizing"),
        icon: Box,
        color: "text-emerald-700",
        bgColor: "bg-emerald-50 border-emerald-200/50"
      },
      {
        keywords: ["dapur", "kitchen"],
        text: t("packages.feature.kitchen"),
        icon: Sparkles,
        color: "text-amber-700",
        bgColor: "bg-amber-50 border-amber-200/50"
      },
      {
        keywords: ["menyeluruh", "seluruh", "komprehensif"],
        text: t("packages.feature.deepClean"),
        icon: Home,
        color: "text-indigo-700",
        bgColor: "bg-indigo-50 border-indigo-200/50"
      },
      {
        keywords: ["detail", "mendalam", "deep"],
        text: t("packages.feature.detailClean"),
        icon: Wand2,
        color: "text-pink-700",
        bgColor: "bg-pink-50 border-pink-200/50"
      }
    ];

    // Check each feature (check longer phrases first)
    for (const feature of featureMap) {
      // Sort keywords by length (longest first) to match more specific phrases first
      const sortedKeywords = [...feature.keywords].sort((a, b) => b.length - a.length);
      
      for (const keyword of sortedKeywords) {
        if (desc.includes(keyword)) {
          // Check if already added
          if (!list.find(f => f.text === feature.text)) {
            list.push({
              text: feature.text,
              icon: feature.icon,
              color: feature.color,
              bgColor: feature.bgColor
            });
            break;
          }
        }
      }
    }
    
    // Default features if few found
    if (list.length === 0) {
       list.push({ icon: CheckCircle2, text: "Professional", color: "text-blue-700", bgColor: "bg-blue-50 border-blue-200/50" });
       list.push({ icon: Zap, text: "Fast", color: "text-indigo-700", bgColor: "bg-indigo-50 border-indigo-200/50" });
    }
    
    return list.slice(0, 4);
  }, [description, isEnglish]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-[70] flex h-[85vh] flex-col overflow-hidden rounded-t-[2rem] bg-white md:inset-0 md:m-auto md:h-fit md:max-h-[80vh] md:w-full md:max-w-xl md:rounded-[2rem] md:top-10"
          >
            {/* Header Image Section */}
            <div className="relative h-56 md:h-64 shrink-0">
              <img
                src={image}
                alt={alt}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute right-4 top-4 rounded-full bg-black/20 backdrop-blur-md p-2 text-white hover:bg-black/40 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>

              {/* Title & Price Overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="mb-2 flex items-center gap-2">
                      <span className="rounded-lg bg-amber-400/20 backdrop-blur-md px-2.5 py-1 text-xs font-bold text-amber-300 border border-amber-400/30 flex items-center gap-1.5">
                        <Star className="h-3.5 w-3.5 fill-amber-300" />
                        {pkg.averageRating ? pkg.averageRating.toFixed(1) : "5.0"}
                      </span>
                      <span className="text-sm font-medium text-white/80">
                        ({pkg.totalReviews || 0} {isEnglish ? "Reviews" : "Ulasan"})
                      </span>
                    </div>
                    <h2 className="text-2xl font-bold leading-tight md:text-2xl">{name}</h2>
                  </div>
                </div>
              </div>
            </div>

            {/* Content Scrollable Area */}
            <div className="flex-1 overflow-y-auto bg-white px-6 py-4 pb-32 md:pb-6">
              {/* Price Row */}
              <div className="mb-5 flex items-center justify-center rounded-2xl bg-slate-50 p-3 border border-slate-100">
                 <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-tropical-100 text-tropical-600">
                       <Wallet className="h-5 w-5" />
                    </div>
                    <div>
                       <p className="text-xs text-slate-500 font-medium">{isEnglish ? "Starting Price" : "Harga Mulai"}</p>
                       <p className="text-base font-bold text-slate-800">Rp {pkg.price.toLocaleString("id-ID")}</p>
                    </div>
                 </div>
              </div>

              {/* Description */}
              <div className="mb-6">
                <h3 className="mb-2 text-base font-bold text-slate-800">{isEnglish ? "About Service" : "Tentang Layanan"}</h3>
                <p className="text-sm leading-relaxed text-slate-600 md:text-sm">
                  {description}
                </p>
              </div>

              {/* Features Grid */}
              <div className="mb-6">
                <h3 className="mb-3 text-base font-bold text-slate-800">{isEnglish ? "What's Included" : "Termasuk Layanan"}</h3>
                <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
                  {features.map((feature, idx) => {
                    // Use bgColor if available, otherwise construct from color (though we now guarantee bgColor)
                    const bgColor = feature.bgColor || `bg-${feature.color.split('-')[1]}-50`;
                    
                    return (
                      <div key={idx} className={`flex items-center gap-2 sm:gap-2.5 p-3 sm:p-3.5 rounded-lg sm:rounded-xl border ${bgColor} h-full`}>
                        <feature.icon className={`h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 ${feature.color}`} />
                        <span className={`text-xs sm:text-sm font-semibold ${feature.color} whitespace-normal leading-relaxed`}>
                          {feature.text}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Bottom Action Bar (Sticky on Mobile) */}
            <div className="absolute bottom-0 left-0 right-0 border-t border-slate-100 bg-white px-6 py-4 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] md:relative md:shadow-none md:border-t-0">
              <button
                onClick={() => {
                  if (onBook) {
                    onBook();
                  } else {
                    navigate(`/orders/new?paket_id=${pkg.id}`);
                  }
                }}
                className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-tropical-500 to-ocean-500 py-4 text-base font-bold text-white shadow-xl shadow-tropical-500/30 transition-all hover:scale-[1.02] hover:shadow-tropical-500/50 active:scale-[0.98]"
              >
                <span>{isEnglish ? "Book Now" : "Pesan Sekarang"}</span>
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
