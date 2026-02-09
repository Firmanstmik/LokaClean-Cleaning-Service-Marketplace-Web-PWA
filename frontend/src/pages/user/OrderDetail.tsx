/**
 * USER order detail page.
 * Refactored with LokaClean Tropical Premium Theme.
 */

import { useCallback, useEffect, useState, useRef, type ChangeEvent } from "react";
import { Link, useParams, useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, CreditCard, Clock, CheckCircle2 } from "lucide-react";
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

// New Modular Components
import { OrderSuccessHeader } from "../../components/order/OrderSuccessHeader";
import { OrderSummaryCard } from "../../components/order/OrderSummaryCard";
import { OrderTimeline } from "../../components/order/OrderTimeline";
import { BeforeAfterPhotos } from "../../components/order/BeforeAfterPhotos";
import { StickyActionBar } from "../../components/order/StickyActionBar";

function formatOrderNumber(orderNumber: number | null | undefined): string {
  if (!orderNumber) return "-";
  return `LC-${orderNumber.toString().padStart(4, "0")}`;
}

export function OrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const orderId = Number(id);

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

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const autoPayTriggered = useRef(false);

  const refresh = useCallback(async () => {
    if (!Number.isFinite(orderId)) return;
    const resp = await api.get(`/orders/${orderId}`);
    setOrder(resp.data.data.order as Pesanan);
  }, [orderId]);

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
  }, [orderId]);

  useEffect(() => {
    if (!order || order.status === 'COMPLETED' || !Number.isFinite(orderId)) return;
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
  }, [order, orderId]);

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

  return (
    <div className="min-h-screen bg-slate-50 pb-32 relative font-sans">
      <ThankYouAnimation 
        isVisible={showThankYou} 
        hasTip={tipAmount > 0} 
        onClose={() => setShowThankYou(false)} 
      />

      {/* Hidden Inputs */}
      <input ref={cameraInputRef} type="file" accept="image/*" capture onChange={handleAfterFileSelect} className="hidden" multiple />
      <input ref={galleryInputRef} type="file" accept="image/*" onChange={handleAfterFileSelect} className="hidden" multiple />

      {/* Header */}
      <div className="bg-white rounded-b-[40px] shadow-sm pb-4 mb-4">
        <div className="px-4 pt-4">
          <Link to="/orders" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Kembali</span>
          </Link>
        </div>
        <OrderSuccessHeader 
          orderNumber={formatOrderNumber(order.order_number)} 
          title={headerTitle}
          subtitle={headerSubtitle}
        />
      </div>

      {/* Summary Card */}
      <div className="-mt-8 relative z-10 mb-6">
        <OrderSummaryCard 
          order={order} 
          packageName={packageNameDisplay} 
          orderNumber={formatOrderNumber(order.order_number)} 
        />
      </div>

      {/* Timeline */}
      <OrderTimeline status={order.status} />

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
              } catch (err) { setActionError(getApiErrorMessage(err)); } 
              finally { setBusy(false); }
            }}
            className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-200"
          >
            {busy ? "Mengupload..." : "Kirim Foto Bukti"}
          </motion.button>
          {actionError && <p className="text-xs text-rose-600 mt-2 text-center">{actionError}</p>}
        </div>
      )}

      {/* Completion & Tip Section */}
      {order.status === "IN_PROGRESS" && afterPhotoPaths.length > 0 && canDoAfterAndComplete && (
        <div className="mx-4 mt-6 p-5 bg-white rounded-xl shadow-sm border border-slate-100">
          <h3 className="font-bold text-slate-800 mb-4">{t("orderDetail.completeOrder")}</h3>
          
          {/* Tip */}
          {!order.tip ? (
             <div className="mb-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
               <label className="block text-sm font-medium text-slate-700 mb-2">{t("orderDetail.giveTip")}</label>
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
                      } catch(err) { setActionError(getApiErrorMessage(err)); }
                      finally { setBusy(false); }
                   }}
                   disabled={busy || tipAmount < 0}
                   className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-semibold"
                 >
                   Simpan
                 </button>
               </div>
             </div>
          ) : (
            <div className="mb-4 p-3 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-medium">
              Tip diberikan: Rp {order.tip.amount.toLocaleString("id-ID")}
            </div>
          )}

          {/* Complete Button */}
          {(order.tip !== null && order.tip !== undefined) && (
            <motion.button
              whileTap={{ scale: 0.98 }}
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  await api.post(`/orders/${order.id}/verify-completion`);
                  await refresh();
                } catch (err) { setActionError(getApiErrorMessage(err)); }
                finally { setBusy(false); }
              }}
              className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-200 text-lg"
            >
              {busy ? "Memproses..." : "Selesaikan Pesanan"}
            </motion.button>
          )}
        </div>
      )}

      {/* Rating Section (Completed) */}
      {order.status === "COMPLETED" && (
        <div className="mx-4 mt-6 mb-8 p-5 bg-white rounded-xl shadow-sm border border-slate-100">
           <h3 className="font-bold text-slate-800 mb-4">{t("orderDetail.ratingAndTip")}</h3>
           {order.rating ? (
             <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
               <div className="flex items-center gap-2 mb-2">
                 <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                 <span className="font-bold text-slate-800">Rating Anda: {order.rating.rating_value}</span>
               </div>
               <StarRating value={order.rating.rating_value} readOnly size="md" />
               {order.rating.review && <p className="mt-2 text-slate-600 text-sm italic">"{order.rating.review}"</p>}
             </div>
           ) : (
             <div className="space-y-4">
               <div className="flex justify-center">
                 <StarRating value={ratingValue} onChange={setRatingValue} size="lg" />
               </div>
               <textarea 
                 value={review} 
                 onChange={e => setReview(e.target.value)}
                 className="w-full p-3 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-emerald-200"
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
                      await api.post(`/orders/${order.id}/rating`, { rating_value: ratingValue, review: review.trim() || undefined });
                      setRatingSubmitted(true);
                      await refresh();
                      setTimeout(() => setShowThankYou(true), 500);
                    } catch (err) { setActionError(getApiErrorMessage(err)); }
                    finally { setBusy(false); }
                 }}
                 className="w-full py-3 bg-slate-800 text-white rounded-xl font-bold shadow-lg"
               >
                 {busy ? "Mengirim..." : "Kirim Ulasan"}
               </motion.button>
             </div>
           )}
        </div>
      )}

      <StickyActionBar 
        onChat={() => window.open("https://wa.me/6287865463388", "_blank")}
        onCall={() => window.location.href = "tel:+6287865463388"}
        onReorder={() => navigate("/new-order")}
      />
    </div>
  );
}
