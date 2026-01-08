/**
 * Geo routes (reverse geocode and forward geocode helpers).
 */

import { Router } from "express";
import { reverseGeocodeHandler, forwardGeocodeHandler } from "./geo.controller";

export const geoRouter = Router();

// Public: lightweight reverse geocode (used by frontend MapPicker to show address details).
geoRouter.get("/reverse", reverseGeocodeHandler);

// Public: lightweight forward geocode (used by frontend to convert address to coordinates).
geoRouter.get("/forward", forwardGeocodeHandler);


