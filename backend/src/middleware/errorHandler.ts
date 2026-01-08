/**
 * Centralized error handler.
 *
 * Converts thrown errors into a stable JSON response format.
 */

import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import multer from "multer";

import { HttpError } from "../utils/httpError";

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  // Zod validation errors
  if (err instanceof ZodError) {
    return res.status(400).json({
      ok: false,
      error: {
        message: "Validation error",
        details: err.flatten()
      }
    });
  }

  // Multer upload errors
  if (err instanceof multer.MulterError) {
    return res.status(400).json({
      ok: false,
      error: {
        message: "Upload error",
        details: { code: err.code, field: err.field }
      }
    });
  }

  // Typed HTTP errors thrown intentionally
  if (err instanceof HttpError) {
    return res.status(err.status).json({
      ok: false,
      error: {
        message: err.message,
        details: err.details
      }
    });
  }

  // Unknown/unexpected errors
  console.error("[ERROR]", err);
  
  // In development, show full error details
  const isDevelopment = process.env.NODE_ENV === "development";
  const errorMessage = err instanceof Error ? err.message : "Internal server error";
  const errorStack = err instanceof Error ? err.stack : undefined;

  return res.status(500).json({
    ok: false,
    error: {
      message: isDevelopment ? errorMessage : "Internal server error",
      ...(isDevelopment && errorStack && { stack: errorStack })
    }
  });
}


