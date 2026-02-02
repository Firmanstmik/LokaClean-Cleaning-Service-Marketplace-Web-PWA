/**
 * JWT authentication middleware.
 *
 * Attaches `req.auth` when a valid token is provided.
 */

import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

import { prisma } from "../db/prisma";
import { env } from "../config/env";
import { HttpError } from "../utils/httpError";
import type { JwtTokenPayload } from "../types/auth";

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.header("authorization");
  if (!header) {
    return next(new HttpError(401, "Missing Authorization header"));
  }

  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) {
    return next(new HttpError(401, "Invalid Authorization header format"));
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtTokenPayload;
    if (!decoded?.id || !decoded?.actor || !decoded?.role) {
      return next(new HttpError(401, "Invalid token payload"));
    }

    req.auth = {
      id: Number(decoded.id),
      actor: decoded.actor,
      role: decoded.role
    };

    // Verify user exists in DB (Async check)
    (async () => {
      try {
        if (req.auth.actor === "USER") {
          const user = await prisma.user.findUnique({ where: { id: req.auth.id } });
          if (!user) throw new HttpError(404, "User account not found");
        } else if (req.auth.actor === "ADMIN") {
          const admin = await prisma.admin.findUnique({ where: { id: req.auth.id } });
          if (!admin) throw new HttpError(404, "Admin account not found");
        }
        next();
      } catch (err) {
        next(err);
      }
    })();

  } catch {
    return next(new HttpError(401, "Invalid or expired token"));
  }
}


