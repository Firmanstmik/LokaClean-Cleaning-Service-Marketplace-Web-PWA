/**
 * User routes (tourist side).
 */

import { Router } from "express";

import { authenticate } from "../../middleware/auth";
import { requireActor } from "../../middleware/requireActor";
import { imageUpload } from "../../middleware/upload";
import { getMeHandler, updateMeHandler, deleteMeHandler } from "./users.controller";

export const usersRouter = Router();

usersRouter.get("/me", authenticate, requireActor("USER"), getMeHandler);

// Supports both JSON and multipart/form-data (for profile_photo upload).
usersRouter.put(
  "/me",
  authenticate,
  requireActor("USER"),
  imageUpload.single("profile_photo"),
  updateMeHandler
);

usersRouter.delete("/me", authenticate, requireActor("USER"), deleteMeHandler);


