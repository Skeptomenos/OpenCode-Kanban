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
  MoveIssueSchema,
} from '@/contract/pm/schemas';
import type { Issue } from '@/lib/db/schema';
import type { CreateIssueInput, UpdateIssueInput, ParentInfo } from '@/lib/db/repository';

/**
 * Issue with optional parent metadata for hierarchical display.
 * Extends the base Issue type with parent information from the backend.
 *
 * @see ralph-wiggum/specs/4.9-hierarchical-display.md
 */
export type IssueWithParent = Issue & {
  parent?: ParentInfo | null;
};

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
 * Returns issues with parent metadata for hierarchical display.
 * @param filters Optional filter parameters
 * @returns Array of Issue objects with optional parent info
 * @throws ApiError if the request fails
 */
export async function fetchIssues(filters?: {
  parentId?: string | null;
  type?: string;
  status?: string;
}): Promise<IssueWithParent[]> {
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

  let response: Response;
  try {
    response = await fetch(url);
  } catch {
    throw new ApiError('Network error: Failed to connect to server', 'NETWORK_ERROR');
  }

  let result: ApiResponse<IssueWithParent[]>;
  try {
    result = await response.json();
  } catch {
    throw new ApiError('Invalid response from server', 'PARSE_ERROR', response.status);
  }

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

  let response: Response;
  try {
    response = await fetch('/api/issues', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sanitizedInput),
    });
  } catch {
    throw new ApiError('Network error: Failed to connect to server', 'NETWORK_ERROR');
  }

  let result: ApiResponse<Issue>;
  try {
    result = await response.json();
  } catch {
    throw new ApiError('Invalid response from server', 'PARSE_ERROR', response.status);
  }

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

  let response: Response;
  try {
    response = await fetch(`/api/issues/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sanitizedInput),
    });
  } catch {
    throw new ApiError('Network error: Failed to connect to server', 'NETWORK_ERROR');
  }

  let result: ApiResponse<Issue>;
  try {
    result = await response.json();
  } catch {
    throw new ApiError('Invalid response from server', 'PARSE_ERROR', response.status);
  }

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
  let response: Response;
  try {
    response = await fetch(`/api/issues/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  } catch {
    throw new ApiError('Network error: Failed to connect to server', 'NETWORK_ERROR');
  }

  let result: ApiResponse<{ id: string }>;
  try {
    result = await response.json();
  } catch {
    throw new ApiError('Invalid response from server', 'PARSE_ERROR', response.status);
  }

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
  let response: Response;
  try {
    response = await fetch(`/api/issues/${encodeURIComponent(id)}`);
  } catch {
    throw new ApiError('Network error: Failed to connect to server', 'NETWORK_ERROR');
  }

  if (response.status === 404) {
    return null;
  }

  let result: ApiResponse<Issue>;
  try {
    result = await response.json();
  } catch {
    throw new ApiError('Invalid response from server', 'PARSE_ERROR', response.status);
  }

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
  issues: IssueWithParent[];
};

/**
 * Fetch boards with optional filtering.
 * @param filters Optional filter parameters
 * @returns Array of BoardListItem
 * @throws ApiError if the request fails
 */
export async function fetchBoards(filters?: {
  parentId?: string;
}): Promise<BoardListItem[]> {
  const params = new URLSearchParams();

  if (filters?.parentId) {
    params.set('parentId', filters.parentId);
  }

  const queryString = params.toString();
  const url = queryString ? `/api/boards?${queryString}` : '/api/boards';

  let response: Response;
  try {
    response = await fetch(url);
  } catch {
    throw new ApiError('Network error: Failed to connect to server', 'NETWORK_ERROR');
  }

  let result: ApiResponse<BoardListItem[]>;
  try {
    result = await response.json();
  } catch {
    throw new ApiError('Invalid response from server', 'PARSE_ERROR', response.status);
  }

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
  let response: Response;
  try {
    response = await fetch(`/api/boards/${encodeURIComponent(id)}`);
  } catch {
    throw new ApiError('Network error: Failed to connect to server', 'NETWORK_ERROR');
  }

  let result: ApiResponse<BoardWithIssues>;
  try {
    result = await response.json();
  } catch {
    throw new ApiError('Invalid response from server', 'PARSE_ERROR', response.status);
  }

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
 * @see specs/4.2-frontend-state.md:L13-14
 */
export type CreateBoardInput = {
  name: string;
  filters?: {
    types?: string[];
    statuses?: string[];
    parentId?: string | null;
    labelIds?: string[];
  };
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

  let response: Response;
  try {
    response = await fetch('/api/boards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sanitizedInput),
    });
  } catch {
    throw new ApiError('Network error: Failed to connect to server', 'NETWORK_ERROR');
  }

  let result: ApiResponse<BoardWithIssues>;
  try {
    result = await response.json();
  } catch {
    throw new ApiError('Invalid response from server', 'PARSE_ERROR', response.status);
  }

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

  let response: Response;
  try {
    response = await fetch(`/api/boards/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sanitizedInput),
    });
  } catch {
    throw new ApiError('Network error: Failed to connect to server', 'NETWORK_ERROR');
  }

  let result: ApiResponse<BoardWithIssues>;
  try {
    result = await response.json();
  } catch {
    throw new ApiError('Invalid response from server', 'PARSE_ERROR', response.status);
  }

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
 * Input for moving an issue (drag-drop reordering).
 * @see ralph-wiggum/specs/5.3-drag-persistence.md:L17-30
 */
export type MoveIssueInput = {
  status: string;
  prevIssueId: string | null;
  nextIssueId: string | null;
};

/**
 * Move an issue to a new position (drag-drop reordering).
 * Updates both status (column) and sortOrder (position within column).
 * Uses Schema.strip().parse() to strip unknown fields before sending.
 * 
 * @param id Issue ID to move
 * @param input Move parameters: target status and neighbor issue IDs
 * @returns The updated Issue
 * @throws ApiError if the request fails
 * @see ralph-wiggum/specs/5.3-drag-persistence.md:L17-30
 */
export async function moveIssue(
  id: string,
  input: MoveIssueInput
): Promise<Issue> {
  // CRITICAL: Strip unknown fields to prevent 400 errors from strict backend
  const sanitizedInput = MoveIssueSchema.strip().parse(input);

  let response: Response;
  try {
    response = await fetch(`/api/issues/${encodeURIComponent(id)}/move`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sanitizedInput),
    });
  } catch {
    throw new ApiError('Network error: Failed to connect to server', 'NETWORK_ERROR');
  }

  let result: ApiResponse<Issue>;
  try {
    result = await response.json();
  } catch {
    throw new ApiError('Invalid response from server', 'PARSE_ERROR', response.status);
  }

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
 * Delete a board by ID.
 * @see specs/4.2-frontend-state.md:L15-18
 * @param id Board ID to delete
 * @returns Object with deleted board id
 * @throws ApiError if the request fails
 */
export async function deleteBoard(id: string): Promise<{ id: string }> {
  let response: Response;
  try {
    response = await fetch(`/api/boards/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  } catch {
    throw new ApiError('Network error: Failed to connect to server', 'NETWORK_ERROR');
  }

  let result: ApiResponse<{ deleted: boolean }>;
  try {
    result = await response.json();
  } catch {
    throw new ApiError('Invalid response from server', 'PARSE_ERROR', response.status);
  }

  if (!result.success) {
    throw new ApiError(
      result.error.message,
      result.error.code,
      response.status
    );
  }

  return { id };
}
