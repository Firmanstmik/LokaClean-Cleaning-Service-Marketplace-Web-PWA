import type { Request, Response } from "express";

import { asyncHandler } from "../../utils/asyncHandler";
import { ok } from "../../utils/respond";
import { HttpError } from "../../utils/httpError";
import { env } from "../../config/env";
import { snapTokenRequestSchema } from "./payments.schemas";
import { generateSnapToken, handleWebhookNotification } from "./payments.service";

/**
 * Ensure Midtrans is running in SANDBOX mode
 * ❗ DO NOT validate key prefix (Midtrans sandbox key may not start with SB-)
 */
function ensureSandboxOnly() {
  if (env.MIDTRANS_IS_PRODUCTION) {
    throw new HttpError(
      503,
      "Payment endpoint is in SANDBOX mode but MIDTRANS_IS_PRODUCTION=true"
    );
  }

  if (!env.MIDTRANS_SERVER_KEY) {
    throw new HttpError(503, "Midtrans server key is not configured");
  }
}

/**
 * USER: Generate Snap token
 * POST /api/payments/snap-token
 */
export const generateSnapTokenHandler = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.auth) throw new HttpError(401, "Unauthenticated");

    const input = snapTokenRequestSchema.parse(req.body);

    // ❗ Only protect Snap-token endpoint
    ensureSandboxOnly();

    console.info("[Payments] Snap token request", {
      orderId: input.order_id,
      userId: req.auth.id
    });

    const snapToken = await generateSnapToken(
      input.order_id,
      req.auth.id
    );

    console.info("[Payments] Snap token generated", {
      orderId: input.order_id,
      userId: req.auth.id
    });

    return ok(res, { snap_token: snapToken });
  }
);

/**
 * PUBLIC: Midtrans webhook
 * POST /api/payments/webhook
 *
 * ❗ MUST NOT BLOCK BY ENV CHECK
 */
export const webhookHandler = asyncHandler(
  async (req: Request, res: Response) => {
    console.info("[Payments] Incoming Midtrans webhook");
    await handleWebhookNotification(req.body);
    return ok(res, { status: "ok" });
  }
);
