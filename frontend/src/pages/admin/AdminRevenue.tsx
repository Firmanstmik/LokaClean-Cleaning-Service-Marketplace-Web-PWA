/**
 * ADMIN revenue monitoring page with premium charts and professional analytics.
 * 
 * Note: Inline styles are intentionally used for dynamic colors from data (chart status colors).
 * This is necessary because colors are determined at runtime based on order status.
 */

import { useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  Calendar,
  Download,
  Filter,
  DollarSign,
  Heart,
  Package,
  TrendingUp,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import { api } from "../../lib/api";
import { getApiErrorMessage } from "../../lib/apiError";
import { formatDateWITA } from "../../utils/date";
import type { Pesanan } from "../../types/api";

interface RevenueData {
  totalRevenue: number;
  totalTipRevenue: number;
  totalOrders: number;
  paidOrders: number;
  pendingOrders: number;
  monthlyData: Array<{ month: string; revenue: number; tipRevenue: number; orders: number; monthKey: string }>;
  statusData: Array<{ status: string; count: number; fill?: string }>;
}

const STATUS_COLORS: Record<string, string> = {
  "Pending": "#f59e0b",      // Amber
  "Processing": "#3b82f6",   // Blue
  "In Progress": "#8b5cf6",  // Purple
  "Selesai": "#10b981",      // Emerald/Green
  "Unknown": "#6b7280",      // Gray
};


export function AdminRevenuePage() {
  type OrderWithRelations = Pesanan & {
    pembayaran?: {
      status?: string;
      amount?: number | null;
    } | null;
    tip?: {
      amount?: number | null;
    } | null;
  };

  const [data, setData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>("ALL");
  const [selectedYear, setSelectedYear] = useState<string>("ALL");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        // Fetch orders data
        const resp = await api.get("/admin/orders");
        const orders = (resp.data.data.items || []) as OrderWithRelations[];

        // Calculate revenue data (excluding tip)
        const totalRevenue = orders.reduce((sum: number, order: OrderWithRelations) => {
          if (order.pembayaran?.status === "PAID") {
            return sum + (order.pembayaran.amount || 0);
          }
          return sum;
        }, 0);

        // Calculate tip revenue
        const totalTipRevenue = orders.reduce((sum: number, order: OrderWithRelations) => {
          if (order.tip?.amount) {
            return sum + (order.tip.amount || 0);
          }
          return sum;
        }, 0);

        const totalOrders = orders.length;
        const paidOrders = orders.filter((o) => o.pembayaran?.status === "PAID").length;
        const pendingOrders = orders.filter((o) => o.pembayaran?.status === "PENDING").length;

        // Monthly data (last 12 months) - with tip revenue
        const monthlyMap = new Map<string, { revenue: number; tipRevenue: number; orders: number; monthKey: string; month: string }>();
        orders.forEach((order) => {
          if (order.pembayaran?.status === "PAID") {
            const date = new Date(order.created_at);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
            const monthLabel = formatDateWITA(order.created_at, { month: "short", year: "numeric", timeZone: "Asia/Makassar" });
            const existing = monthlyMap.get(monthKey) || { revenue: 0, tipRevenue: 0, orders: 0, monthKey, month: monthLabel };
            monthlyMap.set(monthKey, {
              revenue: existing.revenue + (order.pembayaran.amount || 0),
              tipRevenue: existing.tipRevenue + (order.tip?.amount || 0),
              orders: existing.orders + 1,
              monthKey,
              month: monthLabel,
            });
          }
        });
        const monthlyData = Array.from(monthlyMap.values())
          .sort((a, b) => a.monthKey.localeCompare(b.monthKey))
          .slice(-12)
          .map(({ monthKey, month, ...rest }) => ({ month, monthKey, ...rest }));

        // Status data - include COMPLETED status for user verified completions
        const statusLabels: Record<string, string> = {
          PENDING: "Pending",
          PROCESSING: "Processing",
          IN_PROGRESS: "In Progress",
          COMPLETED: "Selesai",
          UNKNOWN: "Unknown",
        };
        
        // Initialize all statuses with 0 count
        const statusMap = new Map<string, number>();
        Object.values(statusLabels).forEach((label) => {
          statusMap.set(label, 0);
        });
        
        // Count orders by status
        orders.forEach((order) => {
          const status = order.status || "UNKNOWN";
          // Map status to readable label, COMPLETED shows as "Selesai" when user verified
          const displayStatus = statusLabels[status] || status;
          statusMap.set(displayStatus, (statusMap.get(displayStatus) || 0) + 1);
        });
        
        // Convert to array, filter out zero counts except for important statuses, and sort
        const statusOrder = ["Pending", "Processing", "In Progress", "Selesai"];
        const statusData = Array.from(statusMap.entries())
          .map(([status, count]) => ({
            status,
            count,
            fill: STATUS_COLORS[status] || "#6b7280",
          }))
          // Filter: keep all statuses that have count > 0, OR keep "Selesai" always visible
          .filter(({ status, count }) => count > 0 || status === "Selesai")
          .sort((a, b) => {
            const aIndex = statusOrder.indexOf(a.status);
            const bIndex = statusOrder.indexOf(b.status);
            if (aIndex === -1 && bIndex === -1) return a.status.localeCompare(b.status);
            if (aIndex === -1) return 1;
            if (bIndex === -1) return -1;
            return aIndex - bIndex;
          });

        if (alive) {
          setData({
            totalRevenue,
            totalTipRevenue,
            totalOrders,
            paidOrders,
            pendingOrders,
            monthlyData,
            statusData,
          });
        }
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

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-4 w-32 rounded bg-slate-200 animate-pulse" />
            <div className="h-3 w-48 rounded bg-slate-200 animate-pulse" />
          </div>
          <div className="hidden gap-2 sm:flex">
            <div className="h-9 w-28 rounded-full bg-slate-200 animate-pulse" />
            <div className="h-9 w-24 rounded-full bg-slate-200 animate-pulse" />
            <div className="h-9 w-32 rounded-full bg-slate-200 animate-pulse" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="h-3 w-24 rounded bg-slate-200 animate-pulse" />
              <div className="mt-4 h-7 w-32 rounded bg-slate-200 animate-pulse" />
              <div className="mt-3 h-3 w-20 rounded bg-slate-200 animate-pulse" />
            </div>
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="h-72 rounded-xl border border-slate-200 bg-white shadow-sm animate-pulse lg:col-span-2" />
          <div className="h-72 rounded-xl border border-slate-200 bg-white shadow-sm animate-pulse" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-rose-500/40 dark:bg-rose-500/5">
        <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-red-50 dark:bg-rose-500/20">
          <AlertCircle className="h-6 w-6 text-red-600 dark:text-rose-200" />
        </div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
          Gagal memuat data pendapatan
        </h2>
        <p className="mt-2 text-sm text-red-600 dark:text-rose-200">{error}</p>
      </div>
    );
  }

  if (!data) return null;
  
  // Average monthly revenue (exclude tip)
  const avgMonthlyRevenue = data.monthlyData.length > 0 
    ? data.monthlyData.reduce((sum, month) => sum + month.revenue, 0) / data.monthlyData.length 
    : 0;

  // Generate years from 2026 to 2035
  const availableYears = Array.from({ length: 10 }, (_, i) => (2026 + i).toString()).reverse();

  // Generate all months for filter (1-12)
  const allMonths = [
    { value: "01", label: "Januari" },
    { value: "02", label: "Februari" },
    { value: "03", label: "Maret" },
    { value: "04", label: "April" },
    { value: "05", label: "Mei" },
    { value: "06", label: "Juni" },
    { value: "07", label: "Juli" },
    { value: "08", label: "Agustus" },
    { value: "09", label: "September" },
    { value: "10", label: "Oktober" },
    { value: "11", label: "November" },
    { value: "12", label: "Desember" },
  ];

  // Filter monthly data by selected month and year
  let filteredMonthlyData = data.monthlyData;
  
  if (selectedYear !== "ALL") {
    filteredMonthlyData = filteredMonthlyData.filter(m => m.monthKey.startsWith(selectedYear));
  }
  
  if (selectedMonth !== "ALL") {
    filteredMonthlyData = filteredMonthlyData.filter(m => m.monthKey.endsWith(`-${selectedMonth}`));
  }

  // Selected month/year revenue
  const selectedPeriodRevenue = (selectedMonth !== "ALL" || selectedYear !== "ALL")
    ? filteredMonthlyData.reduce((sum, m) => sum + m.revenue, 0)
    : null;

  // Get display label for selected period
  const getSelectedPeriodLabel = () => {
    if (selectedMonth === "ALL" && selectedYear === "ALL") return "Tren 12 bulan terakhir";
    if (selectedMonth !== "ALL" && selectedYear !== "ALL") {
      const monthLabel = allMonths.find(m => m.value === selectedMonth)?.label || "";
      return `${monthLabel} ${selectedYear}`;
    }
    if (selectedYear !== "ALL") return `Tahun ${selectedYear}`;
    if (selectedMonth !== "ALL") {
      const monthLabel = allMonths.find(m => m.value === selectedMonth)?.label || "";
      return `Bulan ${monthLabel}`;
    }
    return "Tren 12 bulan terakhir";
  };

  const latestMonth =
    data.monthlyData.length > 0 ? data.monthlyData[data.monthlyData.length - 1] : null;
  const previousMonth =
    data.monthlyData.length > 1 ? data.monthlyData[data.monthlyData.length - 2] : null;

  const previousAvgMonthlyRevenue =
    data.monthlyData.length > 1
      ? data.monthlyData
          .slice(0, -1)
          .reduce((sum, month) => sum + month.revenue, 0) /
        (data.monthlyData.length - 1)
      : null;

  const getChangeInfo = (current: number, previous: number | null | undefined) => {
    if (!previous || previous === 0) {
      return null;
    }
    const diff = current - previous;
    const percent = (diff / previous) * 100;
    return {
      direction: diff >= 0 ? "up" as const : "down" as const,
      percent: Math.abs(percent),
    };
  };

  const kpiCards = [
    {
      id: "totalRevenue",
      label: "Total Pendapatan",
      value: `Rp ${data.totalRevenue.toLocaleString("id-ID")}`,
      change: getChangeInfo(latestMonth?.revenue ?? 0, previousMonth?.revenue ?? null),
      icon: DollarSign,
    },
    {
      id: "totalOrders",
      label: "Total Pesanan",
      value: data.totalOrders.toLocaleString("id-ID"),
      change: getChangeInfo(latestMonth?.orders ?? 0, previousMonth?.orders ?? null),
      icon: Package,
    },
    {
      id: "avgMonthly",
      label: "Rata-rata Bulanan",
      value: `Rp ${avgMonthlyRevenue.toLocaleString("id-ID", {
        maximumFractionDigits: 0,
      })}`,
      change: getChangeInfo(avgMonthlyRevenue, previousAvgMonthlyRevenue),
      icon: TrendingUp,
    },
    {
      id: "tipRevenue",
      label: "Pendapatan Tip",
      value: `Rp ${data.totalTipRevenue.toLocaleString("id-ID")}`,
      change: getChangeInfo(
        latestMonth?.tipRevenue ?? 0,
        previousMonth?.tipRevenue ?? null,
      ),
      icon: Heart,
    },
  ];

  const totalStatusOrders = data.statusData.reduce((sum, s) => sum + s.count, 0);

  const handleExportPdf = () => {
    if (typeof window === "undefined") return;

    const nowWita = new Date().toLocaleString("id-ID", {
      timeZone: "Asia/Makassar",
      dateStyle: "full",
      timeStyle: "short",
    });

    const periodLabel = getSelectedPeriodLabel();

    const rowsHtml =
      filteredMonthlyData.length > 0
        ? filteredMonthlyData
            .map((month, index) => {
              const rowClass = index % 2 === 0 ? "row-even" : "row-odd";
              return `
                <tr class="${rowClass}">
                  <td class="text-left">${month.month}</td>
                  <td>Rp ${month.revenue.toLocaleString("id-ID")}</td>
                  <td>Rp ${month.tipRevenue.toLocaleString("id-ID")}</td>
                  <td>${month.orders.toLocaleString("id-ID")}</td>
                </tr>
              `;
            })
            .join("")
        : `<tr><td colspan="4" class="text-left">Belum ada data pendapatan untuk periode ini.</td></tr>`;

    const html = `
      <!doctype html>
      <html lang="id">
        <head>
          <meta charset="utf-8" />
          <title>Laporan Pendapatan - LokaClean</title>
          <style>
            :root {
              color-scheme: light;
            }
            * {
              box-sizing: border-box;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            body {
              margin: 24px;
              font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
              font-size: 12px;
              color: #0f172a;
              background-color: #f9fafb;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              margin-bottom: 16px;
            }
            .title-block h1 {
              margin: 0;
              font-size: 18px;
              font-weight: 700;
              letter-spacing: 0.02em;
              color: #0f172a;
            }
            .title-block p {
              margin: 4px 0 0;
              font-size: 11px;
              color: #6b7280;
            }
            .meta {
              margin-bottom: 12px;
              font-size: 11px;
              color: #6b7280;
            }
            .summary {
              display: flex;
              flex-wrap: wrap;
              gap: 16px;
              margin-bottom: 16px;
              padding: 10px 12px;
              border-radius: 10px;
              background: #0f172a;
              color: #e5e7eb;
            }
            .summary-item {
              display: flex;
              flex-direction: column;
              gap: 2px;
              min-width: 120px;
            }
            .summary-item span {
              font-size: 10px;
              text-transform: uppercase;
              letter-spacing: 0.08em;
              opacity: 0.8;
            }
            .summary-item strong {
              font-size: 12px;
              font-weight: 600;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 4px;
            }
            thead {
              background: #0f172a;
              color: #e5e7eb;
            }
            th, td {
              padding: 8px 10px;
              text-align: right;
              border-bottom: 1px solid #e5e7eb;
              vertical-align: top;
            }
            th.text-left, td.text-left {
              text-align: left;
            }
            th {
              font-size: 11px;
              font-weight: 600;
            }
            td {
              font-size: 11px;
              color: #111827;
            }
            .row-even {
              background-color: #f9fafb;
            }
            .footer {
              margin-top: 16px;
              font-size: 10px;
              color: #9ca3af;
              display: flex;
              justify-content: space-between;
            }
            @page {
              margin: 18mm 14mm 18mm;
            }
          </style>
        </head>
        <body>
          <header class="header">
            <div class="title-block">
              <h1>Laporan Pendapatan</h1>
              <p>LokaClean · Ringkasan revenue dan tip</p>
            </div>
          </header>
          <div class="meta">
            Dibuat pada ${nowWita} (WITA) · Periode: ${periodLabel}
          </div>
          <section class="summary">
            <div class="summary-item">
              <span>Total pendapatan</span>
              <strong>Rp ${data.totalRevenue.toLocaleString("id-ID")}</strong>
            </div>
            <div class="summary-item">
              <span>Pendapatan tip</span>
              <strong>Rp ${data.totalTipRevenue.toLocaleString("id-ID")}</strong>
            </div>
            <div class="summary-item">
              <span>Total pesanan</span>
              <strong>${data.totalOrders.toLocaleString("id-ID")} pesanan</strong>
            </div>
            <div class="summary-item">
              <span>Pesanan terbayar</span>
              <strong>${data.paidOrders.toLocaleString("id-ID")} pesanan</strong>
            </div>
            <div class="summary-item">
              <span>Pesanan pending</span>
              <strong>${data.pendingOrders.toLocaleString("id-ID")} pesanan</strong>
            </div>
          </section>
          <table>
            <thead>
              <tr>
                <th class="text-left">Bulan</th>
                <th>Pendapatan</th>
                <th>Pendapatan Tip</th>
                <th>Jumlah Pesanan</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
          <div class="footer">
            <span>LokaClean Admin · Panel Pendapatan</span>
          </div>
        </body>
      </html>
    `;

    const win = window.open("", "_blank");
    if (!win) return;
    win.document.open();
    win.document.write(html);
    win.document.close();
    win.focus();
    win.print();
  };

  return (
    <div className="space-y-8 pb-8 bg-slate-50 dark:bg-slate-950">
      <div className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50/95 pb-3 pt-1 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-950/95">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-slate-800 dark:text-blue-400">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-slate-900 sm:text-2xl dark:text-slate-50">
                Ringkasan Pendapatan
              </h1>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                Analitik performa finansial
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2">
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <Calendar className="h-4 w-4" />
                </span>
                <select
                  id="year-filter-revenue"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="h-9 rounded-full border border-slate-300 bg-white pl-9 pr-4 text-xs font-medium text-slate-900 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  title="Filter berdasarkan tahun"
                  aria-label="Filter pendapatan berdasarkan tahun"
                >
                  <option value="ALL">Semua tahun</option>
                  {availableYears.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <Calendar className="h-4 w-4" />
                </span>
                <select
                  id="month-filter-revenue"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="h-9 rounded-full border border-slate-300 bg-white pl-9 pr-4 text-xs font-medium text-slate-900 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  title="Filter berdasarkan bulan"
                  aria-label="Filter pendapatan berdasarkan bulan"
                >
                  <option value="ALL">Semua bulan</option>
                  {allMonths.map((month) => (
                    <option key={month.value} value={month.value}>
                      {month.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
            >
              <Filter className="h-4 w-4" />
              <span>Filter</span>
            </button>
            <button
              type="button"
              onClick={handleExportPdf}
              className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--color-primary)] bg-white px-3 py-1.5 text-xs font-medium text-[color:var(--color-primary)] hover:bg-[color:var(--color-primary-soft)] dark:border-[color:var(--color-primary)]/70 dark:bg-slate-950 dark:text-[color:var(--color-primary)]"
            >
              <Download className="h-4 w-4" />
              <span>Export PDF</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.id}
              className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  {card.label}
                </div>
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3 text-xl font-semibold leading-snug text-slate-900 sm:text-2xl dark:text-slate-50">
                {card.value}
              </div>
            {card.change && (
              <div
                className={`mt-2 inline-flex items-center text-[11px] font-medium ${
                  card.change.direction === "up"
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {card.change.direction === "up" ? (
                  <ArrowUp className="mr-1 h-3 w-3" />
                ) : (
                  <ArrowDown className="mr-1 h-3 w-3" />
                )}
                <span>
                  {card.change.direction === "up" ? "+" : "-"}
                  {card.change.percent.toFixed(1)}% vs bulan lalu
                </span>
              </div>
            )}
            </div>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm lg:col-span-2 dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 sm:px-6 dark:border-slate-800">
            <div>
              <h2 className="text-lg font-medium text-slate-900 dark:text-slate-50">
                Tren Pendapatan
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {getSelectedPeriodLabel()}
                {selectedPeriodRevenue !== null && (
                  <span className="ml-1 font-semibold text-slate-700 dark:text-slate-200">
                    · Rp {selectedPeriodRevenue.toLocaleString("id-ID")}
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="px-4 py-4 sm:px-6 sm:py-5">
            {filteredMonthlyData.length === 0 ? (
              <div className="flex h-64 items-center justify-center text-sm text-slate-500 dark:text-slate-400">
                Tidak ada data pendapatan untuk periode ini
              </div>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={filteredMonthlyData}
                    margin={{ top: 10, right: 16, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid
                      stroke="#e5e7eb"
                      strokeDasharray="3 3"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="month"
                      stroke="#9ca3af"
                      tick={{ fill: "#9ca3af", fontSize: 12 }}
                      axisLine={{ stroke: "#e5e7eb", strokeWidth: 1 }}
                      tickLine={false}
                    />
                    <YAxis
                      stroke="#9ca3af"
                      tick={{ fill: "#9ca3af", fontSize: 12 }}
                      axisLine={{ stroke: "#e5e7eb", strokeWidth: 1 }}
                      tickLine={false}
                      tickFormatter={(value) => {
                        if (value >= 1000000)
                          return `Rp${(value / 1000000).toFixed(1)}M`;
                        if (value >= 1000)
                          return `Rp${(value / 1000).toFixed(0)}k`;
                        return `Rp${value}`;
                      }}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const v = payload[0].value as number;
                          return (
                            <div className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 shadow-sm">
                              <div className="mb-1 font-medium">{label}</div>
                              <div>
                                Pendapatan:{" "}
                                <span className="font-semibold">
                                  Rp {v.toLocaleString("id-ID")}
                                </span>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="var(--color-primary)"
                      strokeWidth={2}
                      fill="none"
                      dot={{
                        r: 3,
                        stroke: "var(--color-primary)",
                        strokeWidth: 1,
                      }}
                      activeDot={{
                        r: 5,
                        stroke: "var(--color-primary-hover)",
                        strokeWidth: 1,
                        fill: "#ffffff",
                      }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="border-b border-slate-200 px-4 py-3 sm:px-6 dark:border-slate-800">
            <h2 className="text-lg font-medium text-slate-900 dark:text-slate-50">
              Status Pesanan
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Distribusi pesanan berdasarkan status
            </p>
          </div>
          <div className="space-y-4 px-4 py-4 sm:px-6 sm:py-5">
            {totalStatusOrders === 0 ? (
              <div className="flex h-40 items-center justify-center text-sm text-slate-500 dark:text-slate-400">
                Belum ada data pesanan
              </div>
            ) : (
              <>
                {data.statusData.map((entry) => {
                  const percentage =
                    totalStatusOrders > 0
                      ? Math.round((entry.count / totalStatusOrders) * 100)
                      : 0;
                  const barColor =
                    entry.fill || STATUS_COLORS[entry.status] || "#2563eb";
                  return (
                    <div key={entry.status} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-700 dark:text-slate-100">
                          {entry.status}
                        </span>
                        <span className="text-slate-500 dark:text-slate-400">
                          {percentage}% · {entry.count} pesanan
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800">
                        <div
                          className="h-2 rounded-full"
                          style={{
                            width: `${percentage}%`,
                            backgroundColor: barColor,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
                <div className="mt-2 flex items-center justify-between border-t border-slate-200 pt-3 text-xs dark:border-slate-800">
                  <span className="font-medium text-slate-600 dark:text-slate-200">
                    Total pesanan
                  </span>
                  <span className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                    {totalStatusOrders}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

