/**
 * Notification routes for users.
 */

import { Router } from "express";

import { authenticate } from "../../middleware/auth";
import {
  listMyNotificationsHandler,
  markNotificationReadHandler,
  markAllNotificationsReadHandler
} from "./notifications.controller";

export const notificationsRouter = Router();

notificationsRouter.use(authenticate);

notificationsRouter.get("/", listMyNotificationsHandler);
notificationsRouter.patch("/:id/read", markNotificationReadHandler);
notificationsRouter.patch("/read-all", markAllNotificationsReadHandler);

