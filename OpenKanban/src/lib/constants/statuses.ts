/**
 * Canonical Issue Status Constants
 *
 * This file defines the single source of truth for issue statuses across the codebase.
 * All status string literals should reference these constants to prevent inconsistencies.
 *
 * Historical note: Production code used 'in-progress' (hyphen) while tests used 'in_progress' (underscore).
 * This caused issues matching statuses to columns. The canonical format uses hyphens.
 *
 * @see specs/4.5-status-constants.md
 */

/**
 * Canonical issue status values.
 *
 * These values must match:
 * - Default board column statusMappings in create-board-dialog.tsx
 * - Issue status values stored in the database
 * - Test fixtures and assertions
 */
export const ISSUE_STATUSES = {
  BACKLOG: 'backlog',
  IN_PROGRESS: 'in-progress',
  DONE: 'done',
} as const;

/**
 * Type representing valid issue status values.
 *
 * Usage:
 * ```typescript
 * import { ISSUE_STATUSES, type IssueStatus } from '@/lib/constants/statuses';
 *
 * const status: IssueStatus = ISSUE_STATUSES.IN_PROGRESS;
 * ```
 */
export type IssueStatus = (typeof ISSUE_STATUSES)[keyof typeof ISSUE_STATUSES];

/**
 * Array of all valid status values.
 * Useful for validation and iteration.
 */
export const ALL_ISSUE_STATUSES = Object.values(ISSUE_STATUSES);

/**
 * Human-readable labels for status values.
 * Derived from ISSUE_STATUSES to ensure synchronization.
 */
export const STATUS_LABELS: Record<IssueStatus, string> = {
  [ISSUE_STATUSES.BACKLOG]: 'Backlog',
  [ISSUE_STATUSES.IN_PROGRESS]: 'In Progress',
  [ISSUE_STATUSES.DONE]: 'Done',
};

export const FILTER_ALL = 'all' as const;
