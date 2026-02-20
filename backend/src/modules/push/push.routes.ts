import { Router } from "express";
import { authenticate } from "../../middleware/auth";
import { requireActor } from "../../middleware/requireActor";
import {
  getPublicKeyHandler,
  subscribeHandler,
  unsubscribeHandler,
  subscribeAdminHandler,
  unsubscribeAdminHandler
} from "./push.controller";

export const pushRouter = Router();

pushRouter.get("/public-key", getPublicKeyHandler);

pushRouter.use(authenticate);

pushRouter.post("/subscribe", requireActor("USER"), subscribeHandler);
pushRouter.post("/unsubscribe", requireActor("USER"), unsubscribeHandler);

pushRouter.post("/admin/subscribe", requireActor("ADMIN"), subscribeAdminHandler);
pushRouter.post("/admin/unsubscribe", requireActor("ADMIN"), unsubscribeAdminHandler);
