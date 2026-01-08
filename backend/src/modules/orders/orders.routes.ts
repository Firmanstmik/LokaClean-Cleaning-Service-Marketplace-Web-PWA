/**
 * USER-facing Pesanan routes.
 */

import { Router } from "express";

import { authenticate } from "../../middleware/auth";
import { requireActor } from "../../middleware/requireActor";
import { imageUpload } from "../../middleware/upload";
import {
  createOrderHandler,
  createRatingHandler,
  createTipHandler,
  getMyOrderHandler,
  listMyOrdersHandler,
  uploadAfterPhotoUserHandler,
  verifyCompletionHandler
} from "./orders.controller";

export const ordersRouter = Router();

ordersRouter.use(authenticate, requireActor("USER"));

// Create order with BEFORE photo upload (multipart/form-data, supports multiple photos, max 4).
ordersRouter.post("/", imageUpload.array("room_photo_before", 4), createOrderHandler);

ordersRouter.get("/", listMyOrdersHandler);
ordersRouter.get("/:id", getMyOrderHandler);

// Optional: user can upload AFTER photo too (supports multiple photos, max 4).
ordersRouter.post("/:id/after-photo", imageUpload.array("room_photo_after", 4), uploadAfterPhotoUserHandler);

// Verify job completion (IN_PROGRESS -> COMPLETED).
ordersRouter.post("/:id/verify-completion", verifyCompletionHandler);

// Rating and tip (0..1 each per order).
ordersRouter.post("/:id/rating", createRatingHandler);
ordersRouter.post("/:id/tip", createTipHandler);


