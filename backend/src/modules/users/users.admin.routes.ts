/**
 * Admin User management routes.
 */

import { Router } from "express";

import { authenticate } from "../../middleware/auth";
import { requireActor } from "../../middleware/requireActor";
import {
  listUsersHandler,
  createUserHandler,
  updateUserHandler,
  deleteUserHandler,
  resetPasswordHandler
} from "./users.admin.controller";

export const adminUsersRouter = Router();

adminUsersRouter.use(authenticate, requireActor("ADMIN"));

adminUsersRouter.get("/", listUsersHandler);
adminUsersRouter.post("/", createUserHandler);
adminUsersRouter.put("/:id", updateUserHandler);
adminUsersRouter.delete("/:id", deleteUserHandler);
adminUsersRouter.post("/:id/reset-password", resetPasswordHandler);

