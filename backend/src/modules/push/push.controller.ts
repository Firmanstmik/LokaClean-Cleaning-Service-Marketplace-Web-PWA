import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok, created } from "../../utils/respond";
import { HttpError } from "../../utils/httpError";
import { prisma } from "../../db/prisma";
import { env } from "../../config/env";
import webpush from "web-push";

// Initialize VAPID (if configured)
function ensureVapid() {
  if (env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY && env.VAPID_SUBJECT) {
    webpush.setVapidDetails(env.VAPID_SUBJECT, env.VAPID_PUBLIC_KEY, env.VAPID_PRIVATE_KEY);
    return true;
  }
  return false;
}

export const getPublicKeyHandler = asyncHandler(async (_req: Request, res: Response) => {
  if (!env.VAPID_PUBLIC_KEY) {
    return ok(res, { publicKey: null });
  }
  return ok(res, { publicKey: env.VAPID_PUBLIC_KEY });
});

export const subscribeHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) throw new HttpError(401, "Unauthenticated");
  if (req.auth.actor !== "USER") throw new HttpError(403, "Forbidden");

  const { endpoint, keys } = req.body || {};
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    throw new HttpError(400, "Invalid subscription payload");
  }

  // Upsert by endpoint
  const sub = await prisma.pushSubscription.upsert({
    where: { endpoint },
    update: {
      user_id: req.auth.id,
      p256dh: keys.p256dh,
      auth: keys.auth
    },
    create: {
      user_id: req.auth.id,
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth
    }
  });

  return created(res, { subscription: sub });
});

export const unsubscribeHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) throw new HttpError(401, "Unauthenticated");
  if (req.auth.actor !== "USER") throw new HttpError(403, "Forbidden");

  const { endpoint } = req.body || {};
  if (!endpoint) throw new HttpError(400, "Endpoint required");

  await prisma.pushSubscription.deleteMany({
    where: { user_id: req.auth.id, endpoint }
  });

  return ok(res, { message: "Unsubscribed" });
});

// Utility: Send a push notification to a specific user
export async function sendPushToUser(userId: number, payload: {
  title: string;
  message: string;
  url?: string;
  tag?: string;
}) {
  if (!ensureVapid()) {
    return;
  }

  const subs = await prisma.pushSubscription.findMany({
    where: { user_id: userId }
  });

  const data = JSON.stringify({
    title: payload.title,
    message: payload.message,
    url: payload.url,
    tag: payload.tag || `user-${userId}`
  });

  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: s.endpoint,
            keys: { p256dh: s.p256dh, auth: s.auth }
          } as any,
          data
        );
      } catch (err: any) {
        // Clean up gone subscriptions (status 410)
        if (err?.statusCode === 410 || err?.statusCode === 404) {
          await prisma.pushSubscription.deleteMany({ where: { endpoint: s.endpoint } });
        }
      }
    })
  );
}

