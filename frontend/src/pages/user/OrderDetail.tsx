/**
 * USER order detail page.
 *
 * Allows:
 * - optional AFTER photo upload
 * - completion verification (IN_PROGRESS -> COMPLETED)
 * - rating + tip after completion
 */

import { useCallback, useEffect, useState, useRef } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Camera, Image as ImageIcon, X, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { api } from "../../lib/api";
import { getApiErrorMessage } from "../../lib/apiError";
import { toAbsoluteUrl, parsePhotoPaths } from "../../lib/urls";
import { formatDateTimeWITA } from "../../utils/date";
import { getPackageGradient } from "../../utils/packageIcon";
import { getPackageImage, getPackageImageAlt } from "../../utils/packageImage";
import { t, getLanguage } from "../../lib/i18n";
import { playOrderNotificationSound } from "../../utils/sound";
import { StarRating } from "../../components/StarRating";
import { ThankYouAnimation } from "../../components/ThankYouAnimation";
import type { Pesanan } from "../../types/api";

export function OrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
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

  const [afterPhotos, setAfterPhotos] = useState<File[]>([]);
  const [afterPhotoPreviews, setAfterPhotoPreviews] = useState<string[]>([]);
  const [ratingValue, setRatingValue] = useState(0); // 0 means no rating selected yet
  const [review, setReview] = useState("");
  const [tipAmount, setTipAmount] = useState<number>(0);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(async () => {
    if (!Number.isFinite(orderId)) return;
    const resp = await api.get(`/orders/${orderId}`);
    setOrder(resp.data.data.order as Pesanan);
  }, [orderId]);

  // After photo previews
  useEffect(() => {
    if (afterPhotos.length > 0) {
      const readers = afterPhotos.map(photo => {
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(photo);
        });
      });
      Promise.all(readers).then(previews => setAfterPhotoPreviews(previews));
    } else {
      setAfterPhotoPreviews([]);
    }
  }, [afterPhotos]);

  const addAfterPhotos = (newFiles: File[]) => {
    setAfterPhotos(prev => {
      const combined = [...prev, ...newFiles];
      // Limit to max 4 photos
      const limited = combined.slice(0, 4);
      if (limited.length < combined.length) {
        setActionError(t("newOrder.maxPhotosExceeded") || `Maksimal 4 foto. Hanya ${limited.length} foto pertama yang ditambahkan.`);
      }
      return limited;
    });
    setActionError(null);
  };

  const removeAfterPhoto = (index: number) => {
    setAfterPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleAfterFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter(f => f.type.startsWith("image/"));
    if (files.length > 0) {
      addAfterPhotos(files);
    }
    // Reset input value so same file can be selected again
    e.target.value = "";
  };

  const handleAfterCameraClick = async () => {
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
      container.id = 'camera-container-after';
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
      video.id = 'camera-video-after';
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
      captureBtn.setAttribute('aria-label', t("newOrder.capturePhoto") || "Capture Photo");
      
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
            const file = new File([blob], `photo-after-${Date.now()}.jpg`, { type: 'image/jpeg' });
            addAfterPhotos([file]);
          }
          // Cleanup
          cleanup();
        }, 'image/jpeg', 0.9);
      };

      const cleanup = () => {
        stream.getTracks().forEach(track => track.stop());
        const containerEl = document.getElementById('camera-container-after');
        const videoEl = document.getElementById('camera-video-after');
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
      setActionError(t("newOrder.cameraAccessError") || "Tidak dapat mengakses kamera. Silakan gunakan pilihan galeri.");
      cameraInputRef.current?.click();
    }
  };

  const handleAfterGalleryClick = () => {
    galleryInputRef.current?.click();
  };

  // Track previous status to detect changes
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
          
          // Play sound if order status changed to IN_PROGRESS (confirmed/OTW)
          if (prevStatusRef.current && prevStatusRef.current !== 'IN_PROGRESS' && newOrder.status === 'IN_PROGRESS') {
            console.log('[OrderDetail] Order status changed to IN_PROGRESS - playing notification sound');
            playOrderNotificationSound().catch(err => {
              console.warn('[OrderDetail] Failed to play sound:', err);
            });
          }
          prevStatusRef.current = newOrder.status;
        }
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

  // Poll for status updates every 3 seconds (only for pending/processing orders)
  useEffect(() => {
    if (!order || order.status === 'COMPLETED' || !Number.isFinite(orderId)) return;
    
    const interval = setInterval(async () => {
      try {
        const resp = await api.get(`/orders/${orderId}`);
        const updatedOrder = resp.data.data.order as Pesanan;
        
        // Play sound if order status changed to IN_PROGRESS (confirmed/OTW)
        if (order.status !== 'IN_PROGRESS' && updatedOrder.status === 'IN_PROGRESS') {
          console.log('[OrderDetail] Order status changed to IN_PROGRESS during polling - playing notification sound');
          playOrderNotificationSound().catch(err => {
            console.warn('[OrderDetail] Failed to play sound:', err);
          });
        }
        
        setOrder(updatedOrder);
        prevStatusRef.current = updatedOrder.status;
      } catch (err) {
        // Silently fail - polling errors are not critical
        console.error('[OrderDetail] Polling error:', err);
      }
    }, 3000); // Poll every 3 seconds
    
    return () => clearInterval(interval);
  }, [order, orderId]);

  if (loading) return <div className="text-sm text-slate-600">{t("orderDetail.loading")}</div>;
  if (loadError) {
    return (
      <div className="rounded-xl border bg-white p-6 shadow-[0_8px_24px_rgba(0,0,0,0.15),0_4px_8px_rgba(0,0,0,0.1),0_2px_4px_rgba(0,0,0,0.08)]">
        <div className="text-lg font-semibold">{t("orderDetail.couldNotLoad")}</div>
        <div className="mt-2 text-sm text-rose-700">{loadError}</div>
        <div className="mt-4">
          <Link className="text-sm font-semibold text-sky-700 hover:underline" to="/orders">
            {t("orderDetail.backToOrders")}
          </Link>
        </div>
      </div>
    );
  }
  if (!order) return null;

  // Parse photos (supports JSON array or single string)
  const beforePhotoPaths = parsePhotoPaths(order.room_photo_before);
  const afterPhotoPaths = parsePhotoPaths(order.room_photo_after);
  const beforeUrls = beforePhotoPaths.map(p => toAbsoluteUrl(p));
  const afterUrls = afterPhotoPaths.map(p => toAbsoluteUrl(p));

  const packageNameDisplay = isEnglish && order.paket.name_en ? order.paket.name_en : order.paket.name;
  const packageDescDisplay = isEnglish && order.paket.description_en ? order.paket.description_en : order.paket.description;

  return (
    <div className="w-full bg-gradient-to-br from-tropical-50 via-ocean-50/50 to-sand-50/70">
      <div className="space-y-4 sm:space-y-6 max-w-full overflow-x-hidden px-3 sm:px-4 lg:px-6 pb-6 sm:pb-8 lg:pb-12">
      {/* Back Button */}
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        whileHover={{ scale: 1.05, x: -2 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => {
          // Always navigate to orders page (your orders)
          navigate("/orders");
        }}
        className="flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-slate-900 transition-colors mb-2"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>{t("orderDetail.backToOrders")}</span>
      </motion.button>
      
      <div className="flex flex-wrap items-start sm:items-end justify-between gap-3">
        <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
          <div className="flex-shrink-0">
            <img
              src={getPackageImage(order.paket.name, order.paket.image)}
              alt={getPackageImageAlt(packageNameDisplay)}
              className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg sm:rounded-xl object-cover border-2 border-slate-200/50 shadow-lg"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48'%3E%3Crect fill='%23e2e8f0' width='48' height='48'/%3E%3Ctext x='50%25' y='50%25' font-family='Arial' font-size='12' fill='%2394a3b8' text-anchor='middle' dominant-baseline='middle'%3E${encodeURIComponent(packageNameDisplay)}%3C/text%3E%3C/svg%3E`;
              }}
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs sm:text-sm text-slate-500">{t("orderDetail.orderHash")}{order.order_number}</div>
            <div className="text-base sm:text-lg lg:text-xl font-semibold truncate">
              {packageNameDisplay}
            </div>
            <div className="text-xs sm:text-sm text-slate-500 line-clamp-2 mb-1">
              {packageDescDisplay}
            </div>
            <div className="mt-1 text-xs sm:text-sm text-slate-600 line-clamp-2">{order.address}</div>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="inline-flex items-center rounded-full bg-slate-100 px-2 sm:px-3 py-1 text-[10px] sm:text-xs font-semibold text-slate-700">
            {order.status}
          </div>
          <div className="mt-1.5 sm:mt-2 text-[10px] sm:text-xs text-slate-500">
            {t("orderDetail.paymentLabel")} <span className="font-semibold">{order.pembayaran.status}</span> <span className="hidden sm:inline">({order.pembayaran.method})</span>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        <div className="rounded-xl sm:rounded-2xl border bg-white p-3 sm:p-4 lg:p-5 shadow-[0_8px_24px_rgba(0,0,0,0.15),0_4px_8px_rgba(0,0,0,0.1),0_2px_4px_rgba(0,0,0,0.08)] max-w-full overflow-hidden">
          <div className="text-sm font-semibold text-slate-800">{t("orderDetail.photos")}</div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <div className="text-xs font-semibold text-slate-500">{t("orderDetail.before")}</div>
              {beforeUrls.length > 0 ? (
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {beforeUrls.map((url, index) => (
                    url && (
                      <img key={index} className="aspect-video w-full rounded-xl border object-cover" src={url} alt={`${t("orderDetail.beforePhoto")} ${index + 1}`} />
                    )
                  ))}
                </div>
              ) : (
                <div className="mt-2 rounded-xl border bg-slate-50 p-4 text-sm text-slate-600">{t("orderDetail.noPhoto")}</div>
              )}
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-500">{t("orderDetail.after")}</div>
              {afterUrls.length > 0 ? (
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {afterUrls.map((url, index) => (
                    url && (
                      <img key={index} className="aspect-video w-full rounded-xl border object-cover" src={url} alt={`${t("orderDetail.afterPhoto")} ${index + 1}`} />
                    )
                  ))}
                </div>
              ) : (
                <div className="mt-2 rounded-xl border bg-slate-50 p-4 text-sm text-slate-600">{t("orderDetail.notUploadedYet")}</div>
              )}
            </div>
          </div>

          {/* Upload after photo - Only available when status is IN_PROGRESS */}
          {afterPhotoPaths.length === 0 && order.status === "IN_PROGRESS" ? (
            <div className="mt-4 rounded-xl border-2 border-lombok-tropical-200 bg-gradient-to-br from-lombok-tropical-50 to-lombok-ocean-50 p-4 shadow-[0_6px_16px_rgba(0,0,0,0.12),0_3px_6px_rgba(0,0,0,0.08),0_1px_3px_rgba(0,0,0,0.06)]">
              <div className="text-sm font-semibold text-slate-800 mb-1">{t("orderDetail.uploadAfterPhoto")}</div>
              <div className="text-xs text-slate-600 mb-3">{t("orderDetail.uploadAfterPhotoHint")}</div>
              {/* Hidden file inputs - Labels provided via aria-label for accessibility */}
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                onChange={handleAfterFileSelect}
                className="hidden"
                multiple
                aria-label={t("newOrder.takePhoto") || "Take photo"}
                title={t("newOrder.takePhoto") || "Take photo"}
              />
              <input
                ref={galleryInputRef}
                type="file"
                accept="image/*"
                onChange={handleAfterFileSelect}
                className="hidden"
                multiple
                aria-label={t("newOrder.chooseFromGallery") || "Choose from gallery"}
                title={t("newOrder.chooseFromGallery") || "Choose from gallery"}
              />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAfterFileSelect}
                className="hidden"
                multiple
                aria-label={t("newOrder.uploadBeforePhoto") || "Upload photo"}
                title={t("newOrder.uploadBeforePhoto") || "Upload photo"}
              />

              {afterPhotoPreviews.length > 0 ? (
                <div className="mt-3 p-3 bg-white rounded-lg">
                  <div className="grid grid-cols-2 gap-2">
                    {afterPhotoPreviews.map((preview, index) => (
                      <div key={index} className="relative">
                        <img
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-32 sm:h-40 object-cover rounded-lg"
                        />
                        <motion.button
                          type="button"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            removeAfterPhoto(index);
                          }}
                          className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-rose-500 text-white shadow-lg hover:bg-rose-600"
                        >
                          <X className="h-3.5 w-3.5" />
                        </motion.button>
                        <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-0.5 rounded">
                          {index + 1}/{afterPhotoPreviews.length}
                        </div>
                      </div>
                    ))}
                    {/* Placeholder slot untuk menambah foto jika belum 4 */}
                    {afterPhotos.length < 4 && (
                      <div 
                        className="relative border-2 border-dashed border-lombok-tropical-300 rounded-lg bg-lombok-tropical-50/50 hover:bg-lombok-tropical-100 cursor-pointer flex flex-col items-center justify-center h-32 sm:h-40"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAfterGalleryClick();
                        }}
                      >
                        <ImageIcon className="h-8 w-8 text-lombok-tropical-500 mb-1" />
                        <span className="text-xs text-lombok-tropical-600 font-semibold">Tambah Foto</span>
                        <span className="text-[10px] text-slate-500 mt-0.5">({afterPhotos.length}/4)</span>
                      </div>
                    )}
                  </div>
                  {afterPhotos.length < 4 && (
                    <div className="mt-3 flex flex-col sm:flex-row gap-2">
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAfterCameraClick();
                        }}
                        className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-lombok-tropical-500 to-lombok-ocean-500 px-4 py-2 text-sm font-bold text-white shadow-lg hover:shadow-xl transition-all"
                      >
                        <Camera className="h-4 w-4" />
                        <span>{t("newOrder.takePhoto")}</span>
                      </motion.button>
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAfterGalleryClick();
                        }}
                        className="flex-1 flex items-center justify-center gap-2 rounded-lg border-2 border-lombok-tropical-300 bg-white px-4 py-2 text-sm font-bold text-lombok-tropical-600 hover:bg-lombok-tropical-50 transition-all"
                      >
                        <ImageIcon className="h-4 w-4" />
                        <span>{t("newOrder.chooseFromGallery")}</span>
                      </motion.button>
                    </div>
                  )}
                  {afterPhotos.length >= 4 && (
                    <div className="mt-2 text-xs text-center text-emerald-600 font-semibold">
                      Maksimal 4 foto telah ditambahkan
                    </div>
                  )}
                </div>
              ) : (
                <div className="mt-3 flex flex-col sm:flex-row gap-2">
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAfterCameraClick();
                    }}
                    className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-lombok-tropical-500 to-lombok-ocean-500 px-4 py-2 text-sm font-bold text-white shadow-lg hover:shadow-xl transition-all"
                  >
                    <Camera className="h-4 w-4" />
                    <span>{t("newOrder.takePhoto")}</span>
                  </motion.button>
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAfterGalleryClick();
                    }}
                    className="flex-1 flex items-center justify-center gap-2 rounded-lg border-2 border-lombok-tropical-300 bg-white px-4 py-2 text-sm font-bold text-lombok-tropical-600 hover:bg-lombok-tropical-50 transition-all"
                  >
                    <ImageIcon className="h-4 w-4" />
                    <span>{t("newOrder.chooseFromGallery")}</span>
                  </motion.button>
                </div>
              )}

              <button
                className="mt-3 w-full rounded-lg bg-lombok-tropical-600 px-4 py-2 text-sm font-semibold text-white hover:bg-lombok-tropical-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                disabled={busy || afterPhotos.length === 0}
                onClick={async () => {
                  setBusy(true);
                  setActionError(null);
                  try {
                    const fd = new FormData();
                    // Append all photos (backend may need to handle multiple)
                    afterPhotos.forEach((photo) => {
                      fd.append("room_photo_after", photo);
                    });
                    await api.post(`/orders/${order.id}/after-photo`, fd);
                    await refresh();
                    setAfterPhotos([]);
                  } catch (err) {
                    setActionError(getApiErrorMessage(err));
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                {busy ? t("orderDetail.uploading") : t("orderDetail.uploadAfterPhoto")}
              </button>
            </div>
          ) : afterPhotoPaths.length === 0 && order.status !== "IN_PROGRESS" ? (
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-[0_6px_16px_rgba(0,0,0,0.12),0_3px_6px_rgba(0,0,0,0.08),0_1px_3px_rgba(0,0,0,0.06)]">
              <div className="text-sm font-semibold text-slate-800">{t("orderDetail.uploadAfterPhoto")}</div>
              <div className="mt-2 text-xs text-slate-500">
                {t("orderDetail.afterPhotoRestriction")}
              </div>
            </div>
          ) : null}
        </div>

        <div className="space-y-4 sm:space-y-6">
          <div className="rounded-xl sm:rounded-2xl border bg-white p-3 sm:p-4 lg:p-5 shadow-[0_8px_24px_rgba(0,0,0,0.15),0_4px_8px_rgba(0,0,0,0.1),0_2px_4px_rgba(0,0,0,0.08)] max-w-full overflow-hidden">
            <div className="text-sm font-semibold text-slate-800">{t("orderDetail.scheduleAndPayment")}</div>
            <div className="mt-3 grid gap-3 text-sm">
              <div className="flex items-center justify-between">
                <div className="text-slate-600">{t("orderDetail.scheduled")}</div>
                <div className="font-semibold">{formatDateTimeWITA(order.scheduled_date)}</div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-slate-600">{t("orderDetail.amount")}</div>
                <div className="font-semibold">Rp {order.pembayaran.amount.toLocaleString("id-ID")}</div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-slate-600">{t("orderDetail.paymentStatusLabel")}</div>
                <div className="font-semibold">{order.pembayaran.status}</div>
              </div>
            </div>
          </div>

          {/* Completion section - Show tip input after photo uploaded, then completion button */}
          {order.status === "IN_PROGRESS" && afterPhotoPaths.length > 0 ? (
            <div className="rounded-2xl border-2 border-lombok-tropical-200 bg-gradient-to-br from-lombok-tropical-50 to-lombok-ocean-50 p-5 shadow-[0_8px_24px_rgba(0,0,0,0.15),0_4px_8px_rgba(0,0,0,0.1),0_2px_4px_rgba(0,0,0,0.08)]">
              <div className="text-sm font-semibold text-slate-800 mb-2">{t("orderDetail.completeOrder")}</div>
              
              {/* Tip Input - Only show if after photo is uploaded and tip not yet submitted */}
              {!order.tip ? (
                <div className="mt-4 rounded-xl border-2 border-lombok-sunset-200 bg-white p-4 shadow-[0_6px_16px_rgba(0,0,0,0.12),0_3px_6px_rgba(0,0,0,0.08),0_1px_3px_rgba(0,0,0,0.06)]">
                  <div className="text-sm font-semibold text-slate-800 mb-1">{t("orderDetail.giveTip")}</div>
                  <div className="text-xs text-slate-600 mb-3">
                    {t("orderDetail.tipTransparency")}
                  </div>
                  <div className="mt-3">
                    <label className="block">
                      <div className="text-xs font-semibold text-slate-500 mb-1">{t("orderDetail.tipAmount")}</div>
                      <input
                        className="w-full rounded-lg border-2 border-slate-200 bg-white px-3 py-2 text-sm focus:border-lombok-sunset-500 focus:ring-2 focus:ring-lombok-sunset-200"
                        type="number"
                        min={0}
                        step={1000}
                        value={tipAmount}
                        onChange={(e) => setTipAmount(Number(e.target.value))}
                        placeholder="0"
                      />
                    </label>
                    <button
                      className="mt-3 rounded-lg bg-lombok-sunset-600 px-4 py-2 text-sm font-semibold text-white hover:bg-lombok-sunset-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                      disabled={busy || tipAmount < 0}
                      onClick={async () => {
                        setBusy(true);
                        setActionError(null);
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
                    >
                      {busy ? t("orderDetail.saving") : tipAmount > 0 ? t("orderDetail.saveTip").replace("{amount}", tipAmount.toLocaleString("id-ID")) : t("orderDetail.skipTip")}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-4 rounded-xl border-2 border-emerald-200 bg-emerald-50 p-4 shadow-[0_6px_16px_rgba(0,0,0,0.12),0_3px_6px_rgba(0,0,0,0.08),0_1px_3px_rgba(0,0,0,0.06)]">
                  <div className="text-sm font-semibold text-emerald-800 mb-1">{t("orderDetail.yourTip")}</div>
                  <div className="text-base font-bold text-emerald-700">
                    {order.tip.amount > 0 ? `Rp ${order.tip.amount.toLocaleString("id-ID")}` : t("orderDetail.noTip")}
                  </div>
                  <div className="text-xs text-emerald-600 mt-1">
                    {order.tip.amount > 0 
                      ? t("orderDetail.tipForwarded")
                      : t("orderDetail.tipSkipped")}
                  </div>
                </div>
              )}

              {/* Completion Button - Only show after tip is submitted (including amount 0) */}
              {order.tip !== null && order.tip !== undefined && (
                <div className="mt-4">
                  <button
                    className="w-full rounded-lg bg-gradient-to-r from-lombok-tropical-600 to-lombok-ocean-600 px-4 py-3 text-sm font-bold text-white hover:from-lombok-tropical-700 hover:to-lombok-ocean-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-lg"
                    disabled={busy}
                    onClick={async () => {
                      setBusy(true);
                      setActionError(null);
                      try {
                        await api.post(`/orders/${order.id}/verify-completion`);
                        await refresh();
                      } catch (err) {
                        setActionError(getApiErrorMessage(err));
                      } finally {
                        setBusy(false);
                      }
                    }}
                  >
                    {busy ? t("orderDetail.processing") : t("orderDetail.complete")}
                  </button>
                  <div className="mt-2 text-xs text-center text-slate-500">
                    {t("orderDetail.clickToComplete")}
                  </div>
                </div>
              )}
            </div>
          ) : order.status === "IN_PROGRESS" && afterPhotoPaths.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-[0_8px_24px_rgba(0,0,0,0.15),0_4px_8px_rgba(0,0,0,0.1),0_2px_4px_rgba(0,0,0,0.08)]">
              <div className="text-sm font-semibold text-slate-800">{t("orderDetail.completeOrder")}</div>
              <div className="mt-2 text-sm text-slate-600">
                {t("orderDetail.uploadAfterFirst")}
              </div>
            </div>
          ) : order.status !== "IN_PROGRESS" ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-[0_8px_24px_rgba(0,0,0,0.15),0_4px_8px_rgba(0,0,0,0.1),0_2px_4px_rgba(0,0,0,0.08)]">
              <div className="text-sm font-semibold text-slate-800">{t("orderDetail.orderStatus")}</div>
              <div className="mt-2 text-sm text-slate-600">
                {t("orderDetail.currentStatus")} <span className="font-semibold">{order.status}</span>
              </div>
              {order.status === "PENDING" && (
                <div className="mt-2 text-xs text-slate-500">
                  {t("orderDetail.waitingAdmin")}
                </div>
              )}
            </div>
          ) : null}

          <div className="rounded-2xl border bg-white p-5 shadow-[0_8px_24px_rgba(0,0,0,0.15),0_4px_8px_rgba(0,0,0,0.1),0_2px_4px_rgba(0,0,0,0.08)]">
            <div className="text-sm font-semibold text-slate-800">{t("orderDetail.ratingAndTip")}</div>
            <div className="mt-2 text-sm text-slate-600">{t("orderDetail.availableAfterCompletion")}</div>

            {order.status === "COMPLETED" ? (
              <div className="mt-4 space-y-5">
                {/* Rating */}
                {order.rating ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl bg-gradient-to-br from-teal-50/80 to-blue-50/80 p-5 text-sm shadow-[0_6px_16px_rgba(0,0,0,0.12),0_3px_6px_rgba(0,0,0,0.08),0_1px_3px_rgba(0,0,0,0.06)] border border-teal-200"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                      <div className="font-bold text-slate-900">{t("orderDetail.yourRating").replace("{value}", String(order.rating.rating_value))}</div>
                    </div>
                    <div className="mt-3">
                      <StarRating
                        value={order.rating.rating_value}
                        readOnly={true}
                        size="md"
                        showLabel={true}
                      />
                    </div>
                    {order.rating.review && (
                      <div className="mt-4 p-3 rounded-lg bg-white/60 text-slate-700 border border-slate-200">
                        {order.rating.review}
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl border-2 border-teal-200 bg-gradient-to-br from-white to-teal-50/30 p-5 shadow-[0_6px_16px_rgba(0,0,0,0.12),0_3px_6px_rgba(0,0,0,0.08),0_1px_3px_rgba(0,0,0,0.06)]"
                  >
                    <div className="text-base font-bold text-slate-900 mb-1">{t("orderDetail.leaveRating")}</div>
                    <div className="text-xs text-slate-600 mb-4">Share your experience to help us improve</div>
                    
                    <div className="space-y-4">
                      {/* Star Rating */}
                      <div>
                        <div className="text-xs font-semibold text-slate-700 mb-3">{t("orderDetail.ratingLabel")}</div>
                        <div className="flex items-center justify-center py-2">
                          <StarRating
                            value={ratingValue}
                            onChange={setRatingValue}
                            size="lg"
                            showLabel={true}
                          />
                        </div>
                      </div>

                      {/* Review Textarea */}
                      <label className="block">
                        <div className="text-xs font-semibold text-slate-700 mb-2">{t("orderDetail.reviewOptional")}</div>
                        <textarea
                          className="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-sm focus:border-teal-400 focus:ring-2 focus:ring-teal-200 transition-all resize-none"
                          rows={4}
                          value={review}
                          onChange={(e) => setReview(e.target.value)}
                          placeholder={t("orderDetail.reviewPlaceholder")}
                          maxLength={2000}
                        />
                        <div className="mt-1 text-xs text-slate-500 text-right">
                          {review.length}/2000
                        </div>
                      </label>

                      {/* Submit Button */}
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full rounded-xl bg-gradient-to-r from-teal-600 to-blue-600 px-6 py-3 text-sm font-bold text-white hover:from-teal-700 hover:to-blue-700 disabled:from-slate-400 disabled:to-slate-500 disabled:cursor-not-allowed shadow-lg shadow-teal-500/30 transition-all"
                        disabled={busy || ratingValue === 0}
                        onClick={async () => {
                          if (ratingValue === 0) return;
                          
                          setBusy(true);
                          setActionError(null);
                          try {
                            await api.post(`/orders/${order.id}/rating`, {
                              rating_value: ratingValue,
                              review: review.trim() || undefined
                            });
                            setRatingSubmitted(true);
                            await refresh();
                            
                            // Show thank you animation after a short delay
                            // Fetch latest order data to check for tip (after refresh updates state)
                            setTimeout(async () => {
                              try {
                                const resp = await api.get(`/orders/${order.id}`);
                                const latestOrder = resp.data.data.order as Pesanan;
                                // Update order state with latest data
                                setOrder(latestOrder);
                                // Show thank you animation
                                setShowThankYou(true);
                              } catch (err) {
                                // Fallback: show animation anyway
                                setShowThankYou(true);
                              }
                            }, 500);
                          } catch (err) {
                            setActionError(getApiErrorMessage(err));
                          } finally {
                            setBusy(false);
                          }
                        }}
                      >
                        {busy ? (
                          <span className="flex items-center justify-center gap-2">
                            <motion.div
                              className="h-4 w-4 border-2 border-white border-t-transparent rounded-full"
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            />
                            {t("orderDetail.processing") || "Submitting..."}
                          </span>
                        ) : ratingSubmitted ? (
                          <span className="flex items-center justify-center gap-2">
                            <CheckCircle2 className="h-5 w-5" />
                            Rating Submitted!
                          </span>
                        ) : (
                          t("orderDetail.submitRating")
                        )}
                      </motion.button>

                      {ratingValue === 0 && (
                        <p className="text-xs text-center text-amber-600 font-medium">
                          Please select a rating to submit
                        </p>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* Tip */}
                {order.tip ? (
                  <div className="rounded-xl bg-slate-50 p-4 text-sm shadow-[0_6px_16px_rgba(0,0,0,0.12),0_3px_6px_rgba(0,0,0,0.08),0_1px_3px_rgba(0,0,0,0.06)]">
                    <div className="font-semibold">{t("orderDetail.yourTipLabel").replace("{amount}", order.tip.amount.toLocaleString("id-ID"))}</div>
                  </div>
                ) : (
                  <div className="rounded-xl border bg-slate-50 p-4 shadow-[0_6px_16px_rgba(0,0,0,0.12),0_3px_6px_rgba(0,0,0,0.08),0_1px_3px_rgba(0,0,0,0.06)]">
                    <div className="text-sm font-semibold text-slate-800">{t("orderDetail.leaveTip")}</div>
                    <div className="mt-3 grid gap-3">
                      <label className="block">
                        <div className="text-xs font-semibold text-slate-500">{t("orderDetail.tipAmountLabel")}</div>
                        <input
                          className="mt-1 w-full rounded-lg border bg-white px-3 py-2 text-sm"
                          type="number"
                          min={0}
                          value={tipAmount}
                          onChange={(e) => setTipAmount(Number(e.target.value))}
                        />
                      </label>
                      <button
                        className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
                        disabled={busy}
                        onClick={async () => {
                          setBusy(true);
                          setActionError(null);
                          try {
                            await api.post(`/orders/${order.id}/tip`, { amount: tipAmount });
                            await refresh();
                          } catch (err) {
                            setActionError(getApiErrorMessage(err));
                          } finally {
                            setBusy(false);
                          }
                        }}
                      >
                        {t("orderDetail.submitTip")}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-4 text-sm text-slate-600">{t("orderDetail.completeFirst")}</div>
            )}
          </div>
        </div>
      </div>

      {actionError ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{actionError}</div>
      ) : null}

      {/* Thank You Animation */}
      {order && (
        <ThankYouAnimation
          isVisible={showThankYou}
          hasTip={order.tip ? order.tip.amount > 0 : false}
          onClose={() => {
            setShowThankYou(false);
            // Navigate to new order page when closing animation
            navigate("/orders/new");
          }}
        />
      )}
      </div>
    </div>
  );
}


