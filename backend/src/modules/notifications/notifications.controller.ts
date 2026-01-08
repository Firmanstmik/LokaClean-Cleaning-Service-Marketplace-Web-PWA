/**
 * Notification controllers for users.
 */

import type { Request, Response } from "express";

import { prisma } from "../../db/prisma";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok } from "../../utils/respond";
import { HttpError } from "../../utils/httpError";
import { parseId } from "../../utils/parseId";

/**
 * USER: Get all notifications for the current user.
 */
export const listMyNotificationsHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) throw new HttpError(401, "Unauthenticated");

  const notifications = await prisma.notification.findMany({
    where: { user_id: req.auth.id },
    orderBy: { created_at: "desc" },
    include: {
      pesanan: {
        select: {
          id: true,
          status: true,
          paket: {
            select: {
              name: true
            }
          },
          rating: {
            select: {
              id: true,
              rating_value: true,
              review: true
            }
          }
        }
      }
    }
  });

  return ok(res, { notifications });
});

/**
 * USER: Mark notification as read.
 */
export const markNotificationReadHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) throw new HttpError(401, "Unauthenticated");
  const id = parseId(req.params.id);

  // Verify notification belongs to user
  const notification = await prisma.notification.findUnique({
    where: { id }
  });

  if (!notification) throw new HttpError(404, "Notification not found");
  if (notification.user_id !== req.auth.id) throw new HttpError(403, "Forbidden");

  const updated = await prisma.notification.update({
    where: { id },
    data: { is_read: true }
  });

  return ok(res, { notification: updated });
});

/**
 * USER: Mark all notifications as read.
 */
export const markAllNotificationsReadHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) throw new HttpError(401, "Unauthenticated");

  await prisma.notification.updateMany({
    where: { user_id: req.auth.id, is_read: false },
    data: { is_read: true }
  });

  return ok(res, { message: "All notifications marked as read" });
});

