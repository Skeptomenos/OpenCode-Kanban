'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchProjects, ProjectApiError } from '../api';
import type { Project } from '@/contract/pm/types';
import { queryKeys } from '@/lib/query-keys';

interface UseProjectsReturn {
  projects: Project[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Hook for fetching and managing projects list.
 * @see specs/356-tech-debt.md:L18-20
 */
export function useProjects(): UseProjectsReturn {
  const query = useQuery({
    queryKey: queryKeys.projects,
    queryFn: fetchProjects,
  });

  const errorMessage = extractErrorMessage(query.error);

  return {
    projects: query.data ?? [],
    isLoading: query.isLoading,
    error: errorMessage,
    refresh: async () => {
      await query.refetch();
    },
  };
}

function extractErrorMessage(error: unknown): string | null {
  if (!error) return null;
  if (error instanceof ProjectApiError) return error.message;
  if (error instanceof Error) return error.message;
  return 'Failed to load projects';
}
