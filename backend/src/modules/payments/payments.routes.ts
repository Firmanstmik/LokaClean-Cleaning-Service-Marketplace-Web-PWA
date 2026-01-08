/**
 * User payment routes.
 *
 * Routes:
 * - POST /payments/snap-token - Request Snap token for NON-CASH payment
 * - POST /payments/webhook - Midtrans webhook (no auth required)
 */

import { Router } from "express";

import { authenticate } from "../../middleware/auth";
import { requestSnapTokenHandler, webhookHandler } from "./payments.controller";

export const paymentsRouter = Router();

// Webhook endpoint (no auth - Midtrans calls this directly)
paymentsRouter.post("/webhook", webhookHandler);

// Snap token endpoint (requires user authentication)
paymentsRouter.post("/snap-token", authenticate, requestSnapTokenHandler);

