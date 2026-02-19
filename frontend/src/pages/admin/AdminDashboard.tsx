import { lazy, Suspense, useEffect, useMemo, useRef, useState, memo } from "react";
import type { ReactNode } from "react";
import { Users, ShoppingBag, DollarSign, Activity, MapPin, Package as PackageIcon } from "lucide-react";

import { api } from "../../lib/api";
import { getSocket, connectSocket } from "../../lib/socket";
import { AnimatedCard } from "../../components/AnimatedCard";

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

  return (
    <DashboardLayout
      title="Dashboard"
      subtitle="Selamat datang kembali, Admin"
      right={<SystemLiveBadge />}
    >
      <section className="space-y-5 sm:space-y-6">
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

        <AnimatedCard className="overflow-hidden p-0 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between gap-2 border-b bg-white px-3 py-2.5 sm:px-4 sm:py-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-50">
                <MapPin className="h-3.5 w-3.5 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-xs sm:text-sm font-semibold text-slate-800">
                  Live Map
                </h2>
                <p className="text-[10px] sm:text-xs font-medium text-slate-400">
                  Updates in realtime
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsMapCollapsed((prev) => !prev)}
              className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] sm:text-xs font-semibold text-slate-600 hover:border-indigo-300 hover:text-indigo-700"
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
            className={`w-full bg-slate-50 transition-all duration-300 ${
              isMapCollapsed
                ? "h-14 sm:h-16"
                : "h-64 sm:h-64 md:h-80 lg:h-[420px]"
            }`}
          >
            {isMapCollapsed ? (
              <div className="flex h-full w-full items-center justify-center px-3 text-[10px] sm:text-xs font-medium text-slate-500">
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
        </AnimatedCard>
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
    blue: "bg-blue-50 text-blue-600 ring-blue-600/20",
    green: "bg-green-50 text-green-600 ring-green-600/20",
    purple: "bg-purple-50 text-purple-600 ring-purple-600/20",
    orange: "bg-orange-50 text-orange-600 ring-orange-600/20",
  };

  return (
    <AnimatedCard className="flex h-full flex-col justify-between rounded-xl border border-slate-100 bg-white px-3 py-3 sm:px-4 sm:py-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1.5">
          <p className="text-[10px] sm:text-xs font-medium uppercase tracking-wide text-slate-500">
            {title}
          </p>
          <p className="text-lg sm:text-xl font-extrabold text-slate-900">
            {value}
          </p>
        </div>
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-lg ring-1 ring-inset ${colorStyles[color]}`}
        >
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </AnimatedCard>
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
    <div className="space-y-5 pb-24 sm:space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">
              {subtitle}
            </p>
          )}
        </div>
        {right}
      </div>
      {children}
    </div>
  );
}

function SystemLiveBadge() {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-semibold text-emerald-700 sm:text-xs">
      <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500" />
      <span>Sistem Aktif</span>
    </div>
  );
}
