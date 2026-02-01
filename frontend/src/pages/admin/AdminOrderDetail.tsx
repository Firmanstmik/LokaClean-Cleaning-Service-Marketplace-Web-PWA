/**
 * ADMIN order detail page with premium UI, advanced animations, and professional effects.
 *
 * Admin can:
 * - view order details with location map
 * - view payment status (automatically marked as PAID when user completes order)
 * - share location map link with workers
 */

import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  DollarSign,
  CreditCard,
  Camera,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Play,
  Activity,
  Star,
  Gift,
  Copy,
  ExternalLink,
  Trash2,
} from "lucide-react";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import type { LatLng } from "../../components/MapPicker";

import { api } from "../../lib/api";
import { getApiErrorMessage } from "../../lib/apiError";

function formatOrderNumber(orderNumber: number | null | undefined): string {
  if (!orderNumber) return "-";
  return `LC-${orderNumber.toString().padStart(4, "0")}`;
}
import { toAbsoluteUrl, parsePhotoPaths } from "../../lib/urls";
import { AnimatedCard } from "../../components/AnimatedCard";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { formatDateTimeWITA } from "../../utils/date";
import { getPackageIcon, getPackageGradient } from "../../utils/packageIcon";
import type { Pesanan } from "../../types/api";

export function AdminOrderDetailPage() {
  const { id } = useParams();
  const orderId = Number(id);
  const navigate = useNavigate();

  const [order, setOrder] = useState<Pesanan | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const refresh = useCallback(async () => {
    const resp = await api.get(`/admin/orders/${orderId}`);
    setOrder(resp.data.data.order as Pesanan);
  }, [orderId]);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoadError(null);
      if (!Number.isFinite(orderId)) {
        setLoadError("Invalid order id");
        setLoading(false);
        return;
      }
      try {
        const resp = await api.get(`/admin/orders/${orderId}`);
        if (alive) setOrder(resp.data.data.order as Pesanan);
      } catch (err) {
        if (alive) setLoadError(getApiErrorMessage(err));
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [orderId]);

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-center py-12"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="h-12 w-12 rounded-full border-4 border-slate-200 border-t-indigo-600"
        />
      </motion.div>
    );
  }

  if (loadError) {
    return (
      <AnimatedCard delay={0} className="card-lombok">
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
          <h2 className="text-2xl font-black text-slate-900 mb-2">Could not load order</h2>
          <p className="text-sm font-semibold text-red-700 mb-6">{loadError}</p>
          <Link to="/admin/orders">
            <motion.button
              whileHover={{ scale: 1.05, x: -4 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-3 text-sm font-black text-white shadow-xl"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to orders
            </motion.button>
          </Link>
        </div>
      </AnimatedCard>
    );
  }
  if (!order) return null;

  // Parse photos (supports JSON array or single string)
  const beforePhotoPaths = parsePhotoPaths(order.room_photo_before);
  const afterPhotoPaths = parsePhotoPaths(order.room_photo_after);
  const beforeUrls = beforePhotoPaths.map(p => toAbsoluteUrl(p));
  const afterUrls = afterPhotoPaths.map(p => toAbsoluteUrl(p));
  
  // Get location coordinates
  const location: LatLng | null = order.location_latitude && order.location_longitude
    ? { lat: order.location_latitude, lng: order.location_longitude }
    : null;

  // Generate Google Maps link
  const googleMapsLink = location
    ? `https://www.google.com/maps?q=${location.lat},${location.lng}`
    : null;

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { bg: string; text: string; icon: typeof CheckCircle2 }> = {
      PENDING: { bg: "from-amber-500 to-orange-600", text: "text-amber-50", icon: AlertCircle },
      PROCESSING: { bg: "from-blue-500 to-indigo-600", text: "text-blue-50", icon: Play },
      IN_PROGRESS: { bg: "from-purple-500 to-pink-600", text: "text-purple-50", icon: Activity },
      COMPLETED: { bg: "from-emerald-500 to-teal-600", text: "text-emerald-50", icon: CheckCircle2 },
    };
    return configs[status] || configs.PENDING;
  };

  const statusConfig = getStatusConfig(order.status);
  const StatusIcon = statusConfig.icon;

  return (
    <>
      {/* Success Toast - Top Right Corner, Above All Layers */}
      <AnimatePresence>
        {actionSuccess && (
          <motion.div
            initial={{ opacity: 0, x: 100, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 50, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="fixed top-24 right-3 sm:top-28 sm:right-4 z-[99999] max-w-[calc(100vw-1.5rem)] sm:max-w-sm pointer-events-auto"
            style={{ 
              isolation: 'isolate',
              zIndex: 99999,
              position: 'fixed'
            }}
          >
            <div className="relative rounded-xl border border-emerald-300 bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-50 px-3 sm:px-4 py-2.5 sm:py-3 shadow-lg shadow-emerald-500/30 backdrop-blur-sm">
              {/* Subtle glow effect */}
              <motion.div
                className="absolute inset-0 rounded-xl bg-gradient-to-r from-emerald-400/10 to-teal-400/10 blur-lg"
                animate={{
                  opacity: [0.2, 0.4, 0.2],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
              
              <div className="relative flex items-start gap-2 sm:gap-3">
                <motion.div
                  animate={{ scale: 1.15 }}
                  whileHover={{ scale: 1.2, rotate: 5 }}
                  transition={{ duration: 0.3, type: "spring", stiffness: 300 }}
                  className="flex h-7 w-7 sm:h-8 sm:w-8 md:h-9 md:w-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 shadow-md mt-0.5 relative overflow-hidden group/icon"
                >
                  {/* Glow effect on hover */}
                  <motion.div
                    className="absolute inset-0 rounded-full bg-gradient-to-br from-emerald-400/40 to-teal-400/40 opacity-0 group-hover/icon:opacity-100 blur-lg"
                    transition={{ duration: 0.3 }}
                  />
                  <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 text-white" strokeWidth={2.5} />
                </motion.div>
                <div className="flex-1 min-w-0 pr-1">
                  <div className="text-[11px] sm:text-xs md:text-sm font-bold text-emerald-900 leading-tight mb-0.5">Berhasil!</div>
                  <div className="text-[10px] sm:text-xs text-emerald-700 font-medium leading-relaxed break-words">
                    {actionSuccess.replace("✅ ", "")}
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setActionSuccess(null)}
                  className="flex-shrink-0 h-6 w-6 sm:h-6 sm:w-6 md:h-7 md:w-7 flex items-center justify-center rounded-full text-emerald-600 hover:bg-emerald-100 hover:text-emerald-800 transition-colors -mt-0.5 touch-manipulation"
                  aria-label="Close notification"
                >
                  <span className="text-base sm:text-lg md:text-xl font-bold leading-none">×</span>
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-4 sm:space-y-6 animate-fade-in">
        {/* Compact Header - Mobile Optimized */}
        <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-start justify-between gap-3 sm:gap-4"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-bold text-slate-500 mb-2">
            {(() => {
              const Icon = getPackageIcon(order.paket.name);
              return <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />;
            })()}
            Order {formatOrderNumber(order.order_number)}
          </div>
          <h1 className="text-base sm:text-lg lg:text-xl xl:text-2xl font-black bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent leading-tight mb-2">
            {order.paket.name}
          </h1>
          <div className="text-[11px] sm:text-xs md:text-sm font-medium text-slate-600 leading-relaxed">
            <div className="flex items-start gap-1.5 sm:gap-2">
              <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-400 flex-shrink-0 mt-0.5" />
              <span className="break-words">{order.address}</span>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 sm:gap-2.5 flex-shrink-0">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`inline-flex items-center gap-1.5 sm:gap-2 rounded-full bg-gradient-to-r ${statusConfig.bg} px-3 sm:px-3.5 py-1.5 sm:py-2 text-[11px] sm:text-xs font-black ${statusConfig.text} shadow-xl`}
          >
            <StatusIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="whitespace-nowrap">{order.status}</span>
          </motion.div>
          <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-medium text-slate-600 text-right">
            <CreditCard className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
            <span className="whitespace-nowrap">
              <span className="font-bold">{order.pembayaran.status}</span>
              <span className="hidden sm:inline"> ({order.pembayaran.method})</span>
            </span>
          </div>
        </div>
      </motion.div>

              {/* Error message */}
              <AnimatePresence>
                {actionError && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="flex items-center gap-2.5 sm:gap-3 rounded-xl border-2 border-red-200 bg-gradient-to-r from-red-50 to-rose-50 p-3 sm:p-4 text-xs sm:text-sm font-semibold text-red-700 shadow-lg"
                  >
                    <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                    <span className="break-words">{actionError}</span>
                  </motion.div>
                )}
              </AnimatePresence>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        {/* Customer Card */}
        <AnimatedCard delay={0.1} className="card-lombok">
          <div className="mb-2 sm:mb-3 flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-bold uppercase tracking-wider text-indigo-600">
            <User className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            Customer Information
          </div>
          <div className="mt-3 sm:mt-4 space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 p-3 sm:p-4">
              <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-600">
                <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-indigo-600 flex-shrink-0" />
                <span>Name</span>
              </div>
              <div className="text-xs sm:text-sm font-black text-slate-900 text-right ml-2 break-words">{order.user.full_name}</div>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-gradient-to-r from-blue-50 to-cyan-50 p-3 sm:p-4">
              <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-600">
                <Phone className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600 flex-shrink-0" />
                <span>Phone</span>
              </div>
              <div className="text-xs sm:text-sm font-black text-slate-900 text-right ml-2 break-words">{order.user.phone_number}</div>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 p-3 sm:p-4">
              <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-600">
                <Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-600 flex-shrink-0" />
                <span>Email</span>
              </div>
              <div className="text-xs sm:text-sm font-black text-slate-900 text-right ml-2 break-all">{order.user.email}</div>
            </div>
          </div>
        </AnimatedCard>

        {/* Location Map Card */}
        {location && (
          <AnimatedCard delay={0.15} className="card-lombok lg:col-span-2">
            <div className="mb-2 sm:mb-3 flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-bold uppercase tracking-wider text-emerald-600">
              <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Order Location
            </div>
            <div className="mt-3 sm:mt-4 space-y-3 sm:space-y-4">
              <div className="rounded-xl border-2 border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100 overflow-hidden">
                <MapContainer
                  center={location}
                  zoom={15}
                  style={{ height: "220px", width: "100%", minHeight: "180px" }}
                  className="z-0 sm:h-[250px]"
                  scrollWheelZoom={false}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <Marker position={location} />
                </MapContainer>
              </div>
              
              {/* Copy Map Link - Responsive */}
              <div className="space-y-2.5 sm:space-y-3">
                <div className="rounded-xl border-2 border-slate-200 bg-white px-3 sm:px-4 py-2.5 sm:py-3 shadow-[0_2px_8px_rgba(0,0,0,0.06),0_1px_3px_rgba(0,0,0,0.04)]">
                  <div className="text-[11px] sm:text-xs font-bold text-slate-500 mb-1.5">Google Maps Link</div>
                  <div className="text-[10px] sm:text-xs font-medium text-slate-700 break-all leading-relaxed">
                    {googleMapsLink}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  onClick={async () => {
                    if (googleMapsLink) {
                      try {
                        // Clear previous messages
                        setActionError(null);
                        setActionSuccess(null);
                        
                        // Copy to clipboard
                        await navigator.clipboard.writeText(googleMapsLink);
                        
                        // Show success message
                        setActionSuccess("✅ Link berhasil di-copy! Siap di-share ke pekerja.");
                        
                        // Auto-hide after 5 seconds
                        setTimeout(() => {
                          setActionSuccess(null);
                        }, 5000);
                      } catch (err) {
                        console.error("Failed to copy:", err);
                        setActionSuccess(null);
                        setActionError("Gagal menyalin link. Silakan coba lagi.");
                      }
                    }
                  }}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 sm:px-5 py-3 sm:py-3.5 text-xs sm:text-sm font-black text-white shadow-lg transition-all hover:shadow-xl min-w-[120px] touch-manipulation"
                    title="Copy map link to share"
                  >
                    <Copy className="h-4 w-4 sm:h-4 sm:w-4 flex-shrink-0" />
                    <span>Copy Link</span>
                  </motion.button>
                  {googleMapsLink && (
                    <motion.a
                      href={googleMapsLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex-1 sm:flex-initial flex items-center justify-center gap-2 rounded-xl border-2 border-emerald-200 bg-emerald-50 px-4 sm:px-5 py-3 sm:py-3.5 text-xs sm:text-sm font-black text-emerald-700 transition-all hover:border-emerald-300 hover:bg-emerald-100 min-w-[120px] touch-manipulation"
                      title="Open in Google Maps"
                    >
                      <ExternalLink className="h-4 w-4 sm:h-4 sm:w-4 flex-shrink-0" />
                      <span>Open Maps</span>
                    </motion.a>
                  )}
                </div>
              </div>
              <div className="text-[11px] sm:text-xs font-medium text-slate-500 mt-2.5 leading-relaxed">
                📍 Share this link with workers/employees assigned to this order
              </div>
            </div>
          </AnimatedCard>
        )}

        {/* Operations Card */}
        <AnimatedCard delay={location ? 0.2 : 0.15} className="card-lombok">
          <div className="mb-2 sm:mb-3 flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-bold uppercase tracking-wider text-purple-600">
            <Activity className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            Operations
          </div>
          <div className="mt-3 sm:mt-4 space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 p-3 sm:p-4">
              <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-600">
                <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-600 flex-shrink-0" />
                <span>Scheduled</span>
              </div>
              <div className="text-xs sm:text-sm font-black text-slate-900 text-right ml-2 break-words">{formatDateTimeWITA(order.scheduled_date)}</div>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 p-3 sm:p-4">
              <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-600">
                <DollarSign className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-600 flex-shrink-0" />
                <span>Payment Amount</span>
              </div>
              <div className="text-xs sm:text-sm font-black text-emerald-700 text-right ml-2">Rp {order.pembayaran.amount.toLocaleString("id-ID")}</div>
            </div>
          </div>

          {/* Payment Section */}
          <div className="mt-5 sm:mt-6 rounded-xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-3 sm:p-4">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-black text-emerald-700 mb-2.5 sm:mb-3">
              <CreditCard className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Payment Status
            </div>
            <div className="text-xs sm:text-sm font-medium text-slate-600 mb-2">
              Current: <span className="font-black text-slate-900">{order.pembayaran.status}</span>
            </div>
            {order.status === "COMPLETED" && order.pembayaran.status === "PAID" && (
              <div className="mt-3 flex items-center gap-2 rounded-lg bg-emerald-100 px-3 py-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                <span className="text-xs sm:text-sm font-semibold text-emerald-800">
                  Payment automatically marked as PAID when order was completed
                </span>
              </div>
            )}
            {order.status !== "COMPLETED" && (
              <div className="mt-3 text-xs sm:text-sm font-medium text-slate-500">
                Payment will be automatically marked as PAID when user completes the order with proof photo.
              </div>
            )}
          </div>
        </AnimatedCard>

        {/* Photos Card - View Only (User uploads after photo) */}
        <AnimatedCard delay={location ? 0.3 : 0.2} className="card-lombok lg:col-span-2">
          <div className="mb-2 sm:mb-3 flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-bold uppercase tracking-wider text-rose-600">
            <Camera className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            Room Photos
          </div>
          <div className="mt-3 sm:mt-4 grid gap-3 sm:gap-4 sm:grid-cols-2">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="rounded-xl border-2 border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100 p-2.5 sm:p-3 md:p-4 shadow-[0_2px_8px_rgba(0,0,0,0.06),0_1px_3px_rgba(0,0,0,0.04)]"
            >
              <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-black text-slate-500 mb-2.5 sm:mb-3">
                <Camera className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                Before {beforeUrls.length > 1 && `(${beforeUrls.length})`}
              </div>
              {beforeUrls.length > 0 ? (
                <div className="space-y-2">
                  {beforeUrls.map((url, idx) => (
                    url && (
                      <motion.img
                        key={idx}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="aspect-video w-full rounded-xl border-2 border-slate-200 object-cover shadow-lg"
                        src={url}
                        alt={`Before cleaning ${idx + 1}`}
                      />
                    )
                  ))}
                </div>
              ) : (
                <div className="aspect-video w-full rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 flex items-center justify-center text-[11px] sm:text-xs md:text-sm font-medium text-slate-400">
                  No photo
                </div>
              )}
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="rounded-xl border-2 border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100 p-2.5 sm:p-3 md:p-4 shadow-[0_2px_8px_rgba(0,0,0,0.06),0_1px_3px_rgba(0,0,0,0.04)]"
            >
              <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-black text-slate-500 mb-2.5 sm:mb-3">
                <Camera className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                After {afterUrls.length > 1 && `(${afterUrls.length})`}
              </div>
              {afterUrls.length > 0 ? (
                <div className="space-y-2">
                  {afterUrls.map((url, idx) => (
                    url && (
                      <motion.img
                        key={idx}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="aspect-video w-full rounded-xl border-2 border-slate-200 object-cover shadow-lg"
                        src={url}
                        alt={`After cleaning ${idx + 1}`}
                      />
                    )
                  ))}
                </div>
              ) : (
                <div className="aspect-video w-full rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 flex items-center justify-center text-[11px] sm:text-xs md:text-sm font-medium text-slate-400">
                  <div className="text-center px-2">
                    <div>User will upload</div>
                    <div className="text-[10px] sm:text-xs mt-1">after completion</div>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </AnimatedCard>

        {/* Feedback Card */}
        <AnimatedCard delay={location ? 0.35 : 0.3} className="card-lombok lg:col-span-2">
          <div className="mb-2 sm:mb-3 flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-bold uppercase tracking-wider text-yellow-600">
            <Star className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            Customer Feedback
          </div>
          <div className="mt-3 sm:mt-4 grid gap-3 sm:gap-4 sm:grid-cols-2">
            <motion.div
              whileHover={{ scale: 1.02, y: -2 }}
              className="rounded-xl border-2 border-yellow-200 bg-gradient-to-br from-yellow-50 to-amber-50 p-4 sm:p-5 md:p-6 shadow-[0_2px_8px_rgba(0,0,0,0.06),0_1px_3px_rgba(0,0,0,0.04)]"
            >
              <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-black text-yellow-600 mb-2.5 sm:mb-3">
                <Star className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                Rating
              </div>
              {order.rating ? (
                <>
                  <div className="text-2xl sm:text-3xl font-black text-slate-900 mb-2">
                    {order.rating.rating_value}/5
                  </div>
                  {order.rating.review && (
                    <p className="text-xs sm:text-sm font-medium text-slate-700 leading-relaxed">{order.rating.review}</p>
                  )}
                </>
              ) : (
                <div className="text-xs sm:text-sm font-medium text-slate-400">No rating yet</div>
              )}
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.02, y: -2 }}
              className="rounded-xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-4 sm:p-5 md:p-6 shadow-[0_2px_8px_rgba(0,0,0,0.06),0_1px_3px_rgba(0,0,0,0.04)]"
            >
              <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-black text-emerald-600 mb-2.5 sm:mb-3">
                <Gift className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                Tip
              </div>
              {order.tip ? (
                <div className="text-xl sm:text-2xl font-black text-emerald-700">
                  Rp {order.tip.amount.toLocaleString("id-ID")}
                </div>
              ) : (
                <div className="text-xs sm:text-sm font-medium text-slate-400">No tip received</div>
              )}
            </motion.div>
          </div>
        </AnimatedCard>
      </div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-4 sm:mt-6 flex flex-col sm:flex-row gap-3"
      >
        <Link to="/admin/orders" className="flex-1 sm:flex-initial">
          <motion.button
            whileHover={{ scale: 1.05, x: -4 }}
            whileTap={{ scale: 0.95 }}
            className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-slate-700 to-slate-900 px-5 sm:px-6 py-3 sm:py-3.5 text-xs sm:text-sm font-black text-white shadow-xl transition-all hover:shadow-2xl touch-manipulation"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Orders</span>
          </motion.button>
        </Link>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          disabled={deleting}
          onClick={() => {
            if (!order) return;
            setShowDeleteConfirm(true);
          }}
          className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 px-5 sm:px-6 py-3 sm:py-3.5 text-xs sm:text-sm font-black text-white shadow-xl transition-all hover:shadow-2xl disabled:opacity-60 disabled:cursor-not-allowed touch-manipulation"
        >
          {deleting ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white"
              />
              <span>Deleting...</span>
            </>
          ) : (
            <>
              <Trash2 className="h-4 w-4" />
              <span>Delete Order</span>
            </>
          )}
        </motion.button>
      </motion.div>
      </div>

      {/* Modern Confirm Dialog for Delete */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={async () => {
          if (!order) return;
          
          setDeleting(true);
          setActionError(null);
          setActionSuccess(null);
          try {
            await api.delete(`/admin/orders/${order.id}`);
            setActionSuccess(`✅ Pesanan ${formatOrderNumber(order.order_number)} berhasil dihapus!`);
            
            // Navigate after showing success message briefly
            setTimeout(() => {
              navigate("/admin/orders");
            }, 1500);
          } catch (err) {
            setActionError(getApiErrorMessage(err));
            setActionSuccess(null);
            setDeleting(false);
            setShowDeleteConfirm(false);
          }
        }}
        title="Hapus Pesanan?"
        message={`Nomor Pesanan: ${formatOrderNumber(order?.order_number)}\nPaket: ${order?.paket.name}\nStatus: ${order?.status}\nCustomer: ${order?.user.full_name}\n\nApakah Anda yakin ingin menghapus pesanan ini?\nTindakan ini TIDAK DAPAT DIBATALKAN dan semua data terkait akan dihapus permanen.`}
        confirmText="Ya, Hapus"
        cancelText="Batal"
        variant="danger"
        isLoading={deleting}
      />
    </>
  );
}


