/**
 * Geo service (reverse geocode).
 *
 * Uses OpenStreetMap's Nominatim public API by default.
 * Consider hosting your own instance for production workloads.
 */

import { env } from "../../config/env";
import { HttpError } from "../../utils/httpError";

export type ReverseGeocodeResult = {
  display_name: string | null;
  address: Record<string, unknown> | null;
  lat: number;
  lng: number;
  source: "nominatim";
};

type CacheEntry = { expiresAt: number; value: ReverseGeocodeResult };

const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 1000 * 60 * 60 * 6; // 6 hours

function cacheKey(lat: number, lng: number) {
  // 5 decimals ~= 1.1m at equator, good enough for address lookups.
  return `${lat.toFixed(5)},${lng.toFixed(5)}`;
}

export async function reverseGeocode(input: { lat: number; lng: number; lang?: string | undefined }) {
  const { lat, lng, lang } = input;

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) throw new HttpError(400, "Invalid coordinates");
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) throw new HttpError(400, "Coordinates out of range");

  const key = cacheKey(lat, lng);
  const cached = cache.get(key);
  const now = Date.now();
  if (cached && cached.expiresAt > now) return cached.value;

  const base = env.NOMINATIM_BASE_URL.replace(/\/$/, "");
  const url = new URL(`${base}/reverse`);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lng));
  url.searchParams.set("zoom", "18");
  url.searchParams.set("addressdetails", "1");
  if (env.NOMINATIM_EMAIL) url.searchParams.set("email", env.NOMINATIM_EMAIL);

  const userAgent =
    env.NOMINATIM_USER_AGENT === "LokaClean" ? `LokaClean (${env.BASE_URL})` : env.NOMINATIM_USER_AGENT;

  const headers: Record<string, string> = {
    Accept: "application/json",
    "User-Agent": userAgent
  };
  if (lang) headers["Accept-Language"] = lang;

  let resp: Response;
  try {
    resp = await fetch(url.toString(), { headers });
  } catch (fetchErr) {
    const errMsg = fetchErr instanceof Error ? fetchErr.message : "Unknown error";
    if (process.env.NODE_ENV === "development") {
      console.error("[geo/reverse] Fetch error:", errMsg);
    }
    throw new HttpError(502, "Geocoding service unreachable. Please try again later.");
  }

  if (!resp.ok) {
    // Nominatim commonly rate-limits with 429.
    if (resp.status === 429) throw new HttpError(503, "Geocoding service rate-limited. Please try again.");
    throw new HttpError(502, `Geocoding service error (${resp.status})`);
  }

  const json = (await resp.json()) as { display_name?: unknown; address?: unknown; lat?: unknown; lon?: unknown };

  const out: ReverseGeocodeResult = {
    display_name: typeof json.display_name === "string" ? json.display_name : null,
    address: typeof json.address === "object" && json.address !== null ? (json.address as Record<string, unknown>) : null,
    lat: typeof json.lat === "string" ? Number(json.lat) : lat,
    lng: typeof json.lon === "string" ? Number(json.lon) : lng,
    source: "nominatim"
  };

  cache.set(key, { expiresAt: now + CACHE_TTL_MS, value: out });
  return out;
}

export type ForwardGeocodeResult = {
  display_name: string | null;
  address: Record<string, unknown> | null;
  lat: number;
  lng: number;
  source: "nominatim";
};

type ForwardCacheEntry = { expiresAt: number; value: ForwardGeocodeResult };

const forwardCache = new Map<string, ForwardCacheEntry>();

function forwardCacheKey(query: string) {
  return query.toLowerCase().trim();
}

export async function forwardGeocode(input: { query: string; lang?: string | undefined }) {
  const { query, lang } = input;

  if (!query || typeof query !== "string" || query.trim().length === 0) {
    throw new HttpError(400, "Query is required");
  }

  const trimmedQuery = query.trim();
  if (trimmedQuery.length < 3) {
    throw new HttpError(400, "Query must be at least 3 characters");
  }

  const key = forwardCacheKey(trimmedQuery);
  const cached = forwardCache.get(key);
  const now = Date.now();
  if (cached && cached.expiresAt > now) return cached.value;

  const base = env.NOMINATIM_BASE_URL.replace(/\/$/, "");
  const url = new URL(`${base}/search`);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("q", trimmedQuery);
  url.searchParams.set("limit", "1");
  url.searchParams.set("addressdetails", "1");
  if (env.NOMINATIM_EMAIL) url.searchParams.set("email", env.NOMINATIM_EMAIL);

  const userAgent =
    env.NOMINATIM_USER_AGENT === "LokaClean" ? `LokaClean (${env.BASE_URL})` : env.NOMINATIM_USER_AGENT;

  const headers: Record<string, string> = {
    Accept: "application/json",
    "User-Agent": userAgent
  };
  if (lang) headers["Accept-Language"] = lang;

  let resp: Response;
  try {
    resp = await fetch(url.toString(), { headers });
  } catch (fetchErr) {
    const errMsg = fetchErr instanceof Error ? fetchErr.message : "Unknown error";
    if (process.env.NODE_ENV === "development") {
      console.error("[geo/forward] Fetch error:", errMsg);
    }
    throw new HttpError(502, "Geocoding service unreachable. Please try again later.");
  }

  if (!resp.ok) {
    if (resp.status === 429) throw new HttpError(503, "Geocoding service rate-limited. Please try again.");
    throw new HttpError(502, `Geocoding service error (${resp.status})`);
  }

  const json = (await resp.json()) as Array<{
    display_name?: unknown;
    address?: unknown;
    lat?: unknown;
    lon?: unknown;
  }>;

  if (!Array.isArray(json) || json.length === 0) {
    throw new HttpError(404, "Address not found");
  }

  const first = json[0];
  const lat = typeof first.lat === "string" ? Number(first.lat) : typeof first.lat === "number" ? first.lat : null;
  const lng = typeof first.lon === "string" ? Number(first.lon) : typeof first.lon === "number" ? first.lon : null;

  if (lat === null || lng === null || !Number.isFinite(lat) || !Number.isFinite(lng)) {
    throw new HttpError(502, "Invalid geocoding response");
  }

  const out: ForwardGeocodeResult = {
    display_name: typeof first.display_name === "string" ? first.display_name : null,
    address: typeof first.address === "object" && first.address !== null ? (first.address as Record<string, unknown>) : null,
    lat,
    lng,
    source: "nominatim"
  };

  forwardCache.set(key, { expiresAt: now + CACHE_TTL_MS, value: out });
  return out;
}


