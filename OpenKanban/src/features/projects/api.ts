/**
 * Projects Feature API Layer
 * @see specs/356-tech-debt.md:L13-15
 *
 * Typed fetchers for projects feature. Isolates HTTP logic from components/hooks.
 * CRITICAL: Uses Schema.strip().parse() to strip unknown fields before sending
 * to prevent 400 errors from strict backend schemas.
 */

import { CreateIssueSchema } from '@/contract/pm/schemas';
import type { Project } from '@/contract/pm/types';
import type { CreateIssueInput } from '@/lib/db/repository';

// =============================================================================
// Types
// =============================================================================

/**
 * API response envelope for success cases.
 */
type ApiSuccessResponse<T> = {
  success: true;
  data: T;
};

/**
 * API response envelope for error cases.
 */
type ApiErrorResponse = {
  success: false;
  error: {
    message: string;
    code?: string;
  };
};

/**
 * Union type for API responses.
 */
type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Error thrown when API calls fail.
 */
export class ProjectApiError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly status?: number
  ) {
    super(message);
    this.name = 'ProjectApiError';
  }
}

/**
 * Input for creating a new project.
 * Projects are Issues with type='project'.
 */
export type CreateProjectInput = {
  title: string;
  description?: string | null;
};

// =============================================================================
// Fetchers
// =============================================================================

/**
 * Fetch all projects (issues with type='project').
 * @returns Array of Project objects
 * @throws ProjectApiError if the request fails
 */
export async function fetchProjects(): Promise<Project[]> {
  const response = await fetch('/api/issues?type=project');
  const result: ApiResponse<Project[]> = await response.json();

  if (!result.success) {
    throw new ProjectApiError(
      result.error.message,
      result.error.code,
      response.status
    );
  }

  return result.data;
}

/**
 * Create a new project.
 * Uses Schema.strip().parse() to strip unknown fields before sending.
 * @param input Project creation input
 * @returns The created Project
 * @throws ProjectApiError if validation fails or the request fails
 */
export async function createProject(input: CreateProjectInput): Promise<Project> {
  // Build the full issue input with type='project'
  const issueInput: CreateIssueInput = {
    type: 'project',
    title: input.title,
    description: input.description ?? null,
  };

  // CRITICAL: Strip unknown fields to prevent 400 errors from strict backend
  // @see specs/356-tech-debt.md:L15
  let sanitizedInput: CreateIssueInput;
  try {
    sanitizedInput = CreateIssueSchema.strip().parse(issueInput);
  } catch (error) {
    throw new ProjectApiError(
      'Invalid project data: ' + (error instanceof Error ? error.message : 'validation failed'),
      'VALIDATION_ERROR'
    );
  }

  const response = await fetch('/api/issues', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(sanitizedInput),
  });

  const result: ApiResponse<Project> = await response.json();

  if (!result.success) {
    throw new ProjectApiError(
      result.error.message,
      result.error.code,
      response.status
    );
  }

  return result.data;
}
