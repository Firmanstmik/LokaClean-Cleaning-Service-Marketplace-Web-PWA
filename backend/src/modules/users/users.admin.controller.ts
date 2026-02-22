/**
 * Admin User management controllers.
 */

import type { Request, Response } from "express";

import bcrypt from "bcryptjs";

import { prisma } from "../../db/prisma";
import { asyncHandler } from "../../utils/asyncHandler";
import { created, ok } from "../../utils/respond";
import { HttpError } from "../../utils/httpError";
import { normalizeWhatsAppPhone } from "../../utils/phone";
import { z } from "zod";

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

const createUserSchema = z.object({
  full_name: z.string().min(1),
  email: z.string().email(),
  phone_number: z.string().min(6),
  password: z.string().min(6),
  role: z.enum(["USER", "ADMIN"]).optional()
});

const updateUserSchema = z.object({
  full_name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone_number: z.string().min(6).optional(),
  password: z.string().min(6).optional(),
  role: z.enum(["USER", "ADMIN"]).optional()
});

export const listUsersHandler = asyncHandler(async (req: Request, res: Response) => {
  const rows = await prisma.user.findMany({
    select: {
      ...userSelect,
      password_hash: true,
      savedAddresses: {
        orderBy: [
          { is_primary: "desc" },
          { created_at: "desc" }
        ],
        take: 1,
        select: {
          id: true,
          label: true,
          address: true,
          notes: true,
          floor_number: true,
          building_name: true,
          latitude: true,
          longitude: true
        }
      },
      pesanan: {
        orderBy: { created_at: "desc" },
        take: 1,
        select: {
          id: true,
          address: true,
          location_latitude: true,
          location_longitude: true
        }
      }
    },
    orderBy: { created_at: "desc" }
  });

  const users = rows.map(row => {
    const { password_hash, ...user } = row as typeof row & {
      password_hash: string | null;
      savedAddresses: Array<{
        id: number;
        label: string;
        address: string;
        notes: string | null;
        floor_number: string | null;
        building_name: string | null;
        latitude: number;
        longitude: number;
      }>;
      pesanan: Array<{
        id: number;
        address: string;
        location_latitude: number;
        location_longitude: number;
      }>;
    };

    const email = (user.email || "").toString();
    const hasPassword = !!password_hash;
    const isGuestEmail = email.endsWith("@guest.lokaclean.app");

    let auth_type: "REGISTERED" | "GUEST_ONLY" | "UNKNOWN" = "UNKNOWN";
    if (hasPassword) {
      auth_type = "REGISTERED";
    } else if (isGuestEmail) {
      auth_type = "GUEST_ONLY";
    }

    const primarySaved = user.savedAddresses[0] || null;
    const latestOrder = user.pesanan[0] || null;

    let primary_address: string | null = null;
    let primary_address_notes: string | null = null;
    let primary_address_source: "SAVED" | "ORDER" | null = null;
    let primary_address_latitude: number | null = null;
    let primary_address_longitude: number | null = null;

    if (primarySaved) {
      primary_address = primarySaved.address;
      primary_address_notes =
        primarySaved.notes ||
        primarySaved.building_name ||
        primarySaved.floor_number ||
        null;
      primary_address_source = "SAVED";
      primary_address_latitude = primarySaved.latitude;
      primary_address_longitude = primarySaved.longitude;
    } else if (latestOrder) {
      primary_address = latestOrder.address;
      primary_address_notes = null;
      primary_address_source = "ORDER";
      primary_address_latitude = latestOrder.location_latitude;
      primary_address_longitude = latestOrder.location_longitude;
    }

    return {
      ...user,
      auth_type,
      primary_address,
      primary_address_notes,
      primary_address_source,
      primary_address_latitude,
      primary_address_longitude
    };
  });

  return ok(res, { users });
});

export const createUserHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = createUserSchema.parse(req.body);

  // Check if email already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email }
  });
  if (existingUser) {
    throw new HttpError(400, "Email already in use");
  }

  // Normalize phone number
  const normalizedPhone = normalizeWhatsAppPhone(data.phone_number);
  if (!normalizedPhone) {
    throw new HttpError(400, "Invalid phone number");
  }

  // Hash password
  const passwordHash = await bcrypt.hash(data.password, 12);

  // Create user
  const user = await prisma.user.create({
    data: {
      full_name: data.full_name,
      email: data.email,
      phone_number: normalizedPhone,
      password_hash: passwordHash,
      role: data.role || "USER"
    },
    select: userSelect
  });

  return created(res, { user });
});

export const updateUserHandler = asyncHandler(async (req: Request, res: Response) => {
  const userId = parseInt(req.params.id);
  if (!Number.isFinite(userId)) {
    throw new HttpError(400, "Invalid user ID");
  }

  const data = updateUserSchema.parse(req.body);

  // Check if user exists
  const existingUser = await prisma.user.findUnique({
    where: { id: userId }
  });
  if (!existingUser) {
    throw new HttpError(404, "User not found");
  }

  // Check if email is being changed and if it's already taken
  if (data.email && data.email !== existingUser.email) {
    const emailTaken = await prisma.user.findFirst({
      where: {
        email: data.email,
        id: { not: userId }
      }
    });
    if (emailTaken) {
      throw new HttpError(400, "Email already in use");
    }
  }

  // Normalize phone number if provided
  const normalizedPhone = data.phone_number
    ? normalizeWhatsAppPhone(data.phone_number)
    : undefined;
  if (data.phone_number && !normalizedPhone) {
    throw new HttpError(400, "Invalid phone number");
  }

  // Hash password if provided
  const passwordHash = data.password ? await bcrypt.hash(data.password, 12) : undefined;

  // Update user
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(data.full_name ? { full_name: data.full_name } : {}),
      ...(data.email ? { email: data.email } : {}),
      ...(normalizedPhone ? { phone_number: normalizedPhone } : {}),
      ...(passwordHash ? { password_hash: passwordHash } : {}),
      ...(data.role ? { role: data.role } : {})
    },
    select: userSelect
  });

  return ok(res, { user });
});

export const deleteUserHandler = asyncHandler(async (req: Request, res: Response) => {
  const userId = parseInt(req.params.id);
  if (!Number.isFinite(userId)) {
    throw new HttpError(400, "Invalid user ID");
  }

  // Check if user exists
  const existingUser = await prisma.user.findUnique({
    where: { id: userId }
  });
  if (!existingUser) {
    throw new HttpError(404, "User not found");
  }

  // Find all user's orders to handle dependencies
  const userOrders = await prisma.pesanan.findMany({
    where: { user_id: userId },
    select: { id: true }
  });
  const orderIds = userOrders.map(o => o.id);

  // Perform deletion in a transaction to ensure data integrity
  await prisma.$transaction([
    // 1. Delete all notifications belonging to the user OR referencing the user's orders
    prisma.notification.deleteMany({
      where: {
        OR: [
          { user_id: userId },
          // Only include this condition if there are orders, though empty array is usually safe
          ...(orderIds.length > 0 ? [{ pesanan_id: { in: orderIds } }] : [])
        ]
      }
    }),

    // 2. Delete dependencies of the orders (if any)
    ...(orderIds.length > 0 ? [
      prisma.pembayaran.deleteMany({
        where: { pesanan_id: { in: orderIds } }
      }),
      prisma.rating.deleteMany({
        where: { pesanan_id: { in: orderIds } }
      }),
      prisma.tip.deleteMany({
        where: { pesanan_id: { in: orderIds } }
      })
    ] : []),

    // 3. Delete the orders themselves
    prisma.pesanan.deleteMany({
      where: { user_id: userId }
    }),

    // 4. Finally, delete the user
    prisma.user.delete({
      where: { id: userId }
    })
  ]);

  return ok(res, { message: "User deleted successfully" });
});

const resetPasswordSchema = z.object({
  password: z.string().min(6).optional() // Optional: if not provided, generate random password
});

export const resetPasswordHandler = asyncHandler(async (req: Request, res: Response) => {
  const userId = parseInt(req.params.id);
  if (!Number.isFinite(userId)) {
    throw new HttpError(400, "Invalid user ID");
  }

  // Check if user exists
  const existingUser = await prisma.user.findUnique({
    where: { id: userId }
  });
  if (!existingUser) {
    throw new HttpError(404, "User not found");
  }

  const data = resetPasswordSchema.parse(req.body);

  let newPassword: string;

  // Use custom password if provided, otherwise generate random password
  if (data.password) {
    newPassword = data.password;
  } else {
    // Generate a random password (8 characters, alphanumeric)
    const generateRandomPassword = () => {
      const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
      let password = "";
      for (let i = 0; i < 8; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return password;
    };
    newPassword = generateRandomPassword();
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);

  // Update user password
  await prisma.user.update({
    where: { id: userId },
    data: { password_hash: passwordHash }
  });

  // IMPORTANT: If this user is an ADMIN (role = ADMIN), also update the Admin table
  // because admin login uses the Admin table, not the User table
  if (existingUser.role === "ADMIN") {
    // Check if admin exists with the same email
    const existingAdmin = await prisma.admin.findUnique({
      where: { email: existingUser.email }
    });

    if (existingAdmin) {
      // Update admin password in Admin table
      await prisma.admin.update({
        where: { id: existingAdmin.id },
        data: { password: passwordHash }
      });
    } else {
      // If admin doesn't exist but user has ADMIN role, create admin entry
      // This handles edge cases where admin might not exist in Admin table
      await prisma.admin.create({
        data: {
          full_name: existingUser.full_name,
          email: existingUser.email,
          password: passwordHash,
          role: "ADMIN"
        }
      });
    }
  }

  return ok(res, { 
    message: "Password reset successfully",
    newPassword: newPassword // Return the new password so admin can share it with user
  });
});

