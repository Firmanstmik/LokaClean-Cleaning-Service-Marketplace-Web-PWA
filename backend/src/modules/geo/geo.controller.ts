/**
 * Geo controllers.
 */

import type { Request, Response } from "express";

import { asyncHandler } from "../../utils/asyncHandler";
import { ok } from "../../utils/respond";
import { HttpError } from "../../utils/httpError";
import { prisma } from "../../db/prisma";
import { Role } from "@prisma/client";
import { 
  reverseGeocodeQuerySchema, 
  forwardGeocodeQuerySchema,
  findNearestCleanersSchema,
  updateLocationSchema
} from "./geo.schemas";
import { reverseGeocode, forwardGeocode, findNearestCleaners, getAllCleanerLocations } from "./geo.service";

export const reverseGeocodeHandler = asyncHandler(async (req: Request, res: Response) => {
  const { lat, lng, lang } = reverseGeocodeQuerySchema.parse(req.query);
  const acceptLanguage = typeof req.headers["accept-language"] === "string" ? req.headers["accept-language"] : undefined;
  const data = await reverseGeocode({ lat, lng, lang: lang ?? acceptLanguage });
  return ok(res, data);
});

export const forwardGeocodeHandler = asyncHandler(async (req: Request, res: Response) => {
  const { q, lang } = forwardGeocodeQuerySchema.parse(req.query);
  const acceptLanguage = typeof req.headers["accept-language"] === "string" ? req.headers["accept-language"] : undefined;
  const data = await forwardGeocode({ query: q, lang: lang ?? acceptLanguage });
  return ok(res, data);
});

/**
 * Find nearest active cleaners.
 * Used for pre-check or admin dashboard.
 */
export const findNearestCleanersHandler = asyncHandler(async (req: Request, res: Response) => {
  const { lat, lng, limit } = findNearestCleanersSchema.parse(req.body);
  const cleaners = await findNearestCleaners(lat, lng, limit);
  return ok(res, { cleaners });
});

/**
 * Update Cleaner's location.
 * Requires auth and CLEANER role.
 */
export const updateLocationHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) throw new HttpError(401, "Unauthenticated");
  
  // Check if user is a cleaner
  if (req.auth.role !== Role.CLEANER) {
    throw new HttpError(403, "Only cleaners can update location");
  }

  const { lat, lng } = updateLocationSchema.parse(req.body);

  // Update CleanerProfile location using PostGIS
  // We need to find the CleanerProfile for this user
  const cleanerProfile = await prisma.cleanerProfile.findUnique({
    where: { user_id: req.auth.id }
  });

  if (!cleanerProfile) {
    throw new HttpError(404, "Cleaner profile not found");
  }

  await prisma.$executeRaw`
    UPDATE "CleanerProfile"
    SET location = ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326),
        updated_at = NOW()
    WHERE id = ${cleanerProfile.id}
  `;

  return ok(res, { message: "Location updated" });
});

/**
 * Get all cleaner locations for Admin Dashboard.
 */
export const getAllCleanerLocationsHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) throw new HttpError(401, "Unauthenticated");
  if (req.auth.role !== Role.ADMIN) {
    throw new HttpError(403, "Forbidden");
  }

  const cleaners = await getAllCleanerLocations();
  return ok(res, { cleaners });
});
