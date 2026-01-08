/**
 * API router.
 *
 * All routes are mounted under `/api` from `app.ts`.
 */

import { Router } from "express";

import { authRouter } from "./modules/auth/auth.routes";
import { usersRouter } from "./modules/users/users.routes";
import { packagesRouter } from "./modules/packages/packages.routes";
import { ordersRouter } from "./modules/orders/orders.routes";
import { paymentsRouter } from "./modules/payments/payments.routes";
import { adminRouter } from "./modules/admin/admin.routes";
import { geoRouter } from "./modules/geo/geo.routes";
import { notificationsRouter } from "./modules/notifications/notifications.routes";

export const apiRouter = Router();

apiRouter.get("/health", (_req, res) => {
  return res.json({ ok: true, data: { status: "ok" } });
});

apiRouter.use("/auth", authRouter);
apiRouter.use("/users", usersRouter);
apiRouter.use("/packages", packagesRouter);
apiRouter.use("/orders", ordersRouter);
apiRouter.use("/payments", paymentsRouter);
apiRouter.use("/admin", adminRouter);
apiRouter.use("/geo", geoRouter);
apiRouter.use("/notifications", notificationsRouter);


