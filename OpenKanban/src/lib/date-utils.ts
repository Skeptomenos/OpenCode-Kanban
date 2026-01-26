/**
 * Date Utilities
 *
 * Centralized date handling for the application.
 * All timestamp generation should go through this module
 * to enable deterministic testing and consistent behavior.
 *
 * @see coding_principles/rules_ts.md:L36 - Date handling standards
 * @see ralph-wiggum/specs/353-security-hygiene.md:L41-46
 */

/**
 * Get the current Unix timestamp in milliseconds.
 *
 * Wrapper around Date.now() to enable:
 * - Deterministic testing via mocking
 * - Consistent timestamp generation across the codebase
 * - Future extensibility (e.g., clock skew handling)
 *
 * @returns Current timestamp in milliseconds since Unix epoch
 */
export function now(): number {
  return Date.now();
}

/**
 * Get the current timestamp as an ISO 8601 string.
 *
 * Uses the centralized `now()` function internally to ensure
 * consistent timestamp generation across the codebase.
 *
 * @returns Current timestamp as ISO 8601 string (e.g., "2026-01-25T21:50:00.000Z")
 * @see Issue B.1 - Logger date handling centralization
 */
export function nowISO(): string {
  return new Date(now()).toISOString();
}

/**
 * Threshold to distinguish seconds from milliseconds timestamps.
 *
 * 1e12 = 1,000,000,000,000 (Sep 2001 in ms, year 33658 in seconds)
 * - Timestamps < 1e12 are treated as seconds (Unix epoch)
 * - Timestamps >= 1e12 are treated as milliseconds
 *
 * @see https://en.wikipedia.org/wiki/Unix_time
 */
const SECONDS_MS_THRESHOLD = 1e12;

/**
 * Normalize a timestamp to milliseconds.
 *
 * OpenCode stores timestamps in seconds (Unix epoch), but JavaScript
 * Date APIs expect milliseconds. This function safely converts both
 * formats to milliseconds for consistent date handling.
 *
 * @param timestamp - Unix timestamp in either seconds or milliseconds
 * @returns Timestamp in milliseconds
 *
 * @example
 * // Seconds (OpenCode format)
 * normalizeTimestamp(1706284800) // -> 1706284800000
 *
 * @example
 * // Already milliseconds
 * normalizeTimestamp(1706284800000) // -> 1706284800000
 */
export function normalizeTimestamp(timestamp: number): number {
  return timestamp < SECONDS_MS_THRESHOLD ? timestamp * 1000 : timestamp;
}

/**
 * Format a timestamp (seconds or milliseconds) to a localized date string.
 *
 * Convenience wrapper that normalizes the timestamp before formatting.
 *
 * @param timestamp - Unix timestamp in either seconds or milliseconds
 * @returns Localized date string (e.g., "1/26/2026")
 */
export function formatTimestamp(timestamp: number): string {
  return new Date(normalizeTimestamp(timestamp)).toLocaleDateString();
}
