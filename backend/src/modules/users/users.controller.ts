/**
 * User profile controllers.
 */

import type { Request, Response } from "express";

import bcrypt from "bcryptjs";

import { prisma } from "../../db/prisma";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok } from "../../utils/respond";
import { HttpError } from "../../utils/httpError";
import { normalizeWhatsAppPhone } from "../../utils/phone";
import { updateMeSchema, deleteMeSchema } from "./users.schemas";
import { fileToPublicPath } from "../../middleware/upload";

const userSelect = {
  id: true,
  full_name: true,
  email: true,
  phone_number: true,
  profile_photo: true,
  default_latitude: true,
  default_longitude: true,
  role: true,
  created_at: true,
  updated_at: true
};

export const getMeHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) throw new HttpError(401, "Unauthenticated");

  const user = await prisma.user.findUnique({ where: { id: req.auth.id }, select: userSelect });
  if (!user) throw new HttpError(404, "User not found");

  return ok(res, { user });
});

export const updateMeHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) throw new HttpError(401, "Unauthenticated");

  const patch = updateMeSchema.parse(req.body);
  const profilePhoto = req.file ? fileToPublicPath(req.file) : undefined;

  const normalizedPhone =
    patch.phone_number != null ? normalizeWhatsAppPhone(patch.phone_number) : undefined;
  if (patch.phone_number != null && !normalizedPhone) throw new HttpError(400, "Invalid phone number");

  // Hash password if provided
  const passwordHash = patch.password ? await bcrypt.hash(patch.password, 12) : undefined;

  // Check if email is being changed and if it's already taken
  if (patch.email) {
    const existingUser = await prisma.user.findFirst({
      where: {
        email: patch.email,
        id: { not: req.auth.id }
      }
    });
    if (existingUser) {
      throw new HttpError(400, "Email already in use");
    }
  }

  const user = await prisma.user.update({
    where: { id: req.auth.id },
    data: {
      ...(patch.full_name ? { full_name: patch.full_name } : {}),
      ...(patch.email ? { email: patch.email } : {}),
      ...(normalizedPhone ? { phone_number: normalizedPhone } : {}),
      ...(passwordHash ? { password_hash: passwordHash } : {}),
      ...(patch.default_latitude != null ? { default_latitude: patch.default_latitude } : {}),
      ...(patch.default_longitude != null ? { default_longitude: patch.default_longitude } : {}),
      ...(profilePhoto ? { profile_photo: profilePhoto } : {})
    },
    select: userSelect
  });

  return ok(res, { user });
});

/**
 * USER: Delete own account
 * This will delete the user and all related data (cascade delete)
 * Requires email/phone and password verification for security
 */
export const deleteMeHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) throw new HttpError(401, "Unauthenticated");

  const userId = req.auth.id;
  const verification = deleteMeSchema.parse(req.body);

  // Get user with password hash for verification
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      phone_number: true,
      password_hash: true
    }
  });

  if (!user) throw new HttpError(404, "User not found");

  // Verify email or phone matches
  const normalizedInput = verification.email_or_phone.trim().toLowerCase();
  const normalizedEmail = user.email.toLowerCase();
  const normalizedPhone = user.phone_number.replace(/\s+/g, "");

  if (
    normalizedInput !== normalizedEmail &&
    normalizedInput !== normalizedPhone &&
    normalizedInput !== user.phone_number
  ) {
    throw new HttpError(400, "Email or phone number does not match your account");
  }

  // Verify password
  if (!user.password_hash) {
    throw new HttpError(400, "Password verification failed");
  }

  const passwordValid = await bcrypt.compare(verification.password, user.password_hash);
  if (!passwordValid) {
    throw new HttpError(400, "Invalid password");
  }

  // Delete user (cascade will handle related records)
  await prisma.user.delete({
    where: { id: userId }
  });

  return ok(res, { message: "Account deleted successfully" });
});


