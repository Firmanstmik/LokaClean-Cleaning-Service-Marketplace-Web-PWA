/**
 * Geo controllers.
 */

import type { Request, Response } from "express";

import { asyncHandler } from "../../utils/asyncHandler";
import { ok } from "../../utils/respond";
import { reverseGeocodeQuerySchema, forwardGeocodeQuerySchema } from "./geo.schemas";
import { reverseGeocode, forwardGeocode } from "./geo.service";

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


