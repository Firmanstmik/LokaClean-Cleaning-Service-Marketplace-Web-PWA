/**
 * ADMIN-facing Rating routes.
 */

import { Router } from "express";

import { authenticate } from "../../middleware/auth";
import { requireActor } from "../../middleware/requireActor";
import {
  listRatingsAdminHandler,
  getRatingsSummaryAdminHandler
} from "./ratings.admin.controller";

export const adminRatingsRouter = Router();

adminRatingsRouter.use(authenticate, requireActor("ADMIN"));

adminRatingsRouter.get("/", listRatingsAdminHandler);
adminRatingsRouter.get("/summary", getRatingsSummaryAdminHandler);

