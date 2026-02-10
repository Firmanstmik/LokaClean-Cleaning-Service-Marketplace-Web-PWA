/**
 * API router.
 *
 * All routes are mounted under `/api` from `app.ts`.
 */

import { Router } from "express";

import { env } from "./config/env";
import { authRouter } from "./modules/auth/auth.routes";
import { usersRouter } from "./modules/users/users.routes";
import { packagesRouter } from "./modules/packages/packages.routes";
import { ordersRouter } from "./modules/orders/orders.routes";
import { adminRouter } from "./modules/admin/admin.routes";
import { geoRouter } from "./modules/geo/geo.routes";
import { notificationsRouter } from "./modules/notifications/notifications.routes";
import { paymentsRouter } from "./modules/payments/payments.routes";
import { pushRouter } from "./modules/push/push.routes";
import addressesRouter from "./modules/addresses/addresses.routes";

export const apiRouter = Router();

apiRouter.get("/health", (_req: Request, res: Response) => {
  return res.json({ ok: true, data: { status: "ok" } });
});

function validateMidtransConfig(): boolean {
  if (!env.MIDTRANS_SERVER_KEY) {
    console.error("[Midtrans] MIDTRANS_SERVER_KEY is not set. Payments disabled.");
    return false;
  }

  if (env.MIDTRANS_IS_PRODUCTION) {
    console.warn(
      "[Midtrans] MIDTRANS_IS_PRODUCTION=true. Make sure you are using PRODUCTION keys."
    );
  } else {
    console.info("[Midtrans] Running in SANDBOX mode.");
  }

  return true;
}


apiRouter.use("/auth", authRouter);
apiRouter.use("/users", usersRouter);
apiRouter.use("/packages", packagesRouter);
apiRouter.use("/orders", ordersRouter);
apiRouter.use("/admin", adminRouter);
apiRouter.use("/geo", geoRouter);
apiRouter.use("/notifications", notificationsRouter);
apiRouter.use("/push", pushRouter);
apiRouter.use("/address", addressesRouter);

if (validateMidtransConfig()) {
  apiRouter.use("/payments", paymentsRouter);
  console.info("[Routes] Payments router registered at /api/payments");
}

