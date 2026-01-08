/**
 * Date/time utilities for WITA (Waktu Indonesia Tengah) timezone.
 * Lombok NTB uses WITA (UTC+8).
 */

import { getLanguage } from "../lib/i18n";

/**
 * Format date to WITA timezone with Indonesian locale.
 * @param dateString - ISO date string from API
 * @param options - Intl.DateTimeFormatOptions
 * @returns Formatted date string in WITA timezone
 */
export function formatDateWITA(
  dateString: string | Date,
  options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Makassar",
  }
): string {
  const date = typeof dateString === "string" ? new Date(dateString) : dateString;
  const lang = getLanguage();
  const locale = lang === "id" ? "id-ID" : "en-US";
  
  return new Intl.DateTimeFormat(locale, {
    ...options,
    timeZone: "Asia/Makassar",
  }).format(date);
}

/**
 * Format date only (without time) in WITA timezone.
 */
export function formatDateOnlyWITA(dateString: string | Date): string {
  return formatDateWITA(dateString, {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Asia/Makassar",
  });
}

/**
 * Format time only in WITA timezone.
 */
export function formatTimeOnlyWITA(dateString: string | Date): string {
  return formatDateWITA(dateString, {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Makassar",
  });
}

/**
 * Format date and time in WITA timezone (compact format).
 */
export function formatDateTimeWITA(dateString: string | Date): string {
  return formatDateWITA(dateString, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Makassar",
  });
}

/**
 * Format date for datetime-local input (WITA timezone).
 * Note: datetime-local input uses local time, so we need to convert from WITA to local time.
 */
export function toDatetimeLocalValueWITA(d: Date = new Date()): string {
  // Get WITA time components
  const witaString = d.toLocaleString("en-US", { 
    timeZone: "Asia/Makassar",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });
  
  // Parse the formatted string: "MM/DD/YYYY, HH:MM"
  const [datePart, timePart] = witaString.split(", ");
  const [month, day, year] = datePart.split("/");
  const [hour, minute] = timePart.split(":");
  
  return `${year}-${month}-${day}T${hour}:${minute}`;
}

