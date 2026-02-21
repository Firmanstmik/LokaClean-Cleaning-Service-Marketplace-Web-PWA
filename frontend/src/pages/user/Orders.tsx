/**
 * USER Orders page.
 * Displays active and past orders with status badges.
 * Updated: Bilingual Support & Shopee-like Professional UI (v3)
 */
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  LayoutGrid, Wallet, PackageCheck, Truck, Star, XCircle,
  ArrowLeft, ShoppingBag, Calendar, MapPin, CreditCard,
  ChevronRight, Search, RefreshCcw, CheckCircle, Lock
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { api } from "../../lib/api";
import { getApiErrorMessage } from "../../lib/apiError";
import { formatDateOnlyWITA } from "../../utils/date";
import { getPackageImage, getPackageImageAlt } from "../../utils/packageImage";
import { t, useCurrentLanguage, getLanguage } from "../../lib/i18n";
import type { Pesanan } from "../../types/api";
import { useAuth } from "../../lib/auth";

// --- Types & Helpers ---

type FilterTab = 'all' | 'pending' | 'processing' | 'in_progress' | 'rate' | 'completed' | 'cancelled';

const TABS = [
  { id: 'all', labelKey: 'orders.tabs.all', icon: LayoutGrid },
  { id: 'pending', labelKey: 'orders.tabs.pending', icon: Wallet },
  { id: 'processing', labelKey: 'orders.tabs.confirmed', icon: PackageCheck },
  { id: 'in_progress', labelKey: 'orders.tabs.inProgress', icon: Truck },
  { id: 'rate', labelKey: 'orders.tabs.rate', icon: Star },
  { id: 'completed', labelKey: 'orders.tabs.completed', icon: CheckCircle },
  { id: 'cancelled', labelKey: 'orders.tabs.cancelled', icon: XCircle },
] as const;

const STATUS_COLORS: Record<string, string> = {
  PENDING: "text-amber-600 bg-amber-50 border-amber-100",
  PROCESSING: "text-blue-600 bg-blue-50 border-blue-100",
  IN_PROGRESS: "text-indigo-600 bg-indigo-50 border-indigo-100",
  COMPLETED: "text-emerald-600 bg-emerald-50 border-emerald-100",
  CANCELLED: "text-slate-500 bg-slate-100 border-slate-200",
};

const STATUS_LABELS_KEY: Record<string, string> = {
  PENDING: "orders.pending",
  PROCESSING: "orders.processing",
  IN_PROGRESS: "orders.inProgress",
  COMPLETED: "orders.completed",
  CANCELLED: "orders.cancelled",
};

import { OrderRatingModal } from "../../components/order/OrderRatingModal";

import { Skeleton } from "../../components/ui/Skeleton";
import { OptimizedImage } from "../../components/ui/OptimizedImage";

export function OrdersPage() {
  const currentLanguage = useCurrentLanguage();
  const navigate = useNavigate();
  const { token } = useAuth();
  const isGuest = !token;
  const [items, setItems] = useState<Pesanan[]>([]);
  const [loading, setLoading] = useState(!isGuest);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [selectedOrder, setSelectedOrder] = useState<Pesanan | null>(null);

  const fetchOrders = async () => {
    if (!token) {
      setItems([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', '1');
      params.append('limit', '50');
      
      if (activeTab !== 'all') {
        params.append('status', activeTab);
      }
      
      const resp = await api.get(`/orders?${params.toString()}`);
      setItems(resp.data.data.items as Pesanan[]);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setItems([]);
      setError(null);
      return;
    }
    fetchOrders();
  }, [activeTab, token]);

  return (
    <div className="min-h-screen bg-slate-50 pb-24 font-sans">
      {/* Header */}
      <div className="bg-gradient-to-br from-emerald-500 to-teal-600 pt-12 pb-20 px-6 rounded-b-[40px] shadow-lg relative overflow-hidden">
        {/* Background Decorations */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-2xl -ml-12 -mb-12" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <Link to="/home" className="p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/30 transition-colors">
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <h1 className="text-2xl font-bold text-white tracking-wide">{t("orders.title")}</h1>
          </div>
          <p className="text-emerald-50 text-sm font-medium leading-relaxed max-w-sm">
            {t("orders.subtitle")}
          </p>
        </div>
      </div>

      {/* Tabs - Floating Overlap */}
      <div className="-mt-12 px-4 relative z-20">
        <div className="bg-white rounded-2xl shadow-lg p-2 flex overflow-x-auto no-scrollbar gap-2 snap-x">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as FilterTab)}
                className={`
                  flex-shrink-0 flex flex-col items-center justify-center gap-1.5 px-4 py-3 rounded-xl min-w-[80px] snap-start transition-all duration-300
                  ${isActive 
                    ? "bg-gradient-to-b from-emerald-50 to-white text-emerald-600 shadow-sm ring-1 ring-emerald-100" 
                    : "text-slate-400 hover:bg-slate-50 hover:text-slate-600"}
                `}
              >
                <div className={`p-2 rounded-full ${isActive ? "bg-emerald-100 text-emerald-600" : "bg-slate-50 text-slate-400"}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className={`text-[10px] font-bold whitespace-nowrap ${isActive ? "text-emerald-700" : "text-slate-500"}`}>
                  {t(tab.labelKey)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content List */}
      <div className="px-4 mt-6 space-y-4">
        {isGuest ? (
          <div className="mt-2">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-50 via-teal-50 to-sky-50 border border-emerald-100/70 shadow-lg px-[1px] py-[1px]">
              <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-emerald-200/40 blur-3xl" />
              <div className="pointer-events-none absolute -left-8 bottom-0 h-24 w-24 rounded-full bg-teal-200/40 blur-3xl" />
              <div className="relative z-10 rounded-3xl bg-white/95 px-4 py-5 backdrop-blur-sm">
                <div className="flex flex-col items-center text-center gap-3">
                  <div className="relative h-14 w-14 sm:h-16 sm:w-16 rounded-2xl bg-gradient-to-br from-emerald-50 via-teal-50 to-sky-50 shadow-md border border-white/70 overflow-hidden flex items-center justify-center">
                    <img
                      src="/img/maskot2.png"
                      alt="LokaClean Orders Mascot"
                      loading="lazy"
                      className="h-full w-full object-contain mix-blend-multiply"
                    />
                  </div>
                  <div className="flex flex-col items-center gap-1.5">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-slate-900">
                        {currentLanguage === "en" ? "You are not logged in yet" : "Kamu belum login"}
                      </h3>
                      <Lock className="w-4 h-4 text-emerald-500" />
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {currentLanguage === "en"
                        ? "Create a free LokaClean account so your orders are saved and you can track every cleaning easily."
                        : "Buat akun gratis LokaClean supaya semua pesanan kamu tersimpan dan mudah dipantau."}
                    </p>
                  </div>
                  <div className="flex flex-col items-stretch gap-1.5 w-full">
                    <div className="flex flex-wrap justify-center gap-1.5">
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700">
                        <span>✓</span>
                        {currentLanguage === "en" ? "Full order history" : "Riwayat pesanan lengkap"}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2.5 py-1 text-[11px] font-medium text-teal-700">
                        <span>✓</span>
                        {currentLanguage === "en" ? "Realtime status & photos" : "Status real-time & foto dokumentasi"}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2.5 py-1 text-[11px] font-medium text-sky-700">
                        <span>✓</span>
                        {currentLanguage === "en" ? "Exclusive member promos" : "Promo & benefit khusus member"}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row w-full gap-2 mt-1">
                    <button
                      type="button"
                      onClick={() => navigate("/register")}
                      className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 active:scale-95 transition"
                    >
                      {currentLanguage === "en" ? "Create Account" : "Buat Akun Sekarang"}
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate("/login")}
                      className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50/80 px-4 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 active:scale-95 transition"
                    >
                      {currentLanguage === "en" ? "I already have an account" : "Saya sudah punya akun"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                <Skeleton className="h-4 w-1/3 mb-4 rounded" />
                <div className="flex gap-4">
                  <Skeleton className="w-20 h-20 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4 rounded" />
                    <Skeleton className="h-3 w-1/2 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="bg-rose-50 border border-rose-100 rounded-2xl p-6 text-center">
            <p className="text-rose-600 text-sm font-medium mb-2">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-rose-100 text-rose-700 rounded-lg text-xs font-bold"
            >
              Try Again
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingBag className="w-10 h-10 text-emerald-300" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">{t("orders.empty.title")}</h3>
            <p className="text-slate-500 text-sm mb-6">{t("orders.empty.subtitle")}</p>
            <button 
              type="button"
              onClick={() => navigate("/orders/new")}
              className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-colors"
            >
              {t("orders.empty.action")}
              <ArrowLeft className="w-4 h-4 rotate-180" />
            </button>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {items.map((order) => (
              <OrderCard 
                key={order.id} 
                order={order} 
                onRate={(o) => setSelectedOrder(o)} 
              />
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Rating Modal */}
      {selectedOrder && (
        <OrderRatingModal
          isOpen={!!selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onSuccess={() => {
            fetchOrders();
            setSelectedOrder(null);
          }}
          order={selectedOrder}
        />
      )}
    </div>
  );
}

function OrderCard({ order, onRate }: { order: Pesanan; onRate: (order: Pesanan) => void }) {
  const statusKey = STATUS_LABELS_KEY[order.status] || order.status;
  const statusColor = STATUS_COLORS[order.status] || "text-slate-600 bg-slate-50 border-slate-100";
  const isEnglish = getLanguage() === "en";
  const packageName = isEnglish && order.paket.name_en ? order.paket.name_en : order.paket.name;
  
  // Format Price
  const priceFormatted = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  }).format(order.pembayaran.amount);

  // Check if rateable (1 hour after scheduled time OR completed but not rated)
  const isRateable = (() => {
    // If completed and not rated, always rateable
    if (order.status === 'COMPLETED' && !order.rating) return true;
    
    // If In Progress and 1 hour passed
    if (order.status === 'IN_PROGRESS') {
      const scheduledTime = new Date(order.scheduled_date).getTime();
      const oneHourAfter = scheduledTime + 60 * 60 * 1000; // 1 hour in ms
      return Date.now() > oneHourAfter;
    }
    
    return false;
  })();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden"
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1 bg-indigo-50 rounded text-indigo-600">
            <ShoppingBag className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-bold text-slate-700">LokaClean Service</span>
        </div>
        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${statusColor}`}>
          {t(statusKey)}
        </span>
      </div>

      {/* Body */}
      <Link to={`/orders/${order.id}`} className="block p-4 hover:bg-slate-50/50 transition-colors">
        <div className="flex gap-4">
          {/* Image */}
          <div className="w-20 h-20 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0 border border-slate-100">
            <OptimizedImage 
              src={getPackageImage(order.paket.name, order.paket.image)} 
              alt={getPackageImageAlt(order.paket.name)}
              className="w-full h-full object-cover"
            />
          </div>
          
          {/* Details */}
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-slate-900 text-sm truncate mb-1">
              {packageName}
            </h3>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <Calendar className="w-3 h-3" />
              <span>{formatDateOnlyWITA(order.scheduled_date)}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
              <MapPin className="w-3 h-3" />
              <span className="truncate max-w-[150px]">{order.address}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] px-2 py-0.5 bg-slate-100 rounded text-slate-500 font-medium">
                x1 Paket
              </span>
              <span className="text-sm font-bold text-emerald-600">{priceFormatted}</span>
            </div>
          </div>
        </div>
      </Link>

      {/* Footer / Actions */}
      <div className="px-4 py-3 border-t border-slate-50 bg-slate-50/30 flex items-center justify-between gap-3">
        <div className="text-xs text-slate-500 font-medium">
          Total: <span className="text-slate-900 font-bold">{priceFormatted}</span>
        </div>
        
        <div className="flex items-center gap-2">
          {isRateable ? (
            <button 
              onClick={() => onRate(order)}
              className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg shadow-sm shadow-emerald-200 hover:bg-emerald-700 transition-colors flex items-center gap-1"
            >
              <Star className="w-3 h-3" />
              {t("orders.card.rate")}
            </button>
          ) : order.status === 'PENDING' ? (
            <Link 
              to={`/orders/${order.id}`}
              className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg shadow-sm shadow-indigo-200 hover:bg-indigo-700 transition-colors"
            >
              {t("orders.card.pay")}
            </Link>
          ) : (
            <Link 
              to={`/orders/${order.id}`}
              className="px-3 py-1.5 bg-white border border-emerald-200 text-emerald-600 text-xs font-bold rounded-lg hover:bg-emerald-50 transition-colors"
            >
              {t("orders.card.track")}
            </Link>
          )}
          
          <Link 
            to={`/orders/${order.id}`}
            className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-lg hover:bg-slate-50 transition-colors"
          >
            {t("orders.card.detail")}
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
