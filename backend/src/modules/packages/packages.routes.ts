/**
 * Public PaketCleaning routes.
 */

import { Router } from "express";
import { listPackagesHandler } from "./packages.controller";

export const packagesRouter = Router();

// Anyone can view available packages (no auth required).
packagesRouter.get("/", listPackagesHandler);


