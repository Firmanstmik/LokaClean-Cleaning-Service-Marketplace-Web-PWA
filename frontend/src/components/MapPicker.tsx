/**
 * Map picker (Leaflet/OpenStreetMap).
 *
 * - Google Maps-level Address Picker
 * - Autocomplete (Nominatim)
 * - Saved Addresses (Backend)
 * - Recent Locations (LocalStorage)
 * - Draggable Marker
 */

import { useEffect, useMemo, useRef, useState, memo } from "react";
import { Circle, MapContainer, Marker, TileLayer, useMap, useMapEvents, GeoJSON, Popup, LayersControl } from "react-leaflet";
import { LocateFixed, Loader2, MapPin, Navigation, Search, CheckCircle2, Home, Briefcase, Star, Clock, Trash2, Plus, Save, AlertCircle, X, Check } from "lucide-react";
import L from "leaflet";

import { api } from "../lib/api";
import { t } from "../lib/i18n";
import { SaveAddressModal } from "./SaveAddressModal";

export type LatLng = { lat: number; lng: number };

const NTB_CENTER: [number, number] = [-8.652933, 117.361647];

const MAPTILER_KEY = import.meta.env.VITE_MAPTILER_KEY || "";
const IS_KEY_VALID = MAPTILER_KEY && MAPTILER_KEY !== "YOUR_API_KEY_HERE";

// Fallback to OSM Standard (showing POIs) if MapTiler key is missing
const TILE_URL = IS_KEY_VALID 
  ? `https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=${MAPTILER_KEY}`
  : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

const TILE_ATTR = IS_KEY_VALID 
  ? '&copy; <a href="https://www.maptiler.com/copyright/" target="_blank">MapTiler</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors'
  : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

if (!IS_KEY_VALID) {
  console.warn("MapPicker: Using OpenStreetMap fallback because VITE_MAPTILER_KEY is missing or invalid.");
}

// Simplified NTB Boundary (Lombok + Sumbawa boxes) for visual context
const NTB_GEOJSON: any = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: {},
      geometry: {
        type: "MultiPolygon",
        coordinates: [
            // Lombok Approx
            [[[115.82, -8.96], [116.78, -8.96], [116.78, -8.13], [115.82, -8.13], [115.82, -8.96]]],
            // Sumbawa Approx
            [[[116.71, -9.10], [119.16, -9.10], [119.16, -8.08], [116.71, -8.08], [116.71, -9.10]]]
        ]
      }
    }
  ]
};

type SavedAddress = {
  id: number;
  label: string;
  address: string;
  latitude: number;
  longitude: number;
  is_primary?: boolean;
  street?: string;
  village?: string;
  district?: string;
  city?: string;
  notes?: string;
};

const NTB_CITIES = [
  {name:"Mataram",lat:-8.5833,lng:116.1167},
  {name:"Lombok Barat",lat:-8.695,lng:116.12},
  {name:"Lombok Tengah",lat:-8.695,lng:116.305},
  {name:"Lombok Timur",lat:-8.513,lng:116.544},
  {name:"Lombok Utara",lat:-8.373,lng:116.277},
  {name:"Sumbawa",lat:-8.652,lng:117.361},
  {name:"Sumbawa Barat",lat:-8.755,lng:116.824},
  {name:"Dompu",lat:-8.536,lng:118.464},
  {name:"Bima",lat:-8.460,lng:118.727},
  {name:"Kota Bima",lat:-8.462,lng:118.726}
];

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

function ClickToPick({ onPick }: { onPick: (v: LatLng) => void }) {
  useMapEvents({
    click(e) {
      onPick({ lat: e.latlng.lat, lng: e.latlng.lng });
    }
  });
  return null;
}

function SmartMapUpdater({ center, accuracy, zoom }: { center: LatLng; accuracy: number | null; zoom?: number }) {
  const map = useMap();
  const lastCenter = useRef<LatLng | null>(null);
  const lastAccuracy = useRef<number | null>(null);
  const lastZoom = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (
      lastCenter.current && 
      Math.abs(lastCenter.current.lat - center.lat) < 1e-8 && 
      Math.abs(lastCenter.current.lng - center.lng) < 1e-8 &&
      lastAccuracy.current === accuracy &&
      lastZoom.current === zoom
    ) {
      return;
    }

    lastCenter.current = center;
    lastAccuracy.current = accuracy;
    lastZoom.current = zoom;

    if (zoom) {
      map.flyTo(center, zoom, { animate: true, duration: 1.5 });
    } else if (accuracy && accuracy > 1000) {
      map.setView(center, 15, { animate: true });
    } else if (accuracy && accuracy > 50) {
      const bounds = L.latLng(center).toBounds(accuracy);
      map.fitBounds(bounds, { animate: true, padding: [50, 50], maxZoom: 18 });
    } else {
      map.setView(center, 18, { animate: true });
    }
  }, [center.lat, center.lng, accuracy, zoom, map]);

  return null;
}

function formatMeters(m: number) {
  if (!Number.isFinite(m)) return "";
  if (m < 1000) return `${Math.round(m)} m`;
  return `${(m / 1000).toFixed(1)} km`;
}

function osmLink(lat: number, lng: number, zoom = 18) {
  return `https://www.openstreetmap.org/?mlat=${encodeURIComponent(lat)}&mlon=${encodeURIComponent(
    lng
  )}#map=${zoom}/${encodeURIComponent(lat)}/${encodeURIComponent(lng)}`;
}


// Premium Marker UX
const premiumMarkerIcon = L.divIcon({
  className: "premium-marker",
  html: `
    <div class="relative w-10 h-10 group">
       <div class="absolute inset-0 bg-rose-500 rounded-full shadow-lg border-2 border-white flex items-center justify-center transform transition-transform group-hover:scale-110 z-20">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5 text-white">
            <path fill-rule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd" />
          </svg>
       </div>
       <div class="absolute inset-0 bg-rose-500 rounded-full animate-ping opacity-20 z-10"></div>
       <div class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-1 bg-black/20 blur-[2px] rounded-full"></div>
    </div>
  `,
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -44],
});

// CSS for micro-interaction
const markerStyle = `
  .premium-marker {
    transition: transform 0.2s ease-out;
  }
  .leaflet-popup-content-wrapper {
    border-radius: 12px;
    padding: 0;
    overflow: hidden;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
  }
  .leaflet-popup-content {
    margin: 0;
    width: 260px !important;
  }
  .leaflet-popup-tip {
    background: white;
  }
  @keyframes pop {
    from { transform: scale(0.85); opacity: 0.6; }
    to { transform: scale(1); opacity: 1; }
  }
`;

// New Component: Welcome Overlay
function WelcomeOverlay({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
      <div className="absolute bottom-8 left-0 right-0 z-[2000] pointer-events-none w-full px-4 flex justify-center">
        <div className="bg-white/90 backdrop-blur-md px-3 py-2 sm:px-5 sm:py-3 rounded-full shadow-xl border border-white/50 animate-in slide-in-from-bottom-4 fade-in duration-500 max-w-xs sm:max-w-sm text-center">
          <p className="text-xs sm:text-sm font-medium text-slate-700 leading-tight">
            {t("map.welcomeOverlay")}
          </p>
        </div>
      </div>
  );
}

// New Component: Initial FlyTo Logic
function InitialFlyTo({ trigger, zoom }: { trigger: boolean; zoom: number }) {
  const map = useMap();
  const hasFlown = useRef(false);

  useEffect(() => {
    if (trigger && !hasFlown.current) {
        map.flyTo(NTB_CENTER, zoom, { duration: 1.2, easeLinearity: 0.25 });
        hasFlown.current = true;
    }
  }, [trigger, map, zoom]);
  return null;
}

function MapResizer({ isOpen }: { isOpen?: boolean }) {
  const map = useMap();

  useEffect(() => {
    const observer = new ResizeObserver(() => {
      map.invalidateSize();
    });
    
    const container = map.getContainer();
    if (container) {
      observer.observe(container);
    }
    
    const triggerInvalidation = () => {
      map.invalidateSize();
      const intervalId = setInterval(() => {
        map.invalidateSize();
      }, 100);
      const timeoutId = setTimeout(() => {
        clearInterval(intervalId);
        map.invalidateSize();
      }, 1000);
      return () => {
        clearInterval(intervalId);
        clearTimeout(timeoutId);
      };
    };

    let cleanupFn: (() => void) | undefined;
    if (isOpen !== false) {
      cleanupFn = triggerInvalidation();
    }

    return () => {
      observer.disconnect();
      if (cleanupFn) cleanupFn();
    };
  }, [map, isOpen]);

  return null;
}

// Simple Save Modal Component
function SimpleSaveModal({ isOpen, onClose, onSave }: { isOpen: boolean; onClose: () => void; onSave: (label: string, notes: string) => Promise<void> }) {
  const [label, setLabel] = useState("Rumah");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="p-5">
          <h3 className="text-lg font-bold text-slate-800 mb-4 text-center">Pilih Label Lokasi</h3>
          
          <div className="grid grid-cols-3 gap-3 mb-4">
             {["Rumah", "Kantor", "Villa"].map(l => (
               <button 
                 key={l}
                 onClick={() => setLabel(l)}
                 className={`py-3 px-2 rounded-xl text-sm font-bold border-2 transition-all ${label === l ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-100 text-slate-500 hover:border-indigo-100'}`}
               >
                 {l === "Rumah" && "🏠"}
                 {l === "Kantor" && "🏢"}
                 {l === "Villa" && "⭐"}
                 <div className="mt-1">{l}</div>
               </button>
             ))}
          </div>

          <div className="space-y-2 mb-6">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Catatan Lokasi <span className="font-normal normal-case">(Opsional)</span></label>
            <textarea 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Pagar hitam, dekat warung..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              rows={2}
            />
          </div>

          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl transition-colors">
              Batal
            </button>
            <button 
              onClick={async () => {
                setSaving(true);
                await onSave(label, notes);
                setSaving(false);
              }}
              disabled={saving}
              className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Simpan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export const MapPicker = memo(function MapPicker({
  value,
  onChange,
  onAddressChange,
  onDetailsChange,
  label,
  helperText,
  hideLabel = false,
  isOpen,
  onSaveRequest,
  onRefresh,
  mapHeight = "h-[400px]",
  savedAddresses: externalSavedAddresses
}: {
  value: LatLng | null;
  onChange: (v: LatLng | null) => void;
  onAddressChange?: (address: string | null) => void;
  onDetailsChange?: (details: { notes?: string }) => void;
  label?: string;
  helperText?: string;
  hideLabel?: boolean;
  isOpen?: boolean;
  onSaveRequest?: (data: { lat: number; lng: number; address: string }) => void;
  onRefresh?: () => void;
  mapHeight?: string;
  savedAddresses?: SavedAddress[];
}) {
  const defaultLabel = t("common.location");
  const defaultHelperText = t("map.tapToSetLocation");
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [accuracyMeters, setAccuracyMeters] = useState<number | null>(null);

  const [resolving, setResolving] = useState(false);
  const [resolvedAddress, setResolvedAddress] = useState<string | null>(null);
  const [addressDetails, setAddressDetails] = useState<any>(null); // Store full address details (street, city, etc.)
  const [resolveError, setResolveError] = useState<string | null>(null);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedCity, setSelectedCity] = useState("");

  // Favorites & Recents
  const [internalSavedAddresses, setInternalSavedAddresses] = useState<SavedAddress[]>([]);
  const savedAddresses = externalSavedAddresses || internalSavedAddresses;

  const [recentLocations, setRecentLocations] = useState<SavedAddress[]>([]);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveLabel, setSaveLabel] = useState("Home");
  const [isSaving, setIsSaving] = useState(false);
  
  // Map control
  const [forcedZoom, setForcedZoom] = useState<number | undefined>(undefined);
  const [showWelcome, setShowWelcome] = useState(false);
  const welcomeShownRef = useRef(false);
  const [isMobile, setIsMobile] = useState(false);

  const requestIdRef = useRef(0);
  const onAddressChangeRef = useRef<typeof onAddressChange>(onAddressChange);
  const mapKeyRef = useRef(`map-${Date.now()}-${Math.random()}`);

  useEffect(() => {
    setIsMobile(window.innerWidth < 640);
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    onAddressChangeRef.current = onAddressChange;
  }, [onAddressChange]);

  // Welcome Overlay Logic
  useEffect(() => {
    if (isOpen !== false && !value && !welcomeShownRef.current) {
      setShowWelcome(true);
      welcomeShownRef.current = true;
      const timer = setTimeout(() => setShowWelcome(false), 4500);
      return () => clearTimeout(timer);
    }
  }, [isOpen, value]);

  // Simple Flow State
  const [showSimpleModal, setShowSimpleModal] = useState(false);
  const [mainLocation, setMainLocation] = useState<SavedAddress | null>(null);

  useEffect(() => {
    if (savedAddresses.length > 0) {
      const primary = savedAddresses.find(a => a.is_primary);
      if (primary) setMainLocation(primary);
    } else {
      setMainLocation(null);
    }
  }, [savedAddresses]);

  // Auto-select primary location if value is empty (Validation Fix)
  useEffect(() => {
    if (!value && mainLocation) {
      onChange({ lat: mainLocation.latitude, lng: mainLocation.longitude });
      if (onAddressChange) onAddressChange(mainLocation.address);
      setResolvedAddress(mainLocation.address);
      if (onDetailsChange && mainLocation.notes) {
         onDetailsChange({ notes: mainLocation.notes });
      }
    }
  }, [mainLocation, value, onChange, onAddressChange, onDetailsChange]);

  const handleSimpleSave = async (label: string, notes: string) => {
    if (!value) return;
    try {
      const payload = {
        lat: value.lat,
        lng: value.lng,
        address: resolvedAddress || "",
        label,
        notes,
        is_primary: !mainLocation // If no main location, this is primary
      };
      
      const res = await api.post("/address/save", payload);
      if (res.status === 200 || res.status === 201) {
        if (!mainLocation) {
           setMainLocation(res.data.data);
        }
        setShowSimpleModal(false);
        alert("Lokasi berhasil disimpan");
        loadFavorites();
        if (onRefresh) onRefresh();
        if (onSaveRequest) {
           // Optional: Notify parent if needed, but we are doing simple flow
        }
      }
    } catch (e: any) {
      const msg = e.response?.data?.message || "Gagal menyimpan lokasi. Silakan coba lagi.";
      alert(msg);
    }
  };

  // Load favorites & recents
  useEffect(() => {
    if (!externalSavedAddresses) {
      loadFavorites();
    }
    loadRecents();
  }, [externalSavedAddresses]);

  const loadFavorites = async () => {
    try {
      const res = await api.get("/address/list");
      setInternalSavedAddresses(res.data.data);
    } catch (e) {
      // Ignore if unauthenticated or error
    }
  };

  const loadRecents = () => {
    try {
      const raw = localStorage.getItem("lokaclean_recent_locations");
      if (raw) {
        setRecentLocations(JSON.parse(raw));
      }
    } catch (e) {}
  };

  const addToRecents = (addr: SavedAddress) => {
    const newRecents = [addr, ...recentLocations.filter(r => r.address !== addr.address)].slice(0, 5);
    setRecentLocations(newRecents);
    localStorage.setItem("lokaclean_recent_locations", JSON.stringify(newRecents));
  };

  // ====================================================
  // GOOGLE MAPS-LEVEL GENERIC SEARCH PIPELINE
  // ====================================================

  // 1. NORMALIZATION
  const normalize = (str: string) => 
    str.toLowerCase()
       .trim()
       .replace(/[^\w\s]/gi, '')
       .split(/\s+/)
       .filter(Boolean);

  // 9. TYPO TOLERANCE (Levenshtein)
  const getSimilarity = (s1: string, s2: string) => {
    const longer = s1.length > s2.length ? s1 : s2;
    const shorter = s1.length > s2.length ? s2 : s1;
    if (longer.length === 0) return 1.0;
    
    const costs = new Array();
    for (let i = 0; i <= longer.length; i++) {
      let lastValue = i;
      for (let j = 0; j <= shorter.length; j++) {
        if (i === 0) costs[j] = j;
        else {
          if (j > 0) {
            let newValue = costs[j - 1];
            if (longer.charAt(i - 1) !== shorter.charAt(j - 1))
              newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
            costs[j - 1] = lastValue;
            lastValue = newValue;
          }
        }
      }
      if (i > 0) costs[shorter.length] = lastValue;
    }
    return (longer.length - costs[shorter.length]) / longer.length;
  };

  useEffect(() => {
    const tokens = normalize(debouncedSearchQuery);
    
    if (tokens.length === 0) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    const doSearch = async () => {
      setSearching(true);
      setSearchError(null);
      
      try {
        // Helper to fetch from Nominatim
        const fetchNominatim = async (queryStr: string, limit = 20) => {
          const params = new URLSearchParams({
            q: queryStr,
            format: 'jsonv2',
            limit: limit.toString(),
            addressdetails: '1',
            namedetails: '1',
            extratags: '1',
            countrycodes: 'id',
            'accept-language': 'id'
          });
          const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`);
          if (!res.ok) throw new Error("Network response was not ok");
          return await res.json();
        };

        let results: any[] = [];

        // 2. PRIMARY SEARCH (CITY CONSTRAINED)
        if (selectedCity) {
          const q = `${tokens.join(" ")} ${selectedCity} NTB Indonesia`;
          results = await fetchNominatim(q);
        }

        // 3. ZERO RESULT FALLBACK (No City)
        if (!results.length) {
          const q = `${tokens.join(" ")} NTB Indonesia`;
          results = await fetchNominatim(q);
          
          if (!results.length) {
            // Broader context fallback (just Indonesia)
            const q = `${tokens.join(" ")} Indonesia`;
            results = await fetchNominatim(q);
          }
        }

        // 4. TOKEN LOOP FALLBACK
        if (!results.length && tokens.length > 1) {
          const tokenPromises = tokens.map(t => {
            // Skip very short tokens to avoid noise
            if (t.length < 3) return Promise.resolve([]);
            return fetchNominatim(`${t} NTB`, 5);
          });
          
          const tokenResults = await Promise.all(tokenPromises);
          const rawMerged = tokenResults.flat();
          
          // Deduplicate by osm_id
          const seen = new Set();
          results = rawMerged.filter(r => {
            if (seen.has(r.osm_id)) return false;
            seen.add(r.osm_id);
            return true;
          });
        }

        // 7. EDGE CASE / FAILSAFE
        if (!results || results.length === 0) {
          setSearchError(t("map.searchError"));
          setSearchResults([]);
        } else {
          // 5. RANKING
          // Sort by: village > hamlet > suburb > neighbourhood > POI > road
          const rankedData = results.sort((a: any, b: any) => {
            const getGranularityScore = (item: any) => {
              const addr = item.address || {};
              if (addr.village) return 1;
              if (addr.hamlet) return 2;
              if (addr.suburb) return 3;
              if (addr.neighbourhood) return 4;
              if (item.type === 'yes' || item.category === 'amenity' || item.category === 'shop') return 5; // POI
              if (addr.road) return 6;
              return 7; // Other
            };
            return getGranularityScore(a) - getGranularityScore(b);
          });
          
          setSearchResults(rankedData);
          setShowDropdown(true);
        }

      } catch (err) {
        console.error(err);
        setSearchError(t("map.searchFailed"));
      } finally {
        setSearching(false);
      }
    };

    doSearch();
  }, [debouncedSearchQuery, selectedCity]);

  // Default to NTB Province Center
  const center = useMemo(() => {
    // If we have a favorite "Home" or Primary and no value yet, default to it
    if (!value) {
      const primary = savedAddresses.find(a => a.is_primary) || savedAddresses.find(a => a.label.toLowerCase() === 'home');
      if (primary) return { lat: primary.latitude, lng: primary.longitude };
      return { lat: NTB_CENTER[0], lng: NTB_CENTER[1] };
    }
    return value;
  }, [value?.lat, value?.lng, savedAddresses]);

  const details = useMemo(() => {
    if (!value) return null;
    const coords = `${value.lat.toFixed(6)}, ${value.lng.toFixed(6)}`;
    const link = osmLink(value.lat, value.lng);
    return { coords, link };
  }, [value?.lat, value?.lng]);

  const activeSavedAddress = useMemo(() => {
    if (!value) return null;
    return savedAddresses.find(a => 
        Math.abs(a.latitude - value.lat) < 0.0001 && 
        Math.abs(a.longitude - value.lng) < 0.0001
    );
  }, [value?.lat, value?.lng, savedAddresses]);

  const primaryAddress = useMemo(() => savedAddresses.find(a => a.is_primary), [savedAddresses]);

  // Reverse geocode whenever the pin changes.
  useEffect(() => {
    if (!value) {
      setResolving(false);
      setResolvedAddress(null);
      setResolveError(null);
      onAddressChangeRef.current?.(null);
      return;
    }

    const id = ++requestIdRef.current;
    setResolving(true);
    setResolveError(null);

    (async () => {
      try {
        const resp = await api.get("/geo/reverse", { params: { lat: value.lat, lng: value.lng } });
        const json = resp.data?.data;
        const displayName = (json?.display_name ?? null) as string | null;
        const addr = json?.address ?? {};

        if (requestIdRef.current !== id) return;
        setResolvedAddress(displayName);
        setAddressDetails(addr);
        onAddressChangeRef.current?.(displayName);
      } catch {
        if (requestIdRef.current !== id) return;
        setResolvedAddress(null);
        setResolveError(t("map.couldNotResolveAddress"));
        onAddressChangeRef.current?.(null);
      } finally {
        if (requestIdRef.current === id) setResolving(false);
      }
    })();
  }, [value?.lat, value?.lng]);

  const handleManualPick = (v: LatLng) => {
    setGeoError(null);
    setAccuracyMeters(null);
    setForcedZoom(undefined); // Reset forced zoom on manual pick
    onChange(v);
    onDetailsChange?.({ notes: "" });
  };

  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const cityName = e.target.value;
    setSelectedCity(cityName);
    
    const city = NTB_CITIES.find(c => c.name === cityName);
    if (city) {
      const newLoc = { lat: city.lat, lng: city.lng };
      setForcedZoom(13); // Fly to city level
      onChange(newLoc);
      setAccuracyMeters(null);
      onDetailsChange?.({ notes: "" });
    }
  };

  // 6. AUTO CITY SWITCH & 7. MAP ACTIONS
  const selectSearchResult = (result: any) => {
    const lat = parseFloat(result.lat);
    const lon = parseFloat(result.lon);
    
    // 7. MAP: FlyTo & Marker
    setForcedZoom(18); 
    onChange({ lat, lng: lon });
    setAccuracyMeters(null);
    onDetailsChange?.({ notes: "" });
    
    // Update address text
    const displayName = result.display_name;
    setResolvedAddress(displayName);
    setSearchQuery(displayName); 
    setShowDropdown(false);
    
    // 6. AUTO CITY SWITCH
    if (result.address) {
       const resultCity = result.address.city || result.address.town || result.address.regency || result.address.county;
       if (resultCity) {
         const matchedCity = NTB_CITIES.find(c => 
            resultCity.toLowerCase().includes(c.name.toLowerCase()) || 
            c.name.toLowerCase().includes(resultCity.toLowerCase())
         );
         if (matchedCity && matchedCity.name !== selectedCity) {
            setSelectedCity(matchedCity.name);
         }
       }
    }

    // Add to recents
    addToRecents({
      id: Date.now(),
      label: "Recent",
      address: displayName,
      latitude: lat,
      longitude: lon
    });
  };

  const handleDeleteAddress = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (!confirm(t("map.deleteConfirm"))) return;

    try {
      await api.delete(`/address/${id}`);
      setInternalSavedAddresses(prev => prev.filter(a => a.id !== id));
    } catch (e) {
      alert(t("map.deleteFailed"));
    }
  };

  const handleSaveData = async (data: any) => {
    try {
      await api.post("/address/save", data);
      setShowSaveModal(false);
      loadFavorites(); 
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  const handleUseMyLocation = () => {
    setGeoError(null);
    setAccuracyMeters(null);
    setForcedZoom(18); // Zoom in for my location

    if (!window.isSecureContext) {
      // Allow localhost
      const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
      if (!isLocalhost) {
        setGeoError(t("map.locationRequiresHttps"));
        return;
      }
    }

    if (!navigator.geolocation) {
      alert(t("map.geolocationNotSupported"));
      return;
    }

    setLocating(true);
    setAccuracyMeters(null);
    
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    let bestAccuracy = Infinity;
    let huntStartTime = Date.now();
    const HUNT_DURATION = 10000;

    const success = (position: GeolocationPosition) => {
      const { latitude, longitude, accuracy } = position.coords;
      const now = Date.now();
      
      console.log(`[GPS] Signal: Acc=${accuracy}m, Lat=${latitude}`);

      if (accuracy < bestAccuracy || (now - huntStartTime > HUNT_DURATION)) {
        bestAccuracy = accuracy;
        const newLoc = { lat: latitude, lng: longitude };
        
        onChange(newLoc);
        setAccuracyMeters(accuracy);
        onDetailsChange?.({ notes: "" });
        
        if (accuracy < 15) {
           setLocating(false);
        }
      }

      if (now - huntStartTime > 3000 && bestAccuracy < 100) {
        setLocating(false);
      }
    };

    const error = (err: GeolocationPositionError) => {
      console.warn("GPS Error:", err);
      if (bestAccuracy === Infinity) {
        setLocating(false);
        setGeoError(t("map.gpsError").replace("{error}", err.message));
      }
    };

    watchIdRef.current = navigator.geolocation.watchPosition(success, error, {
      enableHighAccuracy: true,
      timeout: 15000, 
      maximumAge: 0 
    });

    setTimeout(() => setLocating(false), 10000);
  };

  const watchIdRef = useRef<number | null>(null);

  const getIconForLabel = (l: string) => {
    const lower = l.toLowerCase();
    if (lower.includes("home") || lower.includes("rumah")) return <Home className="w-3 h-3" />;
    if (lower.includes("office") || lower.includes("kantor")) return <Briefcase className="w-3 h-3" />;
    return <Star className="w-3 h-3" />;
  };

  const initialZoom = isMobile ? 7 : 8;

  return (
    <div className="space-y-4">
      <style>{markerStyle}</style>

      {/* NTB City Selector & Search Bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 relative z-[500]">
        {/* City Selector & Primary Address */}
        <div className="flex flex-col gap-2">
          <div className="relative">
            <select
              aria-label={t("map.city")}
              value={selectedCity}
              onChange={handleCityChange}
              className="w-full appearance-none bg-white border border-slate-200 text-slate-700 text-sm rounded-xl px-4 py-3 pr-10 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm transition-all"
            >
              <option value="">{t("map.allRegions")}</option>
              {NTB_CITIES.map((city) => (
                <option key={city.name} value={city.name}>
                  {city.name}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-slate-400">
              <Navigation className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Address Search with Autocomplete */}
        <div className="relative">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => { if(searchResults.length > 0) setShowDropdown(true); }}
              onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
              placeholder={selectedCity ? t("map.searchCityPlaceholder").replace("{city}", selectedCity) : t("map.searchPlaceholder")}
              className="w-full bg-white border border-slate-200 text-slate-700 text-sm rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm transition-all placeholder:text-slate-400"
            />
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            {searching && (
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
              </div>
            )}
          </div>
          
          {/* Autocomplete Dropdown */}
          {showDropdown && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-50 max-h-80 overflow-y-auto">
              {searchResults.map((result, i) => {
                // 6. UI DROPDOWN - Title & Subtitle
                const addr = result.address || {};
                const title = result.name || addr.road || addr.building || result.display_name.split(',')[0];
                const subtitleParts = [
                   addr.village, 
                   addr.suburb, 
                   addr.district, 
                   addr.city || addr.town || addr.regency
                ].filter(Boolean);
                const subtitle = subtitleParts.join(" - ");

                return (
                  <button
                    key={i}
                    onClick={() => selectSearchResult(result)}
                    className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-indigo-50 transition-colors border-b border-slate-50 last:border-0 flex items-start gap-3"
                  >
                    <MapPin className="w-4 h-4 text-slate-400 mt-1 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-slate-800 line-clamp-1">{title}</div>
                      <div className="text-xs text-slate-500 line-clamp-2">{subtitle || result.display_name}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Main Location Pill (Redesigned) */}
      {mainLocation && (
         <div className="animate-in slide-in-from-top-2 fade-in duration-500 mb-2">
            <div 
               className="w-full bg-white/95 backdrop-blur-md border border-slate-100/80 rounded-xl p-3 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] flex items-center gap-3 relative overflow-hidden cursor-pointer hover:shadow-lg hover:shadow-indigo-500/10 hover:border-indigo-100/50 transition-all group"
               onClick={() => {
                  setForcedZoom(18);
                  onChange({ lat: mainLocation.latitude, lng: mainLocation.longitude });
                  setResolvedAddress(mainLocation.address);
                  setAddressDetails({
                     road: mainLocation.street,
                     village: mainLocation.village,
                     district: mainLocation.district,
                     city: mainLocation.city
                  });
                  onDetailsChange?.({ notes: mainLocation.notes });
               }}
            >
               {/* Elegant Left Accent */}
               <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500"></div>

               {/* Icon Container */}
               <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 shrink-0 group-hover:scale-105 transition-transform border border-indigo-100">
                  <span className="text-lg">{mainLocation.label === 'Rumah' ? '🏠' : mainLocation.label === 'Kantor' ? '🏢' : '📍'}</span>
               </div>

               {/* Content */}
               <div className="flex-1 min-w-0">
                  <div className="flex items-center flex-wrap gap-2 mb-0.5">
                     <span className="font-bold text-slate-800 text-sm tracking-tight">{mainLocation.label}</span>
                     <span className="px-1.5 py-0.5 bg-indigo-600 text-white text-[9px] font-bold rounded-md shadow-sm tracking-wide">
                       UTAMA
                     </span>
                     {mainLocation.notes && (
                       <span className="text-[10px] text-slate-500 italic truncate max-w-[150px] border-l border-slate-200 pl-2">
                         "{mainLocation.notes}"
                       </span>
                     )}
                  </div>
                  <div className="text-[11px] text-slate-500 truncate font-medium opacity-80">{mainLocation.address}</div>
               </div>

               {/* Delete Action (Subtle) */}
               <button 
                  onClick={async (e) => {
                     e.stopPropagation();
                     if(confirm("Hapus lokasi utama?")) {
                        try {
                          await api.delete(`/address/${mainLocation.id}`);
                          setMainLocation(null);
                          loadFavorites();
                          if (onRefresh) onRefresh();
                        } catch(e) {
                          alert("Gagal menghapus lokasi");
                        }
                     }
                  }}
                  className="w-8 h-8 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-full flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
               >
                  <Trash2 className="w-4 h-4" />
               </button>
            </div>
         </div>
      )}

      {/* Location Switcher UI (Radio Style) - Only show others if needed or keep hidden if Simple Flow is strict */}
      {(savedAddresses.length > 0 && !mainLocation) && (
        <div className="space-y-3 mb-4">
           <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t("map.savedLocations")}</span>
              {/* Add Backup Button - Removed per user request */}
           </div>

           <div className="grid gap-2">
             {savedAddresses.map((addr) => {
               const isSelected = value?.lat === addr.latitude && value?.lng === addr.longitude;
               return (
                 <div 
                   key={addr.id}
                   onClick={() => {
                     setForcedZoom(18);
                     onChange({ lat: addr.latitude, lng: addr.longitude });
                     setResolvedAddress(addr.address);
                     setAddressDetails({
                       road: addr.street,
                       village: addr.village,
                       district: addr.district,
                       city: addr.city
                     });
                     onDetailsChange?.({ notes: addr.notes });
                   }}
                   className={`
                     group relative flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer
                     ${isSelected 
                       ? 'bg-indigo-50/50 border-indigo-200 shadow-sm ring-1 ring-indigo-100' 
                       : 'bg-white border-slate-100 hover:border-indigo-100 hover:bg-slate-50'}
                   `}
                 >
                   {/* Radio Indicator */}
                   <div className={`
                     w-4 h-4 rounded-full border flex items-center justify-center transition-colors flex-shrink-0
                     ${isSelected ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300 bg-white group-hover:border-indigo-400'}
                   `}>
                     {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                   </div>

                   {/* Icon */}
                   <div className={`
                     w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                     ${isSelected ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500'}
                   `}>
                     {getIconForLabel(addr.label)}
                   </div>

                   {/* Content */}
                   <div className="flex-1 min-w-0">
                     <div className="flex items-center gap-2 mb-0.5">
                       <span className={`text-xs font-bold ${isSelected ? 'text-indigo-900' : 'text-slate-700'}`}>
                         {addr.label}
                       </span>
                       {addr.is_primary && (
                         <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[9px] font-bold rounded flex items-center gap-0.5">
                         <Star className="w-2.5 h-2.5 fill-amber-700" />
                         {t("map.saveAddress.primaryBadge")}
                       </span>
                       )}
                     </div>
                     <div className="text-[11px] text-slate-500 truncate leading-tight">
                      {addr.address}
                    </div>
                    {addr.notes && (
                      <div className="mt-1.5 flex items-start gap-1.5 bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                         <div className="text-[10px] font-semibold text-indigo-600 shrink-0">
                            {t("map.saveAddress.notes")}:
                         </div>
                         <div className="text-[10px] text-slate-600 leading-tight line-clamp-2 italic">
                            {addr.notes}
                         </div>
                      </div>
                    )}
                  </div>
                   
                   {/* Delete Action */}
                   <button 
                      onClick={(e) => handleDeleteAddress(e, addr.id)}
                      className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                      title={t("common.delete")}
                   >
                     <Trash2 className="w-3.5 h-3.5" />
                   </button>
                 </div>
               );
             })}
           </div>
        </div>
      )}

      {searchError && (
        <div className="flex items-center gap-2 text-xs text-rose-600 bg-rose-50 border border-rose-100 p-2.5 rounded-lg animate-in slide-in-from-top-1">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {searchError}
        </div>
      )}

      {/* Main Map Card */}
      <div className="relative group rounded-3xl overflow-hidden border-4 border-white shadow-2xl ring-1 ring-slate-900/5 transition-all hover:shadow-indigo-500/10">
        
        <MapContainer
          key={mapKeyRef.current}
          center={center}
          zoom={value ? 17 : initialZoom}
          scrollWheelZoom
          className={`${mapHeight} w-full bg-slate-50`}
          style={{ zIndex: 0 }}
        >
          <LayersControl position="topright">
             <LayersControl.BaseLayer checked name="Google Maps">
               <TileLayer
                 url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
                 attribution="&copy; Google Maps"
                 maxZoom={20}
               />
             </LayersControl.BaseLayer>

             <LayersControl.BaseLayer name="Satellite Hybrid">
                <TileLayer
                  url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
                  attribution="&copy; Google Maps"
                  maxZoom={20}
                />
             </LayersControl.BaseLayer>

             <LayersControl.BaseLayer name="OpenStreetMap">
               <TileLayer
                  attribution={TILE_ATTR}
                  url={TILE_URL}
                  maxZoom={20}
                />
             </LayersControl.BaseLayer>
          </LayersControl>

          {/* NTB Boundary Highlight */}
          <GeoJSON 
            data={NTB_GEOJSON} 
            style={{
              color: "#2EC4B6",
              weight: 2,
              fillOpacity: 0.06,
              dashArray: "4 4"
            }} 
          />

          {/* Logic Components */}
          <SmartMapUpdater center={center} accuracy={accuracyMeters} zoom={forcedZoom} />
          <InitialFlyTo trigger={(isOpen !== false) && !value} zoom={initialZoom} />
          <MapResizer isOpen={isOpen} />
          <ClickToPick onPick={handleManualPick} />
          
          {value && (
            <Marker 
              key={`marker-${value.lat}-${value.lng}`} 
              position={value}
              draggable={true}
              icon={premiumMarkerIcon}
              zIndexOffset={100}
              eventHandlers={{
                dragend: (e) => {
                  const marker = e.target;
                  const position = marker.getLatLng();
                  handleManualPick({ lat: position.lat, lng: position.lng });
                }
              }}
            >
              <Popup className="premium-popup" closeButton={false} offset={[0, -20]}>
                 <div className="p-3 font-sans">
                    <div className="text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div>
                      {t("map.selectedPoint")}
                    </div>
                    <div className="text-xs font-semibold text-slate-900 leading-tight mb-2">
                      {resolvedAddress || t("map.loadingAddress")}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono bg-slate-50 p-1.5 rounded border border-slate-100">
                       <span>{value.lat.toFixed(6)}, {value.lng.toFixed(6)}</span>
                    </div>
                    {addressDetails && (
                      <div className="mt-2 pt-2 border-t border-slate-100 grid grid-cols-2 gap-y-1 gap-x-2 text-[10px]">
                         <div className="col-span-2">
                            <span className="text-slate-400 block text-[9px]">{t("map.street")}</span>
                            <span className="font-medium text-slate-700 truncate block" title={addressDetails.road}>{addressDetails.road || "-"}</span>
                         </div>
                         <div>
                            <span className="text-slate-400 block text-[9px]">{t("map.district")}</span>
                            <span className="font-medium text-slate-700 truncate block" title={addressDetails.district || addressDetails.city_district}>{addressDetails.district || addressDetails.city_district || "-"}</span>
                         </div>
                         <div>
                            <span className="text-slate-400 block text-[9px]">{t("map.city")}</span>
                            <span className="font-medium text-slate-700 truncate block" title={addressDetails.city || addressDetails.town}>{addressDetails.city || addressDetails.town || "-"}</span>
                         </div>
                      </div>
                    )}
                    {activeSavedAddress?.notes && (
                      <div className="mt-2 pt-2 border-t border-slate-100">
                         <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                             {t("map.saveAddress.notes")}
                         </div>
                         <div className="text-[10px] text-slate-600 italic bg-indigo-50/50 p-1.5 rounded border border-indigo-100/50">
                             {activeSavedAddress.notes}
                         </div>
                      </div>
                    )}
                 </div>
              </Popup>
            </Marker>
          )}
          
          {value && accuracyMeters ? (
            <Circle
              key={`circle-${value.lat}-${value.lng}-${accuracyMeters}`}
              center={value}
              radius={accuracyMeters}
              pathOptions={{ color: "#4f46e5", fillColor: "#4f46e5", fillOpacity: 0.1, weight: 1, dashArray: "4 4" }}
            />
          ) : null}
        </MapContainer>

        {/* Welcome Overlay */}
        <WelcomeOverlay visible={showWelcome} />

        {/* Floating Controls Overlay */}
        <SimpleSaveModal 
          isOpen={showSimpleModal} 
          onClose={() => setShowSimpleModal(false)} 
          onSave={handleSimpleSave} 
        />
        <div className="absolute inset-0 pointer-events-none p-4 flex flex-col justify-between z-[1100]">
          
          {/* Center Hint: "Ketuk peta" */}
          {!value && (
            <div className="absolute bottom-20 sm:bottom-10 left-0 right-0 flex items-center justify-center z-[300] pointer-events-none">
               <div className="bg-white/80 backdrop-blur-md px-3 py-1.5 sm:px-4 sm:py-2 rounded-full shadow-lg border border-white/50 animate-in slide-in-from-bottom-2 fade-in duration-500 animate-float flex items-center gap-1.5 sm:gap-2">
                  <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-indigo-500" />
                  <span className="text-xs sm:text-sm font-semibold text-slate-600">
                    {t("map.tapToSetLocation")}
                  </span>
               </div>
            </div>
          )}

          {/* Top Row: Address & GPS Button */}
          <div className="flex items-start justify-between w-full pointer-events-none">
            {/* Left: Address Card (Glassmorphism) */}
            <div className="flex-1 max-w-[calc(100%-60px)] pointer-events-auto">
              {value && details ? (
                <div className="bg-white/95 backdrop-blur-xl p-3.5 rounded-2xl shadow-lg border border-white/50 animate-in slide-in-from-top-4 fade-in duration-500 w-full sm:w-auto">
                   <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 mt-0.5">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider mb-0.5">
                            {t("map.approxAddress")}
                          </div>
                          <button 
                            disabled={resolving || !resolvedAddress}
                            onClick={() => {
                                setShowSimpleModal(true);
                            }}
                            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Save className="w-3 h-3" />
                            {t("map.saveAddress.save")}
                          </button>
                        </div>
                        <div className="text-xs font-semibold text-slate-800 leading-tight line-clamp-2 mt-0.5">
                          {resolving ? (
                            <span className="flex items-center gap-2 text-slate-500 font-normal">
                              <Loader2 className="w-3 h-3 animate-spin" />
                              {t("map.lookingUp")}
                            </span>
                          ) : (
                            resolvedAddress ?? "—"
                          )}
                        </div>
                        {activeSavedAddress?.notes && (
                           <div className="mt-1.5 flex items-start gap-1 bg-slate-50 p-1.5 rounded border border-slate-100/50">
                              <span className="text-[9px] font-bold text-indigo-500 uppercase shrink-0 mt-0.5">Detail Catatan untuk Petugas:</span>
                              <span className="text-[10px] text-slate-600 italic line-clamp-2">{activeSavedAddress.notes}</span>
                           </div>
                        )}
                        <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-500 font-medium border-t border-slate-100 pt-2">
                          <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                            {details.coords}
                          </span>
                          {accuracyMeters != null && (
                             <span className={accuracyMeters <= 20 ? "text-emerald-600" : "text-amber-600"}>
                               ±{formatMeters(accuracyMeters)}
                             </span>
                          )}
                        </div>
                      </div>
                   </div>
                </div>
              ) : null}
            </div>

            {/* Right: GPS FAB */}
            <div className="flex flex-col items-end gap-2 ml-2 relative pointer-events-auto">
               {/* Helper Popup for GPS */}
               {!value && !locating && (
                 <div className="absolute right-14 top-6 -translate-y-1/2 w-max pointer-events-none animate-in slide-in-from-right-4 fade-in duration-700 delay-500 z-[500]">
                    <div className="bg-indigo-600 text-white text-[10px] font-bold px-3 py-2 rounded-xl shadow-xl relative flex items-center gap-1.5">
                       <span>{t("map.useMyLocation")}</span>
                       <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-indigo-600 rotate-45"></div>
                    </div>
                 </div>
               )}

               <button
                type="button"
                onClick={handleUseMyLocation}
                disabled={locating}
                className="group relative flex items-center justify-center w-12 h-12 bg-white text-indigo-600 rounded-2xl shadow-xl shadow-slate-200 border border-white/50 hover:bg-indigo-50 hover:scale-105 active:scale-95 transition-all disabled:opacity-70 disabled:grayscale"
              >
                {locating ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <LocateFixed className="w-6 h-6" />
                )}
                {/* Ping animation when locating */}
                {locating && (
                  <span className="absolute inset-0 rounded-2xl animate-ping bg-indigo-400 opacity-20"></span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Save Address Modal */}
      <SaveAddressModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        onSave={handleSaveData}
        address={resolvedAddress || ""}
        details={{
           street: addressDetails?.road,
           village: addressDetails?.village || addressDetails?.suburb,
           district: addressDetails?.district || addressDetails?.city_district,
           city: addressDetails?.city || addressDetails?.town || addressDetails?.regency
        }}
        coordinates={value || { lat: 0, lng: 0 }}
        existingAddresses={savedAddresses}
      />
    </div>
  );
});
