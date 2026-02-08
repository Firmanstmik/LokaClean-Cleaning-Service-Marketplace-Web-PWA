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
import { Circle, MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import { LocateFixed, Loader2, MapPin, Navigation, Search, CheckCircle2, Home, Briefcase, Star, Clock, Trash2, Plus, Save, AlertCircle, X } from "lucide-react";
import L from "leaflet";

import { api } from "../lib/api";
import { t } from "../lib/i18n";

export type LatLng = { lat: number; lng: number };

type SavedAddress = {
  id: number;
  label: string;
  address: string;
  latitude: number;
  longitude: number;
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


const lombokHomeIcon = L.divIcon({
  className: "lombok-marker",
  html: `
    <div style="position: relative; width: 40px; height: 40px;">
       <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style="width: 100%; height: 100%; filter: drop-shadow(0 4px 3px rgb(0 0 0 / 0.1));">
          <!-- Lumbung Roof -->
          <path d="M50 5 C20 40 10 55 5 70 H95 C90 55 80 40 50 5Z" fill="#8B4513" stroke="#5D4037" stroke-width="2"/>
          <!-- Base -->
          <rect x="25" y="70" width="50" height="25" rx="2" fill="#CD853F" stroke="#8B4513" stroke-width="2"/>
          <!-- Door -->
          <rect x="42" y="75" width="16" height="20" rx="1" fill="#5D4037"/>
          <!-- Stilts -->
          <rect x="30" y="95" width="8" height="5" fill="#3E2723"/>
          <rect x="62" y="95" width="8" height="5" fill="#3E2723"/>
       </svg>
    </div>
  `,
  iconSize: [40, 40],
  iconAnchor: [20, 40],
});

// CSS for micro-interaction
const markerStyle = `
  .lombok-marker {
    transition: transform 0.2s ease-out;
  }
  .lombok-marker svg {
    animation: pop 0.25s ease-out backwards;
  }
  @keyframes pop {
    from { transform: scale(0.85); opacity: 0.6; }
    to { transform: scale(1); opacity: 1; }
  }
  @keyframes float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-6px); }
  }
  .animate-float {
    animation: float 3s ease-in-out infinite;
  }
`;

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

export const MapPicker = memo(function MapPicker({
  value,
  onChange,
  onAddressChange,
  label,
  helperText,
  hideLabel = false,
  isOpen,
  onSaveRequest,
  mapHeight = "h-[400px]"
}: {
  value: LatLng | null;
  onChange: (v: LatLng) => void;
  onAddressChange?: (address: string | null) => void;
  label?: string;
  helperText?: string;
  hideLabel?: boolean;
  isOpen?: boolean;
  onSaveRequest?: (data: { lat: number; lng: number; address: string }) => void;
  mapHeight?: string;
}) {
  const defaultLabel = t("common.location");
  const defaultHelperText = t("map.tapToSetLocation");
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [accuracyMeters, setAccuracyMeters] = useState<number | null>(null);

  const [resolving, setResolving] = useState(false);
  const [resolvedAddress, setResolvedAddress] = useState<string | null>(null);
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
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [recentLocations, setRecentLocations] = useState<SavedAddress[]>([]);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveLabel, setSaveLabel] = useState("Home");
  const [isSaving, setIsSaving] = useState(false);
  
  // Map control
  const [forcedZoom, setForcedZoom] = useState<number | undefined>(undefined);

  const requestIdRef = useRef(0);
  const onAddressChangeRef = useRef<typeof onAddressChange>(onAddressChange);
  const mapKeyRef = useRef(`map-${Date.now()}-${Math.random()}`);

  useEffect(() => {
    onAddressChangeRef.current = onAddressChange;
  }, [onAddressChange]);

  // Load favorites & recents
  useEffect(() => {
    loadFavorites();
    loadRecents();
  }, []);

  const loadFavorites = async () => {
    try {
      const res = await api.get("/address/list");
      setSavedAddresses(res.data.data);
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
          setSearchError("Alamat tidak ditemukan. Coba kata kunci lain.");
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
        setSearchError("Gagal mencari alamat");
      } finally {
        setSearching(false);
      }
    };

    doSearch();
  }, [debouncedSearchQuery, selectedCity]);

  // Default to NTB Province Center (Approx middle of Lombok & Sumbawa)
  const defaultCenter = { lat: -8.65, lng: 117.3 }; 
  const center = useMemo(() => {
    // If we have a favorite "Home" and no value yet, default to Home
    if (!value) {
      const home = savedAddresses.find(a => a.label.toLowerCase() === 'home');
      if (home) return { lat: home.latitude, lng: home.longitude };
      return defaultCenter;
    }
    return value;
  }, [value?.lat, value?.lng, savedAddresses]);

  const details = useMemo(() => {
    if (!value) return null;
    const coords = `${value.lat.toFixed(6)}, ${value.lng.toFixed(6)}`;
    const link = osmLink(value.lat, value.lng);
    return { coords, link };
  }, [value?.lat, value?.lng]);

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
        const displayName = (resp.data?.data?.display_name ?? null) as string | null;
        if (requestIdRef.current !== id) return;
        setResolvedAddress(displayName);
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
    if (!confirm("Hapus alamat ini?")) return;

    try {
      await api.delete(`/address/${id}`);
      setSavedAddresses(prev => prev.filter(a => a.id !== id));
    } catch (e) {
      alert("Gagal menghapus alamat");
    }
  };

  const handleSaveFavorite = async () => {
    if (!value || !resolvedAddress) return;
    setIsSaving(true);
    try {
      await api.post("/address/save", {
        label: saveLabel,
        address: resolvedAddress,
        lat: value.lat,
        lng: value.lng
      });
      setShowSaveModal(false);
      loadFavorites(); // Reload
    } catch (e) {
      alert("Gagal menyimpan alamat");
    } finally {
      setIsSaving(false);
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
      alert("Geolocation is not supported by your browser");
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
        setGeoError(`Gagal mengambil lokasi: ${err.message}. Pastikan GPS aktif.`);
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

  return (
    <div className="space-y-4">
      <style>{markerStyle}</style>

      {/* NTB City Selector & Search Bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 relative z-[500]">
        {/* City Selector */}
        <div className="relative">
          <select
            aria-label="Pilih Kota (NTB)"
            value={selectedCity}
            onChange={handleCityChange}
            className="w-full appearance-none bg-white border border-slate-200 text-slate-700 text-sm rounded-xl px-4 py-3 pr-10 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm transition-all"
          >
            <option value="">Semua Wilayah (NTB)</option>
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

        {/* Address Search with Autocomplete */}
        <div className="relative">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => { if(searchResults.length > 0) setShowDropdown(true); }}
              onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
              placeholder={selectedCity ? `Cari di ${selectedCity}...` : "Cari alamat, desa, jalan..."}
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

      {/* Favorites & Recents Quick Access */}
      {(savedAddresses.length > 0 || recentLocations.length > 0) && (
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {savedAddresses.map((addr) => (
            <button
              key={`saved-${addr.id}`}
              onClick={() => {
                setForcedZoom(18);
                onChange({ lat: addr.latitude, lng: addr.longitude });
                setResolvedAddress(addr.address);
              }}
              className="group flex items-center gap-1.5 pl-3 pr-1.5 py-1.5 bg-indigo-50 text-indigo-700 rounded-full text-xs font-medium border border-indigo-100 hover:bg-indigo-100 transition-colors whitespace-nowrap"
            >
              {getIconForLabel(addr.label)}
              <span>{addr.label}</span>
              <div 
                role="button"
                onClick={(e) => handleDeleteAddress(e, addr.id)}
                className="ml-1 p-0.5 rounded-full hover:bg-indigo-200 text-indigo-400 hover:text-indigo-700 transition-colors"
              >
                <X className="w-3 h-3" />
              </div>
            </button>
          ))}
          {recentLocations.map((addr, i) => (
            <button
              key={`recent-${i}`}
              onClick={() => {
                setForcedZoom(18);
                onChange({ lat: addr.latitude, lng: addr.longitude });
                setResolvedAddress(addr.address);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 text-slate-600 rounded-full text-xs font-medium border border-slate-200 hover:bg-slate-100 transition-colors whitespace-nowrap"
            >
              <Clock className="w-3 h-3" />
              {addr.address.split(",")[0]}
            </button>
          ))}
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
          zoom={value ? 17 : 8}
          scrollWheelZoom
          className={`${mapHeight} w-full bg-slate-50`}
          style={{ zIndex: 0 }}
        >
          <TileLayer
            attribution='&copy; Google Maps'
            url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
            maxZoom={20}
          />
          <SmartMapUpdater center={center} accuracy={accuracyMeters} zoom={forcedZoom} />
          <MapResizer isOpen={isOpen} />
          <ClickToPick onPick={handleManualPick} />
          
          {value ? (
            <Marker 
              key={`marker-${value.lat}-${value.lng}`} 
              position={value}
              draggable={true}
              icon={lombokHomeIcon}
              eventHandlers={{
                dragend: (e) => {
                  const marker = e.target;
                  const position = marker.getLatLng();
                  handleManualPick({ lat: position.lat, lng: position.lng });
                }
              }}
            />
          ) : null}
          
          {value && accuracyMeters ? (
            <Circle
              key={`circle-${value.lat}-${value.lng}-${accuracyMeters}`}
              center={value}
              radius={accuracyMeters}
              pathOptions={{ color: "#4f46e5", fillColor: "#4f46e5", fillOpacity: 0.1, weight: 1, dashArray: "4 4" }}
            />
          ) : null}
        </MapContainer>

        {/* Floating Controls Overlay */}
        <div className="absolute inset-0 pointer-events-none p-4 flex flex-col justify-between z-[1100]">
          
          {/* Center Hint: "Ketuk peta" */}
          {!value && (
            <div className="absolute inset-0 flex items-center justify-center z-[300] pointer-events-none">
               <div className="bg-white/80 backdrop-blur-md px-4 py-2 rounded-full shadow-lg border border-white/50 animate-in zoom-in-90 fade-in duration-500 animate-float flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-indigo-500" />
                  <span className="text-sm font-semibold text-slate-600">
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
                              if (onSaveRequest && value && resolvedAddress) {
                                onSaveRequest({ lat: value.lat, lng: value.lng, address: resolvedAddress });
                              } else {
                                setShowSaveModal(true);
                              }
                            }}
                            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Save className="w-3 h-3" />
                            Simpan
                          </button>
                        </div>
                        <div className="text-sm font-semibold text-slate-800 leading-snug line-clamp-2">
                          {resolving ? (
                            <span className="flex items-center gap-2 text-slate-500 font-normal">
                              <Loader2 className="w-3 h-3 animate-spin" />
                              {t("map.lookingUp")}
                            </span>
                          ) : (
                            resolvedAddress ?? "—"
                          )}
                        </div>
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
                       <span>Gunakan lokasi saya</span>
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
    </div>
  );
});
