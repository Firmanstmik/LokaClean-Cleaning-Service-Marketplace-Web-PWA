/**
 * Small helper to extract a human-readable message from Axios/backend errors.
 */

import axios from "axios";

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function extractBackendMessage(data: unknown): string | null {
  if (!isRecord(data)) return null;

  // Backend error format: { ok: false, error: { message, details? } }
  const maybeError = data.error;
  if (isRecord(maybeError) && typeof maybeError.message === "string") {
    return maybeError.message;
  }

  // Fallbacks (in case a proxy or other middleware wraps responses)
  if (typeof data.message === "string") return data.message;

  return null;
}

export function getApiErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const msg = extractBackendMessage(err.response?.data) ?? err.message;
    return typeof msg === "string" && msg.length > 0 ? msg : "Request failed";
  }

  if (err instanceof Error) return err.message;
  return "Request failed";
}


