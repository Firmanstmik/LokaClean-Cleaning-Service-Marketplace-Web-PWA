import { memo } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import "../../lib/leaflet";

interface CleanerLocation {
  id: number;
  user_id: number;
  is_active: boolean;
  full_name: string;
  lat: number;
  lng: number;
}

const cleanerIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-grey.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const activeCleanerIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface AdminLiveMapProps {
  cleaners: CleanerLocation[];
}

function AdminLiveMapBase({ cleaners }: AdminLiveMapProps) {
  return (
    <MapContainer
      center={[-8.6509, 116.3249]}
      zoom={11}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
      />
      {cleaners.map((c) => (
        <Marker
          key={c.id}
          position={[c.lat, c.lng]}
          icon={c.is_active ? activeCleanerIcon : cleanerIcon}
        >
          <Popup>
            <div className="font-semibold">{c.full_name}</div>
            <div className="mt-1 flex items-center gap-1 text-xs text-slate-500">
              <span
                className={`inline-block h-2 w-2 rounded-full ${
                  c.is_active ? "bg-emerald-500" : "bg-slate-300"
                }`}
              />
              {c.is_active ? "Active" : "Inactive"}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}

const AdminLiveMap = memo(AdminLiveMapBase);

export default AdminLiveMap;

