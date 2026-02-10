/**
 * USER package browsing page - Premium Mobile App Design
 * Redesigned for LokaClean - Modern, Expensive, Luxury, Cultural
 */

import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useScroll, useTransform, useSpring } from "framer-motion";
import { 
  Package, ArrowRight, CheckCircle2, Plus, Star, Sparkles, Clock, Shield, 
  Zap, Eye, X, Info, Square, Droplets, Bed, Box, Home, Wand2, ChevronLeft, 
  ChevronRight, Banknote, Flame, Crown, Gem, Tag, Trophy, UserCheck, 
  CalendarCheck, Truck, Quote, ShoppingCart, ShieldCheck, Check, MapPin, 
  Handshake, BadgeCheck
} from "lucide-react";

import { api } from "../../lib/api";
import { getApiErrorMessage } from "../../lib/apiError";
import { getPackageImage } from "../../utils/packageImage";
import { t, getLanguage } from "../../lib/i18n";
import { CircularLoader } from "../../components/ui/CircularLoader";
import { OptimizedImage } from "../../components/ui/OptimizedImage";
import type { PaketCleaning } from "../../types/api";

export function UserHomePage() {
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
  
  // Desktop Carousel State
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoScrolling, setIsAutoScrolling] = useState(true);

  const steps = [
    {
      title: t("home.steps.step1.title"),
      desc: t("home.steps.step1.desc"),
      icon: Package
    },
    {
      title: t("home.steps.step2.title"),
      desc: t("home.steps.step2.desc"),
      icon: CalendarCheck
    },
    {
      title: t("home.steps.step3.title"),
      desc: t("home.steps.step3.desc"),
      icon: Banknote
    },
    {
      title: t("home.steps.step4.title"),
      desc: t("home.steps.step4.desc"),
      icon: Sparkles
    }
  ];

  // Fetch Data
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const resp = await api.get("/packages");
        const next = resp.data.data.items as PaketCleaning[];
        if (alive) {
          setItems(next);
          // Auto-focus on "3 Kamar" or "Premium" package for better initial impression on desktop
          const premiumIndex = next.findIndex(item => 
            item.name.toLowerCase().includes("3 kamar") || 
            item.name.toLowerCase().includes("premium")
          );
          if (premiumIndex !== -1) {
            setCurrentIndex(premiumIndex);
          }
        }
      } catch (err) {
        if (alive) setError(getApiErrorMessage(err));
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // Mobile Auto-Scroll Logic
  const mobileScrollRef = useRef<HTMLDivElement>(null);
  const [isMobilePaused, setIsMobilePaused] = useState(false);

  useEffect(() => {
    if (isMobilePaused || loading || error || items.length === 0) return;

    const scrollContainer = mobileScrollRef.current;
    if (!scrollContainer) return;

    const interval = setInterval(() => {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainer;
      // Calculate card width (85vw or max 340px) + gap (16px)
      // We can measure first child
      const firstChild = scrollContainer.firstElementChild as HTMLElement;
      if (!firstChild) return;

      const itemWidth = firstChild.offsetWidth;
      const gap = 16; // gap-4 is 1rem = 16px
      const scrollAmount = itemWidth + gap;

      // Check if we are near the end
      // We use a small buffer (10px) to handle fractional pixel issues
      if (scrollLeft + clientWidth >= scrollWidth - 10) {
        // Loop back to start
        scrollContainer.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        // Scroll to next
        scrollContainer.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      }
    }, 3000); // 3 seconds interval

    return () => clearInterval(interval);
  }, [isMobilePaused, loading, error, items.length]);

  const handleMobileTouchStart = () => setIsMobilePaused(true);
  const handleMobileTouchEnd = () => {
    // Resume after 5 seconds of inactivity
    setTimeout(() => setIsMobilePaused(false), 5000);
  };

  // Desktop Carousel Logic
  const filteredItems = items;
  let carouselItems = [...filteredItems];
  if (carouselItems.length > 0 && carouselItems.length < 9) {
    while (carouselItems.length < 9) {
      carouselItems = [...carouselItems, ...filteredItems];
    }
  }
  const itemCount = carouselItems.length;

  useEffect(() => {
    if (!isAutoScrolling || itemCount <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => prev + 1);
    }, 4000);
    return () => clearInterval(interval);
  }, [isAutoScrolling, itemCount]);

  const goToNext = () => {
    setIsAutoScrolling(false);
    setCurrentIndex((prev) => prev + 1);
  };

  const goToPrev = () => {
    setIsAutoScrolling(false);
    setCurrentIndex((prev) => prev - 1);
  };

  const goToIndex = (index: number) => {
    setIsAutoScrolling(false);
    setCurrentIndex(index);
  };

  // Extract features helper (kept from original)
  const extractFeatures = (description: string) => {
    const features: Array<{ text: string; icon: typeof Square; color: string; bgColor: string }> = [];
    const desc = description.toLowerCase();
    
    const featureMap = [
      { keywords: ["kamar mandi", "bathroom", "wc", "toilet"], text: t("packages.feature.bathroom"), icon: Droplets, color: "text-cyan-700", bgColor: "bg-cyan-50" },
      { keywords: ["area tidur", "kamar tidur"], text: t("packages.feature.bedroom"), icon: Bed, color: "text-purple-700", bgColor: "bg-purple-50" },
      { keywords: ["lantai", "floor"], text: t("packages.feature.floor"), icon: Square, color: "text-blue-700", bgColor: "bg-blue-50" },
      { keywords: ["penataan", "organizing", "rapikan", "tata"], text: t("packages.feature.organizing"), icon: Box, color: "text-emerald-700", bgColor: "bg-emerald-50" },
      { keywords: ["dapur", "kitchen"], text: t("packages.feature.kitchen"), icon: Sparkles, color: "text-amber-700", bgColor: "bg-amber-50" },
      { keywords: ["menyeluruh", "seluruh", "komprehensif"], text: t("packages.feature.deepClean"), icon: Home, color: "text-indigo-700", bgColor: "bg-indigo-50" },
      { keywords: ["detail", "mendalam", "deep"], text: t("packages.feature.detailClean"), icon: Wand2, color: "text-pink-700", bgColor: "bg-pink-50" }
    ];

    for (const feature of featureMap) {
      const sortedKeywords = [...feature.keywords].sort((a, b) => b.length - a.length);
      for (const keyword of sortedKeywords) {
        if (desc.includes(keyword)) {
          if (!features.find(f => f.text === feature.text)) {
            features.push({ text: feature.text, icon: feature.icon, color: feature.color, bgColor: feature.bgColor });
            break;
          }
        }
      }
    }
    if (features.length === 0) {
      features.push(
        { text: t("packages.professional"), icon: CheckCircle2, color: "text-blue-700", bgColor: "bg-blue-50" },
        { text: t("packages.fast"), icon: Zap, color: "text-indigo-700", bgColor: "bg-indigo-50" }
      );
    }
    return features.slice(0, 4);
  };

  // Helper for Badges
  const getBadgeConfig = (pkg: PaketCleaning) => {
    if ((pkg.totalReviews || 0) > 20 && (pkg.averageRating || 0) >= 4.5) return { label: t("packages.badges.bestSeller"), icon: <Flame className="w-3 h-3 fill-current" />, className: "bg-gradient-to-r from-orange-500 to-red-600", textColor: "text-white" };
    const lowerName = pkg.name.toLowerCase();
    if (lowerName.includes("deep") || lowerName.includes("total") || lowerName.includes("komplit")) return { label: t("packages.badges.deepClean"), icon: <Sparkles className="w-3 h-3 fill-current" />, className: "bg-gradient-to-r from-violet-600 to-indigo-600", textColor: "text-white" };
    if (pkg.price < 150000) return { label: t("packages.badges.save"), icon: <Tag className="w-3 h-3 fill-current" />, className: "bg-gradient-to-r from-emerald-500 to-teal-600", textColor: "text-white" };
    if (pkg.price > 400000) return { label: t("packages.badges.premium"), icon: <Crown className="w-3 h-3 fill-current" />, className: "bg-gradient-to-r from-slate-900 to-black", textColor: "text-white" };
    if ((pkg.averageRating || 0) >= 4.7) return { label: t("packages.badges.recommended"), icon: <Trophy className="w-3 h-3 fill-current" />, className: "bg-gradient-to-r from-blue-500 to-cyan-600", textColor: "text-white" };
    return { label: t("packages.badges.new"), icon: <Sparkles className="w-3 h-3 fill-current" />, className: "bg-gradient-to-r from-pink-500 to-rose-600", textColor: "text-white" };
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-slate-900 font-sans pb-24 sm:pb-32 overflow-x-hidden selection:bg-teal-100 selection:text-teal-900">
      
      {/* 1. Header & Hero Section - Clean & Modern */}
      <div className="relative bg-white pb-8 sm:pb-12 rounded-b-[40px] sm:rounded-b-[60px] shadow-[0_20px_40px_-10px_rgba(0,0,0,0.05)] ring-1 ring-slate-900/10 z-10 overflow-hidden">
        {/* Abstract Background Shapes - Optimized for Android */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none transform-gpu">
           <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-teal-50/50 blur-3xl translate-z-0 will-change-transform" />
           <div className="absolute top-[20%] left-[-10%] w-[400px] h-[400px] rounded-full bg-blue-50/50 blur-3xl translate-z-0 will-change-transform" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-8 relative z-10">
          {/* Header Row */}
          <div className="flex items-center justify-between mb-8 sm:mb-12">
              <div className="flex items-center gap-3">
              <motion.div 
                initial={{ scale: 0, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                whileHover={{ scale: 1.05 }}
                className="h-28 sm:h-32 w-auto flex items-center justify-center"
              >
                <img 
          src="/img/maskot_fixed.jpg" 
          alt="LokaClean Mascot" 
          loading="eager"
          className="h-full w-auto object-contain mix-blend-multiply transition-all duration-500 ease-out hover:-translate-y-1"
        />
              </motion.div>
              <div>
                <h1 className="text-lg sm:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700">LokaClean</h1>
                <p className="text-[10px] sm:text-sm font-medium text-slate-500 tracking-wider uppercase">{t("home.header.subtitle")}</p>
              </div>
            </div>
            
            <motion.button 
              onClick={() => navigate("/orders/new")}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="group relative flex items-center gap-2 bg-gradient-to-r from-teal-600 to-emerald-600 text-white px-3 py-2 sm:px-5 sm:py-3 rounded-full text-[10px] sm:text-sm font-bold shadow-[0_10px_20px_-5px_rgba(13,148,136,0.4)] hover:shadow-[0_15px_30px_-5px_rgba(13,148,136,0.5)] transition-all duration-300 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
              <div className="bg-white/20 rounded-full p-1 group-hover:rotate-180 transition-transform duration-500 backdrop-blur-sm">
                <Plus className="w-4 h-4 text-white" />
              </div>
              <span className="tracking-wide relative z-10">{t("packages.newOrder")}</span>
            </motion.button>
          </div>

          {/* Hero Content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="space-y-6 sm:space-y-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 leading-[1.1] tracking-tight mb-4">
                  {t("home.userHero.titlePart1")} <br/>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-blue-600">{t("home.userHero.titleHighlight")}</span> <br/>
                  {t("home.userHero.titlePart2")}
                </h2>
                <p className="text-slate-500 text-sm sm:text-lg max-w-md leading-relaxed">
                  {t("home.userHero.description")}
                </p>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="flex flex-wrap gap-3 sm:gap-4"
              >
                {[
                  { icon: MapPin, text: t("home.userHero.feature1") },
                  { icon: ShieldCheck, text: t("home.userHero.feature2") },
                  { icon: Handshake, text: t("home.userHero.feature3") }
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-1.5 sm:gap-2 bg-white border border-slate-100 px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg shadow-sm">
                    <item.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-teal-600" />
                    <span className="text-xs sm:text-sm font-semibold text-slate-700">{item.text}</span>
                  </div>
                ))}
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              className="hidden lg:block relative"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-teal-200/20 to-blue-200/20 rounded-[40px] transform rotate-3 scale-105 blur-2xl" />
              <img 
                src="/img/hero.png" 
                alt="LokaClean Hero" 
                className="relative w-full h-auto max-h-[500px] object-contain drop-shadow-2xl z-10"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            </motion.div>
          </div>
        </div>
      </div>

      {/* 2. Package Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 sm:mt-20">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-6 h-[2px] bg-teal-500 rounded-full"></span>
              <span className="text-[10px] sm:text-xs font-bold tracking-[0.2em] text-teal-600 uppercase">{t("home.userPackages.eyebrow")}</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {t("home.userPackages.title")}
            </h3>
          </div>
          <button 
            onClick={() => navigate('/packages/all')}
            className="group flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-teal-50 text-xs sm:text-sm font-bold text-teal-600 hover:bg-teal-100 transition-all active:scale-95"
          >
            <span>{t("home.userPackages.viewAll")}</span>
            <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center py-20">
            <CircularLoader size="lg" />
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="p-6 bg-red-50 text-red-600 rounded-2xl border border-red-100 text-center">
            {error}
          </div>
        )}

        {/* MOBILE: Native Horizontal Scroll (Zero Lag + Auto Scroll) */}
        {!loading && !error && (
          <div className="block lg:hidden">
            <div 
              ref={mobileScrollRef}
              className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-8 -mx-4 px-4 scrollbar-hide touch-pan-x"
              style={{ WebkitOverflowScrolling: "touch", scrollBehavior: "smooth" }}
              onTouchStart={handleMobileTouchStart}
              onTouchEnd={handleMobileTouchEnd}
            >
              {items.map((pkg, i) => {
                const displayName = isEnglish && pkg.name_en ? pkg.name_en : pkg.name;
                const badge = getBadgeConfig(pkg);
                
                return (
                  <div 
                    key={pkg.id} 
                    className="snap-center shrink-0 w-[85vw] max-w-[340px]"
                    onClick={() => navigate(`/orders/new?paket_id=${pkg.id}`)}
                  >
                    <div className="bg-white rounded-[32px] overflow-hidden shadow-[0_20px_40px_-10px_rgba(0,0,0,0.15)] border border-slate-100 ring-1 ring-slate-900/5 h-full flex flex-col relative group transition-all duration-300 hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.2)]">
                      <div className="relative h-56 w-full bg-slate-100 transform-gpu">
                        <OptimizedImage 
                          src={getPackageImage(pkg.name, pkg.image)} 
                          alt={displayName}
                          className="w-full h-full object-cover will-change-transform transition-transform duration-700 group-hover:scale-110"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />
                        
                        <div className="absolute top-4 left-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase ${badge.className} ${badge.textColor} shadow-lg`}>
                            {badge.label}
                          </span>
                        </div>
                        
                        <div className="absolute bottom-4 left-4 right-4">
                           <h4 className="text-xl font-bold text-white leading-tight mb-1">{displayName}</h4>
                           <div className="flex items-center gap-1 text-white/90 text-xs">
                             <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                             <span className="font-bold">{pkg.averageRating ? Number(pkg.averageRating).toFixed(1) : "5.0"}</span>
                             <span className="opacity-70">({pkg.totalReviews || 0} reviews)</span>
                           </div>
                        </div>
                      </div>
                      
                      {/* Content Area */}
                      <div className="p-5 flex flex-col flex-1">
                        <div className="flex flex-wrap gap-2 mb-4">
                           {extractFeatures(pkg.description).slice(0, 3).map((feat, idx) => (
                             <span key={idx} className={`text-xs px-2 py-1 rounded-md font-medium bg-slate-50 text-slate-600 border border-slate-100`}>
                               {feat.text}
                             </span>
                           ))}
                        </div>
                        
                        <div className="mt-auto flex items-end justify-between">
                          <div>
                            <p className="text-sm text-slate-400 font-medium">{t("packages.startingFrom")}</p>
                            <p className="text-2xl font-black text-slate-900">
                              <span className="text-sm font-bold align-top mr-0.5">Rp</span>
                              {pkg.price.toLocaleString("id-ID")}
                            </p>
                          </div>
                          <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-lg group-active:scale-95 transition-transform">
                            <Plus className="w-5 h-5" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* DESKTOP: 3D Carousel (Preserved logic but cleaned visuals) */}
        {!loading && !error && (
          <div className="hidden lg:block relative h-[600px] perspective-[1200px] -mt-10">
            {/* Nav Buttons */}
            <div className="absolute top-1/2 -translate-y-1/2 left-0 z-50">
               <button onClick={goToPrev} className="w-12 h-12 rounded-full bg-white shadow-xl border border-slate-100 flex items-center justify-center hover:scale-110 transition-transform text-slate-700">
                 <ChevronLeft className="w-6 h-6" />
               </button>
            </div>
            <div className="absolute top-1/2 -translate-y-1/2 right-0 z-50">
               <button onClick={goToNext} className="w-12 h-12 rounded-full bg-white shadow-xl border border-slate-100 flex items-center justify-center hover:scale-110 transition-transform text-slate-700">
                 <ChevronRight className="w-6 h-6" />
               </button>
            </div>

            <div className="absolute inset-0 flex items-center justify-center">
              <AnimatePresence initial={false} mode="popLayout">
                {carouselItems.map((pkg, index) => {
                  const normalizedCurrent = ((currentIndex % itemCount) + itemCount) % itemCount;
                  let dist = (index - normalizedCurrent);
                  if (dist > itemCount / 2) dist -= itemCount;
                  if (dist < -itemCount / 2) dist += itemCount;

                  if (Math.abs(dist) > 2) return null;

                  const isCenter = dist === 0;
                  const absDist = Math.abs(dist);
                  const displayName = isEnglish && pkg.name_en ? pkg.name_en : pkg.name;
                  const badge = getBadgeConfig(pkg);
                  
                  return (
                    <motion.div
                      key={`${pkg.id}-${index}`}
                      layout
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ 
                        scale: isCenter ? 1.1 : 0.9,
                        opacity: isCenter ? 1 : 0.5,
                        zIndex: isCenter ? 50 : 30 - absDist,
                        x: dist * 320,
                        rotateY: dist * -15,
                        filter: isCenter ? "blur(0px)" : "blur(2px)",
                      }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.6, ease: "circOut" }}
                      className="absolute w-[340px] cursor-pointer"
                      onClick={() => {
                        if(isCenter) navigate(`/orders/new?paket_id=${pkg.id}`);
                        else goToIndex(index);
                      }}
                    >
                      <div className="bg-white rounded-[40px] overflow-hidden shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] border border-white/50 h-[500px] flex flex-col transform transition-transform hover:-translate-y-2 duration-300">
                        <div className="relative h-64 bg-slate-100 overflow-hidden">
                           <OptimizedImage src={getPackageImage(pkg.name, pkg.image)} alt={displayName} className="w-full h-full object-cover" />
                           <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-transparent to-transparent" />
                           <div className="absolute top-6 left-6">
                             <span className={`px-3 py-1.5 rounded-full text-xs font-bold tracking-wide uppercase ${badge.className} ${badge.textColor} shadow-lg`}>
                               {badge.label}
                             </span>
                           </div>
                           <div className="absolute bottom-6 left-6 right-6">
                             <h3 className="text-2xl font-black text-white leading-none mb-2">{displayName}</h3>
                             <div className="flex items-center gap-2">
                               <div className="flex bg-white/20 backdrop-blur-md rounded-full px-2 py-0.5">
                                 <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                                 <span className="text-white text-xs font-bold ml-1">{pkg.averageRating ? Number(pkg.averageRating).toFixed(1) : "5.0"}</span>
                               </div>
                             </div>
                           </div>
                        </div>
                        <div className="p-6 flex flex-col flex-1 bg-white">
                           <div className="space-y-3 mb-6">
                             {extractFeatures(pkg.description).slice(0, 3).map((feat, i) => (
                               <div key={i} className="flex items-center gap-3 text-slate-600">
                                 <div className={`w-8 h-8 rounded-full ${feat.bgColor} flex items-center justify-center shrink-0`}>
                                   <feat.icon className={`w-4 h-4 ${feat.color}`} />
                                 </div>
                                 <span className="text-sm font-medium">{feat.text}</span>
                               </div>
                             ))}
                           </div>
                           <div className="mt-auto flex items-end justify-between border-t border-slate-100 pt-4">
                             <div>
                               <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Harga Mulai</p>
                               <p className="text-3xl font-black text-slate-900 tracking-tight">
                                Rp {pkg.price.toLocaleString("id-ID")}
                              </p>
                             </div>
                             <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-lg hover:bg-slate-800 transition-colors">
                               <ArrowRight className="w-6 h-6" />
                             </div>
                           </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>

      {/* 3. Trust Section (Premium Grid) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 sm:mt-24">
        <div className="text-center mb-6 sm:mb-16">
          <span className="text-teal-600 font-bold tracking-wider uppercase text-xs sm:text-sm">{t("home.userFeatures.eyebrow")}</span>
          <h3 className="text-xl sm:text-3xl font-black text-slate-900 mt-2">{t("home.userFeatures.titleLine1")}<br/>{t("home.userFeatures.titleLine2")}</h3>
        </div>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
           {[
             { title: t("home.userFeatures.guarantee.title"), desc: t("home.userFeatures.guarantee.desc"), icon: BadgeCheck, color: "text-blue-600", bg: "bg-blue-50" },
             { title: t("home.userFeatures.trusted.title"), desc: t("home.userFeatures.trusted.desc"), icon: UserCheck, color: "text-purple-600", bg: "bg-purple-50" },
             { title: t("home.userFeatures.equipment.title"), desc: t("home.userFeatures.equipment.desc"), icon: Sparkles, color: "text-amber-600", bg: "bg-amber-50" },
             { title: t("home.userFeatures.location.title"), desc: t("home.userFeatures.location.desc"), icon: MapPin, color: "text-teal-600", bg: "bg-teal-50" }
           ].map((item, i) => (
             <div key={i} className="bg-white p-4 rounded-2xl border border-slate-100 ring-1 ring-slate-900/5 shadow-[0_10px_20px_-5px_rgba(0,0,0,0.05)] hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.1)] transition-all duration-300 hover:-translate-y-2">
               <div className={`w-10 h-10 rounded-xl ${item.bg} flex items-center justify-center mb-3`}>
                 <item.icon className={`w-5 h-5 ${item.color}`} />
               </div>
               <h4 className="font-bold text-sm sm:text-base text-slate-900 mb-1">{item.title}</h4>
               <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
             </div>
           ))}
        </div>
      </div>

      {/* 4. How it Works (Dark Premium Card) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 sm:mt-24">
        <div className="bg-slate-900 rounded-[32px] sm:rounded-[40px] p-6 sm:p-12 relative overflow-hidden border border-slate-800 ring-1 ring-white/10 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] transition-all duration-500 hover:shadow-[0_30px_70px_-12px_rgba(20,184,166,0.2)] hover:border-teal-500/30 hover:ring-teal-500/30 group">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-teal-900/20 rounded-full blur-3xl -mr-20 -mt-20" />
          <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-blue-900/20 rounded-full blur-3xl -ml-10 -mb-10" />
          
          <div className="relative z-10 text-center sm:text-left mb-6 sm:mb-10">
            <h3 className="text-xl sm:text-3xl font-bold text-white mb-2">{t("home.howItWorks.title")}</h3>
            <p className="text-slate-400 text-sm sm:text-base">{t("home.howItWorks.subtitle")}</p>
          </div>

          <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-6 sm:gap-8">
            {steps.map((step, i) => (
              <div key={i} className="flex flex-col items-center sm:items-start text-center sm:text-left relative">
                 {i < 3 && <div className="hidden sm:block absolute top-6 left-12 right-0 h-[2px] bg-slate-800" />}
                 
                 <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center mb-3 sm:mb-4 relative z-10 text-teal-400 font-bold text-sm sm:text-lg shadow-lg">
                   {i + 1}
                 </div>
                 <h4 className="text-white text-sm sm:text-base font-bold mb-1">{step.title}</h4>
                 <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 5. Testimonials (Clean Grid) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 sm:mt-24 mb-6 relative z-10">
          <div className="text-center mb-10 sm:mb-16">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-10%" }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="inline-block mb-3 will-change-transform"
            >
              <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-600 text-xs font-bold uppercase tracking-wider">
                Testimonials
              </span>
            </motion.div>
            
            <motion.h2 
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-10%" }}
              transition={{ delay: 0.1, duration: 0.5, ease: "easeOut" }}
              className="text-3xl sm:text-4xl font-black text-slate-900 mb-4 tracking-tight will-change-transform"
            >
              {t("home.testimonials.title")}
            </motion.h2>
            <motion.div 
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.5, ease: "easeOut" }}
              className="w-24 h-1.5 bg-gradient-to-r from-purple-500 to-pink-500 mx-auto rounded-full mb-6 origin-center will-change-transform" 
            />
            <motion.p 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="text-slate-600 max-w-2xl mx-auto text-sm sm:text-base will-change-opacity"
            >
              {t("home.testimonials.subtitle")}
            </motion.p>
          </div>
             
          <div className="block sm:hidden px-2">
            <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth -mx-2 px-2 pb-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
              {[
                { name: t("home.testimonials.item1.name"), role: t("home.testimonials.item1.role"), text: t("home.testimonials.item1.text"), rating: 5, initial: "J" },
                { name: t("home.testimonials.item2.name"), role: t("home.testimonials.item2.role"), text: t("home.testimonials.item2.text"), rating: 5, initial: "S" },
                { name: t("home.testimonials.item3.name"), role: t("home.testimonials.item3.role"), text: t("home.testimonials.item3.text"), rating: 5, initial: "E" },
                { name: t("home.testimonials.item4.name"), role: t("home.testimonials.item4.role"), text: t("home.testimonials.item4.text"), rating: 5, initial: "B" }
              ].map((testi, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true, margin: "-5%" }}
                  transition={{ duration: 0.4, delay: i * 0.1, ease: "easeOut" }}
                  className="snap-center min-w-[85%] relative p-6 rounded-[2rem] bg-white border border-slate-100 ring-1 ring-slate-900/5 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.1)] flex flex-col will-change-transform"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 rounded-xl bg-white border border-slate-100 shadow-sm flex items-center justify-center relative">
                      <div className={`absolute inset-0 rounded-xl bg-gradient-to-br ${
                        i === 0 ? "from-blue-500/20 to-cyan-500/20" :
                        i === 1 ? "from-purple-500/20 to-pink-500/20" :
                        i === 2 ? "from-orange-500/20 to-yellow-500/20" :
                                  "from-green-500/20 to-emerald-500/20"
                      } opacity-100`} />
                      <span className={`text-base font-bold bg-clip-text text-transparent bg-gradient-to-br ${
                        i === 0 ? "from-blue-600 to-cyan-600" :
                        i === 1 ? "from-purple-600 to-pink-600" :
                        i === 2 ? "from-orange-600 to-yellow-600" :
                                  "from-green-600 to-emerald-600"
                      } relative z-10`}>
                        {testi.initial}
                      </span>
                      <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-bold border-2 border-white shadow-sm z-20">
                        <Quote className="h-2.5 w-2.5 fill-white" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-bold text-slate-900 leading-tight">{testi.name}</h3>
                      <p className="text-xs font-bold text-purple-600 mb-1 uppercase tracking-wide">{testi.role}</p>
                      <div className="flex gap-0.5">
                        {[...Array(testi.rating)].map((_, j) => (
                          <Star key={j} className="w-3 h-3 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-slate-500 leading-snug italic">
                    "{testi.text}"
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
          <div className="hidden sm:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 px-4 sm:px-0">
            {[
              { 
                name: t("home.testimonials.item1.name"), 
                role: t("home.testimonials.item1.role"), 
                text: t("home.testimonials.item1.text"), 
                rating: 5, 
                initial: "J" 
              },
              { 
                name: t("home.testimonials.item2.name"), 
                role: t("home.testimonials.item2.role"), 
                text: t("home.testimonials.item2.text"), 
                rating: 5, 
                initial: "S" 
              },
              { 
                name: t("home.testimonials.item3.name"), 
                role: t("home.testimonials.item3.role"), 
                text: t("home.testimonials.item3.text"), 
                rating: 5, 
                initial: "E" 
              },
              { 
                name: t("home.testimonials.item4.name"), 
                role: t("home.testimonials.item4.role"), 
                text: t("home.testimonials.item4.text"), 
                rating: 5, 
                initial: "B" 
              }
            ].map((testi, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.6, ease: "easeOut" }}
                className="relative flex flex-col items-center text-center group h-full"
              >
                <div className="relative p-8 rounded-[2.5rem] bg-white border border-slate-100 ring-1 ring-slate-900/5 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.1)] hover:shadow-[0_30px_60px_-12px_rgba(0,0,0,0.15)] hover:-translate-y-2 transition-all duration-300 w-full h-full flex flex-col items-center">
                  <div className="w-20 h-20 mx-auto rounded-2xl bg-white border border-slate-100 shadow-md flex items-center justify-center mb-4 relative z-10 group-hover:scale-110 transition-transform duration-300">
                    <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${
                      i === 0 ? "from-blue-500/20 to-cyan-500/20" :
                      i === 1 ? "from-purple-500/20 to-pink-500/20" :
                      i === 2 ? "from-orange-500/20 to-yellow-500/20" :
                                "from-green-500/20 to-emerald-500/20"
                    } opacity-100`} />
                    <span className={`text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-br ${
                      i === 0 ? "from-blue-600 to-cyan-600" :
                      i === 1 ? "from-purple-600 to-pink-600" :
                      i === 2 ? "from-orange-600 to-yellow-600" :
                                "from-green-600 to-emerald-600"
                    }`}>
                      {testi.initial}
                    </span>
                    <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center border-2 border-white shadow-sm">
                      <Quote className="h-3 w-3 fill-white" />
                    </div>
                  </div>
                  <div className="flex gap-0.5 mb-3">
                    {[...Array(testi.rating)].map((_, j) => (
                      <Star key={j} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-1">{testi.name}</h3>
                  <p className="text-xs font-bold text-purple-600 mb-3 uppercase tracking-wide">{testi.role}</p>
                  <p className="text-sm text-slate-500 leading-relaxed italic">
                    "{testi.text}"
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
      </section>

    </div>
  );
}
