/**
 * Auth routes.
 */

import { Router } from "express";

import { validateBody } from "../../middleware/validate";
import { adminLoginSchema, userLoginSchema, userRegisterSchema } from "./auth.schemas";
import { loginAdminHandler, loginUserHandler, registerUserHandler } from "./auth.controller";

export const authRouter = Router();

// USER auth
authRouter.post("/user/register", validateBody(userRegisterSchema), registerUserHandler);
authRouter.post("/user/login", validateBody(userLoginSchema), loginUserHandler);

// ADMIN auth
authRouter.post("/admin/login", validateBody(adminLoginSchema), loginAdminHandler);


