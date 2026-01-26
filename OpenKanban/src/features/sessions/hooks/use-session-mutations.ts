'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { logger } from '@/lib/logger';
import type { SessionLink } from '../types';

/**
 * Parameters for linking a session to an issue.
 */
interface LinkSessionParams {
  issueId: string;
  sessionId: string;
  linkType?: string;
}

/**
 * Parameters for unlinking a session from an issue.
 */
interface UnlinkSessionParams {
  issueId: string;
  sessionId: string;
}

/**
 * API response shape from GET /api/issues/[id]/sessions.
 */
interface SessionLinksResponse {
  success: boolean;
  data: SessionLink[];
}

/**
 * Links a session to an issue via POST /api/issues/[id]/sessions.
 *
 * @param params - The issueId, sessionId, and optional linkType
 * @returns The API response
 * @throws Error if the request fails
 */
async function linkSession({ issueId, sessionId, linkType }: LinkSessionParams) {
  const response = await fetch(`/api/issues/${issueId}/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, linkType }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message ?? 'Failed to link session');
  }

  return response.json();
}

/**
 * Unlinks a session from an issue via DELETE /api/issues/[id]/sessions/[sessionId].
 *
 * @param params - The issueId and sessionId to unlink
 * @returns The API response
 * @throws Error if the request fails
 */
async function unlinkSession({ issueId, sessionId }: UnlinkSessionParams) {
  const response = await fetch(`/api/issues/${issueId}/sessions/${sessionId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message ?? 'Failed to unlink session');
  }

  return response.json();
}

/**
 * Hook for linking a session to an issue.
 *
 * Invalidates the issue session links cache on success.
 *
 * @see ralph-wiggum/specs/4.10-link-session-ui.md:L303-317
 * @returns TanStack mutation object
 */
export function useLinkSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: linkSession,
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.issueSessionLinks(variables.issueId),
      });
    },
    onError: (error) => {
      logger.error('Failed to link session', { error: String(error) });
    },
  });
}

/**
 * Hook for unlinking a session from an issue.
 *
 * Invalidates the issue session links cache on success.
 *
 * @see ralph-wiggum/specs/4.10-link-session-ui.md:L319-333
 * @returns TanStack mutation object
 */
export function useUnlinkSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: unlinkSession,
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.issueSessionLinks(variables.issueId),
      });
    },
    onError: (error) => {
      logger.error('Failed to unlink session', { error: String(error) });
    },
  });
}

/**
 * Return type for useSessionLinks hook.
 */
interface UseSessionLinksReturn {
  sessionLinks: SessionLink[];
  isLoading: boolean;
  error: Error | null;
}

/**
 * Hook for fetching session links for a specific issue.
 *
 * @see ralph-wiggum/specs/4.10-link-session-ui.md:L336-358
 * @param issueId - The issue ID to get linked sessions for
 * @returns Object with session links array, loading state, and error
 */
export function useSessionLinks(issueId: string): UseSessionLinksReturn {
  const query = useQuery({
    queryKey: queryKeys.issueSessionLinks(issueId),
    queryFn: async (): Promise<SessionLink[]> => {
      const response = await fetch(`/api/issues/${issueId}/sessions`);
      if (!response.ok) {
        throw new Error('Failed to fetch session links');
      }
      const data: SessionLinksResponse = await response.json();
      if (!data.success) {
        throw new Error('Failed to fetch session links');
      }
      return data.data;
    },
    enabled: Boolean(issueId),
  });

  return {
    sessionLinks: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
  };
}
