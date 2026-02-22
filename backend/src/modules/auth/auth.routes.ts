/**
 * Auth routes.
 */

import { Router } from "express";

import { validateBody } from "../../middleware/validate";
import { adminLoginSchema, userCheckResetPhoneSchema, userLoginSchema, userRegisterSchema, userResetPasswordSchema } from "./auth.schemas";
import { checkUserPhoneForResetHandler, loginAdminHandler, loginUserHandler, registerUserHandler, resetUserPasswordHandler } from "./auth.controller";

export const authRouter = Router();

// USER auth
authRouter.post("/user/register", validateBody(userRegisterSchema), registerUserHandler);
authRouter.post("/user/login", validateBody(userLoginSchema), loginUserHandler);
authRouter.post(
  "/user/reset-password",
  validateBody(userResetPasswordSchema),
  resetUserPasswordHandler
);
authRouter.post(
  "/user/reset-password/check",
  validateBody(userCheckResetPhoneSchema),
  checkUserPhoneForResetHandler
);

// ADMIN auth
authRouter.post("/admin/login", validateBody(adminLoginSchema), loginAdminHandler);


