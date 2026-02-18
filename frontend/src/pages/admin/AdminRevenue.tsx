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
import { AnimatedCard } from "../../components/AnimatedCard";
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
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
          <AlertCircle className="h-6 w-6 text-red-600" />
        </div>
        <h2 className="text-lg font-semibold text-slate-900">
          Gagal memuat data pendapatan
        </h2>
        <p className="mt-2 text-sm text-red-600">{error}</p>
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

  const handleExportCsv = () => {
    if (!data) return;
    const header = ["Bulan", "Pendapatan", "PendapatanTip", "JumlahPesanan"];
    const rows = data.monthlyData.map((month) => [
      month.month,
      month.revenue.toString(),
      month.tipRevenue.toString(),
      month.orders.toString(),
    ]);
    const csv = [header, ...rows]
      .map((row) => row.join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "lokaclean-revenue.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      <div className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50/95 pb-3 pt-1">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              Ringkasan Pendapatan
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Analitik performa finansial
            </p>
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
                  className="h-9 rounded-full border border-slate-300 bg-white pl-9 pr-4 text-xs font-medium text-slate-900 focus:border-blue-600 focus:outline-none"
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
                  className="h-9 rounded-full border border-slate-300 bg-white pl-9 pr-4 text-xs font-medium text-slate-900 focus:border-blue-600 focus:outline-none"
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
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              <Filter className="h-4 w-4" />
              <span>Filter</span>
            </button>
            <button
              type="button"
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 rounded-full border border-blue-600 bg-white px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50"
            >
              <Download className="h-4 w-4" />
              <span>Export CSV</span>
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
              className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  {card.label}
                </div>
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3 text-3xl font-bold text-slate-900">
                {card.value}
              </div>
            {card.change ? (
              <div
                className={`mt-2 inline-flex items-center text-xs font-medium ${
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
            ) : (
              <div className="mt-2 text-xs text-slate-400">
                Belum ada data pembanding
              </div>
            )}
            </div>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 sm:px-6">
            <div>
              <h2 className="text-lg font-medium text-slate-900">
                Tren Pendapatan
              </h2>
              <p className="text-xs text-slate-500">
                {getSelectedPeriodLabel()}
                {selectedPeriodRevenue !== null && (
                  <span className="ml-1 font-semibold text-slate-700">
                    · Rp {selectedPeriodRevenue.toLocaleString("id-ID")}
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="px-4 py-4 sm:px-6 sm:py-5">
            {filteredMonthlyData.length === 0 ? (
              <div className="flex h-64 items-center justify-center text-sm text-slate-500">
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
                      stroke="#2563eb"
                      strokeWidth={2}
                      fill="none"
                      dot={{
                        r: 3,
                        stroke: "#2563eb",
                        strokeWidth: 1,
                      }}
                      activeDot={{
                        r: 5,
                        stroke: "#1d4ed8",
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

        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-4 py-3 sm:px-6">
            <h2 className="text-lg font-medium text-slate-900">
              Status Pesanan
            </h2>
            <p className="text-xs text-slate-500">
              Distribusi pesanan berdasarkan status
            </p>
          </div>
          <div className="space-y-4 px-4 py-4 sm:px-6 sm:py-5">
            {totalStatusOrders === 0 ? (
              <div className="flex h-40 items-center justify-center text-sm text-slate-500">
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
                        <span className="font-medium text-slate-700">
                          {entry.status}
                        </span>
                        <span className="text-slate-500">
                          {percentage}% · {entry.count} pesanan
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100">
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
                <div className="mt-2 flex items-center justify-between border-t border-slate-200 pt-3 text-xs">
                  <span className="font-medium text-slate-600">
                    Total pesanan
                  </span>
                  <span className="text-sm font-semibold text-slate-900">
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

