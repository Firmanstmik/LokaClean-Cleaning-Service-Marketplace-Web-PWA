/**
 * Zod validation middleware for JSON bodies.
 *
 * For multipart/form-data endpoints (file uploads) we validate inside controllers,
 * because req.body values arrive as strings.
 */

import type { NextFunction, Request, Response } from "express";
import type { ZodSchema } from "zod";

export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction) => {
    req.body = schema.parse(req.body);
    next();
  };
}


