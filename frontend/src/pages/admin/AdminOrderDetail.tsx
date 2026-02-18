import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Copy,
  CreditCard,
  DollarSign,
  ExternalLink,
  Gift,
  MapPin,
  PhoneCall,
  MessageCircle,
  Star,
  Trash2,
  User,
  Camera,
} from "lucide-react";
import { MapContainer, Marker, TileLayer } from "react-leaflet";
import type { LatLng } from "../../components/MapPicker";

import { api } from "../../lib/api";
import { getApiErrorMessage } from "../../lib/apiError";
import { toAbsoluteUrl, parsePhotoPaths } from "../../lib/urls";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { formatDateTimeWITA } from "../../utils/date";
import { getPackageImage, getPackageImageAlt } from "../../utils/packageImage";
import type { Pesanan } from "../../types/api";

function formatOrderNumber(orderNumber: number | null | undefined): string {
  if (!orderNumber && orderNumber !== 0) return "-";
  return `LC-${Number(orderNumber).toString().padStart(4, "0")}`;
}

type PhotoViewerState = {
  url: string;
  label: string;
} | null;

type OrderSummaryBarProps = {
  order: Pesanan;
  onBack: () => void;
};

type OrderStatusCardProps = {
  order: Pesanan;
};

type CustomerCardProps = {
  order: Pesanan;
  onCopy: (value: string, message: string) => void;
};

type SchedulePaymentCardProps = {
  order: Pesanan;
};

type LocationCardProps = {
  order: Pesanan;
  location: LatLng | null;
  googleMapsLink: string | null;
  expanded: boolean;
  onToggle: () => void;
  onCopy: (value: string, message: string) => void;
};

type PhotoSectionProps = {
  beforeUrls: string[];
  afterUrls: string[];
  onOpenPhoto: (state: PhotoViewerState) => void;
};

type FeedbackCardProps = {
  order: Pesanan;
};

type OrderActionBarProps = {
  order: Pesanan;
  busyAction: "assign" | "complete" | "delete" | null;
  onAssign: () => void;
  onMarkCompleted: () => void;
  onDelete: () => void;
};

type OrderLocationMapProps = {
  location: LatLng;
};

export function AdminOrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const orderId = Number(id);

  const [order, setOrder] = useState<Pesanan | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<
    "assign" | "complete" | "delete" | null
  >(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [mapExpanded, setMapExpanded] = useState(false);
  const [photoViewer, setPhotoViewer] = useState<PhotoViewerState>(null);

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

  useEffect(() => {
    if (!actionSuccess) return;
    const idTimeout = window.setTimeout(() => setActionSuccess(null), 3000);
    return () => window.clearTimeout(idTimeout);
  }, [actionSuccess]);

  const beforeUrls = useMemo(() => {
    if (!order) return [];
    const paths = parsePhotoPaths(order.room_photo_before);
    return paths
      .map((p) => (p ? toAbsoluteUrl(p) : null))
      .filter((url): url is string => Boolean(url));
  }, [order]);

  const afterUrls = useMemo(() => {
    if (!order) return [];
    const paths = parsePhotoPaths(order.room_photo_after);
    return paths
      .map((p) => (p ? toAbsoluteUrl(p) : null))
      .filter((url): url is string => Boolean(url));
  }, [order]);

  const location: LatLng | null = useMemo(() => {
    if (!order?.location_latitude || !order.location_longitude) return null;
    return {
      lat: order.location_latitude,
      lng: order.location_longitude,
    };
  }, [order]);

  const googleMapsLink = useMemo(() => {
    if (!location) return null;
    return `https://www.google.com/maps?q=${location.lat},${location.lng}`;
  }, [location]);

  const handleBack = useCallback(() => {
    navigate("/admin/orders");
  }, [navigate]);

  const handleCopyToClipboard = useCallback(
    async (value: string, message: string) => {
      if (!value) return;
      try {
        await navigator.clipboard.writeText(value);
        setActionError(null);
        setActionSuccess(message);
      } catch {
        setActionSuccess(null);
        setActionError("Gagal menyalin ke clipboard. Silakan coba lagi.");
      }
    },
    [],
  );

  const handleAssign = useCallback(async () => {
    if (!order) return;
    setBusyAction("assign");
    setActionError(null);
    setActionSuccess(null);
    try {
      await api.patch(`/admin/orders/${order.id}/assign`);
      await refresh();
      setActionSuccess("Pesanan berhasil ditugaskan ke petugas.");
    } catch (err) {
      setActionError(getApiErrorMessage(err));
    } finally {
      setBusyAction(null);
    }
  }, [order, refresh]);

  const handleMarkCompleted = useCallback(async () => {
    if (!order) return;
    setBusyAction("complete");
    setActionError(null);
    setActionSuccess(null);
    try {
      await api.post(`/orders/${order.id}/verify-completion`);
      await refresh();
      setActionSuccess("Pesanan berhasil ditandai sebagai selesai.");
    } catch (err) {
      setActionError(getApiErrorMessage(err));
    } finally {
      setBusyAction(null);
    }
  }, [order, refresh]);

  const handleDelete = useCallback(async () => {
    if (!order) return;
    setBusyAction("delete");
    setActionError(null);
    setActionSuccess(null);
    try {
      await api.delete(`/admin/orders/${order.id}`);
      setActionSuccess(
        `Pesanan ${formatOrderNumber(order.order_number)} berhasil dihapus.`,
      );
      navigate("/admin/orders");
    } catch (err) {
      setActionError(getApiErrorMessage(err));
    } finally {
      setBusyAction(null);
      setShowDeleteConfirm(false);
    }
  }, [navigate, order]);

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-80px)] flex-col bg-slate-50">
        <div className="sticky top-0 z-20 border-b border-slate-200 bg-white px-3 py-3 sm:px-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-slate-200" />
            <div className="flex-1 space-y-1">
              <div className="h-3 w-24 rounded bg-slate-200" />
              <div className="h-4 w-40 rounded bg-slate-200" />
              <div className="h-3 w-56 rounded bg-slate-100" />
            </div>
          </div>
        </div>
        <div className="space-y-3 px-3 py-4 sm:px-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-24 rounded-[14px] border border-slate-200 bg-slate-100"
            />
          ))}
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex min-h-[calc(100vh-80px)] flex-col bg-slate-50">
        <div className="sticky top-0 z-20 border-b border-slate-200 bg-white px-3 py-3 sm:px-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleBack}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="text-sm font-semibold text-slate-900">
              Detail Pesanan
            </div>
          </div>
        </div>
        <div className="flex flex-1 flex-col items-center justify-center px-4">
          <div className="flex flex-col items-center gap-3 text-center">
            <AlertCircle className="h-10 w-10 text-rose-500" />
            <h2 className="text-base font-semibold text-slate-900">
              Tidak dapat memuat detail pesanan
            </h2>
            <p className="text-xs text-rose-600">{loadError}</p>
            <button
              type="button"
              onClick={handleBack}
              className="mt-2 inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Kembali ke Pesanan</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!order) return null;

  return (
    <div className="relative flex min-h-[calc(100vh-80px)] flex-col bg-slate-50">
      <OrderSummaryBar order={order} onBack={handleBack} />

      <main className="mb-[72px] space-y-4 px-3 py-4 sm:px-4 sm:py-5">
        {actionError && (
          <div className="flex items-start gap-2 rounded-[10px] border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 sm:text-sm">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <span>{actionError}</span>
          </div>
        )}

        <OrderStatusCard order={order} />
        <CustomerCard order={order} onCopy={handleCopyToClipboard} />
        <SchedulePaymentCard order={order} />
        <LocationCard
          order={order}
          location={location}
          googleMapsLink={googleMapsLink}
          expanded={mapExpanded}
          onToggle={() => setMapExpanded((prev) => !prev)}
          onCopy={handleCopyToClipboard}
        />
        <PhotoSection
          beforeUrls={beforeUrls}
          afterUrls={afterUrls}
          onOpenPhoto={setPhotoViewer}
        />
        <FeedbackCard order={order} />
      </main>

      <OrderActionBar
        order={order}
        busyAction={busyAction}
        onAssign={handleAssign}
        onMarkCompleted={handleMarkCompleted}
        onDelete={() => setShowDeleteConfirm(true)}
      />

      {actionSuccess && (
        <div className="pointer-events-none fixed inset-x-0 bottom-[88px] z-40 flex justify-center px-4">
          <div className="pointer-events-auto inline-flex max-w-[420px] items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-xs font-medium text-white shadow-lg shadow-slate-900/30 sm:text-sm">
            <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">{actionSuccess}</span>
          </div>
        </div>
      )}

      {photoViewer && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 px-4">
          <div className="relative w-full max-w-md">
            <button
              type="button"
              onClick={() => setPhotoViewer(null)}
              className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white"
            >
              ×
            </button>
            <div className="overflow-hidden rounded-2xl bg-slate-900">
              <div className="bg-slate-900 px-4 py-2 text-xs font-medium text-slate-100">
                {photoViewer.label}
              </div>
              <div className="flex items-center justify-center bg-black">
                <img
                  src={photoViewer.url}
                  alt={photoViewer.label}
                  className="max-h-[70vh] w-full object-contain"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Hapus Pesanan?"
        message={`Nomor Pesanan: ${formatOrderNumber(
          order.order_number,
        )}\nPaket: ${order.paket.name}\nStatus: ${
          order.status
        }\nCustomer: ${
          order.user.full_name
        }\n\nApakah Anda yakin ingin menghapus pesanan ini?\nTindakan ini TIDAK DAPAT DIBATALKAN dan semua data terkait akan dihapus permanen.`}
        confirmText="Ya, Hapus"
        cancelText="Batal"
        variant="danger"
        isLoading={busyAction === "delete"}
      />
    </div>
  );
}

function OrderSummaryBar({ order, onBack }: OrderSummaryBarProps) {
  const orderNumber = formatOrderNumber(order.order_number);

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
      <div className="flex h-16 items-center gap-3 px-3 sm:h-[64px] sm:px-4">
        <button
          type="button"
          onClick={onBack}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-semibold text-slate-500">
            Order {orderNumber}
          </div>
          <div className="mt-0.5 flex items-center gap-2">
            <div className="flex h-7 w-7 flex-shrink-0 overflow-hidden rounded-md bg-slate-100">
              <img
                src={getPackageImage(order.paket.name, order.paket.image)}
                alt={getPackageImageAlt(order.paket.name)}
                loading="lazy"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="truncate text-sm font-semibold text-slate-900">
              {order.paket.name}
            </div>
          </div>
          <div className="truncate text-[11px] text-slate-500">
            {order.address}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="inline-flex h-5 items-center rounded-full bg-slate-900 px-2 text-[10px] font-semibold uppercase tracking-wide text-white">
            {order.status}
          </span>
          <span className="inline-flex h-5 items-center rounded-full border border-slate-200 bg-slate-50 px-2 text-[10px] font-medium text-slate-600">
            <CreditCard className="mr-1 h-3 w-3" />
            {order.pembayaran.status}
          </span>
        </div>
      </div>
    </header>
  );
}

function OrderStatusCard({ order }: OrderStatusCardProps) {
  return (
    <section className="rounded-[14px] border border-slate-200 bg-white px-3 py-3.5 text-xs text-slate-700 sm:px-4 sm:py-4 sm:text-sm">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          Ringkasan Order
        </div>
      </div>
      <dl className="grid grid-cols-2 gap-3">
        <div>
          <dt className="mb-1 flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
            <AlertCircle className="h-3.5 w-3.5 text-slate-400" />
            Status
          </dt>
          <dd className="text-xs font-semibold text-slate-900 sm:text-sm">
            {order.status}
          </dd>
        </div>
        <div>
          <dt className="mb-1 flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
            <CreditCard className="h-3.5 w-3.5 text-slate-400" />
            Payment
          </dt>
          <dd className="text-xs font-semibold text-slate-900 sm:text-sm">
            {order.pembayaran.status} ({order.pembayaran.method})
          </dd>
        </div>
        <div>
          <dt className="mb-1 flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
            <DollarSign className="h-3.5 w-3.5 text-slate-400" />
            Amount
          </dt>
          <dd className="text-xs font-semibold text-slate-900 sm:text-sm">
            Rp {order.pembayaran.amount.toLocaleString("id-ID")}
          </dd>
        </div>
        <div>
          <dt className="mb-1 flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
            Scheduled
          </dt>
          <dd className="text-xs font-semibold text-slate-900 sm:text-sm">
            {formatDateTimeWITA(order.scheduled_date)}
          </dd>
        </div>
      </dl>
    </section>
  );
}

function CustomerCard({ order, onCopy }: CustomerCardProps) {
  const phone = order.user.phone_number || "";

  const waPhone = phone.replace(/[^\d]/g, "");

  return (
    <section className="rounded-[14px] border border-slate-200 bg-white px-3 py-3.5 text-xs text-slate-700 sm:px-4 sm:py-4 sm:text-sm">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          <User className="h-3.5 w-3.5 text-slate-400" />
          Customer
        </div>
      </div>
      <div className="space-y-2.5">
        <div>
          <div className="text-[11px] font-medium text-slate-500">Nama</div>
          <div className="text-xs font-semibold text-slate-900 sm:text-sm">
            {order.user.full_name}
          </div>
        </div>
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-[11px] font-medium text-slate-500">Nomor WhatsApp</div>
            <div className="text-xs font-semibold text-slate-900 sm:text-sm">
              {phone || "-"}
            </div>
          </div>
          <div className="flex flex-shrink-0 items-center gap-1.5">
            <a
              href={phone ? `tel:${phone}` : undefined}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm shadow-emerald-500/30"
              aria-label="Telepon pelanggan"
              title="Telepon pelanggan"
            >
              <PhoneCall className="h-3.5 w-3.5" />
            </a>
            <a
              href={waPhone ? `https://wa.me/${waPhone}` : undefined}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-8 w-8 items-center justify-center rounded-full text-white shadow-sm shadow-emerald-500/30"
              style={{ backgroundColor: "#25D366" }}
              aria-label="Chat via WhatsApp"
              title="Chat via WhatsApp"
            >
              <MessageCircle className="h-3.5 w-3.5" />
            </a>
            <button
              type="button"
              onClick={() =>
                onCopy(
                  phone,
                  "Nomor telepon berhasil disalin, silakan kirimkan ke petugas cleaning.",
                )
              }
              className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-700"
            >
              <Copy className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
        <div>
          <div className="text-[11px] font-medium text-slate-500">Email</div>
          <div className="truncate text-xs font-semibold text-slate-900 sm:text-sm">
            {order.user.email || "-"}
          </div>
        </div>
      </div>
    </section>
  );
}

function SchedulePaymentCard({ order }: SchedulePaymentCardProps) {
  const paymentPending = order.pembayaran.status === "PENDING";

  return (
    <section className="rounded-[14px] border border-slate-200 bg-white px-3 py-3.5 text-xs text-slate-700 sm:px-4 sm:py-4 sm:text-sm">
      <div className="mb-3 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        <Calendar className="h-3.5 w-3.5 text-slate-400" />
        Jadwal & Pembayaran
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-[11px] font-medium text-slate-500">
              Jadwal layanan
            </span>
          </div>
          <div className="text-xs font-semibold text-slate-900 sm:text-sm">
            {formatDateTimeWITA(order.scheduled_date)}
          </div>
        </div>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <DollarSign className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-[11px] font-medium text-slate-500">
              Total pembayaran
            </span>
          </div>
          <div className="text-xs font-semibold text-slate-900 sm:text-sm">
            Rp {order.pembayaran.amount.toLocaleString("id-ID")}
          </div>
        </div>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <CreditCard className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-[11px] font-medium text-slate-500">
              Status pembayaran
            </span>
          </div>
          <div className="text-xs font-semibold text-slate-900 sm:text-sm">
            {order.pembayaran.status}
          </div>
        </div>
        {paymentPending && (
          <div className="mt-2 rounded-[12px] border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-800">
            Pembayaran masih pending. Pastikan status pembayaran sebelum
            menandai pesanan sebagai selesai.
          </div>
        )}
      </div>
    </section>
  );
}

function LocationCard({
  order,
  location,
  googleMapsLink,
  expanded,
  onToggle,
  onCopy,
}: LocationCardProps) {
  const hasLocation = Boolean(location);

  return (
    <section className="rounded-[14px] border border-slate-200 bg-white px-3 py-3.5 text-xs text-slate-700 sm:px-4 sm:py-4 sm:text-sm">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          <MapPin className="h-3.5 w-3.5 text-slate-400" />
          Lokasi
        </div>
        {hasLocation && (
          <button
            type="button"
            onClick={onToggle}
            className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-700"
          >
            {expanded ? "Sembunyikan peta" : "Lihat peta"}
          </button>
        )}
      </div>
      <div className="space-y-3">
        <div className="flex items-start gap-2">
          <MapPin className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-slate-400" />
          <p className="text-xs text-slate-800 sm:text-sm">{order.address}</p>
        </div>
        {hasLocation && (
          <div className="space-y-2">
            {googleMapsLink && (
              <div className="rounded-[10px] border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-600">
                <div className="mb-1 font-medium text-slate-500">
                  Link Google Maps
                </div>
                <div className="break-all text-[11px] text-slate-700">
                  {googleMapsLink}
                </div>
              </div>
            )}
            <div className="flex flex-wrap items-center gap-2">
              {googleMapsLink && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      onCopy(
                        googleMapsLink,
                        "Link berhasil disalin, silakan kirimkan ke petugas cleaning.",
                      )
                    }
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full bg-slate-900 px-3 py-2 text-[11px] font-semibold text-white sm:flex-none sm:px-4"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    Salin link
                  </button>
                  <a
                    href={googleMapsLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border border-slate-300 bg-white px-3 py-2 text-[11px] font-semibold text-slate-800 sm:flex-none sm:px-4"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Buka di Maps
                  </a>
                </>
              )}
            </div>
          </div>
        )}
        {expanded && location && (
          <div className="mt-3 overflow-hidden rounded-[12px] border border-slate-200">
            <OrderLocationMap location={location} />
          </div>
        )}
      </div>
    </section>
  );
}

function PhotoSection({
  beforeUrls,
  afterUrls,
  onOpenPhoto,
}: PhotoSectionProps) {
  const firstBefore = beforeUrls[0];
  const firstAfter = afterUrls[0];

  return (
    <section className="rounded-[14px] border border-slate-200 bg-white px-3 py-3.5 text-xs text-slate-700 sm:px-4 sm:py-4 sm:text-sm">
      <div className="mb-3 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        <Camera className="h-3.5 w-3.5 text-slate-400" />
        Room Photos
      </div>
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <button
          type="button"
          className="flex flex-col rounded-[12px] border border-slate-200 bg-slate-50 p-2 text-left"
          onClick={() =>
            firstBefore &&
            onOpenPhoto({
              url: firstBefore,
              label: "Before Photo",
            })
          }
        >
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="text-[11px] font-medium text-slate-600">
              Before
            </span>
            {beforeUrls.length > 1 && (
              <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-semibold text-white">
                {beforeUrls.length} photos
              </span>
            )}
          </div>
          {firstBefore ? (
            <img
              src={firstBefore}
              alt="Before cleaning"
              loading="lazy"
              className="aspect-video w-full rounded-[10px] border border-slate-200 object-cover"
            />
          ) : (
            <div className="flex aspect-video w-full items-center justify-center rounded-[10px] border border-dashed border-slate-300 text-[11px] text-slate-400">
              No photo
            </div>
          )}
        </button>

        <button
          type="button"
          className="flex flex-col rounded-[12px] border border-slate-200 bg-slate-50 p-2 text-left"
          onClick={() =>
            firstAfter &&
            onOpenPhoto({
              url: firstAfter,
              label: "After Photo",
            })
          }
        >
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="text-[11px] font-medium text-slate-600">
              After
            </span>
            {afterUrls.length > 1 && (
              <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-semibold text-white">
                {afterUrls.length} photos
              </span>
            )}
          </div>
          {firstAfter ? (
            <img
              src={firstAfter}
              alt="After cleaning"
              loading="lazy"
              className="aspect-video w-full rounded-[10px] border border-slate-200 object-cover"
            />
          ) : (
            <div className="flex aspect-video w-full items-center justify-center rounded-[10px] border border-dashed border-slate-300 text-[11px] text-slate-400">
              <div className="text-center">
                <div>Foto akan diunggah oleh pengguna</div>
                <div className="mt-1 text-[10px]">setelah pesanan selesai</div>
              </div>
            </div>
          )}
        </button>
      </div>
    </section>
  );
}

function FeedbackCard({ order }: FeedbackCardProps) {
  return (
    <section className="rounded-[14px] border border-slate-200 bg-white px-3 py-3.5 text-xs text-slate-700 sm:px-4 sm:py-4 sm:text-sm">
      <div className="mb-3 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        <Star className="h-3.5 w-3.5 text-slate-400" />
        Ulasan Pelanggan
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-[12px] border border-slate-200 bg-slate-50 px-3 py-2.5">
          <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
            <Star className="h-3.5 w-3.5 text-slate-400" />
            Rating
          </div>
          {order.rating ? (
            <div className="text-sm font-semibold text-slate-900">
              {order.rating.rating_value}/5
            </div>
          ) : (
            <div className="text-[11px] text-slate-400">Belum ada rating</div>
          )}
        </div>
        <div className="rounded-[12px] border border-slate-200 bg-slate-50 px-3 py-2.5">
          <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
            <Gift className="h-3.5 w-3.5 text-slate-400" />
            Tip
          </div>
          {order.tip ? (
            <div className="text-sm font-semibold text-slate-900">
              Rp {order.tip.amount.toLocaleString("id-ID")}
            </div>
          ) : (
            <div className="text-[11px] text-slate-400">Belum ada tip</div>
          )}
        </div>
      </div>
    </section>
  );
}

function OrderActionBar({
  order,
  busyAction,
  onAssign,
  onMarkCompleted,
  onDelete,
}: OrderActionBarProps) {
  const isCompleted = order.status === "COMPLETED";
  const disableAssign = busyAction !== null || isCompleted;
  const disableComplete = busyAction !== null || isCompleted;

  return (
    <div className="fixed inset-x-0 bottom-[64px] z-50 border-t border-slate-200 bg-white/95 px-3 py-2.5 shadow-[0_-4px_12px_rgba(15,23,42,0.06)] sm:bottom-0 sm:px-4">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onAssign}
          disabled={disableAssign}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-slate-900 px-3 py-2.5 text-xs font-semibold text-white sm:px-4 sm:text-sm disabled:opacity-60"
        >
          {busyAction === "assign" ? (
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          ) : (
            <User className="h-4 w-4" />
          )}
          <span>Tugaskan petugas</span>
        </button>
        <button
          type="button"
          onClick={onMarkCompleted}
          disabled={disableComplete}
          className="hidden min-w-[130px] items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-3 py-2.5 text-xs font-semibold text-slate-900 sm:inline-flex sm:px-4 sm:text-sm disabled:opacity-60"
        >
          {busyAction === "complete" ? (
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-400/60 border-t-slate-700" />
          ) : (
            <CheckCircle2 className="h-4 w-4" />
          )}
          <span>Tandai selesai</span>
        </button>
        <button
          type="button"
          onClick={onDelete}
          disabled={busyAction === "delete"}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-rose-200 bg-rose-50 text-rose-600 disabled:opacity-60"
        >
          {busyAction === "delete" ? (
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-rose-300/70 border-t-rose-600" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );
}

function OrderLocationMap({ location }: OrderLocationMapProps) {
  return (
    <MapContainer
      center={location}
      zoom={15}
      style={{ height: "220px", width: "100%", minHeight: "180px" }}
      scrollWheelZoom={false}
      className="w-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={location} />
    </MapContainer>
  );
}
