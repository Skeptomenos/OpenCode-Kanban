/**
 * Query Key Factory
 * @see specs/358-code-quality.md:L36
 *
 * Centralized query key definitions for TanStack Query.
 * Using a factory pattern ensures:
 * - Type-safe query keys
 * - Consistent cache invalidation
 * - Easy refactoring
 *
 * Pattern: https://tkdodo.eu/blog/effective-react-query-keys
 */

/**
 * Filter criteria for the board view.
 */
export interface BoardFilters {
  status?: string | null;
}

/**
 * Query keys for all data fetching operations.
 * Use these instead of ad-hoc string arrays throughout the codebase.
 */
export const queryKeys = {
  /**
   * Projects list query key.
   * Used by: useProjects hook
   */
  projects: ['projects'] as const,

  /**
   * Kanban board data query key factory.
   * Includes projectId and boardId for proper cache scoping.
   * Used by: KanbanBoard, NewTaskDialog, useColumnMutations
   *
   * @param projectId - Optional project ID filter
   * @param boardId - Optional board ID filter
   * @param filters - Optional board filters (status, etc.)
   */
  kanban: (projectId?: string, boardId?: string, filters?: BoardFilters) =>
    ['kanban', projectId, boardId, filters] as const,

  /**
   * Breadcrumb project name query key factory.
   * Used by: useBreadcrumbData hook
   *
   * @param projectId - Project ID to fetch name for
   */
  breadcrumbProject: (projectId: string) =>
    ['breadcrumb-project', projectId] as const,

  /**
   * Breadcrumb board name query key factory.
   * Used by: useBreadcrumbData hook
   *
   * @param boardId - Board ID to fetch name for
   */
  breadcrumbBoard: (boardId: string) =>
    ['breadcrumb-board', boardId] as const,

  /**
   * Boards list query key factory.
   * Supports optional parentId filtering for project-scoped boards.
   * Used by: useBoards hook, useBoardMutations
   *
   * @param parentId - Optional project ID to filter boards by
   */
  boards: (parentId?: string) =>
    parentId ? (['boards', { parentId }] as const) : (['boards'] as const),

  /**
   * Sessions list query key.
   * Used by: useSessions hook
   *
   * @see ralph-wiggum/specs/4.10-link-session-ui.md
   */
  sessions: ['sessions'] as const,

  /**
   * Issue session links query key factory.
   * Used by: useSessionLinks hook
   *
   * @param issueId - Issue ID to get linked sessions for
   */
  issueSessionLinks: (issueId: string) =>
    ['issue-session-links', issueId] as const,
} as const;

/**
 * Type-safe query key types for external use.
 */
export type ProjectsQueryKey = typeof queryKeys.projects;
export type KanbanQueryKey = ReturnType<typeof queryKeys.kanban>;
export type BoardsQueryKey = ReturnType<typeof queryKeys.boards>;
