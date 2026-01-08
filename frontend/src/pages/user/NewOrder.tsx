/**
 * USER create order page.
 *
 * Flow:
 * - Choose package
 * - Pick location on map + address
 * - Upload BEFORE photo
 * - Choose payment method + schedule
 */

import { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { MapPicker, type LatLng } from "../../components/MapPicker";
import { api } from "../../lib/api";
import { getApiErrorMessage } from "../../lib/apiError";
import { loadMidtransSnap, openMidtransSnap } from "../../lib/midtrans";
import { toDatetimeLocalValueWITA } from "../../utils/date";
import { t, getLanguage } from "../../lib/i18n";
import { motion, AnimatePresence } from "framer-motion";
import { Package, Clock, MapPin, Camera, Calendar, CreditCard, AlertCircle, Lightbulb, Sparkles, CheckCircle2, X, Upload, Image as ImageIcon, Zap, Plus, ArrowRight } from "lucide-react";
import { getPackageIcon, getPackageGradient } from "../../utils/packageIcon";
import { playOrderNotificationSound } from "../../utils/sound";
import type { PaketCleaning, PaymentMethod, Pesanan, User } from "../../types/api";

export function NewOrderPage() {
  const navigate = useNavigate();
  const [language, setLanguage] = useState(getLanguage());
  useEffect(() => {
    const handleLanguageChange = () => setLanguage(getLanguage());
    window.addEventListener("languagechange", handleLanguageChange);
    return () => window.removeEventListener("languagechange", handleLanguageChange);
  }, []);
  const isEnglish = language === "en";
  const [params] = useSearchParams();

  const presetPaketId = params.get("paket_id");
  const presetIdNum = presetPaketId ? Number(presetPaketId) : null;

  const [packages, setPackages] = useState<PaketCleaning[]>([]);
  const [loading, setLoading] = useState(true);

  const [paketId, setPaketId] = useState<number | null>(presetIdNum && Number.isFinite(presetIdNum) ? presetIdNum : null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");
  const [scheduledDate, setScheduledDate] = useState<string>(() => toDatetimeLocalValueWITA(new Date()));
  const [address, setAddress] = useState("");
  const [location, setLocation] = useState<LatLng | null>(null);
  const [beforePhotos, setBeforePhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usingDefaultLocation, setUsingDefaultLocation] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [geocodingAddress, setGeocodingAddress] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const dragAreaRef = useRef<HTMLDivElement>(null);
  const addressGeocodeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const addressFromMapRef = useRef(false);
  const locationChangedFromMapRef = useRef(false);

  const selectedPackage = useMemo(() => packages.find((p) => p.id === paketId) ?? null, [packages, paketId]);

  // Get day name from scheduled date
  const scheduledDayName = useMemo(() => {
    if (!scheduledDate) return null;
    try {
      const date = new Date(scheduledDate);
      const locale = language === "id" ? "id-ID" : "en-US";
      return new Intl.DateTimeFormat(locale, {
        weekday: "long",
        timeZone: "Asia/Makassar"
      }).format(date);
    } catch {
      return null;
    }
  }, [scheduledDate, language]);

  // Calculate progress
  const progress = useMemo(() => {
    let completed = 0;
    if (paketId) completed++;
    if (paymentMethod && scheduledDate) completed++;
    if (location && address && beforePhotos.length > 0) completed++;
    return (completed / 3) * 100;
  }, [paketId, paymentMethod, scheduledDate, location, address, beforePhotos]);

  // Photo previews
  useEffect(() => {
    if (beforePhotos.length > 0) {
      const readers = beforePhotos.map(photo => {
        return new Promise<string>((resolve) => {
      const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(photo);
        });
      });
      Promise.all(readers).then(previews => setPhotoPreviews(previews));
    } else {
      setPhotoPreviews([]);
    }
  }, [beforePhotos]);

  // Drag and drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith("image/"));
    if (files.length > 0) {
      addPhotos(files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter(f => f.type.startsWith("image/"));
    if (files.length > 0) {
      addPhotos(files);
    }
    // Reset input value so same file can be selected again
    e.target.value = "";
  };

  const addPhotos = (newFiles: File[]) => {
    setBeforePhotos(prev => {
      const combined = [...prev, ...newFiles];
      // Limit to max 4 photos
      const limited = combined.slice(0, 4);
      if (limited.length < combined.length) {
        setError(t("newOrder.maxPhotosExceeded") || `Maksimal 4 foto. Hanya ${limited.length} foto pertama yang ditambahkan.`);
      }
      return limited;
    });
    setError(null);
  };

  const removePhoto = (index: number) => {
    setBeforePhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleCameraClick = async () => {
    try {
      // Use MediaDevices API for direct camera access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment', // Use back camera
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });

      // Create container for camera UI
      const container = document.createElement('div');
      container.id = 'camera-container';
      container.style.position = 'fixed';
      container.style.top = '0';
      container.style.left = '0';
      container.style.width = '100%';
      container.style.height = '100%';
      container.style.zIndex = '99999';
      container.style.backgroundColor = '#000';
      container.style.display = 'flex';
      container.style.flexDirection = 'column';
      container.style.justifyContent = 'flex-end';
      container.style.padding = '20px';
      container.style.gap = '20px';

      // Create video element to capture frame
      const video = document.createElement('video');
      video.id = 'camera-video';
      video.srcObject = stream;
      video.setAttribute('playsinline', 'true');
      video.setAttribute('autoplay', 'true');
      video.style.width = '100%';
      video.style.height = '100%';
      video.style.objectFit = 'cover';
      video.style.position = 'absolute';
      video.style.top = '0';
      video.style.left = '0';

      // Wait for video to be ready
      await new Promise((resolve) => {
        video.onloadedmetadata = () => {
          video.play();
          resolve(null);
        };
      });

      // Create capture button (large, visible, centered) - like camera app
      const captureBtn = document.createElement('button');
      captureBtn.style.width = '75px';
      captureBtn.style.height = '75px';
      captureBtn.style.borderRadius = '50%';
      captureBtn.style.border = '5px solid rgba(255, 255, 255, 0.8)';
      captureBtn.style.backgroundColor = 'white';
      captureBtn.style.cursor = 'pointer';
      captureBtn.style.margin = '0 auto 20px';
      captureBtn.style.boxShadow = '0 4px 20px rgba(0,0,0,0.6), 0 0 0 10px rgba(255,255,255,0.1)';
      captureBtn.style.position = 'relative';
      captureBtn.style.zIndex = '100000';
      captureBtn.style.display = 'block';
      captureBtn.setAttribute('aria-label', t("newOrder.capturePhoto"));
      
      // Add hover effect
      captureBtn.onmouseenter = () => {
        captureBtn.style.transform = 'scale(1.1)';
        captureBtn.style.transition = 'transform 0.2s';
      };
      captureBtn.onmouseleave = () => {
        captureBtn.style.transform = 'scale(1)';
      };

      // Create cancel button
      const cancelBtn = document.createElement('button');
      cancelBtn.textContent = t("common.cancel");
      cancelBtn.style.padding = '14px 28px';
      cancelBtn.style.borderRadius = '12px';
      cancelBtn.style.border = '2px solid white';
      cancelBtn.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
      cancelBtn.style.color = 'white';
      cancelBtn.style.fontSize = '16px';
      cancelBtn.style.fontWeight = 'bold';
      cancelBtn.style.cursor = 'pointer';
      cancelBtn.style.margin = '0 auto';
      cancelBtn.style.backdropFilter = 'blur(10px)';
      cancelBtn.style.position = 'relative';
      cancelBtn.style.zIndex = '100000';

      // Create canvas to capture image
      const canvas = document.createElement('canvas');

      const capturePhoto = () => {
        const ctx = canvas.getContext('2d');
        if (!ctx || video.readyState !== video.HAVE_ENOUGH_DATA) return;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);

        // Convert canvas to blob
        canvas.toBlob((blob) => {
          if (blob) {
            // Create File object from blob
            const file = new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
            addPhotos([file]);
          }
          // Cleanup
          cleanup();
        }, 'image/jpeg', 0.9);
      };

      const cleanup = () => {
        stream.getTracks().forEach(track => track.stop());
        const containerEl = document.getElementById('camera-container');
        const videoEl = document.getElementById('camera-video');
        if (containerEl) document.body.removeChild(containerEl);
        if (videoEl) document.body.removeChild(videoEl);
      };

      const cancelCamera = () => {
        cleanup();
      };

      captureBtn.onclick = capturePhoto;
      cancelBtn.onclick = cancelCamera;

      // Add video first
      container.appendChild(video);
      
      // Create button container for proper positioning
      const buttonContainer = document.createElement('div');
      buttonContainer.style.position = 'relative';
      buttonContainer.style.zIndex = '100000';
      buttonContainer.style.display = 'flex';
      buttonContainer.style.flexDirection = 'column';
      buttonContainer.style.alignItems = 'center';
      buttonContainer.style.width = '100%';
      buttonContainer.style.paddingBottom = '40px';
      
      buttonContainer.appendChild(captureBtn);
      buttonContainer.appendChild(cancelBtn);
      container.appendChild(buttonContainer);
      
      document.body.appendChild(container);
    } catch (err) {
      console.error('Error accessing camera:', err);
      // Fallback to file input if camera access fails
      setError(t("newOrder.cameraAccessError") || "Tidak dapat mengakses kamera. Silakan gunakan pilihan galeri.");
      cameraInputRef.current?.click();
    }
  };

  const handleGalleryClick = () => {
    galleryInputRef.current?.click();
  };

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const resp = await api.get("/packages");
        const next = resp.data.data.items as PaketCleaning[];
        if (alive) setPackages(next);
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

  // Prefill location from the user's saved default pin (set during profile completion).
  // Also fetch user data for payment (customer details).
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const resp = await api.get("/users/me");
        const me = resp.data.data.user as User;
        if (!alive) return;
        setUser(me);
        if (me.default_latitude != null && me.default_longitude != null) {
          const loc = { lat: me.default_latitude, lng: me.default_longitude };
          setLocation((prev) => prev ?? loc);
          setUsingDefaultLocation(true);
        }
      } catch {
        // Ignore: profile guard should already handle missing auth/profile.
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // Forward geocode when address is manually changed (debounced).
  // This updates the map location when user types an address.
  // Note: This does NOT update the user's default location in profile.
  useEffect(() => {
    // Clear any pending geocode request
    if (addressGeocodeTimeoutRef.current) {
      clearTimeout(addressGeocodeTimeoutRef.current);
    }

    // Skip if address is empty or was set from map
    if (!address || address.trim().length === 0 || addressFromMapRef.current) {
      addressFromMapRef.current = false;
      return;
    }

    // Skip if address is too short (less than 3 characters)
    if (address.trim().length < 3) {
      return;
    }

    // Debounce: wait 800ms after user stops typing
    addressGeocodeTimeoutRef.current = setTimeout(async () => {
      try {
        setGeocodingAddress(true);
        const resp = await api.get("/geo/forward", {
          params: { q: address.trim() }
        });
        const data = resp.data.data;
        if (data && typeof data.lat === "number" && typeof data.lng === "number") {
          // Update location on map, but don't change default location in profile
          setLocation({ lat: data.lat, lng: data.lng });
          setUsingDefaultLocation(false);
        }
      } catch (err) {
        // Silently fail - user can still manually pick location on map
        if (import.meta.env.DEV) {
          console.warn("[NewOrder] Forward geocoding failed:", err);
        }
      } finally {
        setGeocodingAddress(false);
      }
    }, 800);

    return () => {
      if (addressGeocodeTimeoutRef.current) {
        clearTimeout(addressGeocodeTimeoutRef.current);
      }
    };
  }, [address]);

  return (
    <div className="w-full bg-gradient-to-br from-tropical-50 via-ocean-50/50 to-sand-50/70">
      {/* Professional Card Header */}
      <div className="sticky top-[64px] sm:top-[80px] lg:top-[64px] z-30">
        <div className="max-w-7xl mx-auto px-2 sm:px-5 lg:px-6 pt-3 sm:pt-5 lg:pt-6">
          {/* Professional Card with Premium Shadow & Border */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-blue-500 via-blue-600 to-cyan-500 shadow-[0_10px_40px_rgba(0,174,239,0.25),0_4px_16px_rgba(0,174,239,0.15)] border border-blue-400/30"
          >
            {/* Animated gradient overlay */}
            <motion.div
              className="absolute inset-0 rounded-2xl sm:rounded-3xl pointer-events-none"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0.15) 100%)',
                backgroundSize: '200% 200%',
              }}
              animate={{
                backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "linear",
              }}
            />
            
            {/* Content Container */}
            <div className="relative z-10 px-3 sm:px-6 lg:px-8 py-3 sm:py-5 lg:py-6">
              <div className="flex items-center gap-2 sm:gap-4">
                <div className="flex items-center gap-2 sm:gap-4 lg:gap-5 flex-1 min-w-0">
                  {/* Premium Icon with Organic Shape - Mobile Optimized */}
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0, rotate: -180 }}
                    animate={{ scale: 1, opacity: 1, rotate: 0 }}
                    transition={{ 
                      type: "spring", 
                      stiffness: 200, 
                      damping: 20,
                      delay: 0.1 
                    }}
                    whileHover={{ 
                      scale: 1.1,
                      rotate: [0, -5, 5, -5, 0],
                      transition: { duration: 0.5 }
                    }}
                    className="relative flex-shrink-0"
                  >
                    {/* Outer glow rings - Blue theme */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-br from-blue-400 via-cyan-500 to-blue-600 opacity-0"
                      animate={{
                        opacity: [0, 0.4, 0.6, 0.4, 0],
                        scale: [1, 1.2, 1.4, 1.2, 1],
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                      style={{ 
                        filter: "blur(12px)",
                        borderRadius: "30% 70% 70% 30% / 30% 30% 70% 70%"
                      }}
                    />
                    <motion.div
                      className="absolute -inset-1 bg-gradient-to-br from-cyan-400 via-blue-500 to-cyan-600 opacity-0"
                      animate={{
                        opacity: [0, 0.3, 0.5, 0.3, 0],
                        scale: [1, 1.15, 1.3, 1.15, 1],
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: 0.5,
                      }}
                      style={{ 
                        filter: "blur(10px)",
                        borderRadius: "60% 40% 30% 70% / 60% 30% 70% 40%"
                      }}
                    />
                    
                    {/* Main icon container with organic blob shape - Blue theme */}
                    <motion.div
                      className="relative flex h-10 w-10 sm:h-14 sm:w-14 lg:h-16 lg:w-16 items-center justify-center bg-gradient-to-br from-blue-500 via-cyan-500 to-blue-600 shadow-[0_6px_24px_rgba(0,174,239,0.4),0_3px_12px_rgba(6,182,212,0.3),inset_0_1px_0_rgba(255,255,255,0.4)] flex-shrink-0"
                      animate={{
                        borderRadius: [
                          "30% 70% 70% 30% / 30% 30% 70% 70%",
                          "60% 40% 30% 70% / 60% 30% 70% 40%",
                          "30% 70% 70% 30% / 30% 30% 70% 70%"
                        ],
                      }}
                      transition={{
                        duration: 8,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    >
                      {/* Inner shine effect - organic */}
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-transparent"
                        animate={{
                          opacity: [0.3, 0.6, 0.3],
                          borderRadius: [
                            "60% 40% 30% 70% / 60% 30% 70% 40%",
                            "30% 70% 70% 30% / 30% 30% 70% 70%",
                            "60% 40% 30% 70% / 60% 30% 70% 40%"
                          ],
                        }}
                        transition={{
                          opacity: { duration: 2, repeat: Infinity },
                          borderRadius: { duration: 8, repeat: Infinity, ease: "easeInOut" },
                        }}
                      />
                    
                      {/* Icon with subtle animation */}
                      <motion.div
                        animate={{
                          y: [0, -2, 0],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                      >
                        <Plus className="h-4 w-4 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.3)]" />
                      </motion.div>
                      
                      {/* Floating sparkles - Mobile optimized */}
                      {[...Array(2)].map((_, i) => (
                        <motion.div
                          key={i}
                          className="absolute rounded-full bg-white/80"
                          style={{
                            width: "3px",
                            height: "3px",
                            top: `${25 + i * 50}%`,
                            left: `${20 + (i % 2) * 60}%`,
                          }}
                          animate={{
                            opacity: [0, 1, 0],
                            scale: [0, 1.5, 0],
                            y: [0, -12, -24],
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeOut",
                            delay: i * 0.4,
                          }}
                        />
                      ))}
                    </motion.div>
                  </motion.div>
                
                {/* Premium Typography Section - Mobile Optimized */}
                <div className="min-w-0 flex-1 overflow-hidden">
                  <motion.h1
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                    className="text-lg sm:text-2xl lg:text-3xl xl:text-4xl font-bold text-white leading-tight sm:leading-[1.2] tracking-tight sm:tracking-[-0.02em] font-display line-clamp-2 sm:line-clamp-none"
                    style={{
                      textShadow: "0 2px 4px rgba(0,0,0,0.2)",
                    }}
                  >
                    {t("newOrder.title")}
                  </motion.h1>
                  <motion.p
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                    className="text-xs sm:text-base lg:text-lg text-blue-50 mt-1 sm:mt-2 font-medium flex items-start sm:items-center gap-1 sm:gap-2 leading-snug sm:leading-relaxed"
                  >
                    <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 text-yellow-300 flex-shrink-0 mt-0.5 sm:mt-0" />
                    <span className="line-clamp-2 sm:line-clamp-none break-words">{t("newOrder.subtitle")}</span>
                  </motion.p>
                </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-5 lg:px-6 py-4 sm:py-6 lg:py-7">
        {/* Progress Bar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2 mb-6"
        >
          <div className="flex items-center justify-between text-sm sm:text-base font-semibold text-slate-700">
            <span>{t("newOrder.progress")}</span>
            <span className="text-lombok-ocean-600 font-bold">{Math.round(progress)}%</span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-slate-200 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-lombok-ocean-500 via-lombok-tropical-500 to-lombok-sunset-500 rounded-full shadow-lg"
            />
          </div>
        </motion.div>

        {/* Step Indicators */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between gap-1.5 sm:gap-4 mb-4 sm:mb-6"
        >
          {[
            { step: 1, label: t("newOrder.selectPackage"), icon: Package, completed: !!paketId },
            { step: 2, label: t("common.payment"), icon: Calendar, completed: !!paymentMethod && !!scheduledDate },
            { step: 3, label: t("common.location"), icon: MapPin, completed: !!location && !!address && beforePhotos.length > 0 }
          ].map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className={`flex-1 flex flex-col items-center gap-1.5 sm:gap-2 p-1.5 sm:p-3 rounded-lg sm:rounded-xl transition-all ${
                  item.completed
                    ? "bg-gradient-to-br from-emerald-50/90 to-teal-50/90 backdrop-blur-sm border-2 border-emerald-300/60"
                    : "bg-gradient-to-br from-tropical-50/70 via-ocean-50/50 to-sand-50/60 backdrop-blur-sm border-2 border-slate-200/60"
                }`}
              >
                {/* Step Badge */}
                <div className={`absolute -top-1.5 -right-1.5 sm:-top-3 sm:-right-3 px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[8px] sm:text-[10px] font-bold ${
                  item.completed
                    ? "bg-emerald-500 text-white shadow-lg"
                    : "bg-slate-400 text-white shadow-md"
                }`}>
                  STEP {item.step}
                </div>
                <div className={`relative flex h-7 w-7 sm:h-10 sm:w-10 items-center justify-center rounded-full ${
                  item.completed
                    ? "bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md"
                    : "bg-slate-200 text-slate-500"
                }`}>
                  {item.completed ? (
                    <CheckCircle2 className="h-4 w-4 sm:h-6 sm:w-6" />
                  ) : (
                    <Icon className="h-3.5 w-3.5 sm:h-5 sm:w-5" />
                  )}
                </div>
                <span className={`text-[9px] sm:text-xs font-semibold text-center leading-tight sm:leading-snug line-clamp-2 ${
                  item.completed ? "text-emerald-700" : "text-slate-600"
                }`}>
                  {item.label}
                </span>
              </motion.div>
            );
          })}
        </motion.div>

        {error ? (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border-2 border-rose-200 bg-gradient-to-br from-rose-50 to-pink-50 p-4 text-sm text-rose-700 shadow-[0_4px_12px_rgba(0,0,0,0.08),0_2px_4px_rgba(0,0,0,0.04)]"
        >
          <div className="flex items-center gap-3">
            <motion.div 
              animate={{ rotate: -10 }} 
              whileHover={{ rotate: 10, scale: 1.1 }}
              transition={{ duration: 0.3, type: "spring", stiffness: 300 }}
              className="group/icon"
            >
              <AlertCircle className="h-5 w-5 flex-shrink-0 text-rose-600 group-hover/icon:text-rose-700 transition-colors duration-300" />
            </motion.div>
            <span className="font-semibold">{error}</span>
          </div>
        </motion.div>
        ) : null}

        <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, type: "spring", stiffness: 100 }}
          className="card-lombok max-w-full overflow-hidden"
        >
          <div className="relative z-10">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mb-3 sm:mb-4 flex items-center gap-2"
            >
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex-shrink-0">
                  <Package className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-white" />
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap min-w-0">
                  <span className="text-[9px] sm:text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-1.5 py-0.5 sm:px-2 sm:py-0.5 rounded-md whitespace-nowrap">
                    STEP 1
                  </span>
                  <div className="text-[11px] sm:text-sm font-bold text-slate-900 leading-tight">{t("newOrder.selectPackage")}</div>
                </div>
              </div>
            </motion.div>
            <div className="mt-3">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="h-8 w-8 rounded-full border-4 border-lombok-ocean-200 border-t-lombok-ocean-500"
                />
              </div>
            ) : (
              <div className="grid gap-2 sm:gap-3">
                {packages.map((p) => {
                  const Icon = getPackageIcon(p.name);
                  const gradient = getPackageGradient(p.name);
                  const isSelected = paketId === p.id;
                  const displayName = isEnglish && p.name_en ? p.name_en : p.name;
                  const displayDesc = isEnglish && p.description_en ? p.description_en : p.description;
                  return (
                    <motion.button
                      key={p.id}
                      type="button"
                      whileHover={{ 
                        scale: 1.03, 
                        y: -4,
                        boxShadow: isSelected 
                          ? "0 12px 32px rgba(52, 152, 219, 0.25), 0 6px 16px rgba(26, 188, 156, 0.2)"
                          : "0 8px 24px rgba(0, 0, 0, 0.12), 0 4px 8px rgba(52, 152, 219, 0.15)"
                      }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                      onClick={() => setPaketId(p.id)}
                      className={`relative overflow-visible p-0 text-left transition-all duration-300 group/package`}
                  >
                    {/* Innovative card design with 3D effect */}
                    <div className="relative">
                      {/* Outer glow for selected */}
                      {isSelected && (
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 rounded-2xl opacity-30 blur-md animate-pulse" />
                      )}
                      
                      {/* Main card with unique shape */}
                      <div className={`relative overflow-hidden rounded-xl sm:rounded-2xl p-3 sm:p-5 transition-all duration-300 ${
                        isSelected
                          ? "bg-gradient-to-br from-blue-50 via-cyan-50/80 to-blue-50 border-2 border-blue-400/50 shadow-[0_12px_40px_rgba(37,99,235,0.25),0_6px_20px_rgba(6,182,212,0.2),inset_0_1px_0_rgba(255,255,255,0.9)] clip-path-package-selected"
                          : "bg-white/90 backdrop-blur-sm border-2 border-slate-200/60 shadow-[0_4px_16px_rgba(0,0,0,0.08),0_2px_8px_rgba(0,0,0,0.04)] group-hover/package:border-blue-300/60 group-hover/package:shadow-[0_8px_24px_rgba(37,99,235,0.15),0_4px_12px_rgba(6,182,212,0.1)] clip-path-package-default"
                      }`}
                      >
                        {/* Animated shimmer effect */}
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-0 group-hover/package:opacity-100"
                          animate={{
                            x: ["-100%", "200%"]
                          }}
                          transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            repeatDelay: 1,
                            ease: "linear"
                          }}
                        />
                        
                        {/* Decorative corner accent */}
                        {isSelected && (
                          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 rounded-bl-full" />
                        )}
                        
                        <div className="relative z-10 flex items-start gap-2.5 sm:gap-3">
                        <motion.div 
                          whileHover={{ scale: 1.15, rotate: [0, -10, 10, -10, 0] }}
                          transition={{ duration: 0.5, type: "spring", stiffness: 300 }}
                          className="relative flex-shrink-0"
                        >
                          {/* Outer glow ring */}
                          <div className={`absolute -inset-1 rounded-xl sm:rounded-2xl bg-gradient-to-br ${gradient} opacity-0 group-hover/package:opacity-30 blur-md transition-opacity duration-300`} />
                          
                          {/* Icon container with 3D effect */}
                          <div className={`relative flex h-10 w-10 sm:h-14 sm:w-14 items-center justify-center rounded-xl sm:rounded-2xl bg-gradient-to-br ${gradient} shadow-[0_8px_24px_rgba(0,0,0,0.2),inset_0_2px_4px_rgba(255,255,255,0.3)] group-hover/package:shadow-[0_12px_32px_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.4)] transition-all duration-300 transform-3d-package-icon`}
                          >
                            {/* Inner shine */}
                            <div className="absolute inset-0 rounded-xl sm:rounded-2xl bg-gradient-to-br from-white/30 via-transparent to-transparent" />
                            <Icon className="h-5 w-5 sm:h-7 sm:w-7 text-white relative z-10 drop-shadow-[0_4px_8px_rgba(0,0,0,0.4)]" />
                          </div>
                        </motion.div>
                        <div className="flex-1 min-w-0 overflow-hidden">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className={`text-sm sm:text-lg font-bold ${isSelected ? "text-blue-700" : "text-slate-800"} leading-tight sm:leading-snug line-clamp-2 sm:line-clamp-none`}>
                              {displayName}
                            </h3>
                            {isSelected && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="flex-shrink-0"
                              >
                                <CheckCircle2 className="h-4 w-4 sm:h-6 sm:w-6 text-blue-600" />
                              </motion.div>
                            )}
                          </div>
                          <p className="mt-1.5 text-xs sm:text-base text-slate-600 line-clamp-3 sm:line-clamp-2 leading-snug sm:leading-relaxed">{displayDesc}</p>
                          <div className="mt-2.5 sm:mt-3 flex flex-wrap items-center gap-1.5 sm:gap-3 text-[10px] sm:text-sm">
                            <span className="flex items-center gap-1 font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md sm:rounded-lg whitespace-nowrap">
                              <Clock className="h-3 w-3 sm:h-5 sm:w-5 flex-shrink-0" />
                              <span className="truncate">{p.estimated_duration} {t("newOrder.duration")}</span>
                            </span>
                            <span className="flex items-center gap-1 font-bold text-yellow-600 bg-yellow-50 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md sm:rounded-lg whitespace-nowrap">
                              <CreditCard className="h-3 w-3 sm:h-5 sm:w-5 flex-shrink-0" />
                              <span className="truncate">Rp {p.price.toLocaleString("id-ID")}</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    </div>
                  </motion.button>
                  );
                })}
              </div>
            )}
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1, type: "spring", stiffness: 100 }}
          className="card-lombok max-w-full overflow-hidden"
        >
          <div className="relative z-10">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mb-3 sm:mb-4 flex items-center gap-2"
            >
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-lg bg-gradient-to-br from-yellow-500 to-amber-500 flex-shrink-0">
                  <Calendar className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-white" />
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap min-w-0">
                  <span className="text-[9px] sm:text-xs font-bold uppercase tracking-wider text-yellow-600 bg-yellow-50 px-1.5 py-0.5 sm:px-2 sm:py-0.5 rounded-md whitespace-nowrap">
                    STEP 2
                  </span>
                  <div className="text-[11px] sm:text-sm font-bold text-slate-900 leading-tight">{t("newOrder.scheduleDate")} & {t("common.payment")}</div>
                </div>
              </div>
            </motion.div>
          
            {/* Schedule Date */}
            <div className="mt-3">
            <label className="block">
              <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-base font-semibold text-slate-700 mb-2 sm:mb-2.5">
                <Calendar className="h-3.5 w-3.5 sm:h-5 sm:w-5 text-blue-500 flex-shrink-0" />
                <span className="flex-1 min-w-0">{t("newOrder.scheduleDate")}</span>
                {scheduledDate && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="flex items-center gap-1 text-[10px] sm:text-xs font-bold text-emerald-600 flex-shrink-0"
                  >
                    <CheckCircle2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  </motion.span>
                )}
              </div>
              <input
                className="w-full rounded-lg sm:rounded-xl border-2 border-slate-200 bg-white px-3 py-2.5 sm:px-4 sm:py-3.5 text-sm sm:text-base transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-200 shadow-sm hover:shadow-md hover:border-slate-300"
                type="datetime-local"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                required
              />
              {scheduledDayName && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="mt-2 flex items-center gap-2 text-xs sm:text-sm text-slate-600"
                >
                  <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-500 flex-shrink-0" />
                  <span className="font-medium">
                    {t("newOrder.selectedDay") || "Selected day"}: <span className="font-bold text-blue-600">{scheduledDayName}</span>
                  </span>
                </motion.div>
              )}
            </label>
            </div>

            {/* Payment Method Cards */}
            <div className="mt-4">
            <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-base font-semibold text-slate-700 mb-2.5 sm:mb-3.5">
                <CreditCard className="h-3.5 w-3.5 sm:h-5 sm:w-5 text-yellow-600 flex-shrink-0" />
              <span className="flex-1 min-w-0">{t("newOrder.selectPaymentMethod")}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
              {(["QRIS", "DANA", "TRANSFER", "CASH"] as PaymentMethod[]).map((method) => {
                const isSelected = paymentMethod === method;
                const isDisabled = method !== "CASH"; // Only CASH is enabled
                return (
                  <motion.button
                    key={method}
                    type="button"
                    whileHover={!isDisabled ? { 
                      scale: 1.06, 
                      y: -3,
                      rotateY: 5,
                      boxShadow: isSelected
                        ? "0 12px 32px rgba(244, 208, 63, 0.3), 0 6px 16px rgba(255, 152, 0, 0.25)"
                        : "0 8px 24px rgba(0, 0, 0, 0.12), 0 4px 8px rgba(244, 208, 63, 0.2)"
                    } : {}}
                    whileTap={!isDisabled ? { scale: 0.95 } : {}}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    onClick={() => !isDisabled && setPaymentMethod(method)}
                    disabled={isDisabled}
                    className={`relative overflow-visible p-0 transition-all duration-300 group/payment ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    {/* Innovative payment card design */}
                    <div className="relative">
                      {/* Outer glow for selected */}
                      {isSelected && !isDisabled && (
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 rounded-xl opacity-30 blur-md animate-pulse" />
                      )}
                      
                      {/* Main card */}
                      <div className={`relative overflow-hidden rounded-xl p-3 sm:p-4 transition-all duration-300 ${
                        isDisabled
                          ? "bg-slate-50 border-2 border-slate-200 clip-path-payment-default"
                          : isSelected
                          ? "bg-gradient-to-br from-yellow-50 via-amber-50/80 to-yellow-50 border-2 border-yellow-400/50 shadow-[0_12px_40px_rgba(234,179,8,0.25),0_6px_20px_rgba(245,158,11,0.2),inset_0_1px_0_rgba(255,255,255,0.9)] clip-path-payment-selected"
                          : "bg-white/90 backdrop-blur-sm border-2 border-slate-200/60 shadow-[0_4px_16px_rgba(0,0,0,0.08)] group-hover/payment:border-yellow-300/60 group-hover/payment:shadow-[0_8px_24px_rgba(234,179,8,0.15),0_4px_12px_rgba(245,158,11,0.1)] clip-path-payment-default"
                      }`}
                      >
                        {/* Decorative corner for selected */}
                        {isSelected && !isDisabled && (
                          <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-yellow-400/20 to-amber-400/20 rounded-bl-full" />
                        )}
                        
                        {/* Glow effect on hover - only for enabled buttons */}
                        {!isDisabled && (
                          <motion.div
                            className={`absolute inset-0 rounded-xl opacity-0 group-hover/payment:opacity-100 transition-opacity duration-300 ${
                              isSelected 
                                ? "bg-gradient-to-br from-yellow-500/15 to-amber-500/15"
                                : "bg-gradient-to-br from-yellow-200/20 to-amber-200/20"
                            }`}
                            animate={isSelected ? {
                              opacity: [0.15, 0.25, 0.15]
                            } : {}}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                          />
                        )}
                        {isDisabled && (
                          <div className="absolute inset-0 flex items-center justify-center z-20 bg-white/80 backdrop-blur-sm rounded-xl">
                            <span className="text-[10px] sm:text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1.5 rounded-lg shadow-sm">
                              Tidak Tersedia
                            </span>
                          </div>
                        )}
                        {isSelected && !isDisabled && (
                          <motion.div
                            layoutId="paymentMethodSelection"
                            className="absolute inset-0 bg-gradient-to-br from-yellow-500/8 to-amber-500/8"
                            initial={false}
                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                          />
                        )}
                        <div className="relative z-10 flex flex-col items-center gap-2">
                      <div className={`relative flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl transition-all duration-300 ${
                        isDisabled
                          ? "bg-slate-200 text-slate-400"
                          : isSelected
                          ? "bg-gradient-to-br from-yellow-500 to-amber-500 text-white shadow-[0_8px_24px_rgba(234,179,8,0.4),inset_0_2px_4px_rgba(255,255,255,0.3)] transform-3d-payment-icon"
                          : "bg-slate-100 text-slate-600 group-hover/payment:bg-gradient-to-br group-hover/payment:from-yellow-100 group-hover/payment:to-amber-100"
                      }`}
                      >
                        {!isDisabled && isSelected && (
                          <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/30 via-transparent to-transparent" />
                        )}
                        <CreditCard className="h-5 w-5 sm:h-6 sm:w-6 relative z-10" />
                      </div>
                      <span className={`text-xs sm:text-sm font-bold ${
                        isDisabled
                          ? "text-slate-400"
                          : isSelected
                          ? "text-yellow-700"
                          : "text-slate-700"
                      }`}>
                        {method}
                      </span>
                      {isSelected && !isDisabled && (
                        <motion.div
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          className="absolute -top-1 -right-1 bg-blue-500 rounded-full p-0.5 shadow-lg"
                        >
                          <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                        </motion.div>
                      )}
                    </div>
                    </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
            </div>

            <div className="mt-4 rounded-xl bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-50 p-4 sm:p-5 text-sm sm:text-base text-slate-700 border border-blue-200/60 shadow-[0_2px_8px_rgba(37,99,235,0.1),0_1px_3px_rgba(6,182,212,0.08)] leading-relaxed">
            {paymentMethod === "CASH" ? (
              <div className="flex items-start gap-2.5">
                <svg className="h-5 w-5 mt-0.5 text-yellow-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span dangerouslySetInnerHTML={{ __html: t("newOrder.cashPaymentInfo") }} />
              </div>
            ) : (
              <div className="flex items-start gap-2.5">
                <svg className="h-5 w-5 mt-0.5 text-blue-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span dangerouslySetInnerHTML={{ __html: t("newOrder.nonCashPaymentInfo").replace("{method}", paymentMethod) }} />
              </div>
            )}
          </div>
          </div>
        </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-5 lg:px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2, type: "spring", stiffness: 100 }}
          className="card-lombok max-w-full overflow-hidden mb-8 sm:mb-12"
        >
          <div className="relative z-10">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mb-3 sm:mb-4 flex items-center gap-2"
            >
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 flex-shrink-0">
                  <MapPin className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-white" />
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap min-w-0">
                  <span className="text-[9px] sm:text-xs font-bold uppercase tracking-wider text-cyan-600 bg-cyan-50 px-1.5 py-0.5 sm:px-2 sm:py-0.5 rounded-md whitespace-nowrap">
                    STEP 3
                  </span>
                  <div className="text-[11px] sm:text-sm font-bold text-slate-900 leading-tight">{t("newOrder.locationAndPhoto")}</div>
                </div>
              </div>
            </motion.div>

          <div className="mt-4 grid gap-6 lg:grid-cols-2">
            <div className="relative">
              <MapPicker
                key={`mappicker-${location?.lat}-${location?.lng}`}
                value={location}
                onChange={(v) => {
                  setUsingDefaultLocation(false);
                  // Mark that location is being changed from map (not from address input)
                  locationChangedFromMapRef.current = true;
                  addressFromMapRef.current = true;
                  setLocation(v);
                }}
                onAddressChange={(addr) => {
                  // When location changes from map, always update address
                  if (!addr) return;
                  // If location was changed from map, always update address
                  if (locationChangedFromMapRef.current) {
                    setAddress(addr);
                    locationChangedFromMapRef.current = false; // Reset after update
                  } else if (addressFromMapRef.current) {
                    // If address came from map but location wasn't just changed, only update if empty
                    setAddress((prev) => (prev.trim().length > 0 ? prev : addr));
                  } else {
                    // If user is typing, only auto-fill if address is empty
                    setAddress((prev) => (prev.trim().length > 0 ? prev : addr));
                  }
                }}
              />
              {usingDefaultLocation ? (
                <div className="mt-2 text-sm text-slate-500 leading-relaxed">
                  {t("newOrder.usingDefaultLocationHint")}
                </div>
              ) : null}

              <label className="mt-4 block">
                <div className="flex items-center gap-2 text-sm sm:text-base font-semibold text-slate-700 mb-2.5">
                  <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-cyan-500" />
                  {t("common.address")}
                  {address && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="ml-auto flex items-center gap-1 text-xs font-bold text-emerald-600"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    </motion.span>
                  )}
                </div>
                <input
                  className="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3.5 text-sm sm:text-base transition-all focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 shadow-sm hover:shadow-md hover:border-slate-300"
                  value={address}
                  onChange={(e) => {
                    // Mark that address is being changed manually (not from map)
                    addressFromMapRef.current = false;
                    locationChangedFromMapRef.current = false; // Reset flag when user types
                    setAddress(e.target.value);
                  }}
                  required
                  placeholder={t("newOrder.addressPlaceholder") || "Hotel name, room number, street, etc."}
                />
                {geocodingAddress && (
                  <div className="mt-2 text-xs text-slate-500 flex items-center gap-1.5">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="h-3 w-3 border-2 border-cyan-500 border-t-transparent rounded-full"
                    />
                    <span>{t("newOrder.lookingUpLocation") || "Looking up location..."}</span>
                  </div>
                )}
              </label>
            </div>

            <div>
              <label className="block">
                <div className="flex items-center gap-2 text-sm sm:text-base font-semibold text-slate-700 mb-2.5">
                  <Camera className="h-4 w-4 sm:h-5 sm:w-5 text-cyan-500" />
                  {t("newOrder.uploadBeforePhoto")}
                  {beforePhotos.length > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="ml-auto flex items-center gap-1 text-xs font-bold text-emerald-600"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {beforePhotos.length} {t("newOrder.selected")}
                    </motion.span>
                  )}
                </div>

                {/* Drag & Drop Area */}
                <div
                  ref={dragAreaRef}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onClick={() => {
                    // On desktop, open file picker; on mobile, buttons handle it
                    if (window.innerWidth >= 640) {
                      fileInputRef.current?.click();
                    }
                  }}
                  className={`relative mt-1 cursor-pointer rounded-xl border-2 border-dashed transition-all ${
                    isDragging
                      ? "border-cyan-500 bg-cyan-50 scale-105 shadow-lg"
                      : beforePhotos.length > 0
                      ? "border-cyan-300 bg-cyan-50/80"
                      : "border-slate-300 bg-slate-50 hover:border-cyan-400 hover:bg-cyan-50/50"
                  }`}
                    >
                  {/* Hidden file inputs */}
                  <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <input
                    ref={galleryInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  {/* Legacy input for drag & drop and desktop compatibility */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    required
                    onChange={handleFileSelect}
                    className="hidden"
                  />

                  {photoPreviews.length > 0 ? (
                    <div className="p-2 sm:p-3">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2">
                        {photoPreviews.map((preview, index) => (
                          <div key={index} className="relative">
                      <img
                              src={preview}
                              alt={`Preview ${index + 1}`}
                              className="w-full h-20 sm:h-24 object-cover rounded-lg"
                      />
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => {
                          e.stopPropagation();
                                removePhoto(index);
                              }}
                              className="absolute top-1 right-1 flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-full bg-rose-500 text-white shadow-lg hover:bg-rose-600"
                            >
                              <X className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                            </motion.button>
                            <div className="absolute bottom-1 left-1 bg-black/60 text-white text-[10px] sm:text-xs px-1.5 py-0.5 rounded font-semibold">
                              {index + 1}/{photoPreviews.length}
                            </div>
                          </div>
                        ))}
                        {/* Placeholder slot untuk menambah foto jika belum 4 */}
                        {beforePhotos.length < 4 && (
                          <div 
                            className="relative border-2 border-dashed border-lombok-tropical-300 rounded-lg bg-lombok-tropical-50/50 hover:bg-lombok-tropical-100 cursor-pointer flex flex-col items-center justify-center h-20 sm:h-24"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (window.innerWidth >= 640) {
                                fileInputRef.current?.click();
                              } else {
                                handleGalleryClick();
                          }
                        }}
                          >
                            <ImageIcon className="h-5 w-5 sm:h-6 sm:w-6 text-cyan-500 mb-0.5" />
                            <span className="text-[10px] sm:text-xs text-cyan-600 font-semibold">Tambah</span>
                            <span className="text-[9px] sm:text-[10px] text-slate-500">({beforePhotos.length}/4)</span>
                          </div>
                        )}
                      </div>
                      {beforePhotos.length < 4 && (
                        <div className="mt-2 sm:mt-3 flex flex-col sm:flex-row gap-1.5 sm:gap-2">
                          <motion.button
                            type="button"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCameraClick();
                            }}
                            className="flex-1 flex items-center justify-center gap-1.5 sm:gap-2 rounded-lg sm:rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-white shadow-lg hover:shadow-xl transition-all hover:from-blue-600 hover:to-cyan-600"
                          >
                            <Camera className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            <span>{t("newOrder.takePhoto")}</span>
                          </motion.button>
                          <motion.button
                            type="button"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleGalleryClick();
                            }}
                            className="flex-1 flex items-center justify-center gap-1.5 sm:gap-2 rounded-lg sm:rounded-xl border-2 border-cyan-300 bg-white px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-cyan-600 hover:bg-cyan-50 hover:border-cyan-400 transition-all"
                      >
                            <ImageIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            <span className="hidden sm:inline">{t("newOrder.chooseFromGallery")}</span>
                            <span className="sm:hidden">Gallery</span>
                      </motion.button>
                        </div>
                      )}
                      {beforePhotos.length >= 4 && (
                        <div className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-center text-emerald-600 font-semibold">
                          {t("newOrder.maxPhotosReached") || "Maksimal 4 foto telah ditambahkan"}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-4 sm:py-6 px-3 sm:px-4">
                      <motion.div
                        animate={isDragging ? { scale: 1.1, rotate: 5 } : { scale: 1, rotate: 0 }}
                        whileHover={{ scale: 1.1 }}
                        transition={{ duration: 0.3, type: "spring", stiffness: 300 }}
                        className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-cyan-100 mb-3 sm:mb-4 relative overflow-hidden group/icon"
                      >
                        {/* Glow effect on hover */}
                        <motion.div
                          className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-400/30 to-cyan-400/30 opacity-0 group-hover/icon:opacity-100 blur-xl"
                          transition={{ duration: 0.3 }}
                        />
                        {isDragging ? (
                          <Upload className="h-6 w-6 sm:h-7 sm:w-7 text-cyan-600" />
                        ) : (
                          <ImageIcon className="h-6 w-6 sm:h-7 sm:w-7 text-cyan-600" />
                        )}
                      </motion.div>
                      
                      {/* Action buttons for mobile */}
                      <div className="w-full flex flex-col sm:flex-row gap-2 mb-2 sm:mb-3">
                        <motion.button
                          type="button"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (beforePhotos.length >= 4) {
                              setError(t("newOrder.maxPhotosReached") || "Maksimal 4 foto telah ditambahkan");
                              return;
                            }
                            handleCameraClick();
                          }}
                          disabled={beforePhotos.length >= 4}
                          className="flex-1 flex items-center justify-center gap-1.5 sm:gap-2 rounded-lg sm:rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 px-3 sm:px-4 py-2.5 sm:py-3.5 text-xs sm:text-sm font-bold text-white shadow-lg hover:shadow-xl transition-all hover:from-blue-600 hover:to-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Camera className="h-4 w-4 sm:h-5 sm:w-5" />
                          <span>{t("newOrder.takePhoto")}</span>
                        </motion.button>
                        <motion.button
                          type="button"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (beforePhotos.length >= 4) {
                              setError(t("newOrder.maxPhotosReached") || "Maksimal 4 foto telah ditambahkan");
                              return;
                            }
                            handleGalleryClick();
                          }}
                          disabled={beforePhotos.length >= 4}
                          className="flex-1 flex items-center justify-center gap-1.5 sm:gap-2 rounded-lg sm:rounded-xl border-2 border-cyan-300 bg-white px-3 sm:px-4 py-2.5 sm:py-3.5 text-xs sm:text-sm font-bold text-cyan-600 hover:bg-cyan-50 hover:border-cyan-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ImageIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                          <span className="hidden sm:inline">{t("newOrder.chooseFromGallery")}</span>
                          <span className="sm:hidden">Gallery</span>
                        </motion.button>
                      </div>
                      
                      <p className="text-xs sm:text-sm text-slate-500 text-center leading-relaxed">
                        {t("newOrder.photoFormats")} {beforePhotos.length > 0 && `(${beforePhotos.length}/4)`}
                      </p>
                    </div>
                  )}
                </div>
              </label>
            </div>
          </div>

          <div className="mt-3 sm:mt-4 rounded-xl sm:rounded-2xl bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-50 p-3 sm:p-4 text-xs sm:text-sm text-slate-700 border border-blue-200/60 shadow-[0_2px_8px_rgba(37,99,235,0.1),0_1px_3px_rgba(6,182,212,0.08)] leading-relaxed">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="flex items-center gap-1.5 sm:gap-2 font-bold text-slate-900 mb-2 sm:mb-3"
            >
              <motion.div
                animate={{ rotate: 15 }}
                whileHover={{ rotate: -15, scale: 1.2 }}
                transition={{ duration: 0.3, type: "spring", stiffness: 300 }}
                className="group/icon"
              >
                <Lightbulb className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500 group-hover/icon:text-yellow-600 transition-colors duration-300 drop-shadow-lg" />
              </motion.div>
              <span className="text-xs sm:text-sm">{t("newOrder.tipsForGoodPhoto")}</span>
            </motion.div>
            <ul className="space-y-1.5 sm:space-y-2 text-slate-600">
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5 sm:mt-1 font-bold text-base sm:text-lg">•</span>
                <span className="leading-relaxed text-xs sm:text-sm">{t("newOrder.tip1")}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5 sm:mt-1 font-bold text-base sm:text-lg">•</span>
                <span className="leading-relaxed text-xs sm:text-sm">{t("newOrder.tip2")}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5 sm:mt-1 font-bold text-base sm:text-lg">•</span>
                <span className="leading-relaxed text-xs sm:text-sm">{t("newOrder.tip3")}</span>
              </li>
            </ul>
          </div>

          {/* Order Summary Card */}
          {selectedPackage && location && address && beforePhotos.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 rounded-2xl bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-50 border-2 border-blue-200/80 p-5 sm:p-6 shadow-[0_4px_16px_rgba(37,99,235,0.15),0_2px_8px_rgba(6,182,212,0.12)]"
            >
              <div className="flex items-center gap-2 mb-4">
                <Zap className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">{t("newOrder.orderSummary")}</h3>
              </div>
              <div className="space-y-3 text-sm sm:text-base">
                <div className="flex items-center justify-between leading-relaxed bg-white/60 rounded-lg px-3 py-2">
                  <span className="text-slate-600 font-medium">{t("newOrder.selectPackage")}:</span>
                  <span className="font-bold text-slate-900">{selectedPackage.name}</span>
                </div>
                <div className="flex items-center justify-between leading-relaxed bg-white/60 rounded-lg px-3 py-2">
                  <span className="text-slate-600 font-medium">{t("common.total")}:</span>
                  <span className="font-bold text-yellow-600 text-lg sm:text-xl">
                    Rp {selectedPackage.price.toLocaleString("id-ID")}
                  </span>
                </div>
                <div className="flex items-center justify-between leading-relaxed bg-white/60 rounded-lg px-3 py-2">
                  <span className="text-slate-600 font-medium">{t("newOrder.selectPaymentMethod")}:</span>
                  <span className="font-bold text-slate-900">{paymentMethod}</span>
                </div>
              </div>
            </motion.div>
          )}

          <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            className="group relative mt-6 w-full overflow-hidden rounded-2xl sm:rounded-3xl px-4 sm:px-6 py-4 sm:py-5 text-sm sm:text-base lg:text-lg font-bold text-white transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 sm:gap-2.5 shadow-[0_8px_32px_rgba(37,99,235,0.3),0_4px_16px_rgba(6,182,212,0.2)] hover:shadow-[0_12px_48px_rgba(37,99,235,0.4),0_6px_24px_rgba(6,182,212,0.3)]"
            style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 50%, #3b82f6 100%)',
              backgroundSize: '200% 200%',
            }}
            disabled={submitting || processingPayment || !paketId || !location || !address || beforePhotos.length === 0}
            onClick={async () => {
                  setError(null);
                  if (!paketId) return setError(t("newOrder.pleaseSelectPackage"));
                  if (!location) return setError(t("newOrder.pleaseSelectLocation"));
                  if (beforePhotos.length === 0) return setError(t("newOrder.pleaseUploadPhoto"));
                  if (!user) return setError(t("newOrder.loadingUserData"));

                  setSubmitting(true);
                  try {
                    // Step 1: Create order
                    const fd = new FormData();
                    fd.append("paket_id", String(paketId));
                    fd.append("payment_method", paymentMethod);
                    fd.append("location_latitude", String(location.lat));
                    fd.append("location_longitude", String(location.lng));
                    fd.append("address", address);
                    fd.append("scheduled_date", new Date(scheduledDate).toISOString());
                    // Append all photos (backend may need to handle multiple)
                    beforePhotos.forEach((photo, index) => {
                      fd.append("room_photo_before", photo);
                    });

                    const resp = await api.post("/orders", fd);
                    const order = resp.data.data.order as Pesanan;

                    // Play success sound when order is created
                    playOrderNotificationSound().catch(err => {
                      console.warn('[NewOrder] Failed to play sound:', err);
                    });

                    // Step 2: If NON-CASH payment, request Snap token and open payment UI
                    const isNonCash = paymentMethod !== "CASH";
                    if (isNonCash) {
                      setSubmitting(false);
                      setProcessingPayment(true);

                      try {
                        // Request Snap token from backend
                        const snapResp = await api.post("/payments/snap-token", {
                          pesanan_id: order.id,
                          customer_details: {
                            first_name: user.full_name.split(" ")[0] || user.full_name,
                            last_name: user.full_name.split(" ").slice(1).join(" ") || undefined,
                            email: user.email,
                            phone: user.phone_number
                          }
                        });

                        const { snap_token } = snapResp.data.data;

                        // Load Midtrans Snap script
                        // Get client key from env (should match backend MIDTRANS_CLIENT_KEY)
                        const clientKey =
                          import.meta.env.VITE_MIDTRANS_CLIENT_KEY || "SB-Mid-client-xxxxxxxxxxxxxxxxxxxxx";
                        const isProduction = import.meta.env.VITE_MIDTRANS_IS_PRODUCTION === "true";
                        await loadMidtransSnap(clientKey, isProduction);

                        // Open Midtrans payment UI
                        openMidtransSnap(snap_token, {
                          onSuccess: () => {
                            // Don't trust this callback! Payment status will be updated via webhook.
                            // Redirect to order detail page - user can check status there
                            navigate(`/orders/${order.id}`, { replace: true });
                          },
                          onPending: () => {
                            // Payment is pending (e.g., bank transfer needs confirmation)
                            // Redirect to order detail page - user can check status there
                            navigate(`/orders/${order.id}`, { replace: true });
                          },
                          onError: () => {
                            setError(t("newOrder.paymentFailed"));
                            setProcessingPayment(false);
                          },
                          onClose: () => {
                            // User closed payment popup without completing
                            // Redirect to order detail page - payment is still PENDING
                            navigate(`/orders/${order.id}`, { replace: true });
                          }
                        });
                      } catch (err) {
                        setError(getApiErrorMessage(err) || t("newOrder.failedToInitializePayment"));
                        setProcessingPayment(false);
                      }
                    } else {
                      // CASH payment - just redirect to order detail
                    navigate(`/orders/${order.id}`, { replace: true });
                    }
                  } catch (err) {
                    setError(getApiErrorMessage(err));
                  } finally {
                    setSubmitting(false);
                  }
                }}
            >
              {/* Animated gradient background */}
              <motion.div
                className="absolute inset-0 rounded-2xl sm:rounded-3xl"
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
              
              {/* Shimmer effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-0 group-hover:opacity-100"
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
              
              {/* Outer glow rings */}
              <motion.div
                className="absolute -inset-1 bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 rounded-2xl sm:rounded-3xl opacity-0 group-hover:opacity-50 blur-xl"
                animate={{
                  opacity: [0, 0.3, 0],
                  scale: [1, 1.05, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
              
              {/* Inner shine overlay */}
              <div className="absolute inset-0 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-white/20 via-transparent to-transparent pointer-events-none" />
              
              {/* Content */}
              <div className="relative z-10 flex items-center justify-center gap-2 sm:gap-2.5">
                {processingPayment ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="h-4 w-4 sm:h-5 sm:w-5 rounded-full border-2 border-white/30 border-t-white flex-shrink-0"
                    />
                    <span className="font-bold">{t("newOrder.processingPayment")}</span>
                  </>
                ) : submitting ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="h-4 w-4 sm:h-5 sm:w-5 rounded-full border-2 border-white/30 border-t-white flex-shrink-0"
                    />
                    <span className="font-bold">{t("newOrder.creating")}</span>
                  </>
                ) : (
                  <>
                    <motion.div
                      animate={{
                        scale: [1, 1.2, 1],
                        rotate: [0, 180, 360],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    >
                      <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]" />
                    </motion.div>
                    <span className="font-bold tracking-wide drop-shadow-[0_2px_4px_rgba(0,0,0,0.2)]">{t("newOrder.createOrder")}</span>
                    <motion.div
                      animate={{
                        x: [0, 4, 0],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    >
                      <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]" />
                    </motion.div>
                  </>
                )}
              </div>
              
              {/* Ripple effect on click */}
              <motion.div
                className="absolute inset-0 rounded-2xl sm:rounded-3xl bg-white/20"
                initial={{ scale: 0, opacity: 0 }}
                whileTap={{ scale: 1.5, opacity: [0.5, 0] }}
                transition={{ duration: 0.6 }}
              />
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}


