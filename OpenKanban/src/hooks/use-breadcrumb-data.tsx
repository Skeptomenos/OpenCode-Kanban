'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchIssue, fetchBoard } from '@/features/kanban/api';
import { queryKeys } from '@/lib/query-keys';

export function useBreadcrumbData(projectId?: string, boardId?: string) {
  const projectQuery = useQuery({
    queryKey: projectId ? queryKeys.breadcrumbProject(projectId) : ['breadcrumb-project', 'idle'],
    queryFn: () => fetchIssue(projectId!),
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const boardQuery = useQuery({
    queryKey: boardId ? queryKeys.breadcrumbBoard(boardId) : ['breadcrumb-board', 'idle'],
    queryFn: () => fetchBoard(boardId!),
    enabled: !!boardId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: false,
  });

  return {
    projectName: projectQuery.data?.title ?? undefined,
    boardName: boardQuery.data?.name ?? undefined,
    isLoading: (!!projectId && projectQuery.isLoading) || (!!boardId && boardQuery.isLoading),
    isError: projectQuery.isError || boardQuery.isError
  };
}
