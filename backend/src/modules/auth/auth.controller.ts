/**
 * Auth controllers (HTTP layer).
 */

import type { Request, Response } from "express";

import { asyncHandler } from "../../utils/asyncHandler";
import { created, ok } from "../../utils/respond";
import { loginAdmin, loginUser, registerUser } from "./auth.service";

export const registerUserHandler = asyncHandler(async (req: Request, res: Response) => {
  const { token, user } = await registerUser(req.body);
  return created(res, { token, user });
});

export const loginUserHandler = asyncHandler(async (req: Request, res: Response) => {
  const { token, user } = await loginUser(req.body);
  return ok(res, { token, user });
});

export const loginAdminHandler = asyncHandler(async (req: Request, res: Response) => {
  const { token, admin } = await loginAdmin(req.body);
  return ok(res, { token, admin });
});


