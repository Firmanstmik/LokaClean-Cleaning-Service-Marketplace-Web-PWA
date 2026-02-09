import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Star, Upload, X, Check, Camera, DollarSign, 
  Loader2, ChevronRight, AlertCircle, Heart
} from "lucide-react";
import { api } from "../../lib/api";
import { getApiErrorMessage } from "../../lib/apiError";
import { t } from "../../lib/i18n"; // Assuming i18n exists, or I'll fallback to strings
import type { Pesanan } from "../../types/api";

interface OrderRatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  order: Pesanan;
}

type Step = "upload" | "tip" | "rating" | "processing" | "success";

const TIP_OPTIONS = [0, 5000, 10000, 20000, 50000];

export function OrderRatingModal({ isOpen, onClose, onSuccess, order }: OrderRatingModalProps) {
  const [step, setStep] = useState<Step>("upload");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form States
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [tipAmount, setTipAmount] = useState<number>(0);
  const [rating, setRating] = useState<number>(5);
  const [review, setReview] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize step based on order state
  useEffect(() => {
    if (isOpen) {
      if (order.status === "COMPLETED") {
        setStep("rating");
      } else if (order.room_photo_after && order.tip) {
        // Ready to complete
        setStep("processing"); // Or directly verify? Better let user confirm.
        // Actually if everything is done but not completed, verify first.
        // Let's simpler: if IN_PROGRESS
        if (order.room_photo_after) {
            // If tip exists, go to verify/rating. But if tip missing, go to tip.
            if (order.tip) {
                 // Needs verification
                 verifyCompletion();
            } else {
                setStep("tip");
            }
        } else {
            setStep("upload");
        }
      } else {
        setStep("upload");
      }
    }
  }, [isOpen, order]);

  // Handlers
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setPhotos([...photos, ...newFiles]);
      
      const newPreviews = newFiles.map(file => URL.createObjectURL(file));
      setPhotoPreviews([...photoPreviews, ...newPreviews]);
    }
  };

  const removePhoto = (index: number) => {
    const newPhotos = [...photos];
    newPhotos.splice(index, 1);
    setPhotos(newPhotos);

    const newPreviews = [...photoPreviews];
    URL.revokeObjectURL(newPreviews[index]);
    newPreviews.splice(index, 1);
    setPhotoPreviews(newPreviews);
  };

  const submitUpload = async () => {
    if (photos.length === 0 && !order.room_photo_after) {
      setError("Mohon upload minimal 1 foto hasil pekerjaan.");
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      if (photos.length > 0) {
        const formData = new FormData();
        photos.forEach(file => {
            formData.append("room_photo_after", file);
        });
        
        await api.post(`/orders/${order.id}/after-photo`, formData, {
            headers: { "Content-Type": "multipart/form-data" }
        });
      }
      setStep("tip");
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const submitTip = async () => {
    setLoading(true);
    setError(null);
    try {
      // Always submit tip, even if 0 (required by backend flow)
      await api.post(`/orders/${order.id}/tip`, { amount: tipAmount });
      
      // After tip, verify completion
      await verifyCompletion();
    } catch (err) {
      setError(getApiErrorMessage(err));
      setLoading(false);
    }
  };

  const verifyCompletion = async () => {
    try {
        setLoading(true);
        await api.post(`/orders/${order.id}/verify-completion`);
        setStep("rating");
    } catch (err) {
        setError(getApiErrorMessage(err));
    } finally {
        setLoading(false);
    }
  };

  const submitRating = async () => {
    setLoading(true);
    setError(null);
    try {
      await api.post(`/orders/${order.id}/rating`, {
        rating_value: rating,
        review: review
      });
      setStep("success");
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);
    } catch (err) {
      setError(getApiErrorMessage(err));
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <h2 className="text-lg font-bold text-slate-800">
            {step === "upload" && "Upload Foto Hasil"}
            {step === "tip" && "Berikan Tip"}
            {step === "rating" && "Beri Penilaian"}
            {step === "success" && "Terima Kasih!"}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto">
          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-3 text-rose-600 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {step === "upload" && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto text-indigo-500">
                  <Camera className="w-8 h-8" />
                </div>
                <h3 className="font-bold text-slate-800">Foto Hasil Pekerjaan</h3>
                <p className="text-sm text-slate-500">
                  Silakan upload foto bukti pekerjaan telah selesai untuk verifikasi.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {photoPreviews.map((src, idx) => (
                  <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 group">
                    <img src={src} alt="Preview" className="w-full h-full object-cover" />
                    <button 
                      onClick={() => removePhoto(idx)}
                      className="absolute top-1 right-1 p-1 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {photoPreviews.length < 4 && (
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-square rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-2 text-slate-400 hover:border-indigo-400 hover:text-indigo-500 transition-colors bg-slate-50 hover:bg-indigo-50"
                  >
                    <Camera className="w-6 h-6" />
                    <span className="text-xs font-medium">Tambah</span>
                  </button>
                )}
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handlePhotoSelect} 
                multiple 
                accept="image/*" 
                className="hidden" 
              />

              <button
                onClick={submitUpload}
                disabled={loading || (photos.length === 0 && !order.room_photo_after)}
                className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <>
                    Lanjut <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          )}

          {step === "tip" && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-500">
                  <Heart className="w-8 h-8 fill-emerald-500" />
                </div>
                <h3 className="font-bold text-slate-800">Apresiasi Cleaner</h3>
                <p className="text-sm text-slate-500">
                  Berikan tip sukarela untuk mendukung cleaner kami (opsional).
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {TIP_OPTIONS.map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setTipAmount(amount)}
                    className={`
                      py-3 px-2 rounded-xl border text-sm font-bold transition-all
                      ${tipAmount === amount 
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700 ring-2 ring-emerald-200" 
                        : "border-slate-200 bg-white text-slate-600 hover:border-emerald-300 hover:bg-emerald-50/50"}
                    `}
                  >
                    {amount === 0 ? "Tidak Ada" : `Rp${amount/1000}k`}
                  </button>
                ))}
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400">
                  <span className="font-bold text-sm">Rp</span>
                </div>
                <input
                  type="number"
                  value={tipAmount || ""}
                  onChange={(e) => setTipAmount(Number(e.target.value))}
                  placeholder="Nominal lainnya..."
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
              </div>

              <button
                onClick={submitTip}
                disabled={loading}
                className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <>
                    {tipAmount > 0 ? "Kirim Tip & Selesai" : "Selesai Tanpa Tip"}
                    <Check className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          )}

          {step === "rating" && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto text-amber-500">
                  <Star className="w-8 h-8 fill-amber-500" />
                </div>
                <h3 className="font-bold text-slate-800">Bagaimana Pelayanannya?</h3>
                <p className="text-sm text-slate-500">
                  Beri rating dan ulasan untuk meningkatkan kualitas layanan kami.
                </p>
              </div>

              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className="p-1 transition-transform hover:scale-110 focus:outline-none"
                  >
                    <Star 
                      className={`w-10 h-10 ${star <= rating ? "fill-amber-400 text-amber-400" : "text-slate-300"}`} 
                    />
                  </button>
                ))}
              </div>

              <textarea
                value={review}
                onChange={(e) => setReview(e.target.value)}
                placeholder="Tulis ulasan Anda di sini..."
                className="w-full h-32 p-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all resize-none text-sm"
              />

              <button
                onClick={submitRating}
                disabled={loading}
                className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Kirim Penilaian"}
              </button>
            </div>
          )}

          {step === "success" && (
            <div className="text-center py-8 space-y-4">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto animate-bounce">
                <Check className="w-10 h-10 text-green-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Terima Kasih!</h3>
                <p className="text-slate-500">Penilaian Anda telah tersimpan.</p>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
