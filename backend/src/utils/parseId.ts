import { HttpError } from "./httpError";

/**
 * Parse a string parameter to a number ID.
 * Throws HttpError if invalid.
 */
export function parseId(param: string): number {
  const id = Number(param);
  if (!Number.isFinite(id)) throw new HttpError(400, "Invalid id");
  return id;
}

