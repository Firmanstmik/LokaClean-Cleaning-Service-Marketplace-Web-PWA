/**
 * Admin PaketCleaning management routes.
 */

import { Router } from "express";

import { authenticate } from "../../middleware/auth";
import { requireActor } from "../../middleware/requireActor";
import { imageUpload } from "../../middleware/upload";
import {
  createPackageHandler,
  deletePackageHandler,
  listPackagesHandler,
  updatePackageHandler,
  translateTextHandler
} from "./packages.controller";

export const adminPackagesRouter = Router();

adminPackagesRouter.use(authenticate, requireActor("ADMIN"));

adminPackagesRouter.post("/translate", translateTextHandler);
adminPackagesRouter.get("/", listPackagesHandler);
adminPackagesRouter.post("/", imageUpload.single("image"), createPackageHandler);
adminPackagesRouter.put("/:id", imageUpload.single("image"), updatePackageHandler);
adminPackagesRouter.delete("/:id", deletePackageHandler);


