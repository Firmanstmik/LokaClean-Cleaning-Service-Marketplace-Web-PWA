/**
 * Geo service (reverse geocode).
 *
 * Uses OpenStreetMap's Nominatim public API by default.
 * Consider hosting your own instance for production workloads.
 */

import { env } from "../../config/env";
import { HttpError } from "../../utils/httpError";
import { prisma } from "../../db/prisma";

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

/**
 * Check if a point is inside any ServiceArea polygon.
 * Returns the ServiceArea object if found, null otherwise.
 */
export async function checkServiceArea(lat: number, lng: number) {
  // Check if point is inside any ServiceArea polygon
  // ST_Contains(area, ST_SetSRID(ST_MakePoint(lng, lat), 4326))
  const result = await prisma.$queryRaw`
    SELECT id, name 
    FROM "ServiceArea" 
    WHERE ST_Contains(area::geometry, ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326))
    LIMIT 1
  `;
  return (result as any[])[0] || null;
}

/**
 * Find nearest active cleaners ordered by:
 * 1. Active orders (ASC) - Prioritize cleaners with fewer jobs
 * 2. Rating (DESC) - Prioritize higher rated cleaners
 * 3. Distance (ASC) - Closest cleaners
 */
export async function findNearestCleaners(lat: number, lng: number, limit = 5) {
  // ST_Distance returns meters for geography type
  const cleaners = await prisma.$queryRaw`
    SELECT 
      c.id,
      c.user_id,
      c.rating,
      c.active_orders,
      c.is_active,
      u.full_name,
      u.phone_number,
      u.profile_photo,
      ST_Distance(c.location, ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)) as distance_meters
    FROM "CleanerProfile" c
    JOIN "User" u ON c.user_id = u.id
    WHERE c.is_active = true
    ORDER BY 
      c.active_orders ASC,
      c.rating DESC,
      distance_meters ASC
    LIMIT ${limit}
  `;

  return cleaners as Array<{
    id: number;
    user_id: number;
    rating: number;
    active_orders: number;
    is_active: boolean;
    full_name: string;
    phone_number: string | null;
    profile_photo: string | null;
    distance_meters: number;
  }>;
}

export async function getAllCleanerLocations() {
  const cleaners = await prisma.$queryRaw`
    SELECT 
      c.id,
      c.user_id,
      c.is_active,
      u.full_name,
      u.profile_photo,
      ST_X(c.location::geometry) as lng,
      ST_Y(c.location::geometry) as lat
    FROM "CleanerProfile" c
    JOIN "User" u ON c.user_id = u.id
    WHERE c.location IS NOT NULL
  `;
  return cleaners as Array<{
    id: number;
    user_id: number;
    is_active: boolean;
    full_name: string;
    profile_photo: string | null;
    lng: number;
    lat: number;
  }>;
}


