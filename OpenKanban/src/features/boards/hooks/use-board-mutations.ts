'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createBoard,
  updateBoard,
  deleteBoard,
  ApiError,
} from '@/features/kanban/api';
import type {
  CreateBoardInput,
  UpdateBoardInput,
  BoardWithIssues,
} from '@/features/kanban/api';

/**
 * Hook for creating a new board.
 * @see specs/4.2-frontend-state.md:L32
 *
 * Invalidates all boards queries on success to ensure cache consistency.
 */
export function useCreateBoard() {
  const queryClient = useQueryClient();

  return useMutation<BoardWithIssues, ApiError, CreateBoardInput>({
    mutationFn: createBoard,
    onSuccess: () => {
      // Invalidate all boards queries (broad invalidation is safer)
      // @see specs/4.2-frontend-state.md:L35
      queryClient.invalidateQueries({ queryKey: ['boards'] });
    },
  });
}

/**
 * Hook for updating an existing board.
 * @see specs/4.2-frontend-state.md:L33
 *
 * Invalidates all boards queries on success.
 */
export function useUpdateBoard() {
  const queryClient = useQueryClient();

  return useMutation<
    BoardWithIssues,
    ApiError,
    { id: string; input: UpdateBoardInput }
  >({
    mutationFn: ({ id, input }) => updateBoard(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boards'] });
    },
  });
}

/**
 * Hook for deleting a board.
 * @see specs/4.2-frontend-state.md:L34
 *
 * Invalidates all boards queries on success.
 */
export function useDeleteBoard() {
  const queryClient = useQueryClient();

  return useMutation<{ id: string }, ApiError, string>({
    mutationFn: deleteBoard,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boards'] });
    },
  });
}
