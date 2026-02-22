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
  email?: string;
  phone_number: string;
  password: string;
}) {
  const normalizedPhone = normalizeWhatsAppPhone(input.phone_number);
  if (!normalizedPhone) throw new HttpError(400, "Invalid phone number");

  const existingPhone = await prisma.user.findFirst({ where: { phone_number: normalizedPhone } });
  const isGuestOnlyPhone =
    existingPhone &&
    !existingPhone.password_hash &&
    typeof existingPhone.email === "string" &&
    existingPhone.email.endsWith("@guest.lokaclean.app");

  if (existingPhone && !isGuestOnlyPhone) {
    throw new HttpError(409, "Phone number already registered");
  }

  if (input.password.trim().length < 6) throw new HttpError(400, "Invalid password");
  const passwordHash = await bcrypt.hash(input.password, 12);

  let email: string;
  if (input.email && input.email.trim().length > 0) {
    email = input.email.trim().toLowerCase();
    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail && (!existingPhone || existingEmail.id !== existingPhone.id)) {
      throw new HttpError(409, "Email already registered");
    }
  } else {
    const digits = normalizedPhone.replace(/\D/g, "");
    email = `user+${digits}@lokaclean.local`;
  }

  let user;

  if (isGuestOnlyPhone && existingPhone) {
    user = await prisma.user.update({
      where: { id: existingPhone.id },
      data: {
        full_name: input.full_name,
        email,
        password_hash: passwordHash,
        role: Role.USER
      },
      select: userSelect
    });
  } else {
    user = await prisma.user.create({
      data: {
        full_name: input.full_name,
        email,
        phone_number: normalizedPhone,
        password_hash: passwordHash,
        role: Role.USER
      },
      select: userSelect
    });
  }

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

export async function loginAdmin(input: { login: string; password: string }) {
  const { login: rawLogin, password } = input;

  // In development, auto-create a default admin if none exists (for localhost testing).
  if (env.NODE_ENV === "development") {
    const adminCount = await prisma.admin.count();
    if (adminCount === 0) {
      const devEmail = process.env.ADMIN_SEED_EMAIL ?? "admin@lokaclean.local";
      const devPasswordPlain = process.env.ADMIN_SEED_PASSWORD ?? "admin12345";
      const devPasswordHash = await bcrypt.hash(devPasswordPlain, 12);

      await prisma.admin.create({
        data: {
          full_name: "LokaClean Dev Admin",
          email: devEmail,
          phone_number: "+6281234567890",
          password: devPasswordHash,
          role: Role.ADMIN
        }
      });
    }
  }

  // Normalize login (email) to lowercase if it's an email
  const login = rawLogin.includes("@") ? rawLogin.trim().toLowerCase() : rawLogin.trim();
  
  // Determine if login is email or phone
  const isEmail = login.includes("@");
  let admin: any = null;
  let isUserTable = false;
  
  // Helper to get phone variations
  const getPhoneVariations = (phone: string) => {
    const normalizedPhone = normalizeWhatsAppPhone(phone);
    if (!normalizedPhone) return [];
    
    let digitsOnly = normalizedPhone.replace(/^\+62/, "");
    if (digitsOnly.startsWith("+")) digitsOnly = digitsOnly.slice(1);
    if (digitsOnly.startsWith("62") && digitsOnly.length > 2) digitsOnly = digitsOnly.slice(2);

    const variationsSet = new Set<string>();
    variationsSet.add(normalizedPhone);
    if (digitsOnly && digitsOnly.length >= 10) {
      variationsSet.add(`+62${digitsOnly}`);
      variationsSet.add(`0${digitsOnly}`);
      variationsSet.add(digitsOnly);
      variationsSet.add(`62${digitsOnly}`);
    }
    return Array.from(variationsSet).filter(v => v && v.length > 0);
  };

  // 1. Try finding in ADMIN table
  if (isEmail) {
    admin = await prisma.admin.findUnique({ where: { email: login } });
  } else {
    const variations = getPhoneVariations(login);
    if (variations.length > 0) {
      admin = await prisma.admin.findFirst({
        where: {
          OR: variations.map(v => ({ phone_number: v })) as any
        }
      });
    }
  }

  // 2. If not found in Admin, try USER table with role=ADMIN
  if (!admin) {
    if (isEmail) {
      admin = await prisma.user.findFirst({ 
        where: { email: login, role: "ADMIN" } 
      });
    } else {
      const variations = getPhoneVariations(login);
      if (variations.length > 0) {
        admin = await prisma.user.findFirst({
          where: { 
            AND: [
              { role: "ADMIN" },
              { OR: variations.map(v => ({ phone_number: v })) as any }
            ]
          }
        });
      }
    }
    if (admin) isUserTable = true;
  }

  if (!admin) {
    const message =
      env.NODE_ENV === "development"
        ? "Invalid credentials. Untuk localhost, gunakan admin@lokaclean.local dan password admin12345."
        : "Invalid credentials";
    throw new HttpError(401, message);
  }

  // 3. Verify Password
  // Admin table uses 'password', User table uses 'password_hash'
  const dbPassword = isUserTable ? admin.password_hash : admin.password;
  
  if (!dbPassword) {
    const message =
      env.NODE_ENV === "development"
        ? "Invalid credentials. Untuk localhost, gunakan admin@lokaclean.local dan password admin12345."
        : "Invalid credentials";
    throw new HttpError(401, message);
  }

  const ok = await bcrypt.compare(password, dbPassword);
  if (!ok) {
    const message =
      env.NODE_ENV === "development"
        ? "Invalid credentials. Untuk localhost, gunakan admin@lokaclean.local dan password admin12345."
        : "Invalid credentials";
    throw new HttpError(401, message);
  }

  // 4. Return Token
  const tokenPayload: JwtTokenPayload = { 
      actor: "ADMIN", 
      role: "ADMIN", 
      id: admin.id,
      origin: isUserTable ? "USER" : "ADMIN"
  };

  const token = signToken(tokenPayload);
  
  const safeAdmin = {
      id: admin.id,
      full_name: admin.full_name,
      email: admin.email,
      role: "ADMIN",
      created_at: admin.created_at
  };

  return { token, admin: safeAdmin };
}

export async function resetUserPassword(input: { phone_number: string; new_password: string }) {
  const normalizedPhone = normalizeWhatsAppPhone(input.phone_number);
  if (!normalizedPhone) {
    throw new HttpError(
      400,
      "Nomor WhatsApp tidak valid. Pastikan format nomor benar (contoh: +628123456789 atau 08123456789)"
    );
  }

  const user = await prisma.user.findFirst({
    where: { phone_number: normalizedPhone }
  });

  if (!user) {
    throw new HttpError(
      404,
      "Nomor WhatsApp tidak terdaftar. Pastikan nomor yang Anda masukkan benar atau buat akun baru."
    );
  }

  const isGuestOnly =
    !user.password_hash &&
    typeof user.email === "string" &&
    user.email.endsWith("@guest.lokaclean.app");

  if (isGuestOnly) {
    throw new HttpError(
      401,
      "Nomor WhatsApp ini hanya digunakan untuk pesanan tanpa login. Silakan buat akun baru (register) dengan nomor ini untuk bisa login."
    );
  }

  if (!user.password_hash) {
    throw new HttpError(401, "Akun tidak memiliki password. Silakan hubungi admin.");
  }

  if (!input.new_password || input.new_password.trim().length < 6) {
    throw new HttpError(400, "Password minimal 6 karakter");
  }

  const passwordHash = await bcrypt.hash(input.new_password, 12);

  await prisma.user.update({
    where: { id: user.id },
    data: { password_hash: passwordHash }
  });

  return { userId: user.id };
}

export async function checkUserPhoneForReset(input: { phone_number: string }) {
  const normalizedPhone = normalizeWhatsAppPhone(input.phone_number);
  if (!normalizedPhone) {
    throw new HttpError(
      400,
      "Nomor WhatsApp tidak valid. Pastikan format nomor benar (contoh: +628123456789 atau 08123456789)"
    );
  }

  const user = await prisma.user.findFirst({
    where: { phone_number: normalizedPhone }
  });

  if (!user) {
    throw new HttpError(
      404,
      "Nomor WhatsApp tidak terdaftar. Silakan daftar terlebih dahulu untuk login."
    );
  }

  const isGuestOnly =
    !user.password_hash &&
    typeof user.email === "string" &&
    user.email.endsWith("@guest.lokaclean.app");

  if (isGuestOnly) {
    throw new HttpError(
      401,
      "Nomor WhatsApp ini hanya digunakan untuk pesanan tanpa login. Silakan buat akun baru (register) dengan nomor ini untuk bisa login."
    );
  }

  if (!user.password_hash) {
    throw new HttpError(401, "Akun tidak memiliki password. Silakan hubungi admin.");
  }

  return { ok: true, phone_number: normalizedPhone, userId: user.id };
}


