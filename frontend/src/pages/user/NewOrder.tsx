/**
 * USER create order page.
 * Redesigned: Tropical Clean Lombok Theme
 * Steps: [ Paket ] -> [ Jadwal ] -> [ Lokasi ]
 */

import { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MapPin, Camera, Calendar, CheckCircle2, 
  AlertCircle, ChevronRight, ChevronLeft, 
  Banknote, Info, Sparkles, Palmtree,
  Clock, ArrowRight, X
} from "lucide-react";

import { MapPicker, type LatLng } from "../../components/MapPicker";
import { api } from "../../lib/api";
import { getApiErrorMessage } from "../../lib/apiError";
import { toDatetimeLocalValueWITA } from "../../utils/date";
import { t, getLanguage, useCurrentLanguage } from "../../lib/i18n";
import { getPackageImage, getPackageImageAlt } from "../../utils/packageImage";
import { playOrderNotificationSound } from "../../utils/sound";
import type { PaketCleaning, PaymentMethod, User } from "../../types/api";

// --- Types ---
type Step = 1 | 2 | 3;

// --- Helper: Generate Dates for Calendar ---
const generateNextDays = (days = 14) => {
  const dates = [];
  const today = new Date();
  for (let i = 0; i < days; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    dates.push(d);
  }
  return dates;
};

// --- Helper: Time Slots ---
const TIME_SLOTS = [
  "09:00", "10:00", "11:00", "12:00", 
  "13:00", "14:00", "15:00", "16:00", "17:00"
];

export function NewOrderPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const language = useCurrentLanguage();
  const isEnglish = language === "en";

  // --- Global State ---
  const [packages, setPackages] = useState<PaketCleaning[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  // --- Form State ---
  const [step, setStep] = useState<Step>(1);
  const [paketId, setPaketId] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [location, setLocation] = useState<LatLng | null>(null);
  const [address, setAddress] = useState("");
  const [beforePhotos, setBeforePhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // --- Refs ---
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // --- Initial Data Fetch ---
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [pkgResp, userResp] = await Promise.all([
          api.get("/packages"),
          api.get("/users/me").catch(() => ({ data: { data: { user: null } } }))
        ]);
        
        if (alive) {
          setPackages(pkgResp.data.data.items);
          const userData = userResp.data.data.user;
          setUser(userData);
          
          // Pre-select package if in URL
          const presetId = params.get("paket_id");
          if (presetId) setPaketId(Number(presetId));

          // Pre-fill location if available
          if (userData?.default_latitude && userData?.default_longitude) {
            setLocation({ 
              lat: userData.default_latitude, 
              lng: userData.default_longitude 
            });
          }
          
          // Pre-fill address if available (Fix: Prevent validation error)
          if (userData?.address) {
            setAddress(userData.address);
          }
        }
      } catch (err) {
        if (alive) setError(getApiErrorMessage(err));
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [params]);

  // --- Photo Previews ---
  useEffect(() => {
    if (beforePhotos.length > 0) {
      const urls = beforePhotos.map(file => URL.createObjectURL(file));
      setPhotoPreviews(urls);
      return () => urls.forEach(url => URL.revokeObjectURL(url));
    } else {
      setPhotoPreviews([]);
    }
  }, [beforePhotos]);

  // --- Handlers ---

  const handleNext = () => {
    if (step === 1 && !paketId) return; // Validate Step 1
    if (step === 2 && (!selectedDate || !selectedTime)) return; // Validate Step 2
    if (step < 3) setStep((s) => (s + 1) as Step);
  };

  const handleBack = () => {
    if (step > 1) setStep((s) => (s - 1) as Step);
    else navigate(-1);
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      const newFiles = Array.from(e.target.files).slice(0, 4 - beforePhotos.length);
      setBeforePhotos(prev => [...prev, ...newFiles]);
    }
  };

  const handleSubmit = async () => {
    if (!paketId || !location || !address || !selectedDate || !selectedTime) {
      setError(t("newOrder.validationError"));
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      // Construct Scheduled Date (YYYY-MM-DDTHH:mm)
      // Note: We need to combine selectedDate (Date object) and selectedTime (HH:mm string)
      // into a format backend expects.
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      const finalScheduledDate = `${year}-${month}-${day}T${selectedTime}`;

      const formData = new FormData();
      formData.append("paket_id", String(paketId));
      formData.append("scheduled_date", finalScheduledDate);
      formData.append("address", address);
      formData.append("location_latitude", String(location.lat));
      formData.append("location_longitude", String(location.lng));
      
      // Force Payment Method: CASH (Hide others for now)
      formData.append("payment_method", "CASH"); 

      beforePhotos.forEach((file) => {
        formData.append("room_photo_before", file);
      });

      const resp = await api.post("/orders", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      playOrderNotificationSound();
      const newOrderId = resp.data.data.order.id;
      navigate(`/orders/${newOrderId}`);
      
    } catch (err) {
      setError(getApiErrorMessage(err));
      setSubmitting(false);
    }
  };

  // --- Derived State ---
  const selectedPackage = packages.find(p => p.id === paketId);
  const calendarDates = useMemo(() => generateNextDays(), []);

  // --- Render Helpers ---

  const StepIndicator = () => (
    <div className="flex items-center justify-center space-x-2 mb-6 px-4">
      {[
        { id: 1, label: t("newOrder.summaryPackage") },
        { id: 2, label: t("newOrder.summarySchedule") },
        { id: 3, label: t("newOrder.summaryLocation") }
      ].map((s, idx) => {
        const isActive = step === s.id;
        const isDone = step > s.id;
        return (
          <div key={s.id} className="flex items-center">
            <div 
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-300
                ${isActive 
                  ? "bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-lg shadow-teal-500/30 scale-105" 
                  : isDone
                    ? "bg-teal-50 text-teal-600 border border-teal-100"
                    : "bg-white text-slate-400 border border-slate-200"
                }
              `}
            >
              <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] ${isActive ? "bg-white/20" : isDone ? "bg-teal-100" : "bg-slate-100"}`}>
                {isDone ? <CheckCircle2 className="w-2.5 h-2.5" /> : s.id}
              </span>
              <span>{s.label}</span>
            </div>
            {idx < 2 && (
              <div className={`w-4 h-0.5 mx-1 rounded-full ${isDone ? "bg-teal-200" : "bg-slate-100"}`} />
            )}
          </div>
        );
      })}
    </div>
  );

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="animate-spin w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full" />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 pb-8 font-sans text-slate-800">
      
      {/* HEADER */}
      <div className="bg-white/80 backdrop-blur-sm sticky top-0 z-40 border-b border-slate-100 px-4 py-3 flex items-center justify-between lg:hidden">
        <button onClick={handleBack} className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-600">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="text-sm font-bold text-slate-800">{t("newOrder.title")}</h1>
        <div className="w-9" /> {/* Spacer */}
      </div>

      <div className="pt-6 w-full max-w-5xl mx-auto px-4 lg:px-8">
        <StepIndicator />

        <div className="px-0">
          <AnimatePresence mode="wait">
            
            {/* STEP 1: PILIH PAKET */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div className="text-center mb-6">
                  <h2 className="text-lg font-bold text-slate-800">{t("newOrder.step1Title")}</h2>
                  <p className="text-xs text-slate-500">{t("newOrder.step1Desc")}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {packages.map((pkg) => {
                    const isSelected = paketId === pkg.id;
                    const name = isEnglish && pkg.name_en ? pkg.name_en : pkg.name;
                    const desc = isEnglish && pkg.description_en ? pkg.description_en : pkg.description;

                    return (
                      <div
                        key={pkg.id}
                        onClick={() => setPaketId(pkg.id)}
                        className={`
                          relative flex items-center gap-4 p-3 rounded-2xl border-2 transition-all duration-200 cursor-pointer overflow-hidden
                          ${isSelected 
                            ? "border-teal-500 bg-teal-50 shadow-md shadow-teal-500/10" 
                            : "border-transparent bg-white shadow-sm hover:border-teal-100"
                          }
                        `}
                      >
                        {/* Thumbnail */}
                        <div className="w-20 h-20 flex-shrink-0 rounded-xl bg-slate-100 overflow-hidden">
                          <img 
                             src={getPackageImage(pkg.name, pkg.image)}
                             alt={getPackageImageAlt(pkg.name)}
                             className="w-full h-full object-cover"
                             loading="lazy"
                          />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-bold text-slate-800 mb-1">{name}</h3>
                          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-2">{desc}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-bold text-teal-600">
                              Rp {pkg.price.toLocaleString("id-ID")}
                            </span>
                            {isSelected && (
                              <div className="w-5 h-5 rounded-full bg-teal-500 flex items-center justify-center text-white">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Helper Texts */}
                <div className="mt-8 grid grid-cols-2 gap-3">
                  <div className="bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-2 shadow-sm">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span className="text-[10px] font-medium text-slate-600">{t("newOrder.hygienicTools")}</span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-2 shadow-sm">
                    <Palmtree className="w-4 h-4 text-emerald-500" />
                    <span className="text-[10px] font-medium text-slate-600">{t("newOrder.localStaff")}</span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 2: JADWAL */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <h2 className="text-lg font-bold text-slate-800">{t("newOrder.step2Title")}</h2>
                  <p className="text-xs text-slate-500">{t("newOrder.step2Desc")}</p>
                </div>

                {/* Date Picker (Horizontal Scroll) */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 px-1">
                    <Calendar className="w-4 h-4 text-teal-500" />
                    <span className="text-sm font-bold text-slate-700">{t("newOrder.selectDate")}</span>
                  </div>
                  <div className="flex gap-3 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide snap-x">
                    {calendarDates.map((date) => {
                      const isSelected = selectedDate.toDateString() === date.toDateString();
                      const dayName = date.toLocaleDateString(language === "en" ? "en-US" : "id-ID", { weekday: "short" });
                      const dayNum = date.getDate();
                      
                      return (
                        <button
                          key={date.toISOString()}
                          onClick={() => setSelectedDate(date)}
                          className={`
                            flex-shrink-0 w-16 h-20 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all duration-200 snap-center
                            ${isSelected 
                              ? "bg-gradient-to-br from-teal-500 to-emerald-500 text-white shadow-lg shadow-teal-500/30 scale-105" 
                              : "bg-white text-slate-600 border border-slate-200 hover:border-teal-200"
                            }
                          `}
                        >
                          <span className={`text-xs font-medium ${isSelected ? "text-teal-100" : "text-slate-400"}`}>
                            {dayName}
                          </span>
                          <span className="text-xl font-bold">
                            {dayNum}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Time Picker (Grid) */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 px-1">
                    <Clock className="w-4 h-4 text-teal-500" />
                    <span className="text-sm font-bold text-slate-700">{t("newOrder.selectTime")}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {TIME_SLOTS.map((time) => {
                      const isSelected = selectedTime === time;
                      return (
                        <button
                          key={time}
                          onClick={() => setSelectedTime(time)}
                          className={`
                            py-3 rounded-xl text-sm font-bold transition-all duration-200 border
                            ${isSelected
                              ? "bg-teal-50 border-teal-500 text-teal-700 shadow-sm"
                              : "bg-white border-slate-200 text-slate-600 hover:border-teal-200"
                            }
                          `}
                        >
                          {time}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-700 leading-relaxed">
                    {t("newOrder.scheduleNote")}
                  </p>
                </div>
              </motion.div>
            )}

            {/* STEP 3: LOKASI & KONFIRMASI */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <h2 className="text-lg font-bold text-slate-800">{t("newOrder.step3Title")}</h2>
                  <p className="text-xs text-slate-500">{t("newOrder.step3Desc")}</p>
                </div>

                {/* Map Picker */}
                <div className="space-y-3">
                   <div className="flex items-center gap-2 px-1">
                    <MapPin className="w-4 h-4 text-teal-500" />
                    <span className="text-sm font-bold text-slate-700">{t("newOrder.locationPoint")}</span>
                  </div>

                  <div className="bg-blue-50 px-3 py-2.5 rounded-xl border border-blue-100 flex gap-2">
                    <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-700 leading-snug">
                      <span className="font-semibold">{t("newOrder.infoLabel")}</span> {t("newOrder.locationInfo")}
                    </p>
                  </div>

                  <div className="rounded-2xl overflow-hidden border-2 border-white shadow-sm ring-1 ring-slate-200">
                    <MapPicker 
                      value={location} 
                      onChange={setLocation}
                      onAddressChange={(addr) => setAddress(addr || "")}
                      mapHeight="h-[300px]"
                      hideSearch={true}
                    />
                  </div>
                  <textarea
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder={t("newOrder.addressPlaceholderDetail")}
                    className="w-full p-4 rounded-xl bg-white border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all placeholder:text-slate-400"
                    rows={3}
                  />
                </div>

                {/* Photo Upload */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 px-1">
                    <Camera className="w-4 h-4 text-teal-500" />
                    <span className="text-sm font-bold text-slate-700">{t("newOrder.roomPhoto")}</span>
                  </div>
                  
                  <div className="grid grid-cols-4 gap-2">
                    {photoPreviews.map((src, idx) => (
                      <div key={idx} className="aspect-square rounded-lg overflow-hidden bg-slate-100 border border-slate-200 relative group">
                        <img src={src} alt="Preview" className="w-full h-full object-cover" />
                        <button
                          onClick={() => setBeforePhotos(prev => prev.filter((_, i) => i !== idx))}
                          className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <ChevronLeft className="w-3 h-3 rotate-45" /> {/* Close Icon */}
                        </button>
                      </div>
                    ))}
                    
                    {beforePhotos.length < 4 && (
                      <button 
                        onClick={() => cameraInputRef.current?.click()}
                        className="aspect-square rounded-lg border-2 border-dashed border-slate-300 flex flex-col items-center justify-center gap-1 text-slate-400 hover:border-teal-400 hover:text-teal-500 hover:bg-teal-50 transition-all"
                      >
                        <Camera className="w-5 h-5" />
                        <span className="text-[9px] font-bold">{t("newOrder.photoBtn")}</span>
                      </button>
                    )}
                  </div>
                  
                  <input
                    type="file"
                    ref={cameraInputRef}
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoSelect}
                    multiple
                  />
                </div>

                {/* Payment Method - HIDDEN TRANSFER/QRIS */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 px-1">
                    <Banknote className="w-4 h-4 text-teal-500" />
                    <span className="text-sm font-bold text-slate-700">{t("newOrder.paymentMethod")}</span>
                  </div>
                  
                  {/* Single Option: Cash */}
                  <div className="p-4 rounded-xl bg-white border border-teal-200 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center text-teal-600">
                        <Banknote className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-800">{t("newOrder.cashPayment")}</div>
                        <div className="text-[10px] text-amber-600 font-medium mt-0.5">
                          {t("newOrder.onlinePaymentMaintenance")}
                        </div>
                      </div>
                    </div>
                    <div className="w-5 h-5 rounded-full bg-teal-500 flex items-center justify-center text-white">
                      <CheckCircle2 className="w-3 h-3" />
                    </div>
                  </div>
                </div>

                {/* Total & Summary */}
                {selectedPackage && (
                  <div className="bg-slate-800 text-white p-5 rounded-2xl shadow-lg mt-8">
                    <div className="flex justify-between items-center mb-4 border-b border-slate-700 pb-4">
                      <span className="text-sm text-slate-300">{t("newOrder.totalPayment")}</span>
                      <span className="text-xl font-bold">Rp {selectedPackage.price.toLocaleString("id-ID")}</span>
                    </div>
                    <div className="space-y-2 text-xs text-slate-400">
                      <div className="flex justify-between">
                        <span>{t("newOrder.summaryPackage")}</span>
                        <span className="text-slate-200">{isEnglish && selectedPackage.name_en ? selectedPackage.name_en : selectedPackage.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>{t("newOrder.summarySchedule")}</span>
                        <span className="text-slate-200">
                          {selectedDate.toLocaleDateString(language === "en" ? "en-US" : "id-ID", { day: 'numeric', month: 'short' })}, {selectedTime}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* BOTTOM ACTION BAR */}
        <div className="mt-8 border-t border-slate-100 pt-6">
          <div className="max-w-md mx-auto flex gap-3 lg:max-w-sm lg:ml-auto">
            {step === 3 ? (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-bold shadow-lg shadow-teal-500/30 active:scale-[0.98] transition-transform flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {t("newOrder.creating")}
                  </>
                ) : (
                  <>
                    {t("newOrder.orderNowBtn")}
                    <CheckCircle2 className="w-5 h-5" />
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handleNext}
                disabled={step === 1 && !paketId || step === 2 && (!selectedDate || !selectedTime)}
                className="flex-1 py-3.5 rounded-xl bg-slate-800 text-white font-bold shadow-lg active:scale-[0.98] transition-transform flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t("newOrder.nextBtn")}
                <ArrowRight className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

      </div>
      
      {/* Error Toast */}
      {error && (
        <div className="fixed top-20 left-4 right-4 z-50 animate-in fade-in slide-in-from-top-5">
           <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl shadow-lg flex items-start gap-3">
             <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
             <div className="text-sm font-medium">{error}</div>
             <button onClick={() => setError(null)} className="ml-auto text-rose-400 hover:text-rose-600">
               <X className="w-4 h-4" />
             </button>
           </div>
        </div>
      )}
    </div>
  );
}
