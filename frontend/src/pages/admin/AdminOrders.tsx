import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Package,
  User,
  MapPin,
  CreditCard,
  Clock,
  Eye,
  Activity,
  AlertCircle,
  CheckCircle2,
  Filter,
  X,
  Search,
  Calendar,
  RefreshCw,
  Trash2,
  CheckSquare,
  Square,
} from "lucide-react";
import { api } from "../../lib/api";
import { getApiErrorMessage } from "../../lib/apiError";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { getPackageImage, getPackageImageAlt } from "../../utils/packageImage";
import type { Pesanan } from "../../types/api";

type DeleteState = {
  isOpen: boolean;
  order: Pesanan | null;
};

type OrdersHeaderProps = {
  visibleCount: number;
  totalCount: number;
  loading: boolean;
  onRefresh: () => void;
  performanceMode: boolean;
  onPerformanceChange: (value: boolean) => void;
};

type OrdersSearchProps = {
  value: string;
  onChange: (value: string) => void;
};

type OrdersFilterBarProps = {
  statusFilter: string;
  paymentFilter: string;
  onStatusChange: (value: string) => void;
  onPaymentChange: (value: string) => void;
};

type OrdersDateFilterProps = {
  open: boolean;
  dateFrom: string;
  dateTo: string;
  onToggle: () => void;
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
};

type PerformanceToggleProps = {
  value: boolean;
  onChange: (value: boolean) => void;
};

type OrderCardProps = {
  order: Pesanan;
  selected: boolean;
  onSelectToggle: (id: number) => void;
  onAssign: (id: number) => void;
  onDeleteClick: (order: Pesanan) => void;
  busy: boolean;
  performanceMode: boolean;
};

type OrdersPaginationProps = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

function formatOrderNumber(orderNumber: number | string | null | undefined) {
  if (!orderNumber && orderNumber !== 0) return "-";
  const num = Number(orderNumber);
  if (Number.isNaN(num)) return String(orderNumber);
  return num.toString().padStart(4, "0");
}

function StatusBadge({ status }: { status: string }) {
  const normalized = status.toUpperCase();

  let label = normalized;
  let color = "bg-slate-100 text-slate-700 border-slate-200";
  let icon = <Activity className="h-3 w-3" />;

  if (normalized === "PENDING") {
    label = "Pending";
    color = "bg-amber-50 text-amber-700 border-amber-200";
    icon = <Clock className="h-3 w-3" />;
  } else if (normalized === "IN_PROGRESS") {
    label = "Sedang Dikerjakan";
    color = "bg-sky-50 text-sky-700 border-sky-200";
    icon = <Activity className="h-3 w-3" />;
  } else if (normalized === "COMPLETED") {
    label = "Selesai";
    color = "bg-emerald-50 text-emerald-700 border-emerald-200";
    icon = <CheckCircle2 className="h-3 w-3" />;
  } else if (normalized === "CANCELLED") {
    label = "Dibatalkan";
    color = "bg-rose-50 text-rose-700 border-rose-200";
    icon = <AlertCircle className="h-3 w-3" />;
  }

  return (
    <span
      className={`inline-flex h-5 items-center gap-1 rounded-full border px-2.5 text-[11px] font-semibold ${color}`}
    >
      {icon}
      <span className="truncate max-w-[120px]">{label}</span>
    </span>
  );
}

function PaymentBadge({ status }: { status: string }) {
  const normalized = status.toUpperCase();

  let label = normalized;
  let color = "bg-slate-100 text-slate-700 border-slate-200";

  if (normalized === "PAID") {
    label = "Lunas";
    color = "bg-emerald-50 text-emerald-700 border-emerald-200";
  } else if (normalized === "PENDING") {
    label = "Menunggu";
    color = "bg-amber-50 text-amber-700 border-amber-200";
  } else if (normalized === "FAILED") {
    label = "Gagal";
    color = "bg-rose-50 text-rose-700 border-rose-200";
  }

  return (
    <span
      className={`inline-flex h-5 items-center gap-1 rounded-full border px-2.5 text-[11px] font-semibold ${color}`}
    >
      <CreditCard className="h-3 w-3" />
      <span>{label}</span>
    </span>
  );
}

export function AdminOrdersPage() {
  const [searchParams] = useSearchParams();

  const [items, setItems] = useState<Pesanan[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteState>({
    isOpen: false,
    order: null,
  });
  const [selectedOrders, setSelectedOrders] = useState<Set<number>>(new Set());

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>(
    searchParams.get("filter") || "ALL",
  );
  const [paymentFilter, setPaymentFilter] = useState<string>("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showDateFilters, setShowDateFilters] = useState(false);

  const [performanceMode, setPerformanceMode] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try {
      return localStorage.getItem("lokaclean_admin_orders_perf_mode") === "1";
    } catch {
      return false;
    }
  });

  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const filterParam = searchParams.get("filter");
    if (filterParam && filterParam !== statusFilter) {
      setStatusFilter(filterParam);
    }
  }, [searchParams, statusFilter]);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get("/admin/orders");
      const data = response.data?.data?.items as Pesanan[] | undefined;
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
    }, 300);
    return () => window.clearTimeout(id);
  }, [searchQuery]);

  const handleRefresh = useCallback(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handlePerformanceChange = useCallback((value: boolean) => {
    setPerformanceMode(value);
    try {
      localStorage.setItem("lokaclean_admin_orders_perf_mode", value ? "1" : "0");
    } catch {
      // ignore
    }
  }, []);

  const filteredItems = useMemo(() => {
    if (!items.length) return [];

    const q = debouncedSearch.toLowerCase();

    return items.filter((item) => {
      const searchMatch =
        !q ||
        item.user.full_name.toLowerCase().includes(q) ||
        item.address.toLowerCase().includes(q) ||
        item.paket.name.toLowerCase().includes(q) ||
        formatOrderNumber(item.order_number).toLowerCase().includes(q);

      const statusMatch =
        statusFilter === "ALL" || item.status.toUpperCase() === statusFilter;

      const paymentStatus = item.pembayaran?.status?.toUpperCase() ?? "";
      const paymentMatch =
        paymentFilter === "ALL" || paymentStatus === paymentFilter;

      let dateMatch = true;
      if (dateFrom || dateTo) {
        const createdAt = new Date(item.created_at);
        if (Number.isNaN(createdAt.getTime())) {
          dateMatch = false;
        } else {
          if (dateFrom) {
            const from = new Date(dateFrom);
            from.setHours(0, 0, 0, 0);
            if (createdAt < from) dateMatch = false;
          }
          if (dateTo) {
            const to = new Date(dateTo);
            to.setHours(23, 59, 59, 999);
            if (createdAt > to) dateMatch = false;
          }
        }
      }

      return searchMatch && statusMatch && paymentMatch && dateMatch;
    });
  }, [items, debouncedSearch, statusFilter, paymentFilter, dateFrom, dateTo]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, statusFilter, paymentFilter, dateFrom, dateTo, performanceMode]);

  const itemsPerPage = performanceMode ? 15 : 10;

  const totalPages = Math.max(
    1,
    Math.ceil(filteredItems.length / itemsPerPage || 1),
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedItems = useMemo(() => {
    if (!filteredItems.length) return [];
    const start = (currentPage - 1) * itemsPerPage;
    return filteredItems.slice(start, start + itemsPerPage);
  }, [filteredItems, currentPage, itemsPerPage]);

  const handleToggleSelect = useCallback((id: number) => {
    setSelectedOrders((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleAssign = useCallback(
    async (id: number) => {
      setBusyId(id);
      setError(null);
      try {
        await api.patch(`/admin/orders/${id}/assign`);
        await fetchOrders();
      } catch (err) {
        setError(getApiErrorMessage(err));
      } finally {
        setBusyId(null);
      }
    },
    [fetchOrders],
  );

  const handleOpenDelete = useCallback((order: Pesanan) => {
    setDeleteConfirm({ isOpen: true, order });
  }, []);

  const handleCloseDelete = useCallback(() => {
    setDeleteConfirm({ isOpen: false, order: null });
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteConfirm.order) return;

    const id = deleteConfirm.order.id;

    setBusyId(id);
    setError(null);
    setSuccessMessage(null);

    try {
      await api.delete(`/admin/orders/${id}`);
      setSuccessMessage(
        `Pesanan ${formatOrderNumber(
          deleteConfirm.order.order_number,
        )} berhasil dihapus.`,
      );

      setSelectedOrders((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });

      await fetchOrders();

      window.setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusyId(null);
      setDeleteConfirm({ isOpen: false, order: null });
    }
  }, [deleteConfirm, fetchOrders]);

  return (
    <div className="space-y-4 bg-slate-50 px-0 py-0 sm:space-y-5">
      <OrdersHeader
        visibleCount={filteredItems.length}
        totalCount={items.length}
        loading={loading}
        onRefresh={handleRefresh}
        performanceMode={performanceMode}
        onPerformanceChange={handlePerformanceChange}
      />

      {successMessage && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800 sm:text-sm">
          {successMessage}
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 sm:text-sm">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-3">
        <OrdersSearch value={searchQuery} onChange={setSearchQuery} />
        <div className="space-y-2">
          <OrdersFilterBar
            statusFilter={statusFilter}
            paymentFilter={paymentFilter}
            onStatusChange={setStatusFilter}
            onPaymentChange={setPaymentFilter}
          />
          <OrdersDateFilter
            open={showDateFilters}
            dateFrom={dateFrom}
            dateTo={dateTo}
            onToggle={() => setShowDateFilters((prev) => !prev)}
            onDateFromChange={setDateFrom}
            onDateToChange={setDateTo}
          />
        </div>
      </div>

      {loading && items.length === 0 && <OrdersSkeleton />}

      {!loading && filteredItems.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-8 text-center">
          <Package className="h-10 w-10 text-slate-300" />
          <p className="mt-3 text-sm font-semibold text-slate-700">
            {items.length === 0
              ? "Belum ada pesanan"
              : "Tidak ada pesanan yang cocok dengan filter"}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {items.length === 0
              ? "Pesanan baru akan muncul di sini"
              : "Coba ubah filter atau kata kunci pencarian"}
          </p>
        </div>
      )}

      {!loading && paginatedItems.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span>
              Menampilkan {paginatedItems.length} dari {filteredItems.length}{" "}
              pesanan
            </span>
            <span>
              Halaman {currentPage} dari {totalPages}
            </span>
          </div>

          <div className="space-y-2.5">
            {paginatedItems.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                selected={selectedOrders.has(order.id)}
                onSelectToggle={handleToggleSelect}
                onAssign={handleAssign}
                onDeleteClick={handleOpenDelete}
                busy={busyId === order.id}
                performanceMode={performanceMode}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <OrdersPagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          )}
        </div>
      )}

      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={handleCloseDelete}
        onConfirm={handleConfirmDelete}
        title="Hapus Pesanan?"
        message={
          deleteConfirm.order
            ? `Nomor Pesanan: ${formatOrderNumber(
                deleteConfirm.order.order_number,
              )}\nPaket: ${deleteConfirm.order.paket.name}\nStatus: ${
                deleteConfirm.order.status
              }\n\nApakah Anda yakin ingin menghapus pesanan ini?\nTindakan ini TIDAK DAPAT DIBATALKAN.`
            : ""
        }
        confirmText="Ya, Hapus"
        cancelText="Batal"
        variant="danger"
        isLoading={busyId === deleteConfirm.order?.id}
      />
    </div>
  );
}

function OrdersHeader({
  visibleCount,
  totalCount,
  loading,
  onRefresh,
  performanceMode,
  onPerformanceChange,
}: OrdersHeaderProps) {
  return (
    <div className="flex h-[60px] items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-slate-100">
          <Package className="h-5 w-5 text-slate-700" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="truncate text-base font-semibold text-slate-900">
              Pesanan
            </h1>
            <span className="inline-flex h-5 min-w-[22px] items-center justify-center rounded-full bg-slate-900 px-1.5 text-[11px] font-semibold text-white">
              {visibleCount}
            </span>
          </div>
          <p className="mt-0.5 text-[11px] text-slate-500">
            Kelola dan pantau pesanan pelanggan · {totalCount} pesanan
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <PerformanceToggle value={performanceMode} onChange={onPerformanceChange} />
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 disabled:opacity-60"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function OrdersSearch({ value, onChange }: OrdersSearchProps) {
  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        type="text"
        placeholder="Cari nama pelanggan, alamat, atau nomor pesanan..."
        className="h-10 w-full rounded-full border border-slate-200 bg-slate-50 pl-9 pr-9 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:outline-none focus:ring-0 sm:text-sm"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          aria-label="Clear search"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

function OrdersFilterBar({
  statusFilter,
  paymentFilter,
  onStatusChange,
  onPaymentChange,
}: OrdersFilterBarProps) {
  const statusOptions: { value: string; label: string }[] = [
    { value: "ALL", label: "Semua Status" },
    { value: "PENDING", label: "Pending" },
    { value: "IN_PROGRESS", label: "Proses" },
    { value: "COMPLETED", label: "Selesai" },
  ];

  const paymentOptions: { value: string; label: string }[] = [
    { value: "ALL", label: "Semua Pembayaran" },
    { value: "PAID", label: "Lunas" },
    { value: "PENDING", label: "Menunggu" },
    { value: "FAILED", label: "Gagal" },
  ];

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 text-[11px] font-medium text-slate-500">
        <Filter className="h-3.5 w-3.5" />
        <span>Filter cepat</span>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {statusOptions.map((option) => {
          const active = statusFilter === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onStatusChange(option.value)}
              className={`whitespace-nowrap rounded-full px-3 text-[11px] font-medium transition-colors ${
                active
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              } h-8`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {paymentOptions.map((option) => {
          const active = paymentFilter === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onPaymentChange(option.value)}
              className={`whitespace-nowrap rounded-full px-3 text-[11px] font-medium transition-colors ${
                active
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              } h-8`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function OrdersDateFilter({
  open,
  dateFrom,
  dateTo,
  onToggle,
  onDateFromChange,
  onDateToChange,
}: OrdersDateFilterProps) {
  const hasActive = Boolean(dateFrom || dateTo);

  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between px-3 py-2.5 text-xs font-medium text-slate-700"
      >
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-slate-500" />
          <span>Filter tanggal</span>
          {hasActive && (
            <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-semibold text-white">
              Aktif
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 text-[11px] text-slate-500">
          <span>{open ? "Tutup" : "Buka"}</span>
          <ChevronIcon open={open} />
        </div>
      </button>
      {open && (
        <div className="border-t border-slate-100 px-3 py-3 text-xs text-slate-700">
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="flex-1">
              <label className="mb-1 block text-[11px] font-medium text-slate-500">
                Dari tanggal
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => onDateFromChange(e.target.value)}
                className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 px-2 text-xs text-slate-900 focus:border-slate-400 focus:bg-white focus:outline-none focus:ring-0"
              />
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-[11px] font-medium text-slate-500">
                Sampai tanggal
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => onDateToChange(e.target.value)}
                className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 px-2 text-xs text-slate-900 focus:border-slate-400 focus:bg-white focus:outline-none focus:ring-0"
              />
            </div>
          </div>
          {hasActive && (
            <button
              type="button"
              onClick={() => {
                onDateFromChange("");
                onDateToChange("");
              }}
              className="mt-3 inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-slate-700"
            >
              <X className="h-3 w-3" />
              <span>Reset tanggal</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function PerformanceToggle({ value, onChange }: PerformanceToggleProps) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600"
    >
      <span className="text-[11px]">⚡ Mode ringan</span>
      <span
        className={`flex h-4 w-8 items-center rounded-full ${
          value ? "bg-emerald-500" : "bg-slate-300"
        }`}
      >
        <span
          className={`h-3 w-3 rounded-full bg-white transition-transform ${
            value ? "translate-x-4" : "translate-x-1"
          }`}
        />
      </span>
      <span className="text-[10px] font-semibold text-slate-500">
        {value ? "Aktif" : "Mati"}
      </span>
    </button>
  );
}

const OrderCard = memo(function OrderCard({
  order,
  selected,
  onSelectToggle,
  onAssign,
  onDeleteClick,
  busy,
  performanceMode,
}: OrderCardProps) {
  const paymentStatus = order.pembayaran?.status ?? "PENDING";

  const cardBase =
    "group relative overflow-hidden rounded-[14px] border px-3 py-3 sm:px-4 sm:py-3.5 transition-colors";
  const cardTone = performanceMode
    ? "border-slate-200 bg-white"
    : "border-slate-200 bg-white";

  return (
    <div className={`${cardBase} ${cardTone}`}>
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={() => onSelectToggle(order.id)}
          aria-label={selected ? "Batalkan pilih pesanan" : "Pilih pesanan"}
          className="mt-1 flex-shrink-0 text-slate-500"
        >
          {selected ? (
            <CheckSquare className="h-5 w-5 text-slate-900" />
          ) : (
            <Square className="h-5 w-5" />
          )}
        </button>

        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100">
          <img
            src={getPackageImage(order.paket.name, order.paket.image)}
            alt={getPackageImageAlt(order.paket.name)}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="mb-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                ORDER {formatOrderNumber(order.order_number)}
              </div>
              <h3 className="truncate text-sm font-semibold text-slate-900 sm:text-[15px]">
                {order.paket.name}
              </h3>
              <div className="mt-1.5 space-y-1">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-600 sm:text-xs">
                  <User className="h-3 w-3 flex-shrink-0 text-slate-400" />
                  <span className="truncate">{order.user.full_name}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-600 sm:text-xs">
                  <MapPin className="h-3 w-3 flex-shrink-0 text-slate-400" />
                  <span className="truncate">{order.address}</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <StatusBadge status={order.status} />
              <PaymentBadge status={paymentStatus} />
              {!performanceMode && (
                <button
                  type="button"
                  onClick={() => onDeleteClick(order)}
                  disabled={busy}
                  className="mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-full border border-rose-200 bg-rose-50 text-rose-600 hover:border-rose-300 hover:bg-rose-100 disabled:opacity-60"
                  aria-label="Hapus pesanan"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2 border-t border-slate-100 pt-2.5">
            <Link to={`/admin/orders/${order.id}`} className="flex-1">
              <button
                type="button"
                className={`flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border px-3 text-xs font-semibold sm:text-sm ${
                  performanceMode
                    ? "border-slate-300 bg-white text-slate-900"
                    : "border-slate-200 bg-slate-50 text-slate-900 hover:bg-white"
                }`}
              >
                <Eye className="h-3.5 w-3.5" />
                <span>Detail</span>
              </button>
            </Link>

            {order.status === "PENDING" && (
              <button
                type="button"
                onClick={() => onAssign(order.id)}
                disabled={busy}
                className={`flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-semibold text-white sm:text-sm ${
                  performanceMode
                    ? "bg-slate-900 disabled:opacity-60"
                    : "bg-slate-900 hover:bg-black disabled:opacity-60"
                }`}
              >
                {busy ? (
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                ) : (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                )}
                <span className="hidden sm:inline">Tugaskan</span>
                <span className="sm:hidden">Tugaskan</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

function OrdersPagination({
  currentPage,
  totalPages,
  onPageChange,
}: OrdersPaginationProps) {
  if (totalPages <= 1) return null;

  const canPrev = currentPage > 1;
  const canNext = currentPage < totalPages;

  return (
    <div className="flex items-center justify-center gap-2 pt-1 text-xs text-slate-600">
      <button
        type="button"
        onClick={() => canPrev && onPageChange(currentPage - 1)}
        disabled={!canPrev}
        className="inline-flex h-8 items-center rounded-full border border-slate-200 bg-white px-3 disabled:opacity-50"
      >
        Sebelumnya
      </button>
      <span className="px-2 text-[11px]">
        Halaman {currentPage} dari {totalPages}
      </span>
      <button
        type="button"
        onClick={() => canNext && onPageChange(currentPage + 1)}
        disabled={!canNext}
        className="inline-flex h-8 items-center rounded-full border border-slate-200 bg-white px-3 disabled:opacity-50"
      >
        Berikutnya
      </button>
    </div>
  );
}

function OrdersSkeleton() {
  return (
    <div className="space-y-2.5">
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={index}
          className="h-[84px] w-full rounded-[14px] border border-slate-200 bg-slate-100/60"
        />
      ))}
    </div>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <span
      className={`inline-block h-3 w-3 transform text-slate-500 ${
        open ? "rotate-180" : "rotate-0"
      }`}
    >
      <svg viewBox="0 0 20 20" fill="currentColor">
        <path d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" />
      </svg>
    </span>
  );
}
