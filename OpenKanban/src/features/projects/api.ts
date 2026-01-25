/**
 * Projects Feature API Layer
 * @see specs/356-tech-debt.md:L13-15
 *
 * Typed fetchers for projects feature. Isolates HTTP logic from components/hooks.
 * CRITICAL: Uses Schema.strip().parse() to strip unknown fields before sending
 * to prevent 400 errors from strict backend schemas.
 */

import { CreateIssueSchema, CreateBoardSchema } from '@/contract/pm/schemas';
import type { Project } from '@/contract/pm/types';
import type { CreateIssueInput } from '@/lib/db/repository';
import { logger } from '@/lib/logger';

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
  let response: Response;
  try {
    response = await fetch('/api/issues?type=project');
  } catch {
    throw new ProjectApiError('Network error: Failed to connect to server', 'NETWORK_ERROR');
  }

  let result: ApiResponse<Project[]>;
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

// =============================================================================
// Board Types (for project creation flow)
// =============================================================================

/**
 * Board filters used when creating a default board for a project.
 */
type BoardFilters = {
  types?: string[];
  statuses?: string[];
  parentId?: string | null;
  labelIds?: string[];
};

/**
 * Input for creating a board via the API.
 */
type CreateBoardInput = {
  name: string;
  filters?: BoardFilters;
  columnConfig?: Array<{
    id: string;
    title: string;
    statusMappings: string[];
  }>;
};

/**
 * Board data returned from the API.
 */
type BoardData = {
  id: string;
  name: string;
  filters?: BoardFilters | null;
  columnConfig?: Array<{
    id: string;
    title: string;
    statusMappings: string[];
  }> | null;
};

// =============================================================================
// Composite Operations
// =============================================================================

/**
 * Result of creating a project with its default board.
 */
export type CreateProjectWithBoardResult = {
  project: Project;
  board: BoardData;
};

/**
 * Create a new project with a default "Main Board".
 * 
 * This is an atomic operation that:
 * 1. Creates the project
 * 2. Creates a default board filtered to that project
 * 3. Rolls back the project if board creation fails
 * 
 * @param input Project creation input
 * @returns The created project and board
 * @throws ProjectApiError if any step fails
 */
export async function createProjectWithBoard(
  input: CreateProjectInput
): Promise<CreateProjectWithBoardResult> {
  const project = await createProject(input);
  
  const boardInput: CreateBoardInput = {
    name: 'Main Board',
    filters: { parentId: project.id, types: ['task'] },
  };

  let sanitizedBoardInput: CreateBoardInput;
  try {
    sanitizedBoardInput = CreateBoardSchema.strip().parse(boardInput);
  } catch (error) {
    const rollbackSuccess = await rollbackProject(project.id);
    if (!rollbackSuccess) {
      logger.warn('Orphaned project may exist after validation failure', { projectId: project.id });
    }
    throw new ProjectApiError(
      'Invalid board data: ' + (error instanceof Error ? error.message : 'validation failed'),
      'VALIDATION_ERROR'
    );
  }

  let boardResponse: Response;
  try {
    boardResponse = await fetch('/api/boards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sanitizedBoardInput),
    });
  } catch {
    const rollbackSuccess = await rollbackProject(project.id);
    if (!rollbackSuccess) {
      logger.warn('Orphaned project may exist after network failure', { projectId: project.id });
    }
    throw new ProjectApiError('Network error: Failed to connect to server', 'NETWORK_ERROR');
  }

  let boardResult: ApiResponse<BoardData>;
  try {
    boardResult = await boardResponse.json();
  } catch {
    const rollbackSuccess = await rollbackProject(project.id);
    if (!rollbackSuccess) {
      logger.warn('Orphaned project may exist after parse failure', { projectId: project.id });
    }
    throw new ProjectApiError('Invalid response from server', 'PARSE_ERROR', boardResponse.status);
  }

  if (!boardResult.success) {
    logger.warn('Board creation failed, rolling back project', {
      projectId: project.id,
      error: boardResult.error,
    });
    const rollbackSuccess = await rollbackProject(project.id);
    if (!rollbackSuccess) {
      logger.warn('Orphaned project may exist after board creation failure', { projectId: project.id });
    }
    throw new ProjectApiError(
      'Failed to initialize project board. Please try again.',
      boardResult.error.code,
      boardResponse.status
    );
  }

  return {
    project,
    board: boardResult.data,
  };
}

/**
 * Rollback a project creation by deleting the project.
 * Returns success/failure status for caller visibility.
 * Logs errors but doesn't throw (best-effort cleanup).
 * 
 * @param projectId - The ID of the project to delete
 * @returns true if rollback succeeded, false if it failed
 */
async function rollbackProject(projectId: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/issues/${projectId}`, { method: 'DELETE' });
    return response.ok;
  } catch (rollbackError) {
    logger.error('Failed to rollback project after board failure', {
      projectId,
      error: String(rollbackError),
    });
    return false;
  }
}

/**
 * Create a new project.
 * Uses Schema.strip().parse() to strip unknown fields before sending.
 */
export async function createProject(input: CreateProjectInput): Promise<Project> {
  const issueInput: CreateIssueInput = {
    type: 'project',
    title: input.title,
    description: input.description ?? null,
  };

  let sanitizedInput: CreateIssueInput;
  try {
    sanitizedInput = CreateIssueSchema.strip().parse(issueInput);
  } catch (error) {
    throw new ProjectApiError(
      'Invalid project data: ' + (error instanceof Error ? error.message : 'validation failed'),
      'VALIDATION_ERROR'
    );
  }

  let response: Response;
  try {
    response = await fetch('/api/issues', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sanitizedInput),
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
