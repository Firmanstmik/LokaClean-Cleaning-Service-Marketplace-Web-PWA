/**
 * Admin API router.
 *
 * All endpoints here require ADMIN JWT.
 */

import { Router } from "express";

import { adminPackagesRouter } from "../packages/packages.admin.routes";
import { adminOrdersRouter } from "../orders/orders.admin.routes";
import { adminPaymentsRouter } from "../payments/payments.admin.routes";
import { adminRatingsRouter } from "../ratings/ratings.admin.routes";
import { adminUsersRouter } from "../users/users.admin.routes";

export const adminRouter = Router();

adminRouter.use("/packages", adminPackagesRouter);
adminRouter.use("/orders", adminOrdersRouter);
adminRouter.use("/payments", adminPaymentsRouter);
adminRouter.use("/ratings", adminRatingsRouter);
adminRouter.use("/users", adminUsersRouter);


