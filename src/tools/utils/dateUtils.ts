/**
 * @file dateUtils.ts
 * @description Date and time utility functions for the DEL.
 */

/**
 * Formats a date as ISO 8601 string.
 * @param date - Date to format
 */
export function toISOString(date: Date): string {
  return date.toISOString();
}

/**
 * Formats a date as YYYY-MM-DD.
 * @param date - Date to format
 */
export function toDateString(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Formats a date as a human-readable string.
 * @param date - Date to format
 * @param locale - Locale string
 */
export function toHumanReadable(date: Date, locale = 'en-US'): string {
  return date.toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' });
}

/**
 * Returns the start of a day (midnight UTC).
 * @param date - Reference date
 */
export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

/**
 * Returns the end of a day (23:59:59.999 UTC).
 * @param date - Reference date
 */
export function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setUTCHours(23, 59, 59, 999);
  return d;
}

/**
 * Adds the specified number of days to a date.
 * @param date - Reference date
 * @param days - Days to add
 */
export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

/**
 * Adds the specified number of months to a date.
 * @param date - Reference date
 * @param months - Months to add
 */
export function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setUTCMonth(d.getUTCMonth() + months);
  return d;
}

/**
 * Returns the difference in days between two dates.
 * @param a - First date
 * @param b - Second date
 */
export function diffInDays(a: Date, b: Date): number {
  return Math.floor((a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Checks if a date is within a range.
 * @param date - Date to check
 * @param start - Range start
 * @param end - Range end
 */
export function isInRange(date: Date, start: Date, end: Date): boolean {
  return date >= start && date <= end;
}

/**
 * Returns a relative time string (e.g., '2 hours ago').
 * @param date - Date to describe
 */
export function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds} seconds ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  return `${Math.floor(seconds / 86400)} days ago`;
}

/**
 * Parses a date string safely, returning null on failure.
 * @param str - Date string to parse
 */
export function safeParseDate(str: string): Date | null {
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}

export default { toISOString, toDateString, toHumanReadable, startOfDay, endOfDay, addDays, addMonths, diffInDays, isInRange, timeAgo, safeParseDate };
