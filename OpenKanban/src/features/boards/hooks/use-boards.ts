'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchBoards, ApiError } from '@/features/kanban/api';
import type { BoardListItem } from '@/features/kanban/api';
import { queryKeys } from '@/lib/query-keys';

/**
 * Return type for useBoards hook.
 */
interface UseBoardsReturn {
  boards: BoardListItem[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Hook for fetching boards filtered by project ID.
 * @see specs/4.2-frontend-state.md:L28-30
 *
 * Uses TanStack Query with the boards query key factory.
 * Automatically refetches when projectId changes.
 *
 * @param projectId - The project ID to filter boards by
 * @returns Object with boards, loading state, error message, and refresh function
 */
export function useBoards(projectId: string): UseBoardsReturn {
  const query = useQuery({
    queryKey: queryKeys.boards(projectId),
    queryFn: () => fetchBoards({ parentId: projectId }),
    // Only fetch if we have a valid projectId
    enabled: Boolean(projectId),
  });

  const errorMessage = extractErrorMessage(query.error);

  return {
    boards: query.data ?? [],
    isLoading: query.isLoading,
    error: errorMessage,
    refresh: async () => {
      await query.refetch();
    },
  };
}

/**
 * Extract a user-friendly error message from query errors.
 */
function extractErrorMessage(error: unknown): string | null {
  if (!error) return null;
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return 'Failed to load boards';
}
