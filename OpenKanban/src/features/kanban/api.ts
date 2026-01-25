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
} from '@/contract/pm/schemas';
import type { Issue } from '@/lib/db/schema';

// =============================================================================
// Types
// =============================================================================

/**
 * Input for creating a new issue via the API.
 * Mirrors CreateIssueSchema but as a TypeScript type.
 */
export type CreateIssueInput = {
  type: string;
  parentId?: string | null;
  title: string;
  description?: string | null;
  status?: string;
  metadata?: Record<string, unknown>;
};

/**
 * Input for updating an existing issue via the API.
 * Mirrors UpdateIssueSchema but as a TypeScript type.
 */
export type UpdateIssueInput = {
  parentId?: string | null;
  title?: string;
  description?: string | null;
  status?: string;
  metadata?: Record<string, unknown>;
};

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
