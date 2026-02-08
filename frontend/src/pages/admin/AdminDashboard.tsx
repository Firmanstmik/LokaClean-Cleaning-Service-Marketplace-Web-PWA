import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Users, ShoppingBag, DollarSign, Activity, MapPin } from "lucide-react";

import { api } from "../../lib/api";
import { getSocket, connectSocket } from "../../lib/socket";
import { AnimatedCard } from "../../components/AnimatedCard";
import "../../lib/leaflet"; // Fix Leaflet default icons

// Custom Icons
const cleanerIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-grey.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const activeCleanerIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

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

export function AdminDashboardPage() {
  const [cleaners, setCleaners] = useState<CleanerLocation[]>([]);
  const [stats, setStats] = useState({
    totalOrders: 0,
    activeCleaners: 0,
    revenue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const socket = connectSocket();
    
    // Fetch initial data
    const fetchData = async () => {
      try {
        const [cleanersRes, ordersRes] = await Promise.all([
          api.get("/geo/cleaners-locations"),
          api.get("/admin/orders?limit=1") // Just to get total count if available in metadata
        ]);

        setCleaners(cleanersRes.data.data.cleaners);
        // Assuming we can get some stats from orders endpoint or a dedicated stats endpoint
        // For now, we simulate stats or use available data
        setStats(prev => ({
          ...prev,
          activeCleaners: cleanersRes.data.data.cleaners.filter((c: any) => c.is_active).length,
          // totalOrders would come from ordersRes.data.data.pagination.total if available
          totalOrders: ordersRes.data.data.pagination?.total || 0
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

  return (
    <div className="space-y-6 pb-24">
      <div className="flex items-center justify-between">
         <div>
           <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
           <p className="text-sm text-slate-500">Welcome back, Admin!</p>
         </div>
         <div className="flex items-center gap-2 rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
            <span className="flex h-2 w-2 relative">
               <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
               <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            System Live
         </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
         <StatsCard 
           title="Total Orders" 
           value={stats.totalOrders} 
           icon={ShoppingBag} 
           color="blue" 
         />
         <StatsCard 
           title="Active Cleaners" 
           value={stats.activeCleaners} 
           icon={Users} 
           color="green" 
         />
         <StatsCard 
           title="Revenue (Est)" 
           value={formatRupiah(stats.revenue)} 
           icon={DollarSign} 
           color="purple" 
         />
         <StatsCard 
           title="System Load" 
           value="Normal" 
           icon={Activity} 
           color="orange" 
         />
      </div>

      {/* Map Section */}
      <AnimatedCard className="overflow-hidden p-0 shadow-lg border-0 ring-1 ring-slate-900/5">
         <div className="border-b bg-white px-4 py-3 flex items-center justify-between">
            <h2 className="font-semibold text-slate-700 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-blue-500" />
              Live Map
            </h2>
            <div className="text-xs text-slate-400">Updates in realtime</div>
         </div>
         <div className="h-[500px] w-full relative z-0 bg-slate-100">
            {!loading && (
              <MapContainer 
                center={[-8.6509, 116.3249]} // Lombok Center
                zoom={11} 
                style={{ height: "100%", width: "100%" }}
              >
                 <TileLayer 
                   url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" 
                   attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                 />
                 {cleaners.map(c => (
                    <Marker 
                      key={c.id} 
                      position={[c.lat, c.lng]}
                      icon={c.is_active ? activeCleanerIcon : cleanerIcon}
                    >
                       <Popup>
                          <div className="font-semibold">{c.full_name}</div>
                          <div className="text-xs text-slate-500 flex items-center gap-1">
                            <span className={`inline-block w-2 h-2 rounded-full ${c.is_active ? 'bg-green-500' : 'bg-slate-300'}`}></span>
                            {c.is_active ? "Active" : "Inactive"}
                          </div>
                       </Popup>
                    </Marker>
                 ))}
              </MapContainer>
            )}
         </div>
      </AnimatedCard>
    </div>
  );
}

function StatsCard({ title, value, icon: Icon, color }: { title: string; value: string | number; icon: any; color: "blue" | "green" | "purple" | "orange" }) {
  const colorStyles = {
    blue: "bg-blue-50 text-blue-600 ring-blue-600/20",
    green: "bg-green-50 text-green-600 ring-green-600/20",
    purple: "bg-purple-50 text-purple-600 ring-purple-600/20",
    orange: "bg-orange-50 text-orange-600 ring-orange-600/20",
  };

  return (
    <AnimatedCard className="p-4 flex flex-col justify-between h-full">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{title}</p>
          <p className="mt-2 text-2xl font-bold text-slate-800">{value}</p>
        </div>
        <div className={`rounded-lg p-2 ring-1 ring-inset ${colorStyles[color]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </AnimatedCard>
  );
}
