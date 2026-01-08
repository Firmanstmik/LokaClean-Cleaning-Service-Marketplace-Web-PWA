/**
 * Simple role/actor gate.
 *
 * We have two "actors" in Phase 1:
 * - USER (tourist)
 * - ADMIN (system operator)
 */

import type { NextFunction, Request, Response } from "express";
import type { Actor } from "../types/auth";
import { HttpError } from "../utils/httpError";

export function requireActor(actor: Actor) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.auth) return next(new HttpError(401, "Unauthenticated"));
    if (req.auth.actor !== actor) return next(new HttpError(403, "Forbidden"));
    return next();
  };
}

export function requireAnyActor(actors: Actor[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.auth) return next(new HttpError(401, "Unauthenticated"));
    if (!actors.includes(req.auth.actor)) return next(new HttpError(403, "Forbidden"));
    return next();
  };
}


