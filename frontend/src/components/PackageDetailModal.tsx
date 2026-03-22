import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Star, Tag, CheckCircle2, ShieldCheck, Zap, Droplets, Bed, ArrowRight, Wallet, Home, Square, Box, Wand2, Sparkles } from "lucide-react";
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

  const displayPrice = pkg.final_price > 0 ? pkg.final_price : pkg.base_price;
  const hasDiscount = pkg.discount_percentage > 0 && pkg.base_price > 0 && displayPrice > 0;
  const discountEdition = pkg.discount_edition?.trim();
  
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
            className="fixed inset-x-0 bottom-24 z-[70] flex h-[75vh] flex-col overflow-hidden rounded-t-[2rem] bg-white shadow-[0_-18px_45px_rgba(15,23,42,0.28)] md:inset-0 md:bottom-0 md:m-auto md:h-fit md:max-h-[80vh] md:w-full md:max-w-xl md:rounded-[2rem] md:shadow-2xl md:top-10"
          >
            {/* Header Image Section */}
            <div className="relative aspect-video md:h-80 shrink-0 overflow-hidden">
              <img
                src={image}
                alt={alt}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-40" />
              
              {/* Top Right: Discount Badge */}
              {hasDiscount && (
                <div className="absolute top-4 right-14 z-20">
                  <div className="bg-rose-100/95 backdrop-blur-sm border border-rose-200 px-2.5 py-1 rounded-xl shadow-md">
                    <span className="text-xs font-black text-rose-600">
                      -{pkg.discount_percentage}%
                    </span>
                  </div>
                </div>
              )}

              {/* Bottom Right: Promo Edition Badge */}
              {discountEdition && (
                <div className="absolute bottom-3 right-4 z-20">
                  <div className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-orange-500 via-rose-500 to-rose-600 px-3 py-1.5 text-[10px] font-black tracking-tight text-white uppercase shadow-lg shadow-rose-500/30 border border-white/40 backdrop-blur-sm animate-pulse-subtle">
                    <Tag className="w-3 h-3 text-white fill-white/10" />
                    <span>PROMO {discountEdition}</span>
                  </div>
                </div>
              )}

              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute right-4 top-4 z-30 rounded-full bg-black/20 backdrop-blur-md p-2 text-white hover:bg-black/40 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto bg-white px-6 py-4 pb-28 md:pb-6">
              <div className="mb-6">
                <div className="mb-2 flex items-center gap-2">
                  <span className="rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-black text-amber-600 border border-amber-200 flex items-center gap-1.5">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    {pkg.averageRating ? Number(pkg.averageRating).toFixed(1) : "5.0"}
                  </span>
                  <span className="text-xs font-bold text-slate-400">
                    ({pkg.totalReviews || 0} {isEnglish ? "Reviews" : "Ulasan"})
                  </span>
                </div>
                <h2 className="text-2xl font-black text-slate-900 leading-tight md:text-3xl mb-2">{name}</h2>
                <div className="h-1.5 w-12 bg-teal-500 rounded-full" />
              </div>

              {/* Price Section below Title */}
              <div className="mb-8 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{isEnglish ? "Price starting from" : "Harga mulai dari"}</p>
                {displayPrice > 0 ? (
                  <div className="flex flex-col">
                    {hasDiscount && (
                      <span className="text-sm font-bold text-slate-400 line-through">
                        Rp {pkg.base_price.toLocaleString("id-ID")}
                      </span>
                    )}
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-lg font-bold text-teal-700">Rp</span>
                      <span className="text-4xl font-black text-teal-700 tracking-tight">
                        {displayPrice.toLocaleString("id-ID")}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-lg font-black text-slate-700">
                    {pkg.pricing_note || (isEnglish ? "Contact us for pricing" : "Hubungi kami untuk harga")}
                  </p>
                )}
              </div>

              <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 font-medium text-emerald-700">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>
                    {isEnglish ? "Clean Guarantee" : "Garansi Bersih Tuntas"}
                  </span>
                </div>
                <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 font-medium text-amber-700">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>
                    {isEnglish ? "Hotel-inspired finish" : "Sentuhan ala hotel"}
                  </span>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="mb-1 text-sm font-semibold text-slate-800">
                  {isEnglish ? "About this service" : "Tentang layanan ini"}
                </h3>
                <p className="text-[13px] leading-relaxed text-slate-600">
                  {description}
                </p>
              </div>

              <div className="mb-6">
                <h3 className="mb-2 text-sm font-semibold text-slate-800">
                  {isEnglish ? "What you get" : "Yang Anda Dapatkan"}
                </h3>
                <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
                  {features.map((feature, idx) => {
                    const bgColor = feature.bgColor || `bg-${feature.color.split("-")[1]}-50`;

                    return (
                      <div
                        key={idx}
                        className={`flex h-full items-center gap-2 rounded-xl border ${bgColor} p-3 sm:p-3.5`}
                      >
                        <feature.icon
                          className={`h-4 w-4 flex-shrink-0 sm:h-5 sm:w-5 ${feature.color}`}
                        />
                        <span
                          className={`text-xs font-semibold leading-relaxed sm:text-sm ${feature.color}`}
                        >
                          {feature.text}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="absolute bottom-0 left-0 right-0 border-t border-slate-100 bg-white px-6 py-3.5 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] md:relative md:shadow-none md:border-t-0">
              <p className="mb-2 text-center text-[11px] text-slate-500">
                {isEnglish
                  ? "Secure your preferred time slot – weekend slots fill up fast."
                  : "Amankan jadwal favorit Anda – slot akhir pekan cepat penuh."}
              </p>
              <button
                onClick={() => {
                  if (onBook) {
                    onBook();
                  } else {
                    navigate(`/orders/new?paket_id=${pkg.id}`);
                  }
                }}
                className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-tropical-500 to-ocean-500 py-3.5 text-sm font-semibold text-white shadow-xl shadow-tropical-500/30 transition-all hover:scale-[1.02] hover:shadow-tropical-500/50 active:scale-[0.98]"
              >
                <span>{isEnglish ? "Book Now" : "Pesan Sekarang"}</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
