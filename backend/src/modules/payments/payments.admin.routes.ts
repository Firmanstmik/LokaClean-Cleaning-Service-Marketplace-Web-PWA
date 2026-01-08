/**
 * Admin payment management routes.
 */

import { Router } from "express";

import { authenticate } from "../../middleware/auth";
import { requireActor } from "../../middleware/requireActor";
import { updatePaymentStatusAdminHandler } from "./payments.controller";

export const adminPaymentsRouter = Router();

adminPaymentsRouter.use(authenticate, requireActor("ADMIN"));

adminPaymentsRouter.patch("/:id/status", updatePaymentStatusAdminHandler);


