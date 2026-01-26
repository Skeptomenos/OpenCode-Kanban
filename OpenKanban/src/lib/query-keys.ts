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
   */
  kanban: (projectId?: string, boardId?: string) =>
    ['kanban', projectId, boardId] as const,

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
} as const;

/**
 * Type-safe query key types for external use.
 */
export type ProjectsQueryKey = typeof queryKeys.projects;
export type KanbanQueryKey = ReturnType<typeof queryKeys.kanban>;
