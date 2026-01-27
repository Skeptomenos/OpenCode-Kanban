'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { logger } from '@/lib/logger';
import type { Project } from '@/contract/pm/types';

class ProjectApiError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly status?: number
  ) {
    super(message);
    this.name = 'ProjectApiError';
  }
}

type ApiSuccessResponse<T> = {
  success: true;
  data: T;
};

type ApiErrorResponse = {
  success: false;
  error: {
    message: string;
    code?: string;
  };
};

type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

interface UpdateProjectInput {
  title?: string;
  description?: string | null;
}

interface UpdateProjectMutationInput {
  id: string;
  input: UpdateProjectInput;
}

async function updateProject(id: string, input: UpdateProjectInput): Promise<Project> {
  let response: Response;
  try {
    response = await fetch(`/api/issues/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
  } catch {
    throw new ProjectApiError('Network error: Failed to connect to server', 'NETWORK_ERROR');
  }

  let result: ApiResponse<Project>;
  try {
    result = await response.json();
  } catch {
    throw new ProjectApiError('Invalid response from server', 'PARSE_ERROR', response.status);
  }

  if (!result.success) {
    throw new ProjectApiError(
      result.error.message,
      result.error.code,
      response.status
    );
  }

  return result.data;
}

async function deleteProject(id: string): Promise<{ id: string }> {
  let response: Response;
  try {
    response = await fetch(`/api/issues/${id}`, {
      method: 'DELETE',
    });
  } catch {
    throw new ProjectApiError('Network error: Failed to connect to server', 'NETWORK_ERROR');
  }

  let result: ApiResponse<{ id: string }>;
  try {
    result = await response.json();
  } catch {
    throw new ProjectApiError('Invalid response from server', 'PARSE_ERROR', response.status);
  }

  if (!result.success) {
    throw new ProjectApiError(
      result.error.message,
      result.error.code,
      response.status
    );
  }

  return result.data;
}

/** @see specs/5.1-sidebar-overhaul.md:L33-43 */
export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation<Project, ProjectApiError, UpdateProjectMutationInput, { previousProjects: Project[] | undefined }>({
    mutationFn: ({ id, input }) => updateProject(id, input),
    onMutate: async ({ id, input }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.projects });
      const previousProjects = queryClient.getQueryData<Project[]>(queryKeys.projects);
      
      if (previousProjects) {
        queryClient.setQueryData<Project[]>(queryKeys.projects, (old) =>
          old?.map((project) =>
            project.id === id
              ? { ...project, ...input, updatedAt: Date.now() }
              : project
          )
        );
      }
      
      return { previousProjects };
    },
    onError: (err, _vars, context) => {
      logger.error('Failed to update project', { error: String(err) });
      if (context?.previousProjects) {
        queryClient.setQueryData(queryKeys.projects, context.previousProjects);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.projects });
    },
  });
}

interface DeleteProjectMutationInput {
  projectId: string;
}

/** @see specs/5.1-sidebar-overhaul.md:L33-43 */
export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation<{ id: string }, ProjectApiError, DeleteProjectMutationInput, { previousProjects: Project[] | undefined }>({
    mutationFn: ({ projectId }) => deleteProject(projectId),
    onMutate: async ({ projectId }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.projects });
      const previousProjects = queryClient.getQueryData<Project[]>(queryKeys.projects);
      
      if (previousProjects) {
        queryClient.setQueryData<Project[]>(queryKeys.projects, (old) =>
          old?.filter((project) => project.id !== projectId)
        );
      }
      
      return { previousProjects };
    },
    onError: (err, _vars, context) => {
      logger.error('Failed to delete project', { error: String(err) });
      if (context?.previousProjects) {
        queryClient.setQueryData(queryKeys.projects, context.previousProjects);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.projects });
    },
  });
}
