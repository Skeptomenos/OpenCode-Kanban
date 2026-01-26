'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
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

export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation<Project, ProjectApiError, UpdateProjectMutationInput>({
    mutationFn: ({ id, input }) => updateProject(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects });
    },
  });
}

interface DeleteProjectMutationInput {
  projectId: string;
}

export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation<{ id: string }, ProjectApiError, DeleteProjectMutationInput>({
    mutationFn: ({ projectId }) => deleteProject(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects });
    },
  });
}
