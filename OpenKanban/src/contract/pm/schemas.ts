/**
 * PM Data Layer Zod Schemas
 * @see specs/03-api-contracts.md:L9-14
 * @see specs/SCHEMA.md:L209-226 (TypeScript types reference)
 *
 * Provides validation schemas for API routes. Aligned with repository types.
 */

import { z } from 'zod';

// =============================================================================
// Primitives
// =============================================================================

/**
 * Metadata is a schemaless JSON object for type-specific data.
 * @see specs/SCHEMA.md:L345-374
 */
export const MetadataSchema = z.record(z.string(), z.unknown()).optional();

// =============================================================================
// Issue Schemas
// =============================================================================

/**
 * Schema for creating a new Issue.
 * @see specs/SCHEMA.md:L209-216
 */
export const CreateIssueSchema = z.object({
  type: z.string().min(1, 'Type is required'),
  parentId: z.string().nullable().optional(),
  title: z.string().min(1, 'Title is required'),
  description: z.string().nullable().optional(),
  status: z.string().optional(), // Defaults to 'backlog' in repository
  metadata: MetadataSchema,
});

/**
 * Schema for updating an existing Issue.
 * All fields optional except those that can't be changed (type).
 * @see specs/SCHEMA.md:L218
 */
export const UpdateIssueSchema = z.object({
  parentId: z.string().nullable().optional(),
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  status: z.string().optional(),
  metadata: MetadataSchema,
});

/**
 * Schema for filtering Issues in list queries.
 * @see specs/SCHEMA.md:L220-226
 */
export const IssueFilterSchema = z.object({
  types: z.array(z.string()).optional(),
  statuses: z.array(z.string()).optional(),
  parentId: z.string().nullable().optional(),
  labelIds: z.array(z.string()).optional(),
});

// =============================================================================
// Board Schemas
// =============================================================================

/**
 * Column configuration for a Board.
 * @see specs/SCHEMA.md:L247-251
 */
export const ColumnConfigSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  statusMappings: z.array(z.string()),
});

/**
 * Filter criteria stored on a Board.
 * @see specs/SCHEMA.md:L240-245
 */
export const BoardFiltersSchema = z.object({
  types: z.array(z.string()).optional(),
  statuses: z.array(z.string()).optional(),
  parentId: z.string().optional(),
  labelIds: z.array(z.string()).optional(),
});

/**
 * Schema for creating a new Board.
 * @see specs/SCHEMA.md:L253-257
 */
export const CreateBoardSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  filters: BoardFiltersSchema.optional(),
  columnConfig: z.array(ColumnConfigSchema).optional(),
});

/**
 * Schema for updating an existing Board.
 * @see specs/SCHEMA.md:L259
 */
export const UpdateBoardSchema = z.object({
  name: z.string().min(1).optional(),
  filters: BoardFiltersSchema.optional(),
  columnConfig: z.array(ColumnConfigSchema).optional(),
});

// =============================================================================
// Session Link Schemas
// =============================================================================

/**
 * Schema for linking a session to an issue.
 * @see specs/SCHEMA.md:L314-319
 */
export const LinkSessionSchema = z.object({
  sessionId: z.string().min(1, 'Session ID is required'),
  linkType: z.string().nullable().optional(),
});

// =============================================================================
// Config Schemas
// =============================================================================

/**
 * Schema for setting a config value.
 * Value can be any JSON-serializable data.
 */
export const SetConfigSchema = z.object({
  key: z.string().min(1, 'Key is required'),
  value: z.unknown(),
});

// =============================================================================
// API Response Schemas
// =============================================================================

/**
 * Standard API response envelope.
 * @see specs/SCHEMA.md:L287-291
 */
export const ApiSuccessSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.literal(true),
    data: dataSchema,
  });

export const ApiErrorSchema = z.object({
  success: z.literal(false),
  error: z.object({
    message: z.string(),
    code: z.string().optional(),
  }),
});
