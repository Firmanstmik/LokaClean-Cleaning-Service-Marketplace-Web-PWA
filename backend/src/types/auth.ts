/**
 * Shared auth types for request context + JWT payloads.
 */

export type Actor = "USER" | "ADMIN";

export interface AuthContext {
  actor: Actor;
  role: Actor; // matches ERD roles (USER/ADMIN)
  id: number;
  origin?: "USER" | "ADMIN";
}

export interface JwtTokenPayload {
  actor: Actor;
  role: Actor;
  id: number;
  origin?: "USER" | "ADMIN";
}


