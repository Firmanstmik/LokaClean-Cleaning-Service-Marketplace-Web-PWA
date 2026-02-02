/**
 * USER order history page with Gojek-style design.
 */

import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Package, Clock, MapPin, CreditCard, CheckCircle2, AlertCircle, ArrowRight, Calendar, ChevronRight, ChevronLeft, Filter, List, Sparkles, Eye } from "lucide-react";

import { CircularLoader } from "../../components/ui/CircularLoader";
import { api } from "../../lib/api";
import { getApiErrorMessage } from "../../lib/apiError";
import { AnimatedCard } from "../../components/AnimatedCard";
import { PageHeaderCard } from "../../components/PageHeaderCard";
import { formatDateOnlyWITA, formatTimeOnlyWITA } from "../../utils/date";
import { getPackageGradient } from "../../utils/packageIcon";
import { getPackageImage, getPackageImageAlt } from "../../utils/packageImage";
import { t, getLanguage } from "../../lib/i18n";
import type { Pesanan } from "../../types/api";

function formatOrderNumber(orderNumber: number | null | undefined): string {
  if (!orderNumber) return "-";
  return `LC-${orderNumber.toString().padStart(4, "0")}`;
}

type FilterStatus = 'all' | 'pending' | 'in_progress' | 'completed';

export function OrdersPage() {
  const [language, setLanguage] = useState(getLanguage());
  useEffect(() => {
    const handleLanguageChange = () => setLanguage(getLanguage());
    window.addEventListener("languagechange", handleLanguageChange);
    return () => window.removeEventListener("languagechange", handleLanguageChange);
  }, []);
  const isEnglish = language === "en";

  const [items, setItems] = useState<Pesanan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [pageInput, setPageInput] = useState("1");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [totalPages, setTotalPages] = useState(1);
  const [now, setNow] = useState(() => Date.now());
  const location = useLocation();

  useEffect(() => {
    let alive = true;
    setLoading(true);
    (async () => {
      try {
        const params = new URLSearchParams();
        params.append('page', String(currentPage));
        params.append('limit', '5');
        if (filterStatus !== 'all') {
          params.append('status', filterStatus);
        }
        
        const resp = await api.get(`/orders?${params.toString()}`);
        const data = resp.data.data;
        if (alive) {
          setItems(data.items as Pesanan[]);
          setHasNext(data.pagination?.hasNext || false);
          setTotalPages(data.pagination?.totalPages || 1);
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
  }, [currentPage, filterStatus]);

  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus]);

  useEffect(() => {
    setPageInput(String(currentPage));
  }, [currentPage, totalPages]);

  useEffect(() => {
    const id = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "PROCESSING":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "IN_PROGRESS":
        return "bg-lombok-ocean-100 text-lombok-ocean-700 border-lombok-ocean-200";
      case "COMPLETED":
        return "bg-lombok-tropical-100 text-lombok-tropical-700 border-lombok-tropical-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const getPaymentStatusColor = (status: string) => {
    return status === "PAID"
      ? "bg-lombok-tropical-100 text-lombok-tropical-700"
      : "bg-rose-100 text-rose-700";
  };

  return (
    <div className="w-full bg-gradient-to-br from-tropical-50 via-ocean-50/50 to-sand-50/70">
      {/* Professional Card Header */}
      <PageHeaderCard
        icon={List}
        title={t("orders.title")}
        subtitle={t("orders.subtitle")}
        gradientFrom="#3498db"
        gradientVia="#1abc9c"
        gradientTo="#3498db"
        iconGradientFrom="#1abc9c"
        iconGradientVia="#3498db"
        iconGradientTo="#1abc9c"
        glowColor="rgba(52,152,219"
      />

      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 pt-1 pb-4 sm:py-6 lg:py-7 space-y-4 sm:space-y-6 lg:pb-12">
      {/* Premium Filter Pills - Professional Mobile Design */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="relative"
      >
        {/* Container with subtle background for premium feel */}
        <div className="rounded-2xl border border-slate-200/50 bg-gradient-to-br from-white/90 to-slate-50/50 backdrop-blur-sm p-3 sm:p-4 shadow-sm">
          {/* Horizontal scroll container for mobile - Smooth & Professional */}
          <div 
            className="flex gap-2.5 sm:gap-3 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide sm:overflow-x-visible sm:flex-wrap sm:justify-center" 
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            {/* All Filter */}
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => setFilterStatus('all')}
              className={`relative flex-shrink-0 px-4 sm:px-5 py-2.5 sm:py-3 rounded-full text-xs sm:text-sm font-bold transition-all duration-300 ${
                filterStatus === 'all'
                  ? 'bg-gradient-to-r from-lombok-tropical-500 to-lombok-ocean-500 text-white shadow-lg shadow-lombok-tropical-500/40 scale-105'
                  : 'bg-white/90 backdrop-blur-sm text-slate-600 border-2 border-slate-200/60 hover:border-lombok-tropical-300 hover:bg-lombok-tropical-50/80 hover:shadow-md'
              }`}
            >
              {filterStatus === 'all' && (
                <motion.div
                  layoutId="activeFilter"
                  className="absolute inset-0 rounded-full bg-gradient-to-r from-lombok-tropical-500 to-lombok-ocean-500"
                  initial={false}
                  transition={{ type: "spring", bounce: 0.25, duration: 0.5 }}
                />
              )}
              <span className="relative z-10 whitespace-nowrap">Semua</span>
            </motion.button>

            {/* Pending Filter */}
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => setFilterStatus('pending')}
              className={`relative flex-shrink-0 px-4 sm:px-5 py-2.5 sm:py-3 rounded-full text-xs sm:text-sm font-bold transition-all duration-300 ${
                filterStatus === 'pending'
                  ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-white shadow-lg shadow-amber-400/40 scale-105'
                  : 'bg-white/90 backdrop-blur-sm text-slate-600 border-2 border-slate-200/60 hover:border-amber-300 hover:bg-amber-50/80 hover:shadow-md'
              }`}
            >
              {filterStatus === 'pending' && (
                <motion.div
                  layoutId="activeFilter"
                  className="absolute inset-0 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500"
                  initial={false}
                  transition={{ type: "spring", bounce: 0.25, duration: 0.5 }}
                />
              )}
              <span className="relative z-10 whitespace-nowrap">Belum Dikonfirmasi</span>
            </motion.button>

            {/* In Progress Filter */}
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => setFilterStatus('in_progress')}
              className={`relative flex-shrink-0 px-4 sm:px-5 py-2.5 sm:py-3 rounded-full text-xs sm:text-sm font-bold transition-all duration-300 ${
                filterStatus === 'in_progress'
                  ? 'bg-gradient-to-r from-lombok-ocean-400 to-lombok-ocean-600 text-white shadow-lg shadow-lombok-ocean-500/40 scale-105'
                  : 'bg-white/90 backdrop-blur-sm text-slate-600 border-2 border-slate-200/60 hover:border-lombok-ocean-300 hover:bg-lombok-ocean-50/80 hover:shadow-md'
              }`}
            >
              {filterStatus === 'in_progress' && (
                <motion.div
                  layoutId="activeFilter"
                  className="absolute inset-0 rounded-full bg-gradient-to-r from-lombok-ocean-400 to-lombok-ocean-600"
                  initial={false}
                  transition={{ type: "spring", bounce: 0.25, duration: 0.5 }}
                />
              )}
              <span className="relative z-10 whitespace-nowrap">In Progress</span>
            </motion.button>

            {/* Completed Filter */}
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => setFilterStatus('completed')}
              className={`relative flex-shrink-0 px-4 sm:px-5 py-2.5 sm:py-3 rounded-full text-xs sm:text-sm font-bold transition-all duration-300 ${
                filterStatus === 'completed'
                  ? 'bg-gradient-to-r from-emerald-400 to-emerald-600 text-white shadow-lg shadow-emerald-500/40 scale-105'
                  : 'bg-white/90 backdrop-blur-sm text-slate-600 border-2 border-slate-200/60 hover:border-emerald-300 hover:bg-emerald-50/80 hover:shadow-md'
              }`}
            >
              {filterStatus === 'completed' && (
                <motion.div
                  layoutId="activeFilter"
                  className="absolute inset-0 rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600"
                  initial={false}
                  transition={{ type: "spring", bounce: 0.25, duration: 0.5 }}
                />
              )}
              <span className="relative z-10 whitespace-nowrap">Complete</span>
            </motion.button>
          </div>
        </div>
      </motion.div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <CircularLoader size="lg" />
          <p className="mt-4 text-sm text-slate-600">{t("orders.loading")}</p>
        </div>
      ) : null}

        {error ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-2xl border-2 border-rose-200 bg-gradient-to-br from-rose-50 to-pink-50 p-4 text-sm text-rose-700 shadow-lombok-sm"
        >
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <span className="font-semibold">{error}</span>
          </div>
        </motion.div>
      ) : null}

        <div className="space-y-3 sm:space-y-4">
        {items.map((o, index) => {
          const isActive = location.pathname === `/orders/${o.id}`;
          const displayName = isEnglish && o.paket.name_en ? o.paket.name_en : o.paket.name;
          const isTransferPending =
            o.pembayaran.method === "TRANSFER" &&
            o.pembayaran.status === "PENDING" &&
            o.status !== "CANCELLED";
          const createdAtMs = new Date(o.created_at).getTime();
          const expiryMs = createdAtMs + 60 * 60 * 1000;
          const remainingMs = expiryMs - now;
          const rawRemainingSeconds = Math.floor(remainingMs / 1000);
          const remainingSeconds = Math.max(0, rawRemainingSeconds);
          const minutesLeft = Math.floor(remainingSeconds / 60);
          const secondsLeft = remainingSeconds % 60;
          const isCountdownExpired = rawRemainingSeconds <= 0;
          const hideExpiredTransfer =
            isTransferPending &&
            Number.isFinite(createdAtMs) &&
            rawRemainingSeconds <= -60;
          if (hideExpiredTransfer) {
            return null;
          }
          const showCountdown =
            isTransferPending &&
            Number.isFinite(createdAtMs);
          const baseCardClass =
            "relative block group max-w-full overflow-hidden rounded-2xl sm:rounded-3xl border-2 border-white/60 bg-gradient-to-br from-tropical-50/80 via-ocean-50/60 to-sand-50/70 backdrop-blur-sm shadow-[0_8px_24px_rgba(0,0,0,0.1),0_4px_8px_rgba(0,0,0,0.06),0_2px_4px_rgba(0,0,0,0.04)] transition-transform transition-shadow duration-300 hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(0,0,0,0.16)]";
          const highlightClass = isTransferPending
            ? "border-2 border-rose-300/90 ring-2 ring-rose-300/80 bg-rose-50/80 shadow-[0_18px_45px_rgba(248,113,113,0.45)]"
            : "";
          const activeClass = isActive && !isTransferPending
            ? "ring-2 ring-lombok-tropical-500 border-lombok-tropical-300"
            : "";
          const cardClassName = [baseCardClass, highlightClass, activeClass].filter(Boolean).join(" ");
          return (
            <AnimatedCard key={o.id} delay={index * 0.1} disableHover>
              <Link
                to={`/orders/${o.id}`}
                className={cardClassName}
              >
              <div className="relative z-10 p-4 sm:p-5 lg:p-6">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                  <div className="w-full sm:flex-1 sm:min-w-0 space-y-2">
                    <div className="flex items-center gap-2">
                      <motion.div
                        whileHover={{ 
                          scale: 1.15,
                          rotate: -8
                        }}
                        transition={{ 
                          type: "spring", 
                          stiffness: 400, 
                          damping: 20
                        }}
                        className={`flex h-10 w-10 sm:h-10 sm:w-10 items-center justify-center rounded-lg sm:rounded-xl bg-gradient-to-br ${getPackageGradient(o.paket.name)} shadow-lg shadow-black/10 flex-shrink-0 relative overflow-hidden group/icon`}
                      >
                        {/* Subtle glow effect on hover - no blur */}
                        <motion.div
                          className={`absolute -inset-1 rounded-xl bg-gradient-to-br ${getPackageGradient(o.paket.name)} opacity-0 group-hover:opacity-30 transition-opacity duration-500`}
                          style={{
                            filter: 'blur(8px)',
                          }}
                        />
                        {/* Pulsing glow effect - continuous but subtle */}
                        <motion.div
                          className={`absolute -inset-0.5 rounded-xl bg-gradient-to-br ${getPackageGradient(o.paket.name)} opacity-10`}
                          animate={{
                            opacity: [0.1, 0.2, 0.1],
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                          style={{
                            filter: 'blur(4px)',
                          }}
                        />
                        <motion.img
                          src={getPackageImage(o.paket.name, o.paket.image)}
                          alt={getPackageImageAlt(o.paket.name)}
                          whileHover={{ scale: 1.1 }}
                          transition={{ duration: 0.2 }}
                          className="h-full w-full object-cover relative z-10 drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)] transition-all duration-300 group-hover:drop-shadow-[0_4px_8px_rgba(0,0,0,0.4)]"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </motion.div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between sm:justify-start gap-2">
                          <div className="text-[10px] sm:text-xs font-semibold text-slate-500 group-hover:text-slate-600 transition-colors duration-300">{t("orders.orderNumber")} {formatOrderNumber(o.order_number)}</div>
                          {/* Mobile-only status pill (mini) */}
                          <div className={`sm:hidden h-2 w-2 rounded-full ${o.status === "COMPLETED" ? "bg-lombok-tropical-500" : o.status === "IN_PROGRESS" ? "bg-lombok-ocean-500" : "bg-yellow-500"}`} />
                        </div>
                        <div className="text-base sm:text-lg font-bold text-slate-900 truncate group-hover:text-blue-700 transition-colors duration-300">{displayName}</div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[10px] sm:text-xs text-slate-600 group-hover:text-slate-700 transition-colors duration-300">
                      <div className="flex items-center gap-1 sm:gap-1.5">
                        <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-lombok-ocean-500 group-hover:text-blue-600 flex-shrink-0 transition-colors duration-300" />
                        <span>{formatDateOnlyWITA(o.scheduled_date)}</span>
                        <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-lombok-ocean-500 group-hover:text-blue-600 ml-1 sm:ml-2 flex-shrink-0 transition-colors duration-300" />
                        <span>{formatTimeOnlyWITA(o.scheduled_date)}</span>
                      </div>
                      <div className="flex items-center gap-1 sm:gap-1.5 min-w-0">
                        <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-lombok-tropical-500 group-hover:text-cyan-600 flex-shrink-0 transition-colors duration-300" />
                        <span className="line-clamp-1 truncate">{o.address}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-row items-center justify-between w-full sm:w-auto sm:flex-col sm:items-end gap-1.5 sm:gap-2 sm:flex-shrink-0 mt-3 sm:mt-0 pt-3 sm:pt-0 border-t border-slate-100 sm:border-0">
                    <div className={`inline-flex items-center gap-1 sm:gap-1.5 rounded-full border px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-bold ${getStatusColor(o.status)}`}>
                      <div className={`h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full ${o.status === "COMPLETED" ? "bg-lombok-tropical-500" : o.status === "IN_PROGRESS" ? "bg-lombok-ocean-500" : "bg-yellow-500"} animate-pulse`} />
                      <span className="whitespace-nowrap">{o.status}</span>
                    </div>
                    <div className={`inline-flex items-center gap-1 sm:gap-1.5 rounded-lg px-2 sm:px-2.5 py-0.5 sm:py-1 text-[10px] sm:text-xs font-semibold ${getPaymentStatusColor(o.pembayaran.status)} ${isTransferPending ? "ring-2 ring-rose-300 bg-rose-50/90" : ""}`}>
                      <CreditCard className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />
                      <span className="whitespace-nowrap">{o.pembayaran.status}</span>
                      <span className="text-slate-500 hidden sm:inline">•</span>
                      <span className="text-slate-600 whitespace-nowrap">{o.pembayaran.method}</span>
                    </div>
                  </div>
                </div>

                <motion.div
                  className="mt-3 sm:mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3"
                  initial={{ opacity: 0.7 }}
                  whileHover={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  {showCountdown && (
                    <div
                      className={`flex items-center justify-between w-full sm:w-auto gap-2 rounded-xl px-3 py-1.5 text-[11px] sm:text-xs font-semibold ${
                        isCountdownExpired
                          ? "bg-rose-100 text-rose-700 border border-rose-200"
                          : "bg-amber-100 text-amber-800 border border-amber-200"
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-4 w-4 flex-shrink-0" />
                        <span className="uppercase tracking-wide">
                          {isCountdownExpired ? "Waktu habis" : "Sisa waktu bayar"}
                        </span>
                      </div>
                      {!isCountdownExpired && (
                        <span className="text-sm sm:text-base font-extrabold tabular-nums tracking-widest">
                          {minutesLeft.toString().padStart(2, "0")}:
                          {secondsLeft.toString().padStart(2, "0")}
                        </span>
                      )}
                    </div>
                  )}
                  <motion.button
                    className="group/view self-end sm:self-auto relative inline-flex items-center gap-1.5 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl sm:rounded-2xl bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-500 text-white text-[11px] sm:text-sm font-semibold shadow-[0_4px_12px_rgba(37,99,235,0.25),0_2px_6px_rgba(6,182,212,0.2)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.35),0_4px_10px_rgba(6,182,212,0.25)] transition-all duration-300 overflow-hidden"
                    style={{
                      backgroundSize: "200% 200%",
                    }}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  >
                    {/* Animated gradient background */}
                    <motion.div
                      className="absolute inset-0 rounded-xl sm:rounded-2xl"
                      style={{
                        background: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 50%, #3b82f6 100%)',
                        backgroundSize: '200% 200%',
                      }}
                      animate={{
                        backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                    />
                    
                    {/* Shimmer effect on hover */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-0 group-hover/view:opacity-100"
                      animate={{
                        x: ['-100%', '200%'],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        repeatDelay: 1,
                        ease: "linear",
                      }}
                    />
                    
                    {/* Inner shine overlay */}
                    <div className="absolute inset-0 rounded-xl sm:rounded-2xl bg-gradient-to-br from-white/20 via-transparent to-transparent pointer-events-none" />
                    
                    {/* Content */}
                    <Eye className="relative z-10 h-3.5 w-3.5 sm:h-4 sm:w-4 drop-shadow-[0_1px_2px_rgba(0,0,0,0.25)]" />
                    <span className="relative z-10 font-semibold tracking-wide drop-shadow-[0_1px_2px_rgba(0,0,0,0.2)]">
                      {t("orders.viewDetails")}
                    </span>
                    <motion.div
                      className="relative z-10"
                      animate={{
                        x: [0, 3, 0],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    >
                      <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 drop-shadow-[0_1px_2px_rgba(0,0,0,0.2)]" />
                    </motion.div>
                    
                    {/* Ripple effect on click */}
                    <motion.div
                      className="absolute inset-0 rounded-xl sm:rounded-2xl bg-white/20"
                      initial={{ scale: 0, opacity: 0 }}
                      whileTap={{ scale: 1.5, opacity: [0.5, 0] }}
                      transition={{ duration: 0.6 }}
                    />
                  </motion.button>
                </motion.div>
              </div>
            </Link>
          </AnimatedCard>
          );
        })}

        {!loading && items.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="card-lombok flex flex-col items-center justify-center py-12 text-center"
          >
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Package className="h-16 w-16 text-slate-300 mx-auto" />
            </motion.div>
            <p className="mt-4 text-slate-600 font-medium">{t("orders.noOrders")}</p>
            <p className="mt-1 text-sm text-slate-500">{t("orders.createFirst")}</p>
          </motion.div>
        )}
      </div>

      {/* Modern Pagination with Page Numbers */}
      {!loading && totalPages > 1 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="rounded-2xl border-2 border-slate-200/50 bg-white/80 backdrop-blur-sm p-4 shadow-lg shadow-slate-200/50"
        >
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
              <span className="hidden sm:inline">Halaman</span>
              <div className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 shadow-inner">
                <span className="text-xs font-semibold text-slate-500 sm:hidden">Hal</span>
                <input
                  type="number"
                  min={1}
                  max={totalPages}
                  value={pageInput}
                  onChange={(e) => setPageInput(e.target.value.replace(/[^0-9]/g, ""))}
                  onBlur={() => {
                    const value = parseInt(pageInput, 10);
                    if (!Number.isFinite(value)) {
                      setPageInput(String(currentPage));
                      return;
                    }
                    const normalized = Math.min(Math.max(1, value), totalPages);
                    setCurrentPage(normalized);
                    setPageInput(String(normalized));
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      const value = parseInt(pageInput, 10);
                      if (!Number.isFinite(value)) {
                        setPageInput(String(currentPage));
                        return;
                      }
                      const normalized = Math.min(Math.max(1, value), totalPages);
                      setCurrentPage(normalized);
                      setPageInput(String(normalized));
                    }
                  }}
                  className="w-12 rounded-lg border border-slate-200 bg-white px-2 py-1 text-center text-sm font-bold text-slate-900 focus:border-lombok-tropical-500 focus:outline-none focus:ring-2 focus:ring-lombok-tropical-100"
                />

                <span className="text-xs sm:text-sm font-semibold text-slate-500">
                  / {totalPages}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-1.5 rounded-xl border-2 border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition-all hover:border-lombok-tropical-400 hover:bg-lombok-tropical-50 hover:text-lombok-tropical-600 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-slate-200 disabled:hover:bg-white disabled:hover:text-slate-700 shadow-sm"
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Sebelumnya</span>
              </motion.button>
              
              <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-hide px-2 sm:px-0">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <motion.button
                    key={page}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setCurrentPage(page)}
                    className={`min-w-[36px] h-9 px-3 rounded-xl text-sm font-bold transition-all ${
                      currentPage === page
                        ? "bg-lombok-gradient text-white shadow-lg shadow-lombok-tropical-500/30"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200 hover:shadow-md"
                    }`}
                  >
                    {page}
                  </motion.button>
                ))}
              </div>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="flex items-center gap-1.5 rounded-xl border-2 border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition-all hover:border-lombok-tropical-400 hover:bg-lombok-tropical-50 hover:text-lombok-tropical-600 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-slate-200 disabled:hover:bg-white disabled:hover:text-slate-700 shadow-sm"
              >
                <span className="hidden sm:inline">Selanjutnya</span>
                <ChevronRight className="h-4 w-4" />
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}
      </div>
    </div>
  );
}


