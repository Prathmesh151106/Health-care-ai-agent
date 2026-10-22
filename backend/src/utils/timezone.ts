/**
 * utils/timezone.ts
 * Timezone helpers using date-fns-tz.
 *
 * DST behaviour:
 * - When converting a local wall-clock time to UTC we use date-fns-tz
 *   fromZonedTime(). If a local time is ambiguous (clocks fall back) the
 *   library picks the FIRST occurrence (standard→DST boundary). This is
 *   deterministic and documented here so callers know what to expect.
 * - If a local time is nonexistent (clocks spring forward), date-fns-tz
 *   normalises to the next valid UTC instant.
 */

import { fromZonedTime, toZonedTime, format } from 'date-fns-tz';
import { parseISO, isValid } from 'date-fns';

export const IANA_REGEX = /^[A-Za-z_]+(?:\/[A-Za-z_-]+)+$/;

/**
 * Validates an IANA timezone string.
 * Uses Intl.DateTimeFormat which is part of Node 20's built-in ICU data.
 */
export function isValidIANATimezone(tz: string): boolean {
  if (!IANA_REGEX.test(tz)) return false;
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/**
 * Convert a local wall-clock datetime string + IANA timezone to a UTC Date.
 * @param localDatetime  e.g. "2026-10-22T08:30:00"
 * @param timezone       e.g. "Asia/Kolkata"
 */
export function localToUtc(localDatetime: string, timezone: string): Date {
  return fromZonedTime(localDatetime, timezone);
}

/**
 * Convert a UTC Date to a local Date in the given timezone.
 */
export function utcToLocal(utcDate: Date, timezone: string): Date {
  return toZonedTime(utcDate, timezone);
}

/**
 * Build a UTC Date from a date string (YYYY-MM-DD) and a time string (HH:MM or HH:MM:SS)
 * in the given IANA timezone.
 */
export function buildDueAt(
  dateStr: string,
  timeStr: string,
  timezone: string
): Date {
  const localDatetime = `${dateStr}T${timeStr.length === 5 ? timeStr + ':00' : timeStr}`;
  return localToUtc(localDatetime, timezone);
}

/**
 * Format a UTC date into YYYY-MM-DD in the given IANA timezone.
 */
export function utcToDateString(utcDate: Date, timezone: string): string {
  const zoned = toZonedTime(utcDate, timezone);
  return format(zoned, 'yyyy-MM-dd', { timeZone: timezone });
}

/**
 * Get today's date string (YYYY-MM-DD) in the given IANA timezone.
 */
export function todayInTimezone(timezone: string): string {
  return utcToDateString(new Date(), timezone);
}

/**
 * Get yesterday's date string (YYYY-MM-DD) in the given IANA timezone.
 */
export function yesterdayInTimezone(timezone: string): string {
  const now = new Date();
  const zoned = toZonedTime(now, timezone);
  zoned.setDate(zoned.getDate() - 1);
  return format(zoned, 'yyyy-MM-dd', { timeZone: timezone });
}

/**
 * Parse a date string (YYYY-MM-DD) safely, returning null on failure.
 */
export function parseDateSafe(str: string): Date | null {
  const d = parseISO(str);
  return isValid(d) ? d : null;
}
