/**
 * ADMIN-facing Pesanan routes.
 */

import { Router } from "express";

import { authenticate } from "../../middleware/auth";
import { requireActor } from "../../middleware/requireActor";
import { imageUpload } from "../../middleware/upload";
import {
  assignOrderAdminHandler,
  deleteOrderAdminHandler,
  deleteOrdersBulkAdminHandler,
  getOrderAdminHandler,
  listAllOrdersAdminHandler,
  updateOrderStatusAdminHandler,
  uploadAfterPhotoAdminHandler,
  getPendingOrdersCountHandler
} from "./orders.controller";

export const adminOrdersRouter = Router();

adminOrdersRouter.use(authenticate, requireActor("ADMIN"));

adminOrdersRouter.get("/", listAllOrdersAdminHandler);
adminOrdersRouter.get("/pending-count", getPendingOrdersCountHandler);
adminOrdersRouter.get("/:id", getOrderAdminHandler);

adminOrdersRouter.patch("/:id/assign", assignOrderAdminHandler);
adminOrdersRouter.patch("/:id/status", updateOrderStatusAdminHandler);

adminOrdersRouter.post("/:id/after-photo", imageUpload.single("room_photo_after"), uploadAfterPhotoAdminHandler);

adminOrdersRouter.post("/bulk-delete", deleteOrdersBulkAdminHandler);
adminOrdersRouter.delete("/:id", deleteOrderAdminHandler);


