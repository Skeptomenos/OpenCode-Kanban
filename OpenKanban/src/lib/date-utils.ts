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
