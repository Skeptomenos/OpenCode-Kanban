/**
 * Default Board Configuration Constants
 * @see specs/4.3-ui-components.md:L16
 *
 * Centralized defaults for board creation.
 */

import { ISSUE_STATUSES } from './statuses';

/**
 * Default column configuration for new boards.
 * Creates a standard Kanban workflow: Backlog → In Progress → Done
 */
export const DEFAULT_COLUMN_CONFIG: { id: string; title: string; statusMappings: string[] }[] = [
  { id: ISSUE_STATUSES.BACKLOG, title: 'Backlog', statusMappings: [ISSUE_STATUSES.BACKLOG] },
  { id: ISSUE_STATUSES.IN_PROGRESS, title: 'In Progress', statusMappings: [ISSUE_STATUSES.IN_PROGRESS] },
  { id: ISSUE_STATUSES.DONE, title: 'Done', statusMappings: [ISSUE_STATUSES.DONE] },
];

export type ColumnConfig = (typeof DEFAULT_COLUMN_CONFIG)[number];
