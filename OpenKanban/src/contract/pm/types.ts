import { z } from 'zod';
import {
  CreateIssueSchema,
  UpdateIssueSchema,
  IssueFilterSchema,
  CreateBoardSchema,
  UpdateBoardSchema,
  BoardFiltersSchema,
  ColumnConfigSchema,
  LinkSessionSchema,
  SetConfigSchema,
  MetadataSchema,
} from './schemas';

// =============================================================================
// Input Types (from Zod schemas)
// =============================================================================

export type CreateIssueInput = z.infer<typeof CreateIssueSchema>;
export type UpdateIssueInput = z.infer<typeof UpdateIssueSchema>;
export type IssueFilter = z.infer<typeof IssueFilterSchema>;

export type CreateBoardInput = z.infer<typeof CreateBoardSchema>;
export type UpdateBoardInput = z.infer<typeof UpdateBoardSchema>;
export type BoardFilters = z.infer<typeof BoardFiltersSchema>;
export type ColumnConfig = z.infer<typeof ColumnConfigSchema>;

export type LinkSessionInput = z.infer<typeof LinkSessionSchema>;
export type SetConfigInput = z.infer<typeof SetConfigSchema>;
export type Metadata = z.infer<typeof MetadataSchema>;

// =============================================================================
// API Response Types (canonical types for UI consumption)
// These match the actual API response shapes from the repository layer.
// @see specs/SCHEMA.md:L186-204
// =============================================================================

/**
 * Issue as returned from API endpoints.
 * Note: timestamps are Unix epoch numbers (from SQLite integer columns).
 */
export interface ApiIssue {
  id: string;
  type: string;
  parentId: string | null;
  title: string;
  description: string | null;
  status: string;
  metadata: Record<string, unknown>;
  createdAt: number;
  updatedAt: number;
  sessionIds: string[];
  labelIds: string[];
}

/**
 * Project is an Issue with type='project'.
 * Used by useProjects hook and project listing UI.
 */
export interface Project {
  id: string;
  title: string;
  description: string | null;
  status: string;
  createdAt: number;
  updatedAt: number;
}

/**
 * Board with parsed JSON fields and associated issues.
 * As returned from GET /api/boards/[id].
 */
export interface BoardWithIssues {
  id: string;
  name: string;
  filters: BoardFilters;
  columnConfig: ColumnConfig[];
  createdAt: number;
  updatedAt: number;
  issues: ApiIssue[];
}
