/**
 * ADMIN revenue monitoring page with premium charts and professional analytics.
 * 
 * Note: Inline styles are intentionally used for dynamic colors from data (chart status colors).
 * This is necessary because colors are determined at runtime based on order status.
 */

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  DollarSign,
  Calendar,
  Package,
  AlertCircle,
  ArrowUp,
  Heart,
  Filter,
} from "lucide-react";
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  RadialBarChart,
  RadialBar,
} from "recharts";

import { api } from "../../lib/api";
import { getApiErrorMessage } from "../../lib/apiError";
import { AnimatedCard } from "../../components/AnimatedCard";
import { formatDateWITA } from "../../utils/date";

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
        const orders = resp.data.data.items || [];

        // Calculate revenue data (excluding tip)
        const totalRevenue = orders.reduce((sum: number, order: any) => {
          if (order.pembayaran?.status === "PAID") {
            return sum + (order.pembayaran.amount || 0);
          }
          return sum;
        }, 0);

        // Calculate tip revenue
        const totalTipRevenue = orders.reduce((sum: number, order: any) => {
          if (order.tip?.amount) {
            return sum + (order.tip.amount || 0);
          }
          return sum;
        }, 0);

        const totalOrders = orders.length;
        const paidOrders = orders.filter((o: any) => o.pembayaran?.status === "PAID").length;
        const pendingOrders = orders.filter((o: any) => o.pembayaran?.status === "PENDING").length;

        // Monthly data (last 12 months) - with tip revenue
        const monthlyMap = new Map<string, { revenue: number; tipRevenue: number; orders: number; monthKey: string }>();
        orders.forEach((order: any) => {
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
        orders.forEach((order: any) => {
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
      <div className="flex items-center justify-center py-12">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="h-12 w-12 rounded-full border-4 border-slate-200 border-t-indigo-600"
        />
      </div>
    );
  }

  if (error) {
    return (
      <AnimatedCard delay={0} className="card-lombok">
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
          <h2 className="text-2xl font-black text-slate-900 mb-2">Error loading revenue data</h2>
          <p className="text-sm font-semibold text-red-700">{error}</p>
        </div>
      </AnimatedCard>
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

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Compact Header - Consistent with other pages */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-wrap items-start justify-between gap-3"
      >
        <div>
          <h1 className="flex items-center gap-3 text-2xl sm:text-3xl font-black bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-transparent">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            >
              <TrendingUp className="h-7 w-7 sm:h-8 sm:w-8 text-emerald-600" />
            </motion.div>
            Revenue Monitoring
          </h1>
          <p className="mt-2 text-sm text-slate-600 font-medium">
            Real-time analytics and financial insights
          </p>
        </div>
      </motion.div>

      {/* Key Metrics - Modern Mobile-First Horizontal Layout */}
      <div className="overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:overflow-x-visible scrollbar-hide">
        <div className="flex gap-3 sm:grid sm:grid-cols-2 lg:grid-cols-4 min-w-max sm:min-w-0">
          <AnimatedCard delay={0.1} className="card-lombok relative overflow-hidden p-4 min-w-[160px] sm:min-w-0 backdrop-blur-sm bg-white/90 border border-emerald-100 shadow-lg shadow-emerald-500/5">
            <motion.div 
              className="absolute top-0 right-0 h-24 w-24 bg-gradient-to-br from-emerald-400/20 to-teal-400/20 rounded-full blur-2xl"
              animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
              transition={{ duration: 4, repeat: Infinity }}
            />
            <div className="relative z-10">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-700 mb-2">
                <DollarSign className="h-4 w-4" />
                Revenue
              </div>
              <div className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-2">
                Rp {data.totalRevenue.toLocaleString("id-ID")}
              </div>
              <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
                <ArrowUp className="h-3 w-3" />
                All time
              </div>
            </div>
          </AnimatedCard>

          <AnimatedCard delay={0.15} className="card-lombok relative overflow-hidden p-4 min-w-[160px] sm:min-w-0 backdrop-blur-sm bg-white/90 border border-blue-100 shadow-lg shadow-blue-500/5">
            <motion.div 
              className="absolute top-0 right-0 h-24 w-24 bg-gradient-to-br from-blue-400/20 to-indigo-400/20 rounded-full blur-2xl"
              animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
              transition={{ duration: 4, repeat: Infinity, delay: 0.5 }}
            />
            <div className="relative z-10">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-blue-700 mb-2">
                <Package className="h-4 w-4" />
                Orders
              </div>
              <div className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                {data.totalOrders}
              </div>
              <div className="flex items-center gap-1 text-xs font-semibold text-blue-600">
                <Calendar className="h-3 w-3" />
                Total
              </div>
            </div>
          </AnimatedCard>

          <AnimatedCard delay={0.2} className="card-lombok relative overflow-hidden p-4 min-w-[160px] sm:min-w-0 backdrop-blur-sm bg-white/90 border border-purple-100 shadow-lg shadow-purple-500/5">
            <motion.div 
              className="absolute top-0 right-0 h-24 w-24 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-2xl"
              animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
              transition={{ duration: 4, repeat: Infinity, delay: 1 }}
            />
            <div className="relative z-10">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-purple-700 mb-2">
                <TrendingUp className="h-4 w-4" />
                Avg Monthly
              </div>
              <div className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                Rp {avgMonthlyRevenue.toLocaleString("id-ID", { maximumFractionDigits: 0 })}
              </div>
              <div className="flex items-center gap-1 text-xs font-semibold text-purple-600">
                Per bulan (excl. tip)
              </div>
            </div>
          </AnimatedCard>

          <AnimatedCard delay={0.25} className="card-lombok relative overflow-hidden p-4 min-w-[160px] sm:min-w-0 backdrop-blur-sm bg-white/90 border border-pink-100 shadow-lg shadow-pink-500/5">
            <motion.div 
              className="absolute top-0 right-0 h-24 w-24 bg-gradient-to-br from-pink-400/20 to-rose-400/20 rounded-full blur-2xl"
              animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
              transition={{ duration: 4, repeat: Infinity, delay: 1.5 }}
            />
            <div className="relative z-10">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-pink-700 mb-2">
                <Heart className="h-4 w-4" />
                Tips
              </div>
              <div className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent mb-2">
                Rp {data.totalTipRevenue.toLocaleString("id-ID")}
              </div>
              <div className="flex items-center gap-1 text-xs font-semibold text-pink-600">
                From users/tourists
              </div>
            </div>
          </AnimatedCard>
        </div>
      </div>

      {/* Charts - Modern Full-Width Mobile Layout */}
      <div className="space-y-4">
        {/* Monthly Revenue Chart */}
        <AnimatedCard delay={0.3} className="card-lombok p-4 sm:p-6 backdrop-blur-sm bg-white/90 border border-emerald-100/50 shadow-xl shadow-emerald-500/5">
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex-1">
              <h3 className="text-lg sm:text-xl font-black bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                Monthly Revenue
              </h3>
              <p className="text-xs sm:text-sm font-semibold text-slate-500 mt-1">
                {getSelectedPeriodLabel()}
                {selectedPeriodRevenue !== null && (
                  <span className="ml-2 text-emerald-600 font-bold">
                    - Rp {selectedPeriodRevenue.toLocaleString("id-ID")}
                  </span>
                )}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {/* Year Filter */}
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none z-10" />
                <select
                  id="year-filter-revenue"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="pl-9 pr-4 py-2 text-xs sm:text-sm font-semibold rounded-lg border-2 border-slate-200 bg-white text-slate-900 transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none appearance-none"
                  title="Filter by year"
                  aria-label="Filter monthly revenue by year"
                >
                  <option value="ALL">All Years</option>
                  {availableYears.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Month Filter */}
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none z-10" />
                <select
                  id="month-filter-revenue"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="pl-9 pr-4 py-2 text-xs sm:text-sm font-semibold rounded-lg border-2 border-slate-200 bg-white text-slate-900 transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none appearance-none"
                  title="Filter by month"
                  aria-label="Filter monthly revenue by month"
                >
                  <option value="ALL">All Months</option>
                  {allMonths.map((month) => (
                    <option key={month.value} value={month.value}>
                      {month.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              >
                <TrendingUp className="h-5 w-5 text-emerald-600" />
              </motion.div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={filteredMonthlyData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.9} />
                  <stop offset="50%" stopColor="#14b8a6" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="#e2e8f0" 
                opacity={0.3}
                vertical={false}
              />
              <XAxis 
                dataKey="month" 
                stroke="#64748b" 
                fontSize={12}
                tick={{ fill: "#64748b", fontWeight: 600 }}
                axisLine={{ stroke: "#cbd5e1", strokeWidth: 2 }}
                tickLine={{ stroke: "#cbd5e1" }}
              />
              <YAxis 
                stroke="#64748b" 
                fontSize={12}
                tick={{ fill: "#64748b", fontWeight: 600 }}
                axisLine={{ stroke: "#cbd5e1", strokeWidth: 2 }}
                tickLine={{ stroke: "#cbd5e1" }}
                tickFormatter={(value) => {
                  if (value >= 1000000) return `Rp${(value / 1000000).toFixed(1)}M`;
                  if (value >= 1000) return `Rp${(value / 1000).toFixed(0)}k`;
                  return `Rp${value}`;
                }}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const value = payload[0].value as number;
                    return (
                      <div className="bg-white/95 backdrop-blur-md border-2 border-emerald-200 rounded-xl p-4 shadow-2xl">
                        <p className="font-bold text-sm text-emerald-700 mb-2">{label}</p>
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full bg-emerald-500" />
                          <p className="text-sm text-slate-900">
                            <span className="font-semibold">Revenue:</span>{" "}
                            <span className="font-black text-emerald-600">
                              Rp {value.toLocaleString("id-ID")}
                            </span>
                          </p>
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
                stroke="#10b981"
                strokeWidth={4}
                fillOpacity={1}
                fill="url(#colorRevenue)"
                dot={{ fill: "#10b981", strokeWidth: 2, r: 5 }}
                activeDot={{ r: 8, stroke: "#10b981", strokeWidth: 2, fill: "#fff" }}
                animationDuration={1000}
                animationEasing="ease-out"
              />
            </AreaChart>
          </ResponsiveContainer>
        </AnimatedCard>

        {/* Orders Status Chart - Modern 3D Pie Chart */}
        <AnimatedCard delay={0.4} className="card-lombok p-4 sm:p-6 backdrop-blur-sm bg-white/90 border border-blue-100/50 shadow-xl shadow-blue-500/5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg sm:text-xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Orders by Status
              </h3>
              <p className="text-xs sm:text-sm font-semibold text-slate-500 mt-1">Distribution overview dengan visualisasi 3D</p>
            </div>
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            >
              <Package className="h-5 w-5 text-blue-600" />
            </motion.div>
          </div>
          
          <div className="grid gap-6 sm:grid-cols-2 items-center">
            {/* 3D Pie Chart */}
            <div className="relative">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <defs>
                    {data.statusData.map((entry, index) => {
                      const fillColor = entry.fill || STATUS_COLORS[entry.status] || "#6b7280";
                      return (
                        <linearGradient key={`gradient-${index}`} id={`gradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={fillColor} stopOpacity={1} />
                          <stop offset="100%" stopColor={fillColor} stopOpacity={0.6} />
                        </linearGradient>
                      );
                    })}
                  </defs>
                  <Pie
                    data={data.statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ status, percent }) => {
                      if (percent < 0.05) return ""; // Hide label for very small slices
                      return `${(percent * 100).toFixed(0)}%`;
                    }}
                    outerRadius={100}
                    innerRadius={40}
                    paddingAngle={4}
                    dataKey="count"
                    animationBegin={0}
                    animationDuration={800}
                    animationEasing="ease-out"
                  >
                    {data.statusData.map((entry, index) => {
                      const fillColor = entry.fill || STATUS_COLORS[entry.status] || "#6b7280";
                      return (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={`url(#gradient-${index})`}
                          stroke={fillColor}
                          strokeWidth={2}
                        />
                      );
                    })}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const tooltipPayload = payload[0];
                        const tooltipData = tooltipPayload.payload as typeof data.statusData[0];
                        const total = data.statusData.reduce((sum, s) => sum + s.count, 0);
                        const percentage = total > 0 ? (((tooltipPayload.value as number) / total) * 100).toFixed(1) : "0";
                        return (
                          <div className="bg-white/95 backdrop-blur-md border-2 border-slate-200 rounded-xl p-3 shadow-xl">
                            <p className="font-bold text-sm text-slate-900">{tooltipData.status}</p>
                            <p className="text-xs text-slate-600 mt-1">
                              Count: <span className="font-bold">{tooltipPayload.value}</span>
                            </p>
                            <p className="text-xs text-slate-600">
                              Percentage: <span className="font-bold">{percentage}%</span>
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              
              {/* 3D Shadow Effect */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {/* Dynamic radial gradient for 3D effect */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full blur-3xl opacity-30 chart-shadow-glow" />
              </div>
            </div>

            {/* Status Legend with Cards */}
            <div className="space-y-3">
              {data.statusData.map((entry, index) => {
                const total = data.statusData.reduce((sum, s) => sum + s.count, 0);
                const percentage = total > 0 ? ((entry.count / total) * 100).toFixed(1) : "0";
                const fillColor = entry.fill || STATUS_COLORS[entry.status] || "#6b7280";
                return (
                  <motion.div
                    key={entry.status}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className="relative overflow-hidden rounded-xl border-2 p-3 backdrop-blur-sm bg-white/80 status-card-wrapper"
                    style={{ 
                      '--status-color': fillColor,
                      '--status-color-shadow': fillColor + '80',
                      '--status-color-border': fillColor + '40',
                      '--status-color-bg': fillColor
                    } as React.CSSProperties}
                  >
                    <div className="absolute inset-0 opacity-10 status-card-bg" />
                    <div className="relative z-10 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-4 w-4 rounded-full shadow-md status-indicator-dot" />
                        <div>
                          <p className="text-sm font-bold text-slate-900">{entry.status}</p>
                          <p className="text-xs text-slate-500">{percentage}% dari total</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-black status-count-text">
                          {entry.count}
                        </p>
                        <p className="text-xs text-slate-500">orders</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
              
              {/* Total Summary */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mt-4 pt-4 border-t-2 border-slate-200 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 p-4"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-slate-700">Total Orders</p>
                  <p className="text-2xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    {data.statusData.reduce((sum, s) => sum + s.count, 0)}
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </AnimatedCard>
      </div>
    </div>
  );
}

