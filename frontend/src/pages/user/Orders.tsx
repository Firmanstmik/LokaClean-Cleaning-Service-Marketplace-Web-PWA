import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  Package, Calendar, MapPin, ArrowRight, 
  Search, Filter, ShoppingBag, Clock, CheckCircle2, 
  AlertCircle, ChevronRight, Truck
} from "lucide-react";
import { api } from "../../lib/api";
import { getApiErrorMessage } from "../../lib/apiError";
import { formatDateOnlyWITA } from "../../utils/date";
import { getPackageImage, getPackageImageAlt } from "../../utils/packageImage";
import { t } from "../../lib/i18n";
import type { Pesanan } from "../../types/api";

// --- Types & Helpers ---

type FilterTab = 'all' | 'pending' | 'in_progress' | 'completed';

function formatOrderNumber(orderNumber: number | null | undefined): string {
  if (!orderNumber) return "-";
  return `LC-${orderNumber.toString().padStart(4, "0")}`;
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case "PENDING":
    case "WAITING_PAYMENT":
      return { 
        label: "Menunggu Konfirmasi", 
        color: "bg-amber-100 text-amber-700 border-amber-200",
        icon: AlertCircle
      };
    case "PROCESSING":
    case "IN_PROGRESS":
    case "ON_THE_WAY":
      return { 
        label: "Sedang Diproses", 
        color: "bg-blue-100 text-blue-700 border-blue-200",
        icon: Truck
      };
    case "COMPLETED":
      return { 
        label: "Selesai", 
        color: "bg-emerald-100 text-emerald-700 border-emerald-200",
        icon: CheckCircle2
      };
    case "CANCELLED":
      return { 
        label: "Dibatalkan", 
        color: "bg-slate-100 text-slate-500 border-slate-200",
        icon: AlertCircle
      };
    default:
      return { 
        label: status, 
        color: "bg-slate-100 text-slate-700 border-slate-200",
        icon: Package
      };
  }
};

export function OrdersPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<Pesanan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<FilterTab>('all');

  // Fetch Logic
  useEffect(() => {
    let alive = true;
    setLoading(true);
    (async () => {
      try {
        const params = new URLSearchParams();
        params.append('page', '1');
        params.append('limit', '50'); // Fetch more for scrolling list
        
        // Map UI tabs to API status
        if (activeTab === 'pending') params.append('status', 'PENDING'); // or WAITING_PAYMENT? Usually PENDING cover it
        if (activeTab === 'in_progress') params.append('status', 'IN_PROGRESS'); // API usually handles grouping or we send specific
        if (activeTab === 'completed') params.append('status', 'COMPLETED');
        
        // Note: Real API might need comma separated values or multiple calls if 'in_progress' maps to multiple statuses.
        // For now assuming simple mapping works or backend handles it.
        // If 'in_progress' needs PROCESSING + IN_PROGRESS, we might need to filter client side or fix API.
        // Let's rely on standard 'status' param for now.
        
        const resp = await api.get(`/orders?${params.toString()}`);
        if (alive) {
          setItems(resp.data.data.items as Pesanan[]);
        }
      } catch (err) {
        if (alive) setError(getApiErrorMessage(err));
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [activeTab]);

  // Tab Item Component
  const TabItem = ({ id, label }: { id: FilterTab, label: string }) => {
    const isActive = activeTab === id;
    return (
      <button
        onClick={() => setActiveTab(id)}
        className={`
          flex-shrink-0 px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 whitespace-nowrap
          ${isActive 
            ? "bg-gradient-to-r from-teal-500 to-blue-500 text-white shadow-md shadow-teal-500/20 border border-transparent" 
            : "bg-white text-slate-600 border border-slate-200 hover:border-teal-300 hover:bg-teal-50"
          }
        `}
      >
        {label}
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24 font-sans selection:bg-teal-100 selection:text-teal-900">
      
      {/* 1. TOP HEADER (Gradient Hero) */}
      <div className="bg-gradient-to-br from-teal-600 via-teal-500 to-blue-600 pt-6 pb-16 px-6 shadow-sm">
        <div className="max-w-md mx-auto w-full">
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Pesanan Anda
          </h1>
          <p className="mt-2 text-teal-100 text-sm font-medium opacity-90 leading-relaxed max-w-[280px]">
            Lacak status, foto, pembayaran & feedback layanan kebersihanmu.
          </p>
        </div>
      </div>

      {/* 2. SEGMENT TABS (Scrollable) */}
      <div className="max-w-md mx-auto w-full px-4 -mt-8 mb-6">
        <div className="flex gap-3 overflow-x-auto pb-4 pt-1 scrollbar-hide snap-x">
          <TabItem id="all" label="Semua" />
          <TabItem id="pending" label="Belum Dikonfirmasi" />
          <TabItem id="in_progress" label="In Progress" />
          <TabItem id="completed" label="Selesai" />
        </div>
      </div>

      {/* 3. CONTENT AREA */}
      <div className="max-w-md mx-auto w-full px-4 space-y-4">
        
        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-teal-100 border-t-teal-500 rounded-full animate-spin mb-4" />
            <p className="text-slate-400 text-sm animate-pulse">Memuat pesanan...</p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 flex items-start gap-3 text-rose-700">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="text-sm font-medium">{error}</div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && items.length === 0 && (
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-slate-100 mt-4">
            <div className="w-20 h-20 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingBag className="w-10 h-10 text-teal-500 opacity-80" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">
              Belum ada pesanan
            </h3>
            <p className="text-slate-500 text-sm mb-8 leading-relaxed max-w-[200px] mx-auto">
              Ayo buat pesanan pertamamu dan nikmati kebersihan instan!
            </p>
            <Link 
              to="/packages/all"
              className="block w-full py-3.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-bold shadow-lg shadow-teal-500/30 active:scale-[0.98] transition-transform"
            >
              Pesan Sekarang
            </Link>
          </div>
        )}

        {/* Order List */}
        {!loading && !error && items.length > 0 && items.map((order) => {
          const badge = getStatusBadge(order.status);
          const BadgeIcon = badge.icon;
          const isEnglish = false; // Force ID for now based on prompt language
          const serviceName = isEnglish && order.paket.name_en ? order.paket.name_en : order.paket.name;

          return (
            <div 
              key={order.id}
              className="group bg-white rounded-2xl p-4 border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-300"
            >
              {/* Card Top: Thumb + Info */}
              <div className="flex gap-4">
                {/* Thumbnail */}
                <div className="w-20 h-20 rounded-xl bg-slate-100 overflow-hidden flex-shrink-0 border border-slate-50">
                   <img 
                      src={getPackageImage(order.paket.name, order.paket.image)}
                      alt={getPackageImageAlt(order.paket.name)}
                      className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                   />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 py-0.5">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                      {formatOrderNumber(order.order_number)}
                    </span>
                    {/* Status Badge (Mini for mobile) */}
                    <div className={`px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 ${badge.color}`}>
                      <BadgeIcon className="w-3 h-3" />
                      <span>{badge.label}</span>
                    </div>
                  </div>
                  
                  <h3 className="text-sm font-bold text-slate-800 leading-tight mb-1 truncate">
                    {serviceName}
                  </h3>
                  
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                    <Calendar className="w-3.5 h-3.5 text-teal-500" />
                    <span>{formatDateOnlyWITA(order.scheduled_date)}</span>
                  </div>
                  
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <MapPin className="w-3.5 h-3.5 text-teal-500" />
                    <span className="truncate max-w-[140px]">{order.address}</span>
                  </div>
                </div>
              </div>

              {/* Card Bottom: Actions */}
              <div className="mt-4 pt-3 border-t border-slate-50 flex gap-3">
                <Link 
                  to={`/orders/${order.id}`}
                  className="flex-1 py-2.5 rounded-lg border border-slate-200 text-slate-600 text-xs font-bold text-center hover:bg-slate-50 transition-colors"
                >
                  Detail
                </Link>
                <Link 
                  to={`/orders/${order.id}`} // Usually track is same as detail or specific tab
                  className="flex-1 py-2.5 rounded-lg bg-teal-50 text-teal-700 text-xs font-bold text-center hover:bg-teal-100 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Search className="w-3.5 h-3.5" />
                  Lacak
                </Link>
              </div>
            </div>
          );
        })}
        
        {/* End of list spacer */}
        <div className="h-8" />
      </div>
    </div>
  );
}
