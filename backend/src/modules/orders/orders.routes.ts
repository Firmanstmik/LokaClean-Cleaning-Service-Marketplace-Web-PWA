/**
 * USER-facing Pesanan routes.
 */

import { Router } from "express";

import { authenticate } from "../../middleware/auth";
import { requireActor } from "../../middleware/requireActor";
import { imageUpload, mediaUpload } from "../../middleware/upload";
import {
  createOrderHandler,
  createGuestOrderHandler,
  createRatingHandler,
  createTipHandler,
  getMyOrderHandler,
  listMyOrdersHandler,
  updatePaymentMethodHandler,
  uploadAfterPhotoUserHandler,
  verifyCompletionHandler
} from "./orders.controller";

export const ordersRouter = Router();

ordersRouter.post("/guest", mediaUpload.array("room_photo_before", 4), createGuestOrderHandler);

ordersRouter.use(authenticate, requireActor("USER"));

ordersRouter.post("/", mediaUpload.array("room_photo_before", 4), createOrderHandler);

ordersRouter.get("/", listMyOrdersHandler);
ordersRouter.get("/:id", getMyOrderHandler);

// Change payment method while order and payment are still pending.
ordersRouter.patch("/:id/payment-method", updatePaymentMethodHandler);

// Optional: user can upload AFTER photo too (supports multiple photos, max 4).
ordersRouter.post("/:id/after-photo", mediaUpload.array("room_photo_after", 4), uploadAfterPhotoUserHandler);

// Verify job completion (IN_PROGRESS -> COMPLETED).
ordersRouter.post("/:id/verify-completion", verifyCompletionHandler);

// Rating and tip (0..1 each per order).
ordersRouter.post("/:id/rating", createRatingHandler);
ordersRouter.post("/:id/tip", createTipHandler);


