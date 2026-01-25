/**
 * PM Repository Layer
 * @see specs/02-repository.md
 * @see specs/SCHEMA.md:L209-260 (TypeScript types)
 *
 * Implements the storage engine for OpenKanban's PM data layer.
 * Uses Drizzle ORM with SQLite for persistence.
 */

import { eq, and, inArray, isNull } from 'drizzle-orm';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import type { Issue, Board, IssueSession } from './schema';
import * as schema from './schema';

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
export type IssueWithRelations = Omit<Issue, 'metadata'> & {
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

// =============================================================================
// SQLite Implementation
// =============================================================================

/**
 * Generate a unique ID for database entities.
 * Uses a combination of timestamp and random bytes for uniqueness.
 */
function generateId(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 10);
  return `${timestamp}-${randomPart}`;
}

/**
 * SQLite implementation of IPMRepository using Drizzle ORM.
 * @see specs/02-repository.md:L46-48
 */
export class SqlitePMRepository implements IPMRepository {
  constructor(private readonly db: BetterSQLite3Database<typeof schema>) {}

  // ---------------------------------------------------------------------------
  // Issues CRUD
  // ---------------------------------------------------------------------------

  createIssue(data: CreateIssueInput): Issue {
    const now = Date.now();
    const id = generateId();

    const newIssue: schema.NewIssue = {
      id,
      type: data.type,
      parentId: data.parentId ?? null,
      title: data.title,
      description: data.description ?? null,
      status: data.status ?? 'backlog',
      metadata: data.metadata ? JSON.stringify(data.metadata) : null,
      createdAt: now,
      updatedAt: now,
    };

    this.db.insert(schema.issues).values(newIssue).run();

    return this.getIssue(id)!;
  }

  getIssue(id: string): Issue | null {
    const result = this.db
      .select()
      .from(schema.issues)
      .where(eq(schema.issues.id, id))
      .get();

    return result ?? null;
  }

  getIssueWithRelations(id: string): IssueWithRelations | null {
    const issue = this.getIssue(id);
    if (!issue) return null;

    const sessionLinks = this.getSessionLinks(id);
    const sessionIds = sessionLinks.map((s) => s.sessionId);

    const labelLinks = this.db
      .select()
      .from(schema.issueLabels)
      .where(eq(schema.issueLabels.issueId, id))
      .all();
    const labelIds = labelLinks.map((l) => l.labelId);

    let metadata: Record<string, unknown> = {};
    if (issue.metadata) {
      try {
        metadata = JSON.parse(issue.metadata);
      } catch {
        metadata = {};
      }
    }

    return {
      ...issue,
      metadata,
      sessionIds,
      labelIds,
    };
  }

  listIssues(filter?: IssueFilter): Issue[] {
    let query = this.db.select().from(schema.issues);

    if (filter) {
      const conditions = [];

      if (filter.types && filter.types.length > 0) {
        conditions.push(inArray(schema.issues.type, filter.types));
      }

      if (filter.statuses && filter.statuses.length > 0) {
        conditions.push(inArray(schema.issues.status, filter.statuses));
      }

      if (filter.parentId !== undefined) {
        if (filter.parentId === null) {
          conditions.push(isNull(schema.issues.parentId));
        } else {
          conditions.push(eq(schema.issues.parentId, filter.parentId));
        }
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as typeof query;
      }
    }

    return query.all();
  }

  updateIssue(id: string, data: UpdateIssueInput): Issue {
    const existing = this.getIssue(id);
    if (!existing) {
      throw new Error(`Issue with id "${id}" not found`);
    }

    const now = Math.max(Date.now(), existing.updatedAt + 1);
    const updateData: Partial<schema.NewIssue> = {
      updatedAt: now,
    };

    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.parentId !== undefined) updateData.parentId = data.parentId;
    if (data.metadata !== undefined) {
      updateData.metadata = JSON.stringify(data.metadata);
    }

    this.db
      .update(schema.issues)
      .set(updateData)
      .where(eq(schema.issues.id, id))
      .run();

    return this.getIssue(id)!;
  }

  deleteIssue(id: string): void {
    const existing = this.getIssue(id);
    if (!existing) {
      throw new Error(`Issue with id "${id}" not found`);
    }

    this.db.delete(schema.issues).where(eq(schema.issues.id, id)).run();
  }

  // ---------------------------------------------------------------------------
  // Issue-Session Links
  // ---------------------------------------------------------------------------

  linkSession(issueId: string, sessionId: string, linkType?: string | null): void {
    const now = Date.now();

    const newLink: schema.NewIssueSession = {
      issueId,
      sessionId,
      linkType: linkType ?? null,
      createdAt: now,
    };

    this.db.insert(schema.issueSessions).values(newLink).run();
  }

  unlinkSession(issueId: string, sessionId: string): void {
    this.db
      .delete(schema.issueSessions)
      .where(
        and(
          eq(schema.issueSessions.issueId, issueId),
          eq(schema.issueSessions.sessionId, sessionId)
        )
      )
      .run();
  }

  getSessionLinks(issueId: string): IssueSession[] {
    return this.db
      .select()
      .from(schema.issueSessions)
      .where(eq(schema.issueSessions.issueId, issueId))
      .all();
  }

  // ---------------------------------------------------------------------------
  // Boards CRUD
  // ---------------------------------------------------------------------------

  createBoard(data: CreateBoardInput): BoardWithParsedFields {
    const now = Date.now();
    const id = generateId();

    const newBoard: schema.NewBoard = {
      id,
      name: data.name,
      filters: JSON.stringify(data.filters ?? {}),
      columnConfig: JSON.stringify(data.columnConfig ?? []),
      createdAt: now,
      updatedAt: now,
    };

    this.db.insert(schema.boards).values(newBoard).run();

    return this.getBoard(id)!;
  }

  getBoard(id: string): BoardWithParsedFields | null {
    const result = this.db
      .select()
      .from(schema.boards)
      .where(eq(schema.boards.id, id))
      .get();

    if (!result) return null;

    return this.parseBoardFields(result);
  }

  listBoards(): BoardWithParsedFields[] {
    const results = this.db.select().from(schema.boards).all();
    return results.map((b) => this.parseBoardFields(b));
  }

  updateBoard(id: string, data: UpdateBoardInput): BoardWithParsedFields {
    const existing = this.getBoard(id);
    if (!existing) {
      throw new Error(`Board with id "${id}" not found`);
    }

    const now = Math.max(Date.now(), existing.updatedAt + 1);
    const updateData: Partial<schema.NewBoard> = {
      updatedAt: now,
    };

    if (data.name !== undefined) updateData.name = data.name;
    if (data.filters !== undefined) updateData.filters = JSON.stringify(data.filters);
    if (data.columnConfig !== undefined) {
      updateData.columnConfig = JSON.stringify(data.columnConfig);
    }

    this.db
      .update(schema.boards)
      .set(updateData)
      .where(eq(schema.boards.id, id))
      .run();

    return this.getBoard(id)!;
  }

  deleteBoard(id: string): void {
    const existing = this.getBoard(id);
    if (!existing) {
      throw new Error(`Board with id "${id}" not found`);
    }

    this.db.delete(schema.boards).where(eq(schema.boards.id, id)).run();
  }

  // ---------------------------------------------------------------------------
  // Config (Key-Value Store)
  // ---------------------------------------------------------------------------

  getConfig<T = unknown>(key: string): T | undefined {
    const result = this.db
      .select()
      .from(schema.config)
      .where(eq(schema.config.key, key))
      .get();

    if (!result) return undefined;

    try {
      return JSON.parse(result.value) as T;
    } catch {
      return undefined;
    }
  }

  setConfig<T = unknown>(key: string, value: T): void {
    const jsonValue = JSON.stringify(value);

    this.db
      .insert(schema.config)
      .values({ key, value: jsonValue })
      .onConflictDoUpdate({
        target: schema.config.key,
        set: { value: jsonValue },
      })
      .run();
  }

  deleteConfig(key: string): void {
    this.db.delete(schema.config).where(eq(schema.config.key, key)).run();
  }

  // ---------------------------------------------------------------------------
  // Private Helpers
  // ---------------------------------------------------------------------------

  private parseBoardFields(board: Board): BoardWithParsedFields {
    let filters: BoardFilters = {};
    let columnConfig: ColumnConfig[] = [];

    try {
      filters = JSON.parse(board.filters);
    } catch {
      filters = {};
    }

    try {
      columnConfig = JSON.parse(board.columnConfig);
    } catch {
      columnConfig = [];
    }

    return {
      id: board.id,
      name: board.name,
      filters,
      columnConfig,
      createdAt: board.createdAt,
      updatedAt: board.updatedAt,
    };
  }
}
