/**
 * PM Repository Layer
 * @see specs/02-repository.md
 * @see specs/SCHEMA.md:L209-260 (TypeScript types)
 *
 * Implements the storage engine for OpenKanban's PM data layer.
 * Uses Drizzle ORM with SQLite for persistence.
 */

import type { Issue, Board, IssueSession } from './schema';

// =============================================================================
// Input Types
// =============================================================================

/**
 * Input for creating a new Issue.
 * @see specs/SCHEMA.md:L209-216
 */
export type CreateIssueInput = {
  type: string;
  parentId?: string | null;
  title: string;
  description?: string | null;
  status?: string;
  metadata?: Record<string, unknown>;
};

/**
 * Input for updating an existing Issue.
 * @see specs/SCHEMA.md:L218
 */
export type UpdateIssueInput = Partial<Omit<CreateIssueInput, 'type'>>;

/**
 * Filter criteria for listing Issues.
 * @see specs/SCHEMA.md:L220-226
 */
export type IssueFilter = {
  types?: string[];
  statuses?: string[];
  parentId?: string | null;
  labelIds?: string[];
};

/**
 * Input for creating a new Board.
 * @see specs/SCHEMA.md:L253-257
 */
export type CreateBoardInput = {
  name: string;
  filters?: BoardFilters;
  columnConfig?: ColumnConfig[];
};

/**
 * Input for updating an existing Board.
 * @see specs/SCHEMA.md:L259
 */
export type UpdateBoardInput = Partial<CreateBoardInput>;

/**
 * Filter criteria stored on a Board.
 * @see specs/SCHEMA.md:L240-245
 */
export type BoardFilters = {
  types?: string[];
  statuses?: string[];
  parentId?: string;
  labelIds?: string[];
};

/**
 * Column configuration for a Board.
 * @see specs/SCHEMA.md:L247-251
 */
export type ColumnConfig = {
  id: string;
  title: string;
  statusMappings: string[];
};

// =============================================================================
// Output Types (Enriched)
// =============================================================================

/**
 * Issue with parsed metadata and relations.
 * @see specs/SCHEMA.md:L186-204
 */
export type IssueWithRelations = Issue & {
  metadata: Record<string, unknown>;
  sessionIds: string[];
  labelIds: string[];
  children?: Issue[];
};

/**
 * Board with parsed JSON fields.
 */
export type BoardWithParsedFields = Omit<Board, 'filters' | 'columnConfig'> & {
  filters: BoardFilters;
  columnConfig: ColumnConfig[];
};

// =============================================================================
// Repository Interface
// =============================================================================

/**
 * PM Repository Interface
 *
 * Defines the contract for the storage engine. All database operations
 * go through this interface, enabling:
 * - Easy testing with in-memory SQLite
 * - Potential future backend swaps
 * - Clear separation of concerns
 *
 * @see specs/02-repository.md:L13-26
 * @see specs/phase2-plan.md:L267-289
 */
export interface IPMRepository {
  // ---------------------------------------------------------------------------
  // Issues CRUD
  // ---------------------------------------------------------------------------

  /**
   * Create a new Issue.
   * Generates ID and timestamps automatically.
   */
  createIssue(data: CreateIssueInput): Issue;

  /**
   * Get a single Issue by ID.
   * Returns null if not found.
   */
  getIssue(id: string): Issue | null;

  /**
   * Get a single Issue with all relations (sessions, labels, children).
   * Returns null if not found.
   */
  getIssueWithRelations(id: string): IssueWithRelations | null;

  /**
   * List all Issues matching the optional filter.
   * Returns issues without relations for performance.
   */
  listIssues(filter?: IssueFilter): Issue[];

  /**
   * Update an existing Issue.
   * Throws if Issue not found.
   */
  updateIssue(id: string, data: UpdateIssueInput): Issue;

  /**
   * Delete an Issue by ID.
   * Cascades to children and session links.
   * Throws if Issue not found.
   */
  deleteIssue(id: string): void;

  // ---------------------------------------------------------------------------
  // Issue-Session Links
  // ---------------------------------------------------------------------------

  /**
   * Link an OpenCode session to an Issue.
   * @param issueId - The Issue ID
   * @param sessionId - The OpenCode session ID
   * @param linkType - Optional link type ('planning' | 'execution' | null)
   */
  linkSession(issueId: string, sessionId: string, linkType?: string | null): void;

  /**
   * Unlink an OpenCode session from an Issue.
   */
  unlinkSession(issueId: string, sessionId: string): void;

  /**
   * Get all session links for an Issue.
   */
  getSessionLinks(issueId: string): IssueSession[];

  // ---------------------------------------------------------------------------
  // Boards CRUD
  // ---------------------------------------------------------------------------

  /**
   * Create a new Board.
   * Generates ID and timestamps automatically.
   */
  createBoard(data: CreateBoardInput): BoardWithParsedFields;

  /**
   * Get a single Board by ID.
   * Returns null if not found.
   */
  getBoard(id: string): BoardWithParsedFields | null;

  /**
   * List all Boards.
   */
  listBoards(): BoardWithParsedFields[];

  /**
   * Update an existing Board.
   * Throws if Board not found.
   */
  updateBoard(id: string, data: UpdateBoardInput): BoardWithParsedFields;

  /**
   * Delete a Board by ID.
   * Throws if Board not found.
   */
  deleteBoard(id: string): void;

  // ---------------------------------------------------------------------------
  // Config (Key-Value Store)
  // ---------------------------------------------------------------------------

  /**
   * Get a config value by key.
   * Returns undefined if not found.
   */
  getConfig<T = unknown>(key: string): T | undefined;

  /**
   * Set a config value.
   * Creates or updates the key.
   */
  setConfig<T = unknown>(key: string, value: T): void;

  /**
   * Delete a config key.
   */
  deleteConfig(key: string): void;
}
