/**
 * USER order detail page.
 * Refactored with LokaClean Tropical Premium Theme.
 */

import React, { useCallback, useEffect, useState, useRef, type ChangeEvent, type TouchEvent } from "react";
import { Link, useParams, useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, CreditCard, Clock, CheckCircle2, MessageCircle, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { api } from "../../lib/api";
import { getApiErrorMessage } from "../../lib/apiError";
import { toAbsoluteUrl, parsePhotoPaths } from "../../lib/urls";
import { formatDateTimeWITA } from "../../utils/date";
import { t, getLanguage } from "../../lib/i18n";
import { playOrderNotificationSound } from "../../utils/sound";
import { StarRating } from "../../components/StarRating";
import { ThankYouAnimation } from "../../components/ThankYouAnimation";
import { initializeSnapPayment } from "../../lib/midtrans";
import type { Pesanan } from "../../types/api";
import { useAuth } from "../../lib/auth";

// New Modular Components
import { OrderSuccessHeader } from "../../components/order/OrderSuccessHeader";
import { OrderSummaryCard } from "../../components/order/OrderSummaryCard";
import { OrderTimeline } from "../../components/order/OrderTimeline";
import { BeforeAfterPhotos } from "../../components/order/BeforeAfterPhotos";
import { StickyActionBar } from "../../components/order/StickyActionBar";

const WhatsAppIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 16 16"
    aria-hidden="true"
    fill="currentColor"
    {...props}
  >
    <path d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326zM7.994 14.521a6.6 6.6 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.56 6.56 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592m3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.73.73 0 0 0-.529.247c-.182.198-.691.677-.691 1.654s.71 1.916.81 2.049c.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232" />
  </svg>
);

function formatOrderNumber(orderNumber: number | null | undefined): string {
  if (!orderNumber) return "-";
  return `LC-${orderNumber.toString().padStart(4, "0")}`;
}

export function OrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const orderId = Number(id);
  const { token } = useAuth();
  const isGuest = !token;
  const navigationState = location.state as { order?: Pesanan; fromGuest?: boolean } | null;

  const [language, setLanguage] = useState(getLanguage());
  useEffect(() => {
    const handleLanguageChange = () => setLanguage(getLanguage());
    window.addEventListener("languagechange", handleLanguageChange);
    return () => window.removeEventListener("languagechange", handleLanguageChange);
  }, []);
  const isEnglish = language === "en";

  const [order, setOrder] = useState<Pesanan | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);

  const [afterPhotos, setAfterPhotos] = useState<File[]>([]);
  const [afterPhotoPreviews, setAfterPhotoPreviews] = useState<string[]>([]);
  const [ratingValue, setRatingValue] = useState(0);
  const [review, setReview] = useState("");
  const [tipAmount, setTipAmount] = useState<number>(0);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [isExpiredHidden, setIsExpiredHidden] = useState(false);
  const [showWhatsAppPopup, setShowWhatsAppPopup] = useState(false);
  const [showDetailSheet, setShowDetailSheet] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const autoPayTriggered = useRef(false);
  const touchStartYRef = useRef<number | null>(null);
  const summaryRef = useRef<HTMLDivElement | null>(null);

  const refresh = useCallback(async () => {
    if (!Number.isFinite(orderId)) return;
    if (!token) return;
    const resp = await api.get(`/orders/${orderId}`);
    setOrder(resp.data.data.order as Pesanan);
  }, [orderId, token]);

  const handlePayment = useCallback(async () => {
    if (!order || paymentLoading) return;
    setPaymentLoading(true);
    setActionError(null);
    try {
      const tokenResp = await api.post("/payments/snap-token", { order_id: order.id });
      const snapToken = tokenResp.data.data.snap_token;
      await initializeSnapPayment(snapToken, {
        onSuccess: (result) => { refresh(); setActionError(null); },
        onPending: (result) => { setActionError(null); },
        onError: (result) => { setActionError(t("orderDetail.paymentError") || "Payment failed."); },
        onClose: () => {}
      });
    } catch (err) {
      setActionError(getApiErrorMessage(err));
    } finally {
      setPaymentLoading(false);
    }
  }, [order, paymentLoading, refresh]);

  useEffect(() => {
    const shouldAutoPay = location.state?.autoPay;
    if (shouldAutoPay && order && order.pembayaran.method !== "CASH" && order.pembayaran.status === "PENDING" && !autoPayTriggered.current) {
      autoPayTriggered.current = true;
      window.history.replaceState({}, document.title);
      handlePayment();
    }
  }, [order, location.state, handlePayment]);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (afterPhotos.length > 0) {
      const readers = afterPhotos.map(photo => new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(photo);
      }));
      Promise.all(readers).then(previews => setAfterPhotoPreviews(previews));
    } else {
      setAfterPhotoPreviews([]);
    }
  }, [afterPhotos]);

  const addAfterPhotos = (newFiles: File[]) => {
    setAfterPhotos(prev => {
      const combined = [...prev, ...newFiles];
      const limited = combined.slice(0, 4);
      if (limited.length < combined.length) {
        setActionError(t("newOrder.maxPhotosExceeded") || "Maksimal 4 foto.");
      }
      return limited;
    });
    setActionError(null);
  };

  const removeAfterPhoto = (index: number) => {
    setAfterPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleAfterFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter(f => f.type.startsWith("image/"));
    if (files.length > 0) addAfterPhotos(files);
    e.target.value = "";
  };

  const handleAfterCameraClick = async () => {
    // Keep original camera logic if needed, or rely on native input
    // For this refactor, we'll use the native input triggered via onUploadClick in BeforeAfterPhotos
    // But we'll keep this function if we want to restore the custom camera UI later
    // For now, let's just trigger the native camera input
    cameraInputRef.current?.click();
  };

  const handleAfterGalleryClick = () => {
    galleryInputRef.current?.click();
  };

  const prevStatusRef = useRef<string | null>(null);

  const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    if (isRefreshing) return;
    if (window.scrollY > 0) {
      touchStartYRef.current = null;
      return;
    }
    touchStartYRef.current = e.touches[0]?.clientY ?? null;
    setPullDistance(0);
  };

  const handleTouchMove = (e: TouchEvent<HTMLDivElement>) => {
    if (touchStartYRef.current === null) return;
    const currentY = e.touches[0]?.clientY ?? 0;
    const delta = currentY - touchStartYRef.current;
    if (delta <= 0) {
      setPullDistance(0);
      return;
    }
    setPullDistance(Math.min(delta, 80));
  };

  const handleTouchEnd = async () => {
    if (pullDistance > 40 && !isRefreshing) {
      setIsRefreshing(true);
      try {
        await refresh();
      } finally {
        setTimeout(() => {
          setIsRefreshing(false);
          setPullDistance(0);
        }, 300);
      }
    } else {
      setPullDistance(0);
    }
    touchStartYRef.current = null;
  };

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoadError(null);
      if (!Number.isFinite(orderId)) {
        setLoadError("Invalid order id");
        setLoading(false);
        return;
      }
      if (!token && navigationState?.order) {
        setOrder(navigationState.order);
        setLoading(false);
        return;
      }
      if (!token && !navigationState?.order) {
        setLoadError(t("orderDetail.couldNotLoad"));
        setLoading(false);
        return;
      }
      try {
        const resp = await api.get(`/orders/${orderId}`);
        if (alive) {
          const newOrder = resp.data.data.order as Pesanan;
          setOrder(newOrder);
          if (prevStatusRef.current && prevStatusRef.current !== 'IN_PROGRESS' && newOrder.status === 'IN_PROGRESS') {
            playOrderNotificationSound().catch(console.warn);
          }
          prevStatusRef.current = newOrder.status;
        }
      } catch (err) {
        if (alive) setLoadError(getApiErrorMessage(err));
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [orderId, token, navigationState]);

  useEffect(() => {
    if (!order || order.status === 'COMPLETED' || !Number.isFinite(orderId)) return;
    if (!token) return;
    const interval = setInterval(async () => {
      try {
        const resp = await api.get(`/orders/${orderId}`);
        const updatedOrder = resp.data.data.order as Pesanan;
        if (order.status !== 'IN_PROGRESS' && updatedOrder.status === 'IN_PROGRESS') {
          playOrderNotificationSound().catch(console.warn);
        }
        setOrder(updatedOrder);
        prevStatusRef.current = updatedOrder.status;
      } catch (err) { console.error(err); }
    }, 3000);
    return () => clearInterval(interval);
  }, [order, orderId, token]);

  useEffect(() => {
    if (!order) return;
    if (order.pembayaran.method !== "TRANSFER" || order.pembayaran.status !== "PENDING" || order.status === "CANCELLED") return;
    const createdAtMs = new Date(order.created_at).getTime();
    if (!Number.isFinite(createdAtMs)) return;
    const expiryMs = createdAtMs + 60 * 60 * 1000;
    if (now >= expiryMs + 60 * 1000) setIsExpiredHidden(true);
  }, [order, now]);

  if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center text-sm text-slate-600">{t("orderDetail.loading")}</div>;
  if (loadError || isExpiredHidden) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 flex items-center justify-center">
        <div className="bg-white p-6 rounded-xl shadow-lg max-w-sm w-full text-center">
          <div className="text-lg font-semibold text-slate-900">{isExpiredHidden ? "Waktu pembayaran habis" : t("orderDetail.couldNotLoad")}</div>
          <div className="mt-2 text-sm text-slate-600">{isExpiredHidden ? "Pesanan dihapus otomatis." : loadError}</div>
          <Link className="mt-4 inline-block text-sm font-semibold text-emerald-600 hover:underline" to="/orders">
            {t("orderDetail.backToOrders")}
          </Link>
        </div>
      </div>
    );
  }
  if (!order) return null;

  const beforePhotoPaths = parsePhotoPaths(order.room_photo_before);
  const afterPhotoPaths = parsePhotoPaths(order.room_photo_after);
  const beforeUrls = beforePhotoPaths.map(p => toAbsoluteUrl(p)).filter((u): u is string => u !== null);
  const afterUrls = afterPhotoPaths.map(p => toAbsoluteUrl(p)).filter((u): u is string => u !== null);
  const packageNameDisplay = isEnglish && order.paket.name_en ? order.paket.name_en : order.paket.name;
  
  const scheduledMs = new Date(order.scheduled_date).getTime();
  const fiveMinutesMs = 5 * 60 * 1000;
  const isAfterScheduleGrace = Number.isFinite(scheduledMs) ? now >= scheduledMs + fiveMinutesMs : true;
  const isCashPayment = order.pembayaran.method === "CASH";
  const isNonCashPaid = order.pembayaran.method !== "CASH" && order.pembayaran.status === "PAID";
  const canDoAfterAndComplete = isAfterScheduleGrace && (isCashPayment || isNonCashPaid);
  
  const createdAtMs = new Date(order.created_at).getTime();
  const expiryMs = createdAtMs + 60 * 60 * 1000;
  const remainingMs = expiryMs - now;
  const rawRemainingSeconds = Math.floor(remainingMs / 1000);
  const remainingSeconds = Math.max(0, rawRemainingSeconds);
  const minutesLeft = Math.floor(remainingSeconds / 60);
  const secondsLeft = remainingSeconds % 60;
  const isCountdownExpired = rawRemainingSeconds <= 0;
  const showCountdown = order.pembayaran.method === "TRANSFER" && order.pembayaran.status === "PENDING" && order.status !== "CANCELLED" && Number.isFinite(createdAtMs);

  // Dynamic Header Text
  let headerTitle = t("orderDetail.successTitle");
  let headerSubtitle = t("orderDetail.successSubtitle");
  if (order.status === "COMPLETED") {
    headerTitle = t("orderDetail.completedTitle");
    headerSubtitle = t("orderDetail.completedSubtitle");
  } else if (order.status === "CANCELLED") {
    headerTitle = t("orderDetail.cancelledTitle");
    headerSubtitle = t("orderDetail.cancelledSubtitle");
  } else if (order.status === "IN_PROGRESS") {
    headerTitle = t("orderDetail.inProgressTitle");
    headerSubtitle = t("orderDetail.inProgressSubtitle");
  }

  const handleWhatsAppClick = () => {
    const waNumber = "6281917120833";
    const orderLabel = formatOrderNumber(order.order_number);
    const customerName = order.user.full_name;

    const message =
      language === "en"
        ? [
            `Hello LokaClean Admin, I just created order ${orderLabel} under the name ${customerName}.`,
            "",
            "I have additional requests (e.g. female staff, extra cleaning tools, special preferences).",
          ].join("\n")
        : [
            `Halo Admin LokaClean, saya baru membuat pesanan ${orderLabel} atas nama ${customerName}.`,
            "",
            "Saya memiliki permintaan tambahan (misalnya ART wanita, alat pembersih tambahan, atau kebutuhan khusus lainnya).",
          ].join("\n");

    const url = `https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  return (
    <div
      className="relative min-h-screen bg-slate-50 pb-32 font-sans"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <ThankYouAnimation
        isVisible={showThankYou}
        hasTip={tipAmount > 0}
        onClose={() => setShowThankYou(false)}
      />

      <div className="pointer-events-none fixed inset-x-0 top-0 z-40 flex justify-center">
        <div
          className={`mt-3 rounded-full bg-white/90 px-3 py-1 text-[11px] text-slate-500 shadow-sm transition-all duration-200 ${
            pullDistance > 0 || isRefreshing ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0"
          }`}
        >
          {isRefreshing ? "Menyegarkan..." : "Tarik ke bawah untuk refresh"}
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
      >
        {/* Hidden Inputs */}
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture
          onChange={handleAfterFileSelect}
          className="hidden"
          multiple
        />
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          onChange={handleAfterFileSelect}
          className="hidden"
          multiple
        />

        {/* Header */}
        <div className="mb-5 rounded-b-[32px] border-b border-slate-100 bg-gradient-to-b from-emerald-50 via-white to-white pb-6 shadow-sm">
          <div className="px-4 pt-4">
            <Link
              to="/orders"
              className="inline-flex items-center gap-2 text-slate-500 transition-colors hover:text-slate-800"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="text-sm font-medium">Kembali</span>
            </Link>
          </div>
          <OrderSuccessHeader
            orderNumber={formatOrderNumber(order.order_number)}
            title={headerTitle}
            subtitle={headerSubtitle}
          />

          {order.status === "PENDING" || order.status === "PROCESSING" ? (
            <div className="mt-3 space-y-3 px-4">
              <div className="flex items-center gap-3 rounded-2xl border border-emerald-100 bg-white/90 px-3.5 py-3 shadow-sm">
                <div className="flex items-start gap-2">
                  <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                    <MessageCircle className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
                      {t("orderDetail.extraRequestWhatsAppTitle")}
                    </div>
                    <p className="mt-1 text-[11px] leading-relaxed text-slate-600">
                      {t("orderDetail.extraRequestWhatsAppDesc")}
                    </p>
                  </div>
                </div>
              </div>
              <motion.button
                type="button"
                whileTap={{ scale: 0.97 }}
                onClick={() => setShowWhatsAppPopup(true)}
                className="inline-flex h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-[#25D366] px-4 text-[15px] font-semibold text-white shadow-md shadow-emerald-300/40"
              >
                <WhatsAppIcon className="h-5 w-5" />
                {t("orderDetail.extraRequestWhatsAppCta")}
              </motion.button>
              <p className="text-center text-[11px] text-slate-500">
                {language === "en" ? "Fast response within a few minutes." : "Respon cepat dalam beberapa menit."}
              </p>
            </div>
          ) : null}
        </div>

        {/* Summary Card */}
        <div ref={summaryRef} className="-mt-8 relative z-10 mb-4">
          <OrderSummaryCard
            order={order}
            packageName={packageNameDisplay}
            orderNumber={formatOrderNumber(order.order_number)}
          />
        </div>

        {/* Status + Info */}
        <OrderTimeline status={order.status} />
        <div className="mx-4 mb-4 flex items-center justify-between gap-3">
          <p className="text-[11px] leading-snug text-slate-500">
            {language === "en"
              ? "You will receive a notification when your order is confirmed."
              : "Notifikasi akan dikirim saat pesanan dikonfirmasi."}
          </p>
          <button
            type="button"
            onClick={() => setShowDetailSheet(true)}
            className="text-[11px] font-semibold text-emerald-700 underline-offset-2 hover:underline"
          >
            {language === "en" ? "View Full Details" : "Lihat Detail Lengkap"}
          </button>
        </div>

      {/* Payment Section (Conditional) */}
      {(showCountdown || (order.pembayaran.method !== "CASH" && order.pembayaran.status === "PENDING")) && (
        <div className="mx-4 mt-6 p-5 bg-white rounded-xl shadow-sm border border-slate-100">
          <div className="text-sm font-semibold text-slate-800 mb-3">{t("orderDetail.scheduleAndPayment")}</div>
          
          {showCountdown && (
            <div className={`mb-4 rounded-xl px-4 py-3 flex items-center justify-between gap-2 ${isCountdownExpired ? "bg-rose-50 border border-rose-200" : "bg-amber-50 border border-amber-200"}`}>
              <div className="flex items-center gap-3">
                <Clock className={`w-5 h-5 ${isCountdownExpired ? "text-rose-600" : "text-amber-600"}`} />
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-slate-700">{isCountdownExpired ? "Waktu Habis" : "Sisa Waktu Bayar"}</span>
                  {!isCountdownExpired && <span className="text-xs text-slate-500">Selesaikan pembayaran segera</span>}
                </div>
              </div>
              {!isCountdownExpired && (
                <div className="text-xl font-bold text-slate-900 tabular-nums">
                  {minutesLeft.toString().padStart(2, "0")}:{secondsLeft.toString().padStart(2, "0")}
                </div>
              )}
            </div>
          )}

          <div className="space-y-2 text-sm text-slate-600">
             <div className="flex justify-between">
                <span>Total Tagihan</span>
                <span className="font-bold text-slate-900">Rp {order.pembayaran.amount.toLocaleString("id-ID")}</span>
             </div>
             <div className="flex justify-between">
                <span>Status</span>
                <span className="font-medium">{order.pembayaran.status}</span>
             </div>
          </div>

          {order.pembayaran.method !== "CASH" && order.pembayaran.status === "PENDING" && (
            <motion.button
              whileTap={{ scale: 0.98 }}
              disabled={paymentLoading}
              onClick={handlePayment}
              className="mt-4 w-full py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200 flex items-center justify-center gap-2"
            >
              {paymentLoading ? "Processing..." : <><CreditCard className="w-4 h-4" /> Bayar Sekarang</>}
            </motion.button>
          )}
        </div>
      )}

        {/* Photos & Actions */}
        <BeforeAfterPhotos
          beforePhotos={beforeUrls}
          afterPhotos={afterUrls}
          onUploadClick={() => galleryInputRef.current?.click()}
          canUpload={canDoAfterAndComplete && order.status === "IN_PROGRESS"}
          afterPhotoPreviews={afterPhotoPreviews}
        />

        {/* Upload Pending Action */}
        {afterPhotos.length > 0 && (
          <div className="mx-4 mt-2 mb-6">
            <motion.button
              whileTap={{ scale: 0.98 }}
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  const fd = new FormData();
                  afterPhotos.forEach(p => fd.append("room_photo_after", p));
                  await api.post(`/orders/${order.id}/after-photo`, fd);
                  await refresh();
                  setAfterPhotos([]);
                } catch (err) {
                  setActionError(getApiErrorMessage(err));
                } finally {
                  setBusy(false);
                }
              }}
              className="w-full rounded-xl bg-emerald-600 py-3 font-bold text-white shadow-lg shadow-emerald-200"
            >
              {busy ? "Mengupload..." : "Kirim Foto Bukti"}
            </motion.button>
            {actionError && <p className="mt-2 text-center text-xs text-rose-600">{actionError}</p>}
          </div>
        )}

        {/* Completion & Tip Section */}
        {order.status === "IN_PROGRESS" && canDoAfterAndComplete && (
          <div className="mx-4 mt-6 rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
            <h3 className="mb-4 font-bold text-slate-800">{t("orderDetail.completeOrder")}</h3>

            {/* Tip */}
            {!order.tip ? (
              <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  {t("orderDetail.giveTip")}
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={tipAmount}
                    onChange={e => setTipAmount(Number(e.target.value))}
                    className="flex-1 rounded-lg border-slate-300 focus:border-emerald-500 focus:ring-emerald-200"
                    placeholder="0"
                  />
                  <button
                    onClick={async () => {
                      setBusy(true);
                      try {
                        await api.post(`/orders/${order.id}/tip`, { amount: tipAmount || 0 });
                        await refresh();
                        setTipAmount(0);
                      } catch (err) {
                        setActionError(getApiErrorMessage(err));
                      } finally {
                        setBusy(false);
                      }
                    }}
                    disabled={busy || tipAmount < 0}
                    className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white"
                  >
                    Simpan
                  </button>
                </div>
              </div>
            ) : (
              <div className="mb-4 rounded-lg bg-emerald-50 p-3 text-sm font-medium text-emerald-700">
                Tip diberikan: Rp {order.tip.amount.toLocaleString("id-ID")}
              </div>
            )}

            {/* Complete Button */}
            {order.tip !== null && order.tip !== undefined && (
              <motion.button
                whileTap={{ scale: 0.98 }}
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  try {
                    await api.post(`/orders/${order.id}/verify-completion`);
                    await refresh();
                  } catch (err) {
                    setActionError(getApiErrorMessage(err));
                  } finally {
                    setBusy(false);
                  }
                }}
                className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 py-4 text-lg font-bold text-white shadow-lg shadow-emerald-200"
              >
                {busy ? "Memproses..." : "Selesaikan Pesanan"}
              </motion.button>
            )}
          </div>
        )}

        {/* Rating Section (Completed) */}
        {order.status === "COMPLETED" && (
          <div className="mx-4 mt-6 mb-8 rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
            <h3 className="mb-4 font-bold text-slate-800">{t("orderDetail.ratingAndTip")}</h3>
            {order.rating ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  <span className="font-bold text-slate-800">
                    Rating Anda: {order.rating.rating_value}
                  </span>
                </div>
                <StarRating value={order.rating.rating_value} readOnly size="md" />
                {order.rating.review && (
                  <p className="mt-2 text-sm italic text-slate-600">"{order.rating.review}"</p>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <StarRating value={ratingValue} onChange={setRatingValue} size="lg" />
                </div>
                <textarea
                  value={review}
                  onChange={e => setReview(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-3 focus:border-emerald-500 focus:ring-emerald-200"
                  placeholder="Tulis ulasan Anda..."
                  rows={3}
                />
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  disabled={busy || ratingValue === 0}
                  onClick={async () => {
                    if (ratingValue === 0) return;
                    setBusy(true);
                    try {
                      await api.post(`/orders/${order.id}/rating`, {
                        rating_value: ratingValue,
                        review: review.trim() || undefined
                      });
                      setRatingSubmitted(true);
                      await refresh();
                      setTimeout(() => setShowThankYou(true), 500);
                    } catch (err) {
                      setActionError(getApiErrorMessage(err));
                    } finally {
                      setBusy(false);
                    }
                  }}
                  className="w-full rounded-xl bg-slate-800 py-3 font-bold text-white shadow-lg"
                >
                  {busy ? "Mengirim..." : "Kirim Ulasan"}
                </motion.button>
              </div>
            )}
          </div>
        )}
      </motion.div>

      <StickyActionBar
        onChat={() => window.open("https://wa.me/6281917120833", "_blank")}
        onCall={() => (window.location.href = "tel:+6287865463388")}
        onReorder={() => navigate("/new-order")}
      />

      <AnimatePresence>
        {showDetailSheet && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowDetailSheet(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 8 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 8 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="w-full max-w-md overflow-hidden rounded-3xl border border-emerald-50 bg-gradient-to-b from-emerald-50/80 via-white to-white shadow-[0_18px_45px_rgba(15,23,42,0.28)] backdrop-blur-sm"
              onClick={e => e.stopPropagation()}
            >
              <div className="border-b border-emerald-50 bg-emerald-50/60 px-5 pb-3 pt-4">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-2xl bg-white/80 text-emerald-500 shadow-sm shadow-emerald-100">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-600">
                        {language === "en" ? "Order Details" : "Detail Pesanan"}
                      </div>
                      <h3 className="mt-0.5 text-[15px] font-semibold text-slate-900">
                        {packageNameDisplay}
                      </h3>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="rounded-full bg-white/90 px-3 py-1 text-[11px] font-medium text-slate-600 shadow-sm shadow-emerald-50">
                      {formatOrderNumber(order.order_number)}
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowDetailSheet(false)}
                      aria-label={language === "en" ? "Close" : "Tutup"}
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-emerald-100 bg-white/90 text-emerald-600 shadow-sm shadow-emerald-100 transition-transform transition-colors hover:bg-emerald-50 hover:text-emerald-700 active:scale-95"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="max-h-[60vh] overflow-y-auto px-5 pb-5 pt-3 text-sm text-slate-700">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3 rounded-2xl bg-slate-50/80 px-3 py-2.5">
                    <div className="flex flex-col">
                      <span className="text-[11px] font-medium text-slate-500">
                        {t("orderDetail.scheduleTime")}
                      </span>
                      <span className="mt-0.5 text-[13px] font-semibold text-slate-900">
                        {formatDateTimeWITA(order.scheduled_date)}
                      </span>
                    </div>
                    <span className="self-center rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                      {language === "en" ? "Scheduled" : "Terjadwal"}
                    </span>
                  </div>

                  <div className="rounded-2xl border border-slate-100 bg-white/70 px-3 py-2.5">
                    <div className="text-[11px] font-medium text-slate-500">
                      {t("orderDetail.location")}
                    </div>
                    <div className="mt-1 text-[13px] leading-relaxed text-slate-800">
                      {order.address}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 rounded-2xl bg-slate-50/80 px-3 py-2.5">
                    <div>
                      <div className="text-[11px] font-medium text-slate-500">
                        {t("orderDetail.paymentMethod")}
                      </div>
                      <div className="mt-0.5 text-[13px] font-semibold text-slate-900">
                        {order.pembayaran.method === "CASH" ? "Cash" : "Transfer"}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[11px] font-medium text-slate-500">Total</div>
                      <div className="mt-0.5 text-[15px] font-bold text-emerald-600">
                        Rp {order.pembayaran.amount.toLocaleString("id-ID")}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showWhatsAppPopup && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 8 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 8 }}
              transition={{ duration: 0.18 }}
              className="w-full max-w-sm rounded-2xl border border-slate-100 bg-white p-5 shadow-xl"
            >
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#25D366]/10 text-[#25D366]">
                  <WhatsAppIcon className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">
                    {t("orderDetail.extraRequestWhatsAppTitle")}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    ID: {formatOrderNumber(order.order_number)}
                  </div>
                </div>
              </div>
              <p className="text-[13px] leading-relaxed text-slate-700">
                {t("orderDetail.extraRequestWhatsAppDesc")}
              </p>
              <div className="mt-4 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowWhatsAppPopup(false);
                    handleWhatsAppClick();
                  }}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-2.5 text-[13px] font-semibold text-white shadow-md shadow-emerald-500/30"
                >
                  <WhatsAppIcon className="h-4 w-4" />
                  {t("orderDetail.extraRequestWhatsAppCta")}
                </button>
                <button
                  type="button"
                  onClick={() => setShowWhatsAppPopup(false)}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-[12px] font-medium text-slate-600"
                >
                  {language === "en" ? "Maybe later" : "Nanti saja"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
