/**
 * Express type augmentation.
 *
 * This allows us to attach `req.auth` in the auth middleware with proper typing.
 */

import type { AuthContext } from "./auth";

declare global {
  namespace Express {
    interface Request {
      auth?: AuthContext;
    }
  }
}

export {};


