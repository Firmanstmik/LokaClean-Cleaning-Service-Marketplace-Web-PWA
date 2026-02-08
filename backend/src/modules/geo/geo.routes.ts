/**
 * Geo routes (reverse geocode and forward geocode helpers).
 */

import { Router } from "express";
import { authenticate } from "../../middleware/auth";
import { 
  reverseGeocodeHandler, 
  forwardGeocodeHandler,
  findNearestCleanersHandler,
  updateLocationHandler,
  getAllCleanerLocationsHandler
} from "./geo.controller";

export const geoRouter = Router();

// Public: lightweight reverse geocode (used by frontend MapPicker to show address details).
geoRouter.get("/reverse", reverseGeocodeHandler);

// Public: lightweight forward geocode (used by frontend to convert address to coordinates).
geoRouter.get("/forward", forwardGeocodeHandler);

// Public: Find nearest cleaners (POST because it sends body with lat/lng)
geoRouter.post("/nearest-cleaner", findNearestCleanersHandler);

// Authenticated: Update cleaner location (Cleaner role checked in handler)
geoRouter.post("/location", authenticate, updateLocationHandler);

// Authenticated: Get all cleaner locations (Admin only)
geoRouter.get("/cleaners-locations", authenticate, getAllCleanerLocationsHandler);


