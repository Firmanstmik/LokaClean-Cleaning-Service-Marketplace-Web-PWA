/**
 * Payment routes for Midtrans integration.
 */

import { Router } from "express";

import { authenticate } from "../../middleware/auth";
import { requireActor } from "../../middleware/requireActor";
import { generateSnapTokenHandler, webhookHandler } from "./payments.controller";

export const paymentsRouter = Router();

// Public webhook endpoint (no auth required - Midtrans calls this directly)
paymentsRouter.post("/webhook", webhookHandler);

// Authenticated endpoints require USER role
paymentsRouter.use(authenticate, requireActor("USER"));

// Generate Snap token for order payment
paymentsRouter.post("/snap-token", generateSnapTokenHandler);

