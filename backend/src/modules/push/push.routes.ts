import { Router } from "express";
import { authenticate } from "../../middleware/auth";
import { requireActor } from "../../middleware/requireActor";
import { getPublicKeyHandler, subscribeHandler, unsubscribeHandler } from "./push.controller";

export const pushRouter = Router();

// Public: expose VAPID public key (or null if not configured)
pushRouter.get("/public-key", getPublicKeyHandler);

// Authenticated USER: manage subscription
pushRouter.use(authenticate, requireActor("USER"));
pushRouter.post("/subscribe", subscribeHandler);
pushRouter.post("/unsubscribe", unsubscribeHandler);

