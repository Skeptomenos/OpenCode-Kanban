/**
 * Kanban Feature API Layer
 * @see specs/352-frontend-modernization.md:L19-25
 *
 * Typed fetchers for kanban feature. Isolates HTTP logic from components/store.
 * CRITICAL: Uses Schema.strip().parse() to strip unknown fields before sending
 * to prevent 400 errors from strict backend schemas.
 */

import {
  CreateIssueSchema,
  UpdateIssueSchema,
  CreateBoardSchema,
  UpdateBoardSchema,
} from '@/contract/pm/schemas';
import type { Issue } from '@/lib/db/schema';
import type { CreateIssueInput, UpdateIssueInput } from '@/lib/db/repository';

// Re-export for consumers that import from this module
export type { CreateIssueInput, UpdateIssueInput };

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
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly status?: number
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// =============================================================================
// Fetchers
// =============================================================================

/**
 * Fetch issues with optional filters.
 * @param filters Optional filter parameters
 * @returns Array of Issue objects
 * @throws ApiError if the request fails
 */
export async function fetchIssues(filters?: {
  parentId?: string | null;
  type?: string;
  status?: string;
}): Promise<Issue[]> {
  const params = new URLSearchParams();

  if (filters?.parentId !== undefined) {
    params.set('parentId', filters.parentId ?? 'null');
  }
  if (filters?.type) {
    params.set('type', filters.type);
  }
  if (filters?.status) {
    params.set('status', filters.status);
  }

  const queryString = params.toString();
  const url = queryString ? `/api/issues?${queryString}` : '/api/issues';

  const response = await fetch(url);
  const result: ApiResponse<Issue[]> = await response.json();

  if (!result.success) {
    throw new ApiError(
      result.error.message,
      result.error.code,
      response.status
    );
  }

  return result.data;
}

/**
 * Create a new issue.
 * Uses Schema.strip().parse() to strip unknown fields before sending.
 * @param input Issue creation input
 * @returns The created Issue
 * @throws ApiError if the request fails
 */
export async function createIssue(input: CreateIssueInput): Promise<Issue> {
  // CRITICAL: Strip unknown fields to prevent 400 errors from strict backend
  // @see specs/352-frontend-modernization.md:L25
  const sanitizedInput = CreateIssueSchema.strip().parse(input);

  const response = await fetch('/api/issues', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(sanitizedInput),
  });

  const result: ApiResponse<Issue> = await response.json();

  if (!result.success) {
    throw new ApiError(
      result.error.message,
      result.error.code,
      response.status
    );
  }

  return result.data;
}

/**
 * Update an existing issue.
 * Uses Schema.strip().parse() to strip unknown fields before sending.
 * @param id Issue ID to update
 * @param input Partial issue update input
 * @returns The updated Issue
 * @throws ApiError if the request fails
 */
export async function updateIssue(
  id: string,
  input: UpdateIssueInput
): Promise<Issue> {
  // CRITICAL: Strip unknown fields to prevent 400 errors from strict backend
  // @see specs/352-frontend-modernization.md:L25
  const sanitizedInput = UpdateIssueSchema.strip().parse(input);

  const response = await fetch(`/api/issues/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(sanitizedInput),
  });

  const result: ApiResponse<Issue> = await response.json();

  if (!result.success) {
    throw new ApiError(
      result.error.message,
      result.error.code,
      response.status
    );
  }

  return result.data;
}

/**
 * Delete an issue by ID.
 * @param id Issue ID to delete
 * @returns The deleted issue ID
 * @throws ApiError if the request fails
 */
export async function deleteIssue(id: string): Promise<{ id: string }> {
  const response = await fetch(`/api/issues/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });

  const result: ApiResponse<{ id: string }> = await response.json();

  if (!result.success) {
    throw new ApiError(
      result.error.message,
      result.error.code,
      response.status
    );
  }

  return result.data;
}

/**
 * Fetch a single issue by ID.
 * @param id Issue ID to fetch
 * @returns The Issue or null if not found
 * @throws ApiError if the request fails (except 404)
 */
export async function fetchIssue(id: string): Promise<Issue | null> {
  const response = await fetch(`/api/issues/${encodeURIComponent(id)}`);

  if (response.status === 404) {
    return null;
  }

  const result: ApiResponse<Issue> = await response.json();

  if (!result.success) {
    throw new ApiError(
      result.error.message,
      result.error.code,
      response.status
    );
  }

  return result.data;
}

// =============================================================================
// Board Fetchers
// =============================================================================

/**
 * Board list item type (minimal).
 */
export type BoardListItem = {
  id: string;
  name: string;
};

/**
 * Board with full details including column config and issues.
 */
export type BoardWithIssues = {
  id: string;
  name: string;
  columnConfig: Array<{
    id: string;
    title: string;
    statusMappings: string[];
  }>;
  issues: Issue[];
};

/**
 * Fetch all boards (list view).
 * @returns Array of BoardListItem
 * @throws ApiError if the request fails
 */
export async function fetchBoards(): Promise<BoardListItem[]> {
  const response = await fetch('/api/boards');
  const result: ApiResponse<BoardListItem[]> = await response.json();

  if (!result.success) {
    throw new ApiError(
      result.error.message,
      result.error.code,
      response.status
    );
  }

  return result.data;
}

/**
 * Fetch a single board by ID with its column config and issues.
 * @param id Board ID to fetch
 * @returns The board with issues
 * @throws ApiError if the request fails
 */
export async function fetchBoard(id: string): Promise<BoardWithIssues> {
  const response = await fetch(`/api/boards/${encodeURIComponent(id)}`);
  const result: ApiResponse<BoardWithIssues> = await response.json();

  if (!result.success) {
    throw new ApiError(
      result.error.message,
      result.error.code,
      response.status
    );
  }

  return result.data;
}

/**
 * Input for creating a new board via the API.
 */
export type CreateBoardInput = {
  name: string;
  columnConfig?: Array<{
    id: string;
    title: string;
    statusMappings: string[];
  }>;
};

/**
 * Create a new board.
 * Uses Schema.strip().parse() to strip unknown fields before sending.
 * @param data Board creation data
 * @returns The created board
 * @throws ApiError if validation fails or the request fails
 */
export async function createBoard(
  data: CreateBoardInput
): Promise<BoardWithIssues> {
  // CRITICAL: Strip unknown fields to prevent 400 errors from strict backend
  // @see specs/354-service-completion.md:L56-59
  let sanitizedInput: CreateBoardInput;
  try {
    sanitizedInput = CreateBoardSchema.strip().parse(data);
  } catch (error) {
    throw new ApiError(
      'Invalid board data: ' + (error instanceof Error ? error.message : 'validation failed'),
      'VALIDATION_ERROR'
    );
  }

  const response = await fetch('/api/boards', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(sanitizedInput),
  });

  const result: ApiResponse<BoardWithIssues> = await response.json();

  if (!result.success) {
    throw new ApiError(
      result.error.message,
      result.error.code,
      response.status
    );
  }

  return result.data;
}

/**
 * Input for updating an existing board via the API.
 */
export type UpdateBoardInput = {
  name?: string;
  columnConfig?: Array<{
    id: string;
    title: string;
    statusMappings: string[];
  }>;
};

/**
 * Update an existing board.
 * Uses Schema.strip().parse() to strip unknown fields before sending.
 * @param id Board ID to update
 * @param input Partial board update input
 * @returns The updated board
 * @throws ApiError if validation fails or the request fails
 */
export async function updateBoard(
  id: string,
  input: UpdateBoardInput
): Promise<BoardWithIssues> {
  // CRITICAL: Strip unknown fields to prevent 400 errors from strict backend
  // @see specs/354-service-completion.md:L56-59
  let sanitizedInput: UpdateBoardInput;
  try {
    sanitizedInput = UpdateBoardSchema.strip().parse(input);
  } catch (error) {
    throw new ApiError(
      'Invalid board data: ' + (error instanceof Error ? error.message : 'validation failed'),
      'VALIDATION_ERROR'
    );
  }

  const response = await fetch(`/api/boards/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(sanitizedInput),
  });

  const result: ApiResponse<BoardWithIssues> = await response.json();

  if (!result.success) {
    throw new ApiError(
      result.error.message,
      result.error.code,
      response.status
    );
  }

  return result.data;
}
