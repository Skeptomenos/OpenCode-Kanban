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
import { queryKeys } from '@/lib/query-keys';

interface CreateBoardMutationInput {
  data: CreateBoardInput;
  parentId: string;
}

/**
 * Hook for creating a new board.
 * @see specs/4.2-frontend-state.md:L32
 *
 * Uses scoped cache invalidation based on parentId to avoid
 * unnecessary refetches for other projects.
 * @see docs/PHASE-4-ISSUES.md:M-09
 */
export function useCreateBoard() {
  const queryClient = useQueryClient();

  return useMutation<BoardWithIssues, ApiError, CreateBoardMutationInput>({
    mutationFn: ({ data }) => createBoard(data),
    onSuccess: (_data, { parentId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.boards(parentId) });
    },
  });
}

interface UpdateBoardMutationInput {
  id: string;
  input: UpdateBoardInput;
  parentId: string;
}

/**
 * Hook for updating an existing board.
 * @see specs/4.2-frontend-state.md:L33
 */
export function useUpdateBoard() {
  const queryClient = useQueryClient();

  return useMutation<BoardWithIssues, ApiError, UpdateBoardMutationInput>({
    mutationFn: ({ id, input }) => updateBoard(id, input),
    onSuccess: (_data, { id, parentId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.boards(parentId) });
      queryClient.invalidateQueries({ queryKey: ['board', id] });
    },
  });
}

interface DeleteBoardMutationInput {
  boardId: string;
  parentId: string;
}

/**
 * Hook for deleting a board.
 * @see specs/4.2-frontend-state.md:L34
 */
export function useDeleteBoard() {
  const queryClient = useQueryClient();

  return useMutation<{ id: string }, ApiError, DeleteBoardMutationInput>({
    mutationFn: ({ boardId }) => deleteBoard(boardId),
    onSuccess: (_data, { parentId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.boards(parentId) });
    },
  });
}
