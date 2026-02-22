/**
 * Auth controllers (HTTP layer).
 */

import type { Request, Response } from "express";

import { asyncHandler } from "../../utils/asyncHandler";
import { created, ok } from "../../utils/respond";
import { checkUserPhoneForReset, loginAdmin, loginUser, registerUser, resetUserPassword } from "./auth.service";

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

export const resetUserPasswordHandler = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = await resetUserPassword(req.body);
  return ok(res, {
    message: "Password berhasil direset. Silakan login dengan password baru.",
    userId
  });
});

export const checkUserPhoneForResetHandler = asyncHandler(async (req: Request, res: Response) => {
  const result = await checkUserPhoneForReset(req.body);
  return ok(res, {
    message: "Nomor WhatsApp terdaftar dan dapat melakukan reset password.",
    ...result
  });
});


