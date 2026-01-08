/**
 * Phone helpers (WhatsApp-friendly).
 *
 * Goal:
 * - Accept "free-form" user input (spaces/dashes/parentheses)
 * - Normalize to an E.164-like string that WhatsApp can use: "+<digits>"
 * - Support common local-ID input: "08..." -> "+62..."
 *
 * Notes:
 * - We default local numbers starting with "0" to Indonesia (+62).
 * - For true international users, they should input "+<country><number>" or "00<country><number>".
 */

/**
 * Strips everything except digits and a single leading "+".
 */
export function sanitizePhoneInput(raw: string) {
  const trimmed = raw.trim();
  const cleaned = trimmed.replace(/[^\d+]/g, "").replace(/(?!^)\+/g, "");
  return cleaned;
}

/**
 * Normalize raw input into a WhatsApp-friendly E.164-like format.
 *
 * Examples:
 * - "0812 3456 789" -> "+628123456789"
 * - "+62 812-3456-789" -> "+628123456789"
 * - "0062 8123456789" -> "+628123456789"
 * - "+44 20 1234 5678" -> "+442012345678"
 */
export function normalizeWhatsAppPhone(raw: string, defaultCountryCode = "62") {
  const cleaned = sanitizePhoneInput(raw);
  if (!cleaned) return null;

  const cc = defaultCountryCode.replace(/[^\d]/g, "");
  let out = cleaned;

  // 00-prefixed international format
  if (out.startsWith("00")) out = `+${out.slice(2)}`;

  // People sometimes type "+0..." by mistake; treat it as local "0..."
  if (out.startsWith("+0")) out = `+${cc}${out.slice(2)}`;

  // Local format "0..." (Indonesia default)
  if (!out.startsWith("+") && out.startsWith("0")) out = `+${cc}${out.slice(1)}`;

  // If still no "+", assume they entered countrycode+number without the "+"
  if (!out.startsWith("+")) out = `+${out}`;

  // Validate: WhatsApp uses E.164 (max 15 digits, not starting with 0)
  if (!/^\+[1-9]\d{5,14}$/.test(out)) return null;

  return out;
}


