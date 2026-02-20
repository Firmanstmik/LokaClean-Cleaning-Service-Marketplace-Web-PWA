import { lazy, Suspense, useEffect, useMemo, useRef, useState, memo } from "react";
import type { ReactNode } from "react";
import { Users, ShoppingBag, DollarSign, Activity, MapPin, Package as PackageIcon, Sparkles, Moon, Sun, LayoutDashboard } from "lucide-react";

import { api } from "../../lib/api";
import { getSocket, connectSocket } from "../../lib/socket";
import { useAdminTheme } from "../../components/admin/AdminThemeContext";

const AdminLiveMap = lazy(() => import("../../components/admin/AdminLiveMap"));

const formatRupiah = (amount: number) => 
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(amount);

interface CleanerLocation {
  id: number;
  user_id: number;
  is_active: boolean;
  full_name: string;
  profile_photo: string | null;
  lat: number;
  lng: number;
}

type DashboardOrder = {
  pembayaran?: {
    status?: string;
    amount?: number | null;
  } | null;
};

type CleanerApi = CleanerLocation & {
  is_active: boolean;
};

export function AdminDashboardPage() {
  const { settings, effectiveMode, enableSmartMode } = useAdminTheme();
  const [cleaners, setCleaners] = useState<CleanerLocation[]>([]);
  const [stats, setStats] = useState({
    totalOrders: 0,
    activeCleaners: 0,
    revenue: 0,
    packagesCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [isMapCollapsed, setIsMapCollapsed] = useState(true);
  const [hasMapBeenVisible, setHasMapBeenVisible] = useState(false);
  const mapSectionRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const socket = connectSocket();

    const fetchData = async () => {
      try {
        const [cleanersRes, ordersRes, packagesRes] = await Promise.all([
          api.get("/geo/cleaners-locations"),
          api.get("/admin/orders"),
          api.get("/admin/packages"),
        ]);

        const cleanersRaw = (cleanersRes.data.data.cleaners || []) as CleanerApi[];
        setCleaners(cleanersRaw);

        const orders = (ordersRes.data.data.items || []) as DashboardOrder[];
        const totalOrders = orders.length;
        const totalRevenue = orders.reduce((sum, order) => {
          const payment = order.pembayaran;
          if (payment && payment.status === "PAID") {
            return sum + (payment.amount || 0);
          }
          return sum;
        }, 0);

        const packagesCount = (packagesRes.data.data.items?.length as number) || 0;

        setStats(prev => ({
          ...prev,
          activeCleaners: cleanersRaw.filter(c => c.is_active).length,
          totalOrders,
          revenue: totalRevenue,
          packagesCount,
        }));
      } catch (err) {
        console.error("Failed to fetch dashboard data", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Join admin room
    socket.emit("join_admin");

    // Listen for cleaner updates
    socket.on("admin_cleaner_update", (data: { user_id: number; lat: number; lng: number; is_active?: boolean }) => {
       setCleaners(prev => {
         const idx = prev.findIndex(c => c.user_id === data.user_id);
         if (idx >= 0) {
           const newArr = [...prev];
           newArr[idx] = { 
             ...newArr[idx], 
             lat: data.lat, 
             lng: data.lng,
             is_active: data.is_active ?? newArr[idx].is_active
           };
           // Recalculate active cleaners count
           setStats(s => ({
             ...s,
             activeCleaners: newArr.filter(c => c.is_active).length
           }));
           return newArr;
         }
         return prev;
       });
    });

    // Listen for new orders
    socket.on("admin_new_order", () => {
      setStats(prev => ({ ...prev, totalOrders: prev.totalOrders + 1 }));
      // Optional: Show toast notification
    });

    return () => {
      socket.off("admin_cleaner_update");
      socket.off("admin_new_order");
    };
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth >= 768) {
      setIsMapCollapsed(false);
    }
  }, []);

  useEffect(() => {
    const el = mapSectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting) {
          setHasMapBeenVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -80px 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const statsConfig = useMemo(
    () => [
      {
        id: "total-orders",
        title: "Total Pesanan",
        value: stats.totalOrders,
        icon: ShoppingBag,
        color: "blue" as const,
      },
      {
        id: "total-packages",
        title: "Jumlah Paket",
        value: stats.packagesCount,
        icon: PackageIcon,
        color: "green" as const,
      },
      {
        id: "revenue",
        title: "Perkiraan Pendapatan",
        value: formatRupiah(stats.revenue),
        icon: DollarSign,
        color: "purple" as const,
      },
      {
        id: "system-load",
        title: "Status Sistem",
        value: "Normal",
        icon: Activity,
        color: "orange" as const,
      },
    ],
    [stats]
  );

  const shouldRenderMap = !loading && !isMapCollapsed && hasMapBeenVisible;

  const [showSmartCard, setShowSmartCard] = useState(false);
  const [smartTargetMode, setSmartTargetMode] = useState<"light" | "dark">("dark");

  useEffect(() => {
    if (settings.smart.enabled || settings.preference === "smart") {
      setShowSmartCard(false);
      return;
    }
    try {
      const dismissedRaw = localStorage.getItem("lokaclean_admin_smart_theme_dismissed");
      if (dismissedRaw === "true") {
        setShowSmartCard(false);
        return;
      }
      const raw = localStorage.getItem("lokaclean_admin_theme_usage");
      const entries: { t: number; mode: "light" | "dark" }[] = raw ? JSON.parse(raw) : [];
      if (entries.length < 6) {
        setShowSmartCard(false);
        return;
      }
      let day = 0;
      let night = 0;
      for (const entry of entries) {
        const d = new Date(entry.t);
        const h = d.getHours();
        if (h >= 18 || h < 6) {
          night += 1;
        } else {
          day += 1;
        }
      }
      if (night >= day + 2) {
        setSmartTargetMode("dark");
        setShowSmartCard(true);
      } else if (day >= night + 2) {
        setSmartTargetMode("light");
        setShowSmartCard(true);
      } else {
        setShowSmartCard(false);
      }
    } catch {
      setShowSmartCard(false);
    }
  }, [settings.smart.enabled, settings.preference]);

  const handleSmartActivate = () => {
    enableSmartMode(smartTargetMode);
    setShowSmartCard(false);
    try {
      localStorage.setItem("lokaclean_admin_smart_theme_dismissed", "true");
    } catch {
      void 0;
    }
  };

  const handleSmartDismiss = () => {
    setShowSmartCard(false);
    try {
      localStorage.setItem("lokaclean_admin_smart_theme_dismissed", "true");
    } catch {
      void 0;
    }
  };

  return (
    <DashboardLayout
      title="Dashboard"
      subtitle="Selamat datang kembali, Admin"
      right={<SystemLiveBadge />}
    >
      <section className="space-y-4 sm:space-y-5">
        <div className="block sm:hidden">
          <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-4 py-3 shadow-sm dark:border-slate-700">
            <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-[radial-gradient(circle_at_top,_rgba(251,191,36,0.28),_transparent_60%)]" />
            <div className="relative flex items-center gap-3">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-slate-800/80 text-sky-300 ring-2 ring-sky-500/40">
                <LayoutDashboard className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-slate-400">
                  Selamat datang Admin
                </p>
                <p className="mt-0.5 truncate text-sm font-semibold text-slate-50">
                  {typeof window !== "undefined"
                    ? (() => {
                        try {
                          const raw = localStorage.getItem("lokaclean_admin_data");
                          if (!raw) return "Admin";
                          const parsed = JSON.parse(raw) as { full_name?: string };
                          return parsed.full_name || "Admin";
                        } catch {
                          return "Admin";
                        }
                      })()
                    : "Admin"}
                </p>
              </div>
              <button
                type="button"
                className="relative ml-auto inline-flex h-7 items-center rounded-full border border-slate-600/70 bg-slate-900/60 px-2 text-[10px] font-semibold text-slate-200 active:scale-95"
              >
                <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Dashboard aktif
              </button>
            </div>
          </div>
        </div>
        {showSmartCard && (
          <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-[color:var(--color-primary-soft)] text-[color:var(--color-primary)]">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                    Smart Theme Suggestion
                  </h2>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                    AI Assist
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Kami melihat Anda lebih sering aktif{" "}
                  <span className="font-semibold">
                    {smartTargetMode === "dark" ? "pada malam hari" : "pada siang hari"}
                  </span>
                  . Aktifkan Smart Theme Mode agar sistem otomatis menyesuaikan Light / Dark mode.
                </p>
                <div className="mt-2 inline-flex items-center rounded-full bg-slate-50 px-2.5 py-1 text-[11px] text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                  {smartTargetMode === "dark" ? (
                    <>
                      <Moon className="mr-1 h-3 w-3" />
                      Rekomendasi: Dark mode otomatis
                    </>
                  ) : (
                    <>
                      <Sun className="mr-1 h-3 w-3" />
                      Rekomendasi: Light mode otomatis
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 pt-1 sm:flex-col sm:items-end sm:pt-0">
              <button
                type="button"
                onClick={handleSmartActivate}
                className="btn-admin-primary px-3 py-1.5 text-[11px]"
              >
                Aktifkan
              </button>
              <button
                type="button"
                onClick={handleSmartDismiss}
                className="text-[11px] font-medium text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
              >
                Abaikan
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {loading
            ? Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="h-full rounded-xl border border-slate-100 bg-white px-3 py-3 sm:px-4 sm:py-4 shadow-sm"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="h-2.5 w-20 rounded-full bg-slate-100" />
                      <div className="h-4 w-24 rounded-full bg-slate-100" />
                    </div>
                    <div className="h-8 w-8 rounded-lg bg-slate-100" />
                  </div>
                </div>
              ))
            : statsConfig.map((item) => (
                <StatCard
                  key={item.id}
                  title={item.title}
                  value={item.value}
                  icon={item.icon}
                  color={item.color}
                />
              ))}
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center justify-between gap-2 border-b border-slate-200 bg-white px-3 py-2.5 sm:px-4 sm:py-3 dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 dark:bg-slate-800 dark:text-indigo-300">
                <MapPin className="h-3.5 w-3.5" />
              </div>
              <div>
                <h2 className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-50">
                  Live Map
                </h2>
                <p className="text-[10px] sm:text-xs font-medium text-slate-400 dark:text-slate-400">
                  Updates in realtime
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsMapCollapsed((prev) => !prev)}
              className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] sm:text-xs font-semibold text-slate-600 hover:border-indigo-300 hover:text-indigo-700 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
            >
              <span className="hidden xs:inline">
                {isMapCollapsed ? "Show map" : "Hide map"}
              </span>
              <span className="xs:hidden">
                {isMapCollapsed ? "Show" : "Hide"}
              </span>
            </button>
          </div>

          <div
            ref={mapSectionRef}
            className={`w-full bg-slate-50 transition-all duration-300 dark:bg-slate-900 ${
              isMapCollapsed
                ? "h-14 sm:h-16"
                : "h-64 sm:h-64 md:h-80 lg:h-[420px]"
            }`}
          >
            {isMapCollapsed ? (
              <div className="flex h-full w-full items-center justify-center px-3 text-[10px] sm:text-xs font-medium text-slate-500 dark:text-slate-400">
                Tap to show live locations of cleaners
              </div>
            ) : (
              <>
                {(loading || !hasMapBeenVisible) && (
                  <div className="flex h-full w-full items-center justify-center">
                    <div className="h-10 w-10 animate-pulse rounded-full border-2 border-slate-200 border-t-indigo-500" />
                  </div>
                )}
                {shouldRenderMap && (
                  <Suspense
                    fallback={
                      <div className="flex h-full w-full items-center justify-center">
                        <div className="h-10 w-10 animate-pulse rounded-full border-2 border-slate-200 border-t-indigo-500" />
                      </div>
                    }
                  >
                    <AdminLiveMap cleaners={cleaners} />
                  </Suspense>
                )}
              </>
            )}
          </div>
        </div>
      </section>
    </DashboardLayout>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: typeof Users;
  color: "blue" | "green" | "purple" | "orange";
}

const StatCard = memo(function StatCard({
  title,
  value,
  icon: Icon,
  color,
}: StatCardProps) {
  const colorStyles = {
    blue: "bg-blue-50 text-blue-600 ring-blue-600/20 dark:bg-slate-800 dark:text-blue-400 dark:ring-blue-500/40",
    green: "bg-green-50 text-green-600 ring-green-600/20 dark:bg-slate-800 dark:text-green-400 dark:ring-green-500/40",
    purple: "bg-purple-50 text-purple-600 ring-purple-600/20 dark:bg-slate-800 dark:text-purple-400 dark:ring-purple-500/40",
    orange: "bg-orange-50 text-orange-600 ring-orange-600/20 dark:bg-slate-800 dark:text-orange-400 dark:ring-orange-500/40",
  };

  return (
    <div className="flex h-full flex-col justify-between rounded-xl border border-slate-200 bg-white px-3 py-3 sm:px-4 sm:py-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1.5">
          <p className="text-[10px] sm:text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {title}
          </p>
          <p className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-slate-50">
            {value}
          </p>
        </div>
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-lg ring-1 ring-inset ${colorStyles[color]}`}
        >
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
});

interface DashboardLayoutProps {
  title: string;
  subtitle?: string;
  right?: ReactNode;
  children: ReactNode;
}

function DashboardLayout({ title, subtitle, right, children }: DashboardLayoutProps) {
  return (
    <div className="space-y-4 pb-24 sm:space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-slate-800 dark:text-blue-400">
            <LayoutDashboard className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-900 sm:text-2xl dark:text-slate-50">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        {right}
      </div>
      {children}
    </div>
  );
}

function SystemLiveBadge() {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-semibold text-emerald-700 sm:text-xs dark:border-emerald-500/60 dark:bg-emerald-500/10 dark:text-emerald-200">
      <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500 dark:bg-emerald-400" />
      <span className="whitespace-nowrap">Sistem Aktif</span>
    </div>
  );
}
