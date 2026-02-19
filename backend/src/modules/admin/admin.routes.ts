/**
 * Admin API router.
 *
 * All endpoints here require ADMIN JWT.
 */

import { Router } from "express";

import { adminPackagesRouter } from "../packages/packages.admin.routes";
import { adminOrdersRouter } from "../orders/orders.admin.routes";
import { adminRatingsRouter } from "../ratings/ratings.admin.routes";
import { adminUsersRouter } from "../users/users.admin.routes";
import { authenticate } from "../../middleware/auth";
import { requireActor } from "../../middleware/requireActor";
import { prisma } from "../../db/prisma";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok } from "../../utils/respond";

export const adminRouter = Router();

adminRouter.get(
  "/me/theme",
  authenticate,
  requireActor("ADMIN"),
  asyncHandler(async (req, res) => {
    const adminId = req.auth!.id;
    const admin = await (prisma as any).admin.findUnique({
      where: { id: adminId },
      select: { theme_settings: true }
    });
    return ok(res, { settings: admin?.theme_settings ?? null });
  })
);

adminRouter.put(
  "/me/theme",
  authenticate,
  requireActor("ADMIN"),
  asyncHandler(async (req, res) => {
    const adminId = req.auth!.id;
    const settings = req.body?.settings ?? req.body ?? null;
    const updated = await (prisma as any).admin.update({
      where: { id: adminId },
      data: { theme_settings: settings },
      select: { theme_settings: true }
    });
    return ok(res, { settings: updated.theme_settings });
  })
);

adminRouter.use("/packages", adminPackagesRouter);
adminRouter.use("/orders", adminOrdersRouter);
adminRouter.use("/ratings", adminRatingsRouter);
adminRouter.use("/users", adminUsersRouter);


