/**
 * Consistent JSON response helpers.
 *
 * This keeps API responses predictable for the frontend.
 */

import type { Response } from "express";

export function ok<T>(res: Response, data: T) {
  return res.status(200).json({ ok: true, data });
}

export function created<T>(res: Response, data: T) {
  return res.status(201).json({ ok: true, data });
}


