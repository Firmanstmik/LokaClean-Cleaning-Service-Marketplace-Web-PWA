/**
 * Map picker (Leaflet/OpenStreetMap).
 *
 * - Click/tap to set a marker
 * - Optional "use my location" button (browser geolocation)
 */

import { useEffect, useMemo, useRef, useState, memo } from "react";
import { Circle, MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import { LocateFixed, Loader2, MapPin, Navigation } from "lucide-react";

import { api } from "../lib/api";
import { t } from "../lib/i18n";

export type LatLng = { lat: number; lng: number };

function ClickToPick({ onPick }: { onPick: (v: LatLng) => void }) {
  useMapEvents({
    click(e) {
      onPick({ lat: e.latlng.lat, lng: e.latlng.lng });
    }
  });
  return null;
}

function RecenterOnChange({ center }: { center: LatLng }) {
  const map = useMap();
  const last = useRef<LatLng | null>(null);

  useEffect(() => {
    // Avoid re-centering if the map is already close to the requested center.
    if (last.current && Math.abs(last.current.lat - center.lat) < 1e-8 && Math.abs(last.current.lng - center.lng) < 1e-8) {
      return;
    }
    last.current = center;
    map.setView(center, map.getZoom(), { animate: true });
  }, [center.lat, center.lng, map]);

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


function MapResizer() {
  const map = useMap();

  useEffect(() => {
    const observer = new ResizeObserver(() => {
      map.invalidateSize();
    });
    
    const container = map.getContainer();
    if (container) {
      observer.observe(container);
    }
    
    // Also invalidate immediately on mount/update
    map.invalidateSize();

    return () => observer.disconnect();
  }, [map]);

  return null;
}

export const MapPicker = memo(function MapPicker({
  value,
  onChange,
  onAddressChange,
  label,
  helperText,
  hideLabel = false
}: {
  value: LatLng | null;
  onChange: (v: LatLng) => void;
  onAddressChange?: (address: string | null) => void;
  label?: string;
  helperText?: string;
  hideLabel?: boolean;
}) {
  const defaultLabel = t("common.location");
  const defaultHelperText = t("map.tapToSetLocation");
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [accuracyMeters, setAccuracyMeters] = useState<number | null>(null);

  const [resolving, setResolving] = useState(false);
  const [resolvedAddress, setResolvedAddress] = useState<string | null>(null);
  const [resolveError, setResolveError] = useState<string | null>(null);

  const requestIdRef = useRef(0);
  const onAddressChangeRef = useRef<typeof onAddressChange>(onAddressChange);
  const mapKeyRef = useRef(`map-${Date.now()}-${Math.random()}`);

  useEffect(() => {
    onAddressChangeRef.current = onAddressChange;
  }, [onAddressChange]);

  const center = useMemo(() => value ?? { lat: -8.650_000_0, lng: 115.216_666_7 }, [value?.lat, value?.lng]); // Bali default

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
    onChange(v);
  };

  const handleUseMyLocation = async () => {
    setGeoError(null);
    setAccuracyMeters(null);

    if (!window.isSecureContext) {
      const hostname = window.location.hostname;
      const isLocalhost = hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
      if (!isLocalhost) {
        setGeoError(t("map.locationRequiresHttps"));
        return;
      }
    }

    if (!navigator.geolocation) {
      setGeoError(t("map.geolocationNotSupported"));
      return;
    }

    // Check permission status
    if ("permissions" in navigator) {
      try {
        const permission = await navigator.permissions.query({ name: "geolocation" as PermissionName });
        permission.onchange = () => {
          if (permission.state === "granted") setGeoError(null);
        };
      } catch (err) {
        // Ignore
      }
    }

    setLocating(true);
    let watchId: number | null = null;
    let bestAccuracy = Infinity;
    let hasUpdated = false;

    // Enhanced strategy: Watch position for up to 15s to get the best accuracy ("Zeroing in")
    // This is better than getCurrentPosition for "alley" or low-signal areas as it allows GPS to warm up.
    
    const stopLocating = () => {
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
      setLocating(false);
    };

    // Fail-safe timeout (15s total)
    const timeoutId = setTimeout(() => {
      stopLocating();
      if (!hasUpdated) {
        setGeoError(t("map.locationTimeout"));
      }
    }, 15000);

    const onPos = (pos: GeolocationPosition) => {
      const { latitude, longitude, accuracy } = pos.coords;
      
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;

      // Update map if:
      // 1. It's the first reading we got
      // 2. OR this reading is more accurate than the best one we have so far
      // 3. OR the new reading is decently accurate (< 25m) - allows following the user slightly
      if (!hasUpdated || accuracy < bestAccuracy || (accuracy < 25 && accuracy < bestAccuracy + 5)) {
        hasUpdated = true;
        bestAccuracy = accuracy;
        
        setAccuracyMeters(accuracy);
        onChange({ lat: latitude, lng: longitude });
        setGeoError(null);

        // If we hit "High Precision" (< 10m), we can stop early to save battery/time
        if (accuracy <= 10) {
          clearTimeout(timeoutId);
          stopLocating();
        }
      }
    };

    const onErr = (err: GeolocationPositionError) => {
      // If we already have a position, ignore temporary errors (like GPS signal loss)
      if (hasUpdated) return;

      // If Permission Denied, stop immediately
      if (err.code === 1) {
        clearTimeout(timeoutId);
        stopLocating();
        
        // Error handling logic
        const isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
        const isEdge = /Edg/.test(navigator.userAgent);
        const isFirefox = /Firefox/.test(navigator.userAgent);
        const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);

        let instructions = t("map.permissionDenied") + " To enable location access:\n\n";
        
        if (isChrome || isEdge) {
          instructions += "Chrome/Edge: Click the 🔒 lock icon in the address bar → Site settings → Location → Allow → Reload page";
        } else if (isFirefox) {
          instructions += "Firefox: Click the 🔒 lock icon in the address bar → More information → Permissions → Location → Allow → Reload page";
        } else if (isSafari) {
          instructions += "Safari: Safari menu → Settings for this website → Location → Allow";
        } else {
          instructions += "Click the lock/location icon (🔒 or 📍) in your browser's address bar → Select 'Allow' for location access → Refresh this page";
        }
        
        instructions += "\n\n💡 " + t("map.tipClickMap");
        setGeoError(instructions);
      } 
      // For Timeout/PositionUnavailable, we keep waiting until our own 15s timeout fires
    };

    watchId = navigator.geolocation.watchPosition(onPos, onErr, {
      enableHighAccuracy: true,
      timeout: 10000, // Wait up to 10s for a high-accuracy reading per cycle
      maximumAge: 0   // Force fresh readings, no cache
    });
  };

  return (
    <div className="space-y-3">
      {!hideLabel && (
        <div className="flex items-center justify-between gap-2">
          <div className="text-sm font-bold text-slate-700 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-slate-500" />
            {label ?? defaultLabel}
          </div>
        </div>
      )}

      <div className="relative group rounded-2xl overflow-hidden border-2 border-slate-100 shadow-sm transition-all hover:shadow-md hover:border-indigo-100">
        <MapContainer
          key={mapKeyRef.current}
          center={center}
          zoom={15}
          scrollWheelZoom
          className="h-64 w-full bg-slate-50"
          style={{ zIndex: 0 }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <RecenterOnChange center={center} />
          <MapResizer />
          <ClickToPick onPick={handleManualPick} />
          {value ? <Marker key={`marker-${value.lat}-${value.lng}`} position={value} /> : null}
          {value && accuracyMeters ? (
            <Circle
              key={`circle-${value.lat}-${value.lng}-${accuracyMeters}`}
              center={value}
              radius={accuracyMeters}
              pathOptions={{ color: "#0ea5e9", fillColor: "#0ea5e9", fillOpacity: 0.15 }}
            />
          ) : null}
        </MapContainer>

        {/* Floating "Use My Location" Button */}
        <button
          type="button"
          onClick={handleUseMyLocation}
          disabled={locating}
          className="absolute top-3 right-3 z-[400] flex items-center gap-2 bg-white/90 backdrop-blur-md px-3 py-2 rounded-xl shadow-lg border border-white/50 text-xs font-bold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 hover:scale-105 active:scale-95 transition-all disabled:opacity-70 disabled:scale-100"
        >
          {locating ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-500" />
          ) : (
            <LocateFixed className="h-3.5 w-3.5 text-indigo-500" />
          )}
          <span>{locating ? t("map.locating") : t("map.useMyLocation")}</span>
        </button>
      </div>

      {geoError ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 animate-in slide-in-from-top-2 fade-in duration-300">
          <div className="font-semibold mb-2 flex items-center gap-2">
             <Loader2 className="h-3 w-3 text-rose-500" />
             {t("map.locationAccessIssue")}
          </div>
          <div className="whitespace-pre-wrap leading-relaxed mb-3">{geoError}</div>
          <div className="rounded border border-amber-300 bg-amber-50 p-2 mb-3">
            <div className="font-semibold text-amber-900 mb-1">{t("map.quickSolution")}</div>
            <div className="text-amber-800">
              {t("map.quickSolutionText")}
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              type="button"
              className="text-xs underline hover:no-underline font-medium"
              onClick={() => {
                setGeoError(null);
                setLocating(false);
              }}
            >
              {t("map.dismiss")}
            </button>
            <span className="text-rose-400">•</span>
            <button
              type="button"
              className="text-xs underline hover:no-underline font-medium"
              onClick={() => {
                setGeoError(null);
                handleUseMyLocation();
              }}
            >
              {t("map.tryGpsAgain")}
            </button>
          </div>
        </div>
      ) : null}

      {value && details ? (
        <div className="rounded-xl border border-indigo-100 bg-indigo-50/30 p-4 text-xs text-slate-700 shadow-sm animate-in fade-in slide-in-from-top-2 duration-500">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600 mt-0.5">
              <MapPin className="w-4 h-4" />
            </div>
            <div className="flex-1 space-y-2">
              <div>
                <span className="block text-[10px] uppercase tracking-wider font-bold text-indigo-400 mb-0.5">{t("map.approxAddress")}</span>
                <div className="font-medium text-slate-800 text-sm leading-snug">
                  {resolving ? (
                    <span className="flex items-center gap-2 text-slate-500">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      {t("map.lookingUp")}
                    </span>
                  ) : (
                    resolvedAddress ?? "—"
                  )}
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-2 border-t border-indigo-100/50">
                <div>
                  <span className="text-slate-400 mr-1.5">{t("map.coordinates")}:</span>
                  <span className="font-mono text-slate-600 bg-white/50 px-1.5 py-0.5 rounded border border-indigo-50">{details.coords}</span>
                </div>
                
                {accuracyMeters != null && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400">{t("map.accuracy")}:</span>
                    <span className={`px-1.5 py-0.5 rounded border ${
                      accuracyMeters > 150 
                        ? "bg-amber-50 text-amber-700 border-amber-100" 
                        : "bg-emerald-50 text-emerald-700 border-emerald-100"
                    }`}>
                      ±{formatMeters(accuracyMeters)}
                    </span>
                  </div>
                )}

                <a 
                  className="ml-auto flex items-center gap-1 text-indigo-600 hover:text-indigo-700 font-medium hover:underline" 
                  href={details.link} 
                  target="_blank" 
                  rel="noreferrer"
                >
                  <Navigation className="w-3 h-3" />
                  {t("map.openInOpenStreetMap")}
                </a>
              </div>
            </div>
          </div>

          {resolveError ? <div className="mt-2 text-rose-600 bg-rose-50 px-3 py-2 rounded-lg border border-rose-100">{resolveError}</div> : null}
        </div>
      ) : null}

      <div className="flex items-center gap-2 text-xs text-slate-500 px-1">
        <Navigation className="w-3 h-3 flex-shrink-0" />
        <span>
          {helperText ?? defaultHelperText}
          {geoError ? (
            <span className="ml-1 font-medium text-amber-700">
              {t("map.tipClickMap")}
            </span>
          ) : null}
        </span>
      </div>
    </div>
  );
});


