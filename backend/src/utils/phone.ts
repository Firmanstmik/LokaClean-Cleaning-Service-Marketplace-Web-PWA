/**
 * Phone helpers (WhatsApp-friendly).
 *
 * We store phone numbers in an E.164-like format: "+<digits>".
 * This lets the admin/ops team contact users via WhatsApp reliably.
 *
 * Default country behavior:
 * - If input starts with "0" (local format), we assume Indonesia and convert to +62.
 * - If input starts with "00" (international prefix), we convert "00" -> "+".
 */

export function sanitizePhoneInput(raw: string) {
  const trimmed = raw.trim();
  return trimmed.replace(/[^\d+]/g, "").replace(/(?!^)\+/g, "");
}

export function normalizeWhatsAppPhone(raw: string, defaultCountryCode = "62") {
  const cleaned = sanitizePhoneInput(raw);
  if (!cleaned) return null;

  const cc = defaultCountryCode.replace(/[^\d]/g, "");
  let out = cleaned;

  if (out.startsWith("00")) out = `+${out.slice(2)}`;
  if (out.startsWith("+0")) out = `+${cc}${out.slice(2)}`;
  if (!out.startsWith("+") && out.startsWith("0")) out = `+${cc}${out.slice(1)}`;
  if (!out.startsWith("+")) out = `+${out}`;

  // E.164-ish: max 15 digits, cannot start with 0
  if (!/^\+[1-9]\d{5,14}$/.test(out)) return null;
  return out;
}


