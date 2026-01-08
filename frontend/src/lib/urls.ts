/**
 * URL helpers for uploaded images served by the backend.
 */

const apiBase = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000/api";

// Backend serves uploads at `${origin}/uploads/...` while API is `${origin}/api`.
export const apiOrigin = apiBase.replace(/\/api\/?$/, "");

export function toAbsoluteUrl(path: string | null) {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  if (path.startsWith("/")) return `${apiOrigin}${path}`;
  return `${apiOrigin}/${path}`;
}

/**
 * Parse photo paths from database.
 * Supports both JSON array (new format) and single string (old format for backward compatibility).
 */
export function parsePhotoPaths(photoPath: string | null | undefined): string[] {
  if (!photoPath) return [];
  
  // Try to parse as JSON array first (new format)
  try {
    const parsed = JSON.parse(photoPath);
    if (Array.isArray(parsed)) {
      return parsed.filter((p): p is string => typeof p === 'string');
    }
  } catch {
    // Not JSON, treat as single string (old format)
  }
  
  // Single string (old format) - return as array with single element
  return [photoPath];
}


