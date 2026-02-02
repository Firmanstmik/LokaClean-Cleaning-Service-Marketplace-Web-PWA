/**
 * Auth business logic.
 */

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Role } from "@prisma/client";
import type { SignOptions } from "jsonwebtoken";

import { env } from "../../config/env";
import { prisma } from "../../db/prisma";
import { HttpError } from "../../utils/httpError";
import { normalizeWhatsAppPhone } from "../../utils/phone";
import type { JwtTokenPayload } from "../../types/auth";

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

const adminSelect = {
  id: true,
  full_name: true,
  email: true,
  role: true,
  created_at: true
};

const userSelectWithPasswordHash = {
  ...userSelect,
  password_hash: true
} as const;

function signToken(payload: JwtTokenPayload) {
  // jsonwebtoken's `expiresIn` type is a constrained string union; we validate presence via Zod
  // and cast here to keep env parsing simple.
  const opts: SignOptions = { expiresIn: env.JWT_EXPIRES_IN as SignOptions["expiresIn"] };
  return jwt.sign(payload, env.JWT_SECRET, opts);
}

export async function registerUser(input: {
  full_name: string;
  email: string;
  phone_number: string;
  password: string;
}) {
  const email = input.email.trim().toLowerCase();
  const existingEmail = await prisma.user.findUnique({ where: { email } });
  if (existingEmail) throw new HttpError(409, "Email already registered");

  const normalizedPhone = normalizeWhatsAppPhone(input.phone_number);
  if (!normalizedPhone) throw new HttpError(400, "Invalid phone number");

  const existingPhone = await prisma.user.findFirst({ where: { phone_number: normalizedPhone } });
  if (existingPhone) throw new HttpError(409, "Phone number already registered");

  if (input.password.trim().length < 6) throw new HttpError(400, "Invalid password");
  const passwordHash = await bcrypt.hash(input.password, 12);

  const user = await prisma.user.create({
    data: {
      full_name: input.full_name,
      email,
      phone_number: normalizedPhone,
      password_hash: passwordHash,
      role: Role.USER
    },
    select: userSelect
  });

  const token = signToken({ actor: "USER", role: "USER", id: user.id });
  return { token, user };
}

export async function loginUser(input: { login: string; password: string }) {
  const login = input.login.trim();

  // Determine if login is email or phone number
  const isEmail = login.includes("@");
  let loginType: "email" | "phone" | null = null;
  let normalizedPhone: string | null = null;

  let userWithHash;
  
  if (isEmail) {
    loginType = "email";
    // Find by email
    userWithHash = await prisma.user.findFirst({
      where: { email: login.toLowerCase() },
      select: userSelectWithPasswordHash
    });
  } else {
    // Phone number login
    loginType = "phone";
    normalizedPhone = normalizeWhatsAppPhone(login);
    
    if (!normalizedPhone) {
      throw new HttpError(400, "Nomor WhatsApp tidak valid. Pastikan format nomor benar (contoh: +628123456789 atau 08123456789)");
    }
    
    // Extract just the digits (without country code prefix) for flexible matching
    // For example: +628123456789 -> 8123456789
    let digitsOnly = normalizedPhone.replace(/^\+62/, "");
    // If still starts with country code or has +, remove it
    if (digitsOnly.startsWith("+")) {
      digitsOnly = digitsOnly.slice(1);
    }
    if (digitsOnly.startsWith("62") && digitsOnly.length > 2) {
      digitsOnly = digitsOnly.slice(2);
    }
    
    // Create all possible variations of the phone number
    // Use Set to automatically remove duplicates
    const variationsSet = new Set<string>();
    variationsSet.add(normalizedPhone); // +628123456789 (standard format)
    
    if (digitsOnly && digitsOnly.length >= 10) {
      variationsSet.add(`+62${digitsOnly}`); // +628123456789 (with +62 prefix)
      variationsSet.add(`0${digitsOnly}`); // 08123456789 (local format)
      variationsSet.add(digitsOnly); // 8123456789 (without prefix)
      variationsSet.add(`62${digitsOnly}`); // 628123456789 (country code without +)
    }
    
    const variations = Array.from(variationsSet).filter(v => v && v.length > 0);

    // Use OR condition to search all variations at once (more efficient)
    // IMPORTANT: Only search for users that have password_hash (can login)
    userWithHash = await prisma.user.findFirst({
      where: {
        AND: [
          {
            OR: variations.map(v => ({ phone_number: v }))
          },
          {
            password_hash: { not: null }
          }
        ]
      },
      select: userSelectWithPasswordHash
    });
  }

  // If found with phone, ensure the phone number is stored in normalized format
  if (userWithHash && loginType === "phone" && normalizedPhone) {
    if (userWithHash.phone_number !== normalizedPhone) {
      // Update to normalized format for consistency (async, don't wait)
      prisma.user.update({
        where: { id: userWithHash.id },
        data: { phone_number: normalizedPhone }
      }).catch(() => {
        // Ignore update errors - not critical for login
      });
    }
  }

  // Check if user exists
  if (!userWithHash) {
    if (loginType === "email") {
      throw new HttpError(401, "Email tidak terdaftar. Pastikan email yang Anda masukkan benar atau buat akun baru.");
    } else {
      throw new HttpError(401, "Nomor WhatsApp tidak terdaftar. Pastikan nomor yang Anda masukkan benar atau buat akun baru.");
    }
  }

  // Check if user has password (should always have, but safety check)
  if (!userWithHash.password_hash) {
    throw new HttpError(401, "Akun tidak memiliki password. Silakan hubungi admin.");
  }

  // Verify password
  const ok = await bcrypt.compare(input.password, userWithHash.password_hash);
  if (!ok) {
    throw new HttpError(401, "Password salah. Pastikan password yang Anda masukkan benar.");
  }

  // Never return password hash to clients.
  const { password_hash: _passwordHash, ...user } = userWithHash;

  const token = signToken({ actor: "USER", role: "USER", id: user.id });
  return { token, user };
}

export async function loginAdmin(input: { email: string; password: string }) {
  const admin = await prisma.admin.findUnique({ where: { email: input.email } });
  if (!admin) throw new HttpError(401, "Invalid credentials");

  const ok = await bcrypt.compare(input.password, admin.password);
  if (!ok) throw new HttpError(401, "Invalid credentials");

  const token = signToken({ actor: "ADMIN", role: "ADMIN", id: admin.id });
  const safeAdmin = await prisma.admin.findUnique({ where: { id: admin.id }, select: adminSelect });
  if (!safeAdmin) throw new HttpError(500, "Admin not found after login");

  return { token, admin: safeAdmin };
}


