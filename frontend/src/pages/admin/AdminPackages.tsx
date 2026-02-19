import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertCircle,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  BarChart3,
  Brain,
  CheckCircle2,
  DollarSign,
  Download,
  Edit2,
  Filter,
  Package,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";

import { api } from "../../lib/api";
import { getApiErrorMessage } from "../../lib/apiError";
import { getPackageImage, getPackageImageAlt } from "../../utils/packageImage";
import { PackageForm } from "../../components/admin/PackageForm";
import type { PaketCleaning } from "../../types/api";

type PackageStatus = "ACTIVE" | "INACTIVE";

type SortKey = "name" | "price" | "orders" | "revenue" | "conversionRate";

interface PackageWithMetrics extends PaketCleaning {
  orders: number;
  revenue: number;
  conversionRate: number;
  status: PackageStatus;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);

export function AdminPackagesPage() {
  const [items, setItems] = useState<PaketCleaning[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; package: PaketCleaning | null }>({
    show: false,
    package: null,
  });

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | PackageStatus>("ALL");
  const [priceFilter, setPriceFilter] = useState<"ALL" | "LOW" | "MID" | "HIGH">("ALL");
  const [revenueFilter, setRevenueFilter] = useState<"ALL" | "HAS_REVENUE" | "NO_REVENUE">("ALL");
  const [sortBy, setSortBy] = useState<SortKey>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  async function refresh() {
    const resp = await api.get("/admin/packages");
    setItems(resp.data.data.items as PaketCleaning[]);
  }

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const resp = await api.get("/admin/packages");
        if (alive) setItems(resp.data.data.items as PaketCleaning[]);
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

  const handleCreate = async (formData: FormData) => {
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
        await api.post("/admin/packages", formData, {
            headers: { "Content-Type": "multipart/form-data" }
        });
        setSuccess("Paket berhasil dibuat");
        setShowAddForm(false);
        await refresh();
        setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
        setError(getApiErrorMessage(err));
    } finally {
        setBusy(false);
    }
  };

  const handleUpdate = async (id: number, formData: FormData) => {
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      await api.put(`/admin/packages/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setSuccess("Paket berhasil diperbarui");
      setEditingId(null);
      await refresh();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const packagesWithMetrics = useMemo<PackageWithMetrics[]>(() => {
    return items.map((pkg) => {
      const orders = pkg.totalReviews ?? 0;
      const revenue = orders * pkg.price;
      let conversionRate = 0;
      if (orders > 0) {
        const base = pkg.averageRating ?? 3;
        conversionRate = Math.min(95, Math.max(5, Math.round(base * 15)));
      }
      const status: PackageStatus = pkg.stock === 0 ? "INACTIVE" : "ACTIVE";
      return { ...pkg, orders, revenue, conversionRate, status };
    });
  }, [items]);

  const filteredPackages = useMemo(() => {
    let result = packagesWithMetrics;

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (pkg) =>
          pkg.name.toLowerCase().includes(q) ||
          pkg.description.toLowerCase().includes(q) ||
          pkg.name_en?.toLowerCase().includes(q) ||
          pkg.description_en?.toLowerCase().includes(q),
      );
    }

    if (statusFilter !== "ALL") {
      result = result.filter((pkg) => pkg.status === statusFilter);
    }

    if (priceFilter !== "ALL") {
      result = result.filter((pkg) => {
        if (priceFilter === "LOW") return pkg.price < 100_000;
        if (priceFilter === "MID") return pkg.price >= 100_000 && pkg.price <= 300_000;
        return pkg.price > 300_000;
      });
    }

    if (revenueFilter !== "ALL") {
      result = result.filter((pkg) =>
        revenueFilter === "HAS_REVENUE" ? pkg.revenue > 0 : pkg.revenue === 0,
      );
    }

    return result;
  }, [packagesWithMetrics, search, statusFilter, priceFilter, revenueFilter]);

  const sortedPackages = useMemo(() => {
    const sorted = [...filteredPackages];
    sorted.sort((a, b) => {
      const dir = sortDirection === "asc" ? 1 : -1;
      if (sortBy === "name") {
        return a.name.localeCompare(b.name) * dir;
      }
      if (sortBy === "price") {
        return (a.price - b.price) * dir;
      }
      if (sortBy === "orders") {
        return (a.orders - b.orders) * dir;
      }
      if (sortBy === "revenue") {
        return (a.revenue - b.revenue) * dir;
      }
      return (a.conversionRate - b.conversionRate) * dir;
    });
    return sorted;
  }, [filteredPackages, sortBy, sortDirection]);

  const pageSize = 10;

  const totalPages = Math.max(1, Math.ceil(sortedPackages.length / pageSize || 1));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedPackages = useMemo(() => {
    if (!sortedPackages.length) return [];
    const start = (currentPage - 1) * pageSize;
    return sortedPackages.slice(start, start + pageSize);
  }, [sortedPackages, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, priceFilter, revenueFilter]);

  useEffect(() => {
    setSelectedIds([]);
  }, [items]);

  const totalPackages = items.length;
  const totalOrdersAll = packagesWithMetrics.reduce((sum, pkg) => sum + pkg.orders, 0);
  const totalRevenueAll = packagesWithMetrics.reduce((sum, pkg) => sum + pkg.revenue, 0);
  const averageOrderValue = totalOrdersAll > 0 ? totalRevenueAll / totalOrdersAll : 0;

  const topPackage =
    packagesWithMetrics.length > 0
      ? packagesWithMetrics.reduce((best, pkg) => (pkg.revenue > best.revenue ? pkg : best))
      : null;

  const handleSort = (key: SortKey) => {
    if (sortBy === key) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(key);
      setSortDirection(key === "name" ? "asc" : "desc");
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((existing) => existing !== id) : [...prev, id],
    );
  };

  const toggleSelectAllVisible = () => {
    const visibleIds = paginatedPackages.map((pkg) => pkg.id);
    const allSelected = visibleIds.every((id) => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
    }
  };

  const handleBulkDelete = async () => {
    if (!selectedIds.length) return;
    const confirmed = window.confirm(
      `Hapus ${selectedIds.length} paket terpilih? Tindakan ini tidak dapat dibatalkan.`,
    );
    if (!confirmed) return;
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      for (const id of selectedIds) {
        await api.delete(`/admin/packages/${id}`);
      }
      setSuccess(`Berhasil menghapus ${selectedIds.length} paket.`);
      setSelectedIds([]);
      await refresh();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const handleExportCsv = () => {
    const header = [
      "ID",
      "Nama",
      "Harga",
      "Pesanan",
      "Pendapatan",
      "Konversi",
      "Status",
    ].join(",");
    const rows = packagesWithMetrics.map((pkg) =>
      [
        pkg.id,
        `"${pkg.name.replace(/"/g, '""')}"`,
        pkg.price,
        pkg.orders,
        pkg.revenue,
        `${pkg.conversionRate}%`,
        pkg.status,
      ].join(","),
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "packages.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const editingPackage = editingId ? items.find((pkg) => pkg.id === editingId) : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-slate-800 dark:text-blue-400">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
                Service Packages
              </h1>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                Manage pricing, revenue, and performance
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full sm:w-56">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search packages..."
              className="w-full rounded-full border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 shadow-sm outline-none ring-0 transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-50"
            />
          </div>
          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-sm transition hover:border-slate-400 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-sm transition hover:border-slate-400 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
          >
            <Filter className="h-4 w-4" />
            Filters
          </button>
          <button
            type="button"
            onClick={() => {
              setShowAddForm(true);
              setEditingId(null);
            }}
            className="inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-60"
            disabled={busy}
          >
            <Plus className="h-4 w-4" />
            Add Package
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-sm dark:border-red-700/60 dark:bg-red-950/40 dark:text-red-200">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-medium">Terjadi kesalahan</p>
            <p className="mt-0.5 text-xs text-red-700/90 dark:text-red-200/80">{error}</p>
          </div>
          <button
            type="button"
            onClick={() => setError(null)}
            className="ml-2 text-red-600 hover:text-red-800 dark:text-red-300 dark:hover:text-red-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {success && (
        <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 shadow-sm dark:border-emerald-700/60 dark:bg-emerald-950/40 dark:text-emerald-200">
          <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-medium">Berhasil</p>
            <p className="mt-0.5 text-xs text-emerald-700/90 dark:text-emerald-200/80">{success}</p>
          </div>
          <button
            type="button"
            onClick={() => setSuccess(null)}
            className="ml-2 text-emerald-600 hover:text-emerald-800 dark:text-emerald-300 dark:hover:text-emerald-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {selectedIds.length > 0 && (
        <div className="sticky top-0 z-20 flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[11px] font-semibold text-white dark:bg-slate-100 dark:text-slate-900">
              {selectedIds.length} selected
            </span>
            <span className="hidden text-[11px] text-slate-500 sm:inline">
              Bulk actions for pricing and status
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={handleBulkDelete}
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-full border border-red-300 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-red-700 shadow-sm transition hover:border-red-400 hover:bg-red-50 disabled:opacity-60 dark:border-red-700 dark:bg-slate-900 dark:text-red-300 dark:hover:bg-red-950/30"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete Selected
            </button>
            <button
              type="button"
              disabled
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-2.5 py-1.5 text-[11px] font-medium text-slate-600 shadow-sm opacity-60 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-300"
            >
              Activate
            </button>
            <button
              type="button"
              disabled
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-2.5 py-1.5 text-[11px] font-medium text-slate-600 shadow-sm opacity-60 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-300"
            >
              Deactivate
            </button>
            <button
              type="button"
              disabled
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-2.5 py-1.5 text-[11px] font-medium text-slate-600 shadow-sm opacity-60 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-300"
            >
              Bulk Price Update
            </button>
          </div>
        </div>
      )}

      {loading && items.length === 0 ? (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900"
              >
                <div className="h-3 w-20 rounded bg-slate-200 dark:bg-slate-700" />
                <div className="mt-4 h-7 w-28 rounded bg-slate-200 dark:bg-slate-700" />
                <div className="mt-3 h-3 w-16 rounded bg-slate-200 dark:bg-slate-700" />
              </div>
            ))}
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="mb-3 h-4 w-full rounded bg-slate-200 last:mb-0 dark:bg-slate-700"
              />
            ))}
          </div>
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Total Packages
                  </div>
                  <div className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-50">
                    {totalPackages}
                  </div>
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-slate-800 dark:text-blue-400">
                  <Package className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                Active in catalog
              </div>
            </div>

            <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Total Revenue
                  </div>
                  <div className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-50">
                    {formatCurrency(totalRevenueAll)}
                  </div>
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-slate-800 dark:text-emerald-400">
                  <DollarSign className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3 inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-300">
                <ArrowUp className="h-3 w-3" />
                <span>Revenue by package (approximation)</span>
              </div>
            </div>

            <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Top Package
                  </div>
                  <div className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-50">
                    {topPackage ? topPackage.name : "No data yet"}
                  </div>
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-50 text-purple-600 dark:bg-slate-800 dark:text-purple-400">
                  <Activity className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                {topPackage
                  ? `${formatCurrency(topPackage.revenue)} estimated revenue`
                  : "Waiting for orders"}
              </div>
            </div>

            <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Average Order Value
                  </div>
                  <div className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-50">
                    {formatCurrency(Number.isFinite(averageOrderValue) ? averageOrderValue : 0)}
                  </div>
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  <BarChart3 className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                Based on package-level revenue
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-4 lg:col-span-2">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs shadow-sm dark:border-slate-700 dark:bg-slate-900">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Filters
                  </span>
                  <select
                    value={statusFilter}
                    onChange={(e) =>
                      setStatusFilter(e.target.value as "ALL" | PackageStatus)
                    }
                    className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700 shadow-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                  >
                    <option value="ALL">Status: All</option>
                    <option value="ACTIVE">Status: Active</option>
                    <option value="INACTIVE">Status: Inactive</option>
                  </select>
                  <select
                    value={priceFilter}
                    onChange={(e) =>
                      setPriceFilter(e.target.value as "ALL" | "LOW" | "MID" | "HIGH")
                    }
                    className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700 shadow-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                  >
                    <option value="ALL">Price: All</option>
                    <option value="LOW">Price: &lt; 100K</option>
                    <option value="MID">Price: 100K - 300K</option>
                    <option value="HIGH">Price: &gt; 300K</option>
                  </select>
                  <select
                    value={revenueFilter}
                    onChange={(e) =>
                      setRevenueFilter(
                        e.target.value as "ALL" | "HAS_REVENUE" | "NO_REVENUE",
                      )
                    }
                    className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700 shadow-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                  >
                    <option value="ALL">Revenue: All</option>
                    <option value="HAS_REVENUE">Revenue: &gt; 0</option>
                    <option value="NO_REVENUE">Revenue: 0</option>
                  </select>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  Showing {paginatedPackages.length} of {sortedPackages.length} packages
                </div>
              </div>

              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
                <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
                  <div className="font-medium uppercase tracking-wide">Packages</div>
                  <div>
                    Page {currentPage} of {totalPages}
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse text-sm">
                    <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
                      <tr>
                        <th className="px-4 py-3 text-left">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-slate-600"
                            onChange={toggleSelectAllVisible}
                            checked={
                              paginatedPackages.length > 0 &&
                              paginatedPackages.every((pkg) =>
                                selectedIds.includes(pkg.id),
                              )
                            }
                            aria-label="Select all visible"
                          />
                        </th>
                        <th className="px-4 py-3 text-left">
                          <button
                            type="button"
                            onClick={() => handleSort("name")}
                            className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-50"
                          >
                            Package Name
                            <ArrowUpDown className="h-3 w-3" />
                          </button>
                        </th>
                        <th className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleSort("price")}
                            className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-50"
                          >
                            Price
                            <ArrowUpDown className="h-3 w-3" />
                          </button>
                        </th>
                        <th className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleSort("orders")}
                            className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-50"
                          >
                            Orders
                            <ArrowUpDown className="h-3 w-3" />
                          </button>
                        </th>
                        <th className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleSort("revenue")}
                            className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-50"
                          >
                            Revenue
                            <ArrowUpDown className="h-3 w-3" />
                          </button>
                        </th>
                        <th className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleSort("conversionRate")}
                            className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-50"
                          >
                            Conversion
                            <ArrowUpDown className="h-3 w-3" />
                          </button>
                        </th>
                        <th className="px-4 py-3 text-left">Status</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {paginatedPackages.length === 0 ? (
                        <tr>
                          <td
                            colSpan={8}
                            className="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400"
                          >
                            No packages found. Adjust filters or create a new package.
                          </td>
                        </tr>
                      ) : (
                        paginatedPackages.map((pkg) => {
                          const isSelected = selectedIds.includes(pkg.id);
                          const statusLabel =
                            pkg.status === "ACTIVE" ? "Active" : "Inactive";
                          const statusClasses =
                            pkg.status === "ACTIVE"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800"
                              : "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700";
                          const conversionColor =
                            pkg.conversionRate >= 50
                              ? "text-emerald-600 dark:text-emerald-300"
                              : pkg.conversionRate > 0
                              ? "text-amber-600 dark:text-amber-300"
                              : "text-slate-400 dark:text-slate-500";

                          return (
                            <tr
                              key={pkg.id}
                              className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60"
                            >
                              <td className="px-4 py-3 align-top">
                                <input
                                  type="checkbox"
                                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-slate-600"
                                  checked={isSelected}
                                  onChange={() => toggleSelect(pkg.id)}
                                  aria-label={`Select package ${pkg.name}`}
                                />
                              </td>
                              <td className="px-4 py-3 align-top">
                                <div className="flex items-start gap-3">
                                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
                                    <img
                                      src={getPackageImage(pkg.name, pkg.image)}
                                      alt={getPackageImageAlt(pkg.name)}
                                      className="h-full w-full object-cover"
                                      onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.src = getPackageImage(pkg.name);
                                      }}
                                    />
                                  </div>
                                  <div className="min-w-0">
                                    <div className="truncate text-sm font-medium text-slate-900 dark:text-slate-50">
                                      {pkg.name}
                                    </div>
                                    <div className="mt-1 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">
                                      {pkg.description}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="whitespace-nowrap px-4 py-3 text-right align-top text-sm text-slate-900 dark:text-slate-50">
                                {formatCurrency(pkg.price)}
                              </td>
                              <td className="whitespace-nowrap px-4 py-3 text-right align-top text-sm text-slate-700 dark:text-slate-200">
                                {pkg.orders}
                              </td>
                              <td className="whitespace-nowrap px-4 py-3 text-right align-top text-sm text-slate-900 dark:text-slate-50">
                                {formatCurrency(pkg.revenue)}
                                <div className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                                  This month
                                </div>
                              </td>
                              <td className="whitespace-nowrap px-4 py-3 text-right align-top text-sm">
                                <span className={`inline-flex items-center gap-1 ${conversionColor}`}>
                                  {pkg.conversionRate > 0 ? (
                                    pkg.conversionRate >= 50 ? (
                                      <ArrowUp className="h-3 w-3" />
                                    ) : (
                                      <ArrowDown className="h-3 w-3" />
                                    )
                                  ) : null}
                                  <span>{pkg.conversionRate}%</span>
                                </span>
                              </td>
                              <td className="px-4 py-3 align-top">
                                <span
                                  className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium ${statusClasses}`}
                                >
                                  {statusLabel}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right align-top">
                                <div className="flex justify-end gap-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingId(pkg.id);
                                      setShowAddForm(false);
                                    }}
                                    className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white px-2.5 py-1.5 text-[11px] font-medium text-slate-700 shadow-sm transition hover:border-blue-500 hover:text-blue-600 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-blue-400 dark:hover:text-blue-300"
                                  >
                                    <Edit2 className="h-3.5 w-3.5" />
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    disabled={busy}
                                    onClick={() =>
                                      setDeleteConfirm({ show: true, package: pkg })
                                    }
                                    className="inline-flex items-center gap-1 rounded-full border border-red-300 bg-white px-2.5 py-1.5 text-[11px] font-medium text-red-700 shadow-sm transition hover:border-red-400 hover:bg-red-50 disabled:opacity-60 dark:border-red-700 dark:bg-slate-900 dark:text-red-300 dark:hover:bg-red-950/30"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-xs text-slate-600 dark:border-slate-800 dark:text-slate-400">
                  <div>
                    Showing {(currentPage - 1) * pageSize + 1}-
                    {(currentPage - 1) * pageSize + paginatedPackages.length} of{" "}
                    {sortedPackages.length}
                  </div>
                  <div className="inline-flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="inline-flex items-center rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:border-slate-400 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      Prev
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                      }
                      disabled={currentPage === totalPages}
                      className="inline-flex items-center rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:border-slate-400 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                      <h2 className="text-sm font-medium text-slate-900 dark:text-slate-50">
                        Revenue by Package
                      </h2>
                    </div>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      Estimated revenue distribution across active packages
                    </p>
                  </div>
                </div>
                {packagesWithMetrics.length === 0 || totalRevenueAll === 0 ? (
                  <div className="flex h-32 items-center justify-center text-xs text-slate-500 dark:text-slate-400">
                    No revenue data available yet.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {packagesWithMetrics
                      .slice()
                      .sort((a, b) => b.revenue - a.revenue)
                      .slice(0, 5)
                      .map((pkg) => {
                        const percentage =
                          totalRevenueAll > 0
                            ? Math.max(4, Math.round((pkg.revenue / totalRevenueAll) * 100))
                            : 0;
                        return (
                          <div key={pkg.id} className="space-y-1.5">
                            <div className="flex items-center justify-between text-xs">
                              <span className="truncate text-slate-700 dark:text-slate-200">
                                {pkg.name}
                              </span>
                              <span className="whitespace-nowrap text-slate-500 dark:text-slate-400">
                                {formatCurrency(pkg.revenue)} · {percentage}%
                              </span>
                            </div>
                            <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800">
                              <div
                                className="h-2 rounded-full bg-blue-600 dark:bg-blue-500"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      <span className="flex h-3 w-3 items-center justify-center rounded-full bg-blue-500 text-white">
                        <Brain className="h-2 w-2" />
                      </span>
                      AI Insights
                    </div>
                    <h2 className="mt-2 text-sm font-medium text-slate-900 dark:text-slate-50">
                      Pricing and performance overview
                    </h2>
                  </div>
                </div>
                <div className="mt-4 space-y-2 text-xs text-slate-600 dark:text-slate-300">
                  {topPackage ? (
                    <>
                      <p>
                        Your{" "}
                        <span className="font-semibold text-slate-900 dark:text-slate-50">
                          {topPackage.name}
                        </span>{" "}
                        package generates approximately{" "}
                        <span className="font-semibold">
                          {Math.round(
                            (topPackage.revenue / (totalRevenueAll || 1)) * 100,
                          )}
                          %
                        </span>{" "}
                        of total package revenue.
                      </p>
                      <p>
                        Average order value across all packages is{" "}
                        <span className="font-semibold">
                          {formatCurrency(
                            Number.isFinite(averageOrderValue) ? averageOrderValue : 0,
                          )}
                        </span>
                        , indicating current price positioning.
                      </p>
                    </>
                  ) : (
                    <p>
                      Once orders start coming in, you will see AI-style pricing insights
                      and performance highlights here.
                    </p>
                  )}
                  <p>
                    Use revenue and conversion columns to identify which packages deserve
                    promotion, pricing adjustments, or bundling strategies.
                  </p>
                </div>
                <button
                  type="button"
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-blue-500 hover:text-blue-600 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-blue-400 dark:hover:text-blue-300"
                  onClick={() => {
                    console.log("Auto Optimize Pricing clicked");
                  }}
                >
                  <Activity className="h-3.5 w-3.5" />
                  Auto Optimize Pricing
                </button>
              </div>
            </div>
          </div>

          {(showAddForm || editingPackage) && (
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-medium text-slate-900 dark:text-slate-50">
                    {editingPackage ? "Edit Package" : "Add New Package"}
                  </h2>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {editingPackage
                      ? "Update pricing, description, and image for this package."
                      : "Create a new package to offer in your catalog."}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingId(null);
                  }}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-300 text-slate-500 hover:border-slate-400 hover:text-slate-700 dark:border-slate-600 dark:text-slate-300 dark:hover:border-slate-500 dark:hover:text-slate-100"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <PackageForm
                initialValues={editingPackage ?? undefined}
                onSubmit={(data) =>
                  editingPackage ? handleUpdate(editingPackage.id, data) : handleCreate(data)
                }
                onCancel={() => {
                  setShowAddForm(false);
                  setEditingId(null);
                }}
                busy={busy}
                submitLabel={editingPackage ? "Save Changes" : "Create Package"}
                loadingLabel={editingPackage ? "Saving..." : "Creating..."}
                isEditing={Boolean(editingPackage)}
              />
            </div>
          )}
        </>
      )}

      {deleteConfirm.show && deleteConfirm.package && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4"
          onClick={() => setDeleteConfirm({ show: false, package: null })}
        >
          <div
            className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-lg dark:border-slate-700 dark:bg-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-300">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                  Hapus Paket
                </h3>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Paket akan dihapus secara permanen dari katalog.
                </p>
              </div>
            </div>
            <div className="mt-4 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-200">
              Anda yakin ingin menghapus paket{" "}
              <span className="font-semibold text-slate-900 dark:text-slate-50">
                "{deleteConfirm.package.name}"
              </span>
              ?
            </div>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setDeleteConfirm({ show: false, package: null })}
                className="flex-1 rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 shadow-sm transition hover:border-slate-400 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={async () => {
                  const pkg = deleteConfirm.package!;
                  setDeleteConfirm({ show: false, package: null });
                  setBusy(true);
                  setError(null);
                  setSuccess(null);
                  try {
                    await api.delete(`/admin/packages/${pkg.id}`);
                    setSuccess(`Paket "${pkg.name}" berhasil dihapus.`);
                    await refresh();
                    setTimeout(() => setSuccess(null), 3000);
                  } catch (err) {
                    setError(getApiErrorMessage(err));
                  } finally {
                    setBusy(false);
                  }
                }}
                className="flex-1 rounded-full bg-red-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:opacity-60"
              >
                Hapus Paket
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
