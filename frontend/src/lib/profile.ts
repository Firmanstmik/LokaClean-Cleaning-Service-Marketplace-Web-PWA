/**
 * Profile helpers.
 *
 * We enforce "profile completion" at the UI level:
 * - full name
 * - phone number
 * - profile photo
 * - default map location (lat/lng)
 *
 * NOTE: The ERD keeps some fields optional in the DB, so we do NOT change the schema.
 */

import type { User } from "../types/api";

export function isUserProfileComplete(user: User) {
  const hasName = typeof user.full_name === "string" && user.full_name.trim().length > 0;
  const hasPhone = typeof user.phone_number === "string" && user.phone_number.trim().length > 0;
  // Photo is optional now
  // const hasPhoto = user.profile_photo != null && user.profile_photo.trim().length > 0;
  const hasDefaultLocation = user.default_latitude != null && user.default_longitude != null;

  return hasName && hasPhone && hasDefaultLocation;
}


