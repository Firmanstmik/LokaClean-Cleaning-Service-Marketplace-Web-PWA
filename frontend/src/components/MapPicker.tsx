/**
 * Map picker (Leaflet/OpenStreetMap).
 *
 * - Click/tap to set a marker
 * - Optional "use my location" button (browser geolocation)
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { Circle, MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";

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

export function MapPicker({
  value,
  onChange,
  onAddressChange,
  label,
  helperText
}: {
  value: LatLng | null;
  onChange: (v: LatLng) => void;
  onAddressChange?: (address: string | null) => void;
  label?: string;
  helperText?: string;
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

    // Check secure context
    if (!window.isSecureContext) {
      setGeoError(t("map.locationRequiresHttps"));
      return;
    }

    // Check geolocation support
    if (!navigator.geolocation) {
      setGeoError(t("map.geolocationNotSupported"));
      return;
    }

    // Check permission status for better UX, but don't block - let getCurrentPosition try anyway
    // (sometimes browser will show prompt even if permission API says "denied")
    if ("permissions" in navigator) {
      try {
        const permission = await navigator.permissions.query({ name: "geolocation" as PermissionName });
        // Listen for permission changes (e.g., user enables it)
        permission.onchange = () => {
          if (permission.state === "granted") {
            setGeoError(null);
          }
        };
      } catch (err) {
        // Permission API not fully supported (e.g., Safari, some Firefox versions), continue anyway
        // This is fine - we'll get the error from getCurrentPosition itself
      }
    }

    const getPos = (opts: PositionOptions): Promise<GeolocationPosition> =>
      new Promise((resolve, reject) => {
        const watchId = navigator.geolocation.getCurrentPosition(
          (pos) => {
            resolve(pos);
          },
          (err) => {
            reject(err);
          },
          opts
        );
        // Cleanup: if promise is rejected/resolved elsewhere, we can't cancel watchId
        // But browser will handle it automatically
      });

    setLocating(true);

    try {
      let pos: GeolocationPosition;
      let usedFallback = false;

      // Strategy 1: Try high accuracy GPS first (best accuracy, may take longer)
      try {
        pos = await Promise.race([
          getPos({
            enableHighAccuracy: true,
            timeout: 25_000, // 25 seconds
            maximumAge: 0 // Force fresh position
          }),
          // Fallback timeout wrapper (in case browser doesn't respect timeout)
          new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error("TIMEOUT")), 30_000);
          })
        ]);
      } catch (err) {
        const code = typeof err === "object" && err && "code" in err ? (err as { code?: unknown }).code : null;
        const isTimeout = code === 3 || (typeof err === "object" && err && "message" in err && err.message === "TIMEOUT");

        // Strategy 2: Fallback to network-based location (faster but less accurate)
        if (isTimeout || code === 2) {
          try {
            usedFallback = true;
            pos = await Promise.race([
              getPos({
                enableHighAccuracy: false, // Use network/cell towers
                timeout: 15_000,
                maximumAge: 60_000 // Accept cached position up to 1 minute old
              }),
              new Promise<never>((_, reject) => {
                setTimeout(() => reject(new Error("TIMEOUT")), 20_000);
              })
            ]);
          } catch (fallbackErr) {
            // If fallback also fails, throw original error
            throw err;
          }
        } else {
          throw err;
        }
      }

      // Success: Update map position
      const accuracy = typeof pos.coords.accuracy === "number" ? pos.coords.accuracy : null;
      const latitude = pos.coords.latitude;
      const longitude = pos.coords.longitude;

      // Validate coordinates
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        throw new Error("Invalid coordinates received");
      }

      setAccuracyMeters(accuracy);
      onChange({ lat: latitude, lng: longitude });

      // Clear error on success
      setGeoError(null);

      // Log for debugging (in dev mode)
      if (process.env.NODE_ENV === "development") {
        console.log("📍 Location obtained:", {
          lat: latitude,
          lng: longitude,
          accuracy: accuracy ? `${accuracy}m` : "unknown",
          source: usedFallback ? "network-based" : "high-accuracy"
        });
      }
    } catch (err) {
      // Extract error code for better messaging
      const code = typeof err === "object" && err && "code" in err ? (err as GeolocationPositionError).code : null;
      const message = typeof err === "object" && err && "message" in err ? String(err.message) : "";

      if (code === 1) {
        // PERMISSION_DENIED
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
      } else if (code === 2) {
        // POSITION_UNAVAILABLE
        setGeoError(t("map.positionUnavailable"));
      } else if (code === 3 || message.includes("TIMEOUT")) {
        // TIMEOUT
        setGeoError(t("map.locationTimeout"));
      } else {
        // Unknown error
        const errMsg = typeof err === "object" && err && "message" in err ? String(err.message) : String(err);
        setGeoError(t("map.couldNotGetLocation").replace("{error}", errMsg));
      }

      if (process.env.NODE_ENV === "development") {
        console.error("Geolocation error:", err);
      }
    } finally {
      setLocating(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="text-sm font-medium text-slate-700">{label ?? defaultLabel}</div>
        <button
          type="button"
          className="rounded-md border px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          onClick={handleUseMyLocation}
          disabled={locating}
        >
          {locating ? t("map.locating") : t("map.useMyLocation")}
        </button>
      </div>

      <MapContainer
        key={mapKeyRef.current}
        center={center}
        zoom={15}
        scrollWheelZoom
        className="h-64 w-full rounded-xl border"
        style={{ zIndex: 0 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <RecenterOnChange center={center} />
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

      {geoError ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
          <div className="font-semibold mb-2">{t("map.locationAccessIssue")}</div>
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
        <div className="rounded-xl border bg-white p-3 text-xs text-slate-700">
          <div className="grid gap-2 sm:grid-cols-2">
            <div>
              <span className="font-semibold">{t("map.coordinates")}</span> {details.coords}
            </div>
            {accuracyMeters != null ? (
              <div>
                <span className="font-semibold">{t("map.accuracy")}</span> ±{formatMeters(accuracyMeters)}
              </div>
            ) : (
              <div className="text-slate-500">{t("map.tipUseMyLocation")}</div>
            )}
          </div>

          <div className="mt-2">
            <span className="font-semibold">{t("map.approxAddress")}</span>{" "}
            {resolving ? <span className="text-slate-500">{t("map.lookingUp")}</span> : resolvedAddress ?? "—"}
          </div>
          {resolveError ? <div className="mt-1 text-rose-700">{resolveError}</div> : null}

          {accuracyMeters != null && accuracyMeters > 150 ? (
            <div className="mt-2 text-amber-700">
              {t("map.accuracyLow").replace("{meters}", formatMeters(accuracyMeters))}
            </div>
          ) : null}

          <div className="mt-2">
            <a className="font-medium text-sky-700 hover:underline" href={details.link} target="_blank" rel="noreferrer">
              {t("map.openInOpenStreetMap")}
            </a>
          </div>
        </div>
      ) : null}

      <div className="text-xs text-slate-500">
        {helperText ?? defaultHelperText}
        {geoError ? (
          <span className="ml-1 font-medium text-amber-700">
            {t("map.tipClickMap")}
          </span>
        ) : null}
      </div>
    </div>
  );
}


