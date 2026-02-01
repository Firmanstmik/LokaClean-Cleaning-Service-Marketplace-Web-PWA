/**
 * ADMIN orders list - mobile-friendly compact design.
 *
 * Admin can:
 * - view all incoming orders
 * - assign order to worker/employee (PENDING -> IN_PROGRESS)
 */

import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
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
  ChevronLeft,
  ChevronRight,
  Filter,
  X,
  Search,
  Calendar,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Trash2,
  CheckSquare,
  Square,
} from "lucide-react";

import { api } from "../../lib/api";
import { getApiErrorMessage } from "../../lib/apiError";
import { AnimatedCard } from "../../components/AnimatedCard";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { getPackageGradient } from "../../utils/packageIcon";
import { getPackageImage, getPackageImageAlt } from "../../utils/packageImage";
import type { Pesanan } from "../../types/api";

function formatOrderNumber(orderNumber: number | null | undefined): string {
  if (!orderNumber) return "-";
  return `LC-${orderNumber.toString().padStart(4, "0")}`;
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, { bg: string; text: string; icon: typeof CheckCircle2 }> = {
    PENDING: {
      bg: "from-amber-500 to-orange-600",
      text: "text-amber-50",
      icon: Clock,
    },
    IN_PROGRESS: {
      bg: "from-purple-500 to-pink-600",
      text: "text-purple-50",
      icon: Activity,
    },
    COMPLETED: {
      bg: "from-emerald-500 to-teal-600",
      text: "text-emerald-50",
      icon: CheckCircle2,
    },
  };

  const variant = variants[status] || variants.PENDING;
  const Icon = variant.icon;

  return (
    <div className={`inline-flex items-center gap-1 rounded-full bg-gradient-to-r ${variant.bg} px-2 py-0.5 text-xs font-black ${variant.text} shadow-sm`}>
      <Icon className="h-3 w-3" />
      <span>{status}</span>
    </div>
  );
}

function PaymentBadge({ status }: { status: string }) {
  const isPaid = status === "PAID";
  return (
    <div className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-xs font-black ${
      isPaid
        ? "bg-emerald-100 text-emerald-700"
        : "bg-amber-100 text-amber-700"
    }`}>
      <CreditCard className="h-3 w-3" />
      {status}
    </div>
  );
}

export function AdminOrdersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState<Pesanan[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; order: Pesanan | null }>({
    isOpen: false,
    order: null
  });
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState<{ isOpen: boolean; orderIds: number[] }>({
    isOpen: false,
    orderIds: []
  });
  const [selectedOrders, setSelectedOrders] = useState<Set<number>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>(searchParams.get("filter") || "ALL");
  const [paymentFilter, setPaymentFilter] = useState<string>("ALL");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [monthFilter, setMonthFilter] = useState<string>("ALL");
  const [yearFilter, setYearFilter] = useState<string>("ALL");
  const [timeFrom, setTimeFrom] = useState<string>("");
  const [timeTo, setTimeTo] = useState<string>("");
  const [showDateFilters, setShowDateFilters] = useState(false);
  const itemsPerPage = 10;

  async function refresh() {
    setLoading(true);
    try {
      const resp = await api.get("/admin/orders");
      setItems(resp.data.data.items as Pesanan[]);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  // Check URL params on mount
  useEffect(() => {
    const filterParam = searchParams.get("filter");
    if (filterParam && ["ALL", "PENDING", "IN_PROGRESS", "COMPLETED"].includes(filterParam)) {
      setStatusFilter(filterParam);
    }
  }, [searchParams]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const resp = await api.get("/admin/orders");
        if (alive) setItems(resp.data.data.items as Pesanan[]);
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

  // Filter and search logic
  const filteredItems = items.filter((item) => {
    const matchesSearch = 
      searchQuery === "" ||
      item.user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.paket.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "ALL" || item.status === statusFilter;
    const matchesPayment = paymentFilter === "ALL" || item.pembayaran.status === paymentFilter;
    
    // Date filters
    const orderDate = new Date(item.created_at);
    let matchesDate = true;
    
    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      fromDate.setHours(0, 0, 0, 0);
      if (orderDate < fromDate) matchesDate = false;
    }
    
    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      if (orderDate > toDate) matchesDate = false;
    }
    
    // Month filter
    if (monthFilter !== "ALL") {
      const month = parseInt(monthFilter);
      if (orderDate.getMonth() !== month) matchesDate = false;
    }
    
    // Year filter
    if (yearFilter !== "ALL") {
      const year = parseInt(yearFilter);
      if (orderDate.getFullYear() !== year) matchesDate = false;
    }
    
    // Time filters
    if (timeFrom) {
      const [hours, minutes] = timeFrom.split(":").map(Number);
      const fromTime = hours * 60 + minutes;
      const orderTime = orderDate.getHours() * 60 + orderDate.getMinutes();
      if (orderTime < fromTime) matchesDate = false;
    }
    
    if (timeTo) {
      const [hours, minutes] = timeTo.split(":").map(Number);
      const toTime = hours * 60 + minutes;
      const orderTime = orderDate.getHours() * 60 + orderDate.getMinutes();
      if (orderTime > toTime) matchesDate = false;
    }
    
    return matchesSearch && matchesStatus && matchesPayment && matchesDate;
  });

  // Get unique years and months from items
  const availableYears = Array.from(
    new Set(items.map(item => new Date(item.created_at).getFullYear()))
  ).sort((a, b) => b - a);
  
  const currentYear = new Date().getFullYear();
  const months = [
    { value: "0", label: "January" },
    { value: "1", label: "February" },
    { value: "2", label: "March" },
    { value: "3", label: "April" },
    { value: "4", label: "May" },
    { value: "5", label: "June" },
    { value: "6", label: "July" },
    { value: "7", label: "August" },
    { value: "8", label: "September" },
    { value: "9", label: "October" },
    { value: "10", label: "November" },
    { value: "11", label: "December" },
  ];

  // Pagination logic
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedItems = filteredItems.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, paymentFilter, dateFrom, dateTo, monthFilter, yearFilter, timeFrom, timeTo]);

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Compact Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between gap-3"
      >
        <div className="flex items-center gap-3">
          <Package className="h-7 w-7 sm:h-8 sm:w-8 text-indigo-600" />
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-transparent">
                Orders
              </h1>
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="inline-flex items-center justify-center min-w-[28px] h-7 px-2.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-black shadow-md shadow-indigo-500/30"
              >
                {filteredItems.length}
              </motion.span>
            </div>
            <p className="mt-2 text-sm text-slate-600 font-medium">Manage and track all customer orders</p>
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.05, rotate: 180 }}
          whileTap={{ scale: 0.95 }}
          onClick={refresh}
          className="flex items-center gap-1.5 rounded-xl border-2 border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50 hover:shadow-md"
        >
          <RefreshCw className="h-4 w-4" />
          <span className="hidden sm:inline">Refresh</span>
        </motion.button>
      </motion.div>

      {/* Success message */}
      <AnimatePresence>
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 p-4 text-sm text-emerald-700 shadow-lg"
          >
            <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-emerald-600" />
            <span className="font-semibold">{successMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bulk Actions Bar */}
      {selectedOrders.size > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="flex items-center justify-between gap-3 rounded-xl border-2 border-indigo-200 bg-gradient-to-r from-indigo-50 to-purple-50 p-4 shadow-lg"
        >
          <div className="flex items-center gap-3">
            <CheckSquare className="h-5 w-5 text-indigo-600" />
            <span className="text-sm font-bold text-slate-900">
              {selectedOrders.size} order{selectedOrders.size > 1 ? 's' : ''} selected
            </span>
          </div>
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedOrders(new Set())}
              className="rounded-lg border-2 border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition-all hover:border-slate-400 hover:bg-slate-50"
            >
              Clear Selection
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setBulkDeleteConfirm({ isOpen: true, orderIds: Array.from(selectedOrders) });
              }}
              disabled={busyId !== null}
              className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-red-600 to-rose-600 px-4 py-2 text-sm font-bold text-white shadow-lg transition-all hover:shadow-xl disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
              Delete Selected ({selectedOrders.size})
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* Filters and Search */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-3"
      >
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by customer, address, or package..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border-2 border-slate-200 bg-white pl-10 pr-4 py-2.5 text-sm font-medium text-slate-900 placeholder-slate-400 transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              aria-label="Clear search"
              title="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Filter Chips - Status and Payment */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
            <Filter className="h-4 w-4" />
            Quick Filters:
          </div>
          
          {/* Status Filter */}
          <div className="flex flex-wrap gap-2">
            {["ALL", "PENDING", "IN_PROGRESS", "COMPLETED"].map((status) => (
              <motion.button
                key={status}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  statusFilter === status
                    ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {status}
              </motion.button>
            ))}
          </div>

          {/* Payment Filter */}
          <div className="flex flex-wrap gap-2">
            {["ALL", "PAID", "PENDING"].map((payment) => (
              <motion.button
                key={payment}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setPaymentFilter(payment)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  paymentFilter === payment
                    ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {payment}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Date/Time Filter Toggle Button - Mobile Friendly */}
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={() => setShowDateFilters(!showDateFilters)}
          className={`w-full flex items-center justify-between rounded-xl border-2 px-4 py-3 text-sm font-bold transition-all ${
            showDateFilters || dateFrom || dateTo || monthFilter !== "ALL" || yearFilter !== "ALL" || timeFrom || timeTo
              ? "border-indigo-300 bg-indigo-50 text-indigo-700"
              : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
          }`}
        >
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>Date & Time Filters</span>
            {(dateFrom || dateTo || monthFilter !== "ALL" || yearFilter !== "ALL" || timeFrom || timeTo) && (
              <span className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-xs font-black text-white">
                {(dateFrom ? 1 : 0) + (dateTo ? 1 : 0) + (monthFilter !== "ALL" ? 1 : 0) + (yearFilter !== "ALL" ? 1 : 0) + (timeFrom ? 1 : 0) + (timeTo ? 1 : 0)}
              </span>
            )}
          </div>
          {showDateFilters ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </motion.button>

        {/* Date and Time Filters - Collapsible */}
        <AnimatePresence>
          {showDateFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="space-y-3 pt-3 border-t border-slate-200">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {/* Date From */}
                  <div>
                    <label htmlFor="date-from" className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                      <Calendar className="h-3.5 w-3.5 text-slate-500" />
                      Date From
                    </label>
                    <input
                      id="date-from"
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="w-full rounded-lg border-2 border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
                    />
                    {dateFrom && (
                      <button
                        onClick={() => setDateFrom("")}
                        className="mt-1 text-xs text-slate-500 hover:text-slate-700"
                        aria-label="Clear date from"
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  {/* Date To */}
                  <div>
                    <label htmlFor="date-to" className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                      <Calendar className="h-3.5 w-3.5 text-slate-500" />
                      Date To
                    </label>
                    <input
                      id="date-to"
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      min={dateFrom || undefined}
                      className="w-full rounded-lg border-2 border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
                    />
                    {dateTo && (
                      <button
                        onClick={() => setDateTo("")}
                        className="mt-1 text-xs text-slate-500 hover:text-slate-700"
                        aria-label="Clear date to"
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  {/* Month Filter */}
                  <div>
                    <label htmlFor="month-filter" className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                      <Calendar className="h-3.5 w-3.5 text-slate-500" />
                      Month
                    </label>
                    <select
                      id="month-filter"
                      value={monthFilter}
                      onChange={(e) => setMonthFilter(e.target.value)}
                      className="w-full rounded-lg border-2 border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
                    >
                      <option value="ALL">All Months</option>
                      {months.map((month) => (
                        <option key={month.value} value={month.value}>
                          {month.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Year Filter */}
                  <div>
                    <label htmlFor="year-filter" className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                      <Calendar className="h-3.5 w-3.5 text-slate-500" />
                      Year
                    </label>
                    <select
                      id="year-filter"
                      value={yearFilter}
                      onChange={(e) => setYearFilter(e.target.value)}
                      className="w-full rounded-lg border-2 border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
                    >
                      <option value="ALL">All Years</option>
                      {availableYears.map((year) => (
                        <option key={year} value={year.toString()}>
                          {year}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Time Range */}
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label htmlFor="time-from" className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                      <Clock className="h-3.5 w-3.5 text-slate-500" />
                      Time From
                    </label>
                    <input
                      id="time-from"
                      type="time"
                      value={timeFrom}
                      onChange={(e) => setTimeFrom(e.target.value)}
                      className="w-full rounded-lg border-2 border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
                    />
                    {timeFrom && (
                      <button
                        onClick={() => setTimeFrom("")}
                        className="mt-1 text-xs text-slate-500 hover:text-slate-700"
                        aria-label="Clear time from"
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  <div>
                    <label htmlFor="time-to" className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                      <Clock className="h-3.5 w-3.5 text-slate-500" />
                      Time To
                    </label>
                    <input
                      id="time-to"
                      type="time"
                      value={timeTo}
                      onChange={(e) => setTimeTo(e.target.value)}
                      min={timeFrom || undefined}
                      className="w-full rounded-lg border-2 border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
                    />
                    {timeTo && (
                      <button
                        onClick={() => setTimeTo("")}
                        className="mt-1 text-xs text-slate-500 hover:text-slate-700"
                        aria-label="Clear time to"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                {/* Clear All Date/Time Filters Button */}
                {(dateFrom || dateTo || monthFilter !== "ALL" || yearFilter !== "ALL" || timeFrom || timeTo) && (
                  <div className="pt-2">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setDateFrom("");
                        setDateTo("");
                        setMonthFilter("ALL");
                        setYearFilter("ALL");
                        setTimeFrom("");
                        setTimeTo("");
                      }}
                      className="w-full flex items-center justify-center gap-2 rounded-lg border-2 border-slate-300 bg-slate-50 px-4 py-2 text-sm font-bold text-slate-700 transition-all hover:border-slate-400 hover:bg-slate-100"
                    >
                      <X className="h-4 w-4" />
                      Clear All Date/Time Filters
                    </motion.button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Loading skeleton */}
      {loading && items.length === 0 ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.1 }}
              className="h-48 rounded-2xl bg-gradient-to-r from-slate-100 via-slate-50 to-slate-100 animate-shimmer"
            />
          ))}
        </div>
      ) : null}

      {/* Compact Orders List - Mobile Friendly */}
      <AnimatePresence mode="wait">
        {!loading && (
          <div className="space-y-3">
            {/* Select All Checkbox */}
            {paginatedItems.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2 rounded-lg border-2 border-slate-200 bg-slate-50 p-3"
              >
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    const allSelected = paginatedItems.every(o => selectedOrders.has(o.id));
                    if (allSelected) {
                      // Deselect all on current page
                      const newSelected = new Set(selectedOrders);
                      paginatedItems.forEach(o => newSelected.delete(o.id));
                      setSelectedOrders(newSelected);
                    } else {
                      // Select all on current page
                      const newSelected = new Set(selectedOrders);
                      paginatedItems.forEach(o => newSelected.add(o.id));
                      setSelectedOrders(newSelected);
                    }
                  }}
                  className="flex items-center gap-2 text-sm font-bold text-slate-700"
                >
                  {paginatedItems.every(o => selectedOrders.has(o.id)) ? (
                    <CheckSquare className="h-5 w-5 text-indigo-600" />
                  ) : (
                    <Square className="h-5 w-5 text-slate-400" />
                  )}
                  <span>Select All ({paginatedItems.length})</span>
                </motion.button>
              </motion.div>
            )}

            {paginatedItems.map((o, index) => (
              <motion.div
                key={o.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.03 }}
                className={`group relative overflow-hidden rounded-xl border-2 p-3 sm:p-4 shadow-[0_4px_12px_rgba(0,0,0,0.08),0_2px_4px_rgba(0,0,0,0.04)] transition-all hover:shadow-[0_8px_24px_rgba(0,0,0,0.12),0_4px_8px_rgba(0,0,0,0.08)] max-w-full ${
                  selectedOrders.has(o.id)
                    ? "border-indigo-500 bg-indigo-50"
                    : "border-slate-200 bg-white hover:border-indigo-300"
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Checkbox */}
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      const newSelected = new Set(selectedOrders);
                      if (newSelected.has(o.id)) {
                        newSelected.delete(o.id);
                      } else {
                        newSelected.add(o.id);
                      }
                      setSelectedOrders(newSelected);
                    }}
                    className="flex-shrink-0 mt-1"
                  >
                    {selectedOrders.has(o.id) ? (
                      <CheckSquare className="h-5 w-5 text-indigo-600" />
                    ) : (
                      <Square className="h-5 w-5 text-slate-400" />
                    )}
                  </motion.button>
                  {/* Compact Package Image */}
                  <motion.div
                    whileHover={{ rotate: [0, -10, 10, 0], scale: 1.05 }}
                    className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${getPackageGradient(o.paket.name)} shadow-lg shadow-black/10 overflow-hidden`}
                  >
                    <motion.img
                      src={getPackageImage(o.paket.name, o.paket.image)}
                      alt={getPackageImageAlt(o.paket.name)}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </motion.div>

                  {/* Order Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-slate-500 mb-1">ORDER {formatOrderNumber(o.order_number)}</div>
                        <h3 className="text-base sm:text-lg font-black text-slate-900 truncate">{o.paket.name}</h3>
                        <div className="mt-1.5 space-y-1">
                          <div className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-600">
                            <User className="h-3 w-3 text-slate-400 flex-shrink-0" />
                            <span className="truncate">{o.user.full_name}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-600">
                            <MapPin className="h-3 w-3 text-slate-400 flex-shrink-0" />
                            <span className="truncate">{o.address}</span>
                          </div>
                        </div>
                      </div>

                      {/* Status Badges - Compact */}
                      <div className="flex flex-col items-end gap-1.5">
                        <StatusBadge status={o.status} />
                        <PaymentBadge status={o.pembayaran.status} />
                      </div>
                    </div>

                    {/* Action Buttons - Compact */}
                    <div className="mt-3 flex items-center gap-2 border-t border-slate-100 pt-3">
                      <Link to={`/admin/orders/${o.id}`} className="flex-1">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="w-full flex items-center justify-center gap-1.5 rounded-lg border-2 border-indigo-200 bg-indigo-50 px-3 py-2 text-sm font-black text-indigo-700 transition-all hover:border-indigo-300 hover:bg-indigo-100"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Details
                        </motion.button>
                      </Link>

                      {o.status === "PENDING" && (
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          disabled={busyId === o.id}
                          onClick={async () => {
                            setBusyId(o.id);
                            setError(null);
                            try {
                              // Assign order to admin and set status to IN_PROGRESS (creates notification for user)
                              await api.patch(`/admin/orders/${o.id}/assign`);
                              await refresh();
                            } catch (err) {
                              setError(getApiErrorMessage(err));
                            } finally {
                              setBusyId(null);
                            }
                          }}
                          className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 px-3 py-2 text-xs sm:text-sm font-black text-white shadow-lg transition-all hover:shadow-xl disabled:opacity-50"
                        >
                          {busyId === o.id ? (
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                              className="h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white"
                            />
                          ) : (
                            <>
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              <span className="hidden sm:inline">Konfirmasi/Tugaskan Petugas</span>
                              <span className="sm:hidden">Tugaskan</span>
                            </>
                          )}
                        </motion.button>
                      )}

                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        disabled={busyId === o.id}
                        onClick={() => {
                          setDeleteConfirm({ isOpen: true, order: o });
                        }}
                        className="flex items-center justify-center gap-1.5 rounded-lg border-2 border-rose-200 bg-rose-50 px-3 py-2 text-xs sm:text-sm font-black text-rose-700 transition-all hover:border-rose-300 hover:bg-rose-100 disabled:opacity-50"
                      >
                        {busyId === o.id ? (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="h-3.5 w-3.5 rounded-full border-2 border-rose-300 border-t-rose-600"
                          />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </motion.button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}

            {/* Empty state */}
            {filteredItems.length === 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 p-8 text-center shadow-[0_2px_8px_rgba(0,0,0,0.06),0_1px_3px_rgba(0,0,0,0.04)]"
              >
                <Package className="h-12 w-12 text-slate-300" />
                <p className="mt-3 text-sm font-black text-slate-600">
                  {items.length === 0 ? "No orders yet" : "No orders match your filters"}
                </p>
                <p className="mt-1 text-xs font-semibold text-slate-500">
                  {items.length === 0 ? "New orders will appear here" : "Try adjusting your filters"}
                </p>
              </motion.div>
            )}
          </div>
        )}
      </AnimatePresence>

      {/* Pagination */}
      {filteredItems.length > itemsPerPage && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between gap-3 rounded-xl border-2 border-slate-200 bg-white p-4 shadow-[0_4px_12px_rgba(0,0,0,0.08),0_2px_4px_rgba(0,0,0,0.04)]"
        >
          <div className="text-sm font-semibold text-slate-600">
            Showing {startIndex + 1}-{Math.min(endIndex, filteredItems.length)} of {filteredItems.length} orders
          </div>
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="flex items-center gap-1.5 rounded-lg border-2 border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 transition-all hover:border-indigo-300 hover:bg-indigo-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </motion.button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <motion.button
                  key={page}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 rounded-lg text-sm font-bold transition-all ${
                    currentPage === page
                      ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {page}
                </motion.button>
              ))}
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="flex items-center gap-1.5 rounded-lg border-2 border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 transition-all hover:border-indigo-300 hover:bg-indigo-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* Modern Confirm Dialog for Delete */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, order: null })}
        onConfirm={async () => {
          if (!deleteConfirm.order) return;
          
          setBusyId(deleteConfirm.order.id);
          setError(null);
          setSuccessMessage(null);
          try {
            await api.delete(`/admin/orders/${deleteConfirm.order.id}`);
            setDeleteConfirm({ isOpen: false, order: null });
            setSuccessMessage(`Pesanan ${formatOrderNumber(deleteConfirm.order.order_number)} berhasil dihapus!`);
            
            // Auto-hide success message after 3 seconds
            setTimeout(() => {
              setSuccessMessage(null);
            }, 3000);
            
            // Remove from selected if it was selected
            const newSelected = new Set(selectedOrders);
            newSelected.delete(deleteConfirm.order.id);
            setSelectedOrders(newSelected);
            
            await refresh();
          } catch (err) {
            setError(getApiErrorMessage(err));
            setSuccessMessage(null);
            setDeleteConfirm({ isOpen: false, order: null });
          } finally {
            setBusyId(null);
          }
        }}
        title="Hapus Pesanan?"
        message={`Nomor Pesanan: ${formatOrderNumber(deleteConfirm.order?.order_number)}\nPaket: ${deleteConfirm.order?.paket.name}\nStatus: ${deleteConfirm.order?.status}\n\nApakah Anda yakin ingin menghapus pesanan ini?\nTindakan ini TIDAK DAPAT DIBATALKAN.`}
        confirmText="Ya, Hapus"
        cancelText="Batal"
        variant="danger"
        isLoading={busyId === deleteConfirm.order?.id}
      />

      {/* Bulk Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={bulkDeleteConfirm.isOpen}
        onClose={() => setBulkDeleteConfirm({ isOpen: false, orderIds: [] })}
        onConfirm={async () => {
          if (bulkDeleteConfirm.orderIds.length === 0) return;
          
          setBusyId(-1); // Use -1 to indicate bulk operation
          setError(null);
          setSuccessMessage(null);
          try {
            await api.post("/admin/orders/bulk-delete", {
              ids: bulkDeleteConfirm.orderIds
            });
            setBulkDeleteConfirm({ isOpen: false, orderIds: [] });
            setSuccessMessage(`${bulkDeleteConfirm.orderIds.length} pesanan berhasil dihapus!`);
            
            // Clear selection
            setSelectedOrders(new Set());
            
            // Auto-hide success message after 3 seconds
            setTimeout(() => {
              setSuccessMessage(null);
            }, 3000);
            
            await refresh();
          } catch (err) {
            setError(getApiErrorMessage(err));
            setSuccessMessage(null);
            setBulkDeleteConfirm({ isOpen: false, orderIds: [] });
          } finally {
            setBusyId(null);
          }
        }}
        title="Hapus Pesanan Terpilih?"
        message={`Anda akan menghapus ${bulkDeleteConfirm.orderIds.length} pesanan.\n\nTindakan ini TIDAK DAPAT DIBATALKAN.\n\nApakah Anda yakin ingin melanjutkan?`}
        confirmText="Ya, Hapus Semua"
        cancelText="Batal"
        variant="danger"
        isLoading={busyId === -1}
      />
    </div>
  );
}
