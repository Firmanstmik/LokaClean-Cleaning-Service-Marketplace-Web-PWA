import { Role } from "@prisma/client";

/**
 * Shared auth types for request context + JWT payloads.
 */

export type Actor = "USER" | "ADMIN";

export interface AuthContext {
  actor: Actor;
  role: Role; // matches ERD roles (USER/ADMIN/CLEANER)
  id: number;
  origin?: "USER" | "ADMIN";
}

export interface JwtTokenPayload {
  actor: Actor;
  role: Role;
  id: number;
  origin?: "USER" | "ADMIN";
}


