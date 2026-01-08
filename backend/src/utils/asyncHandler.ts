/**
 * Wrapper to forward async errors to Express' error handler.
 */

import type { NextFunction, Request, Response } from "express";

/**
 * Express doesn't natively catch async errors.
 *
 * We intentionally allow any return type here because many handlers `return res.json(...)`,
 * which is a Response object (not `void`).
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown> | unknown
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}


