'use client';

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import type { Session, SessionsResponse } from '../types';

/**
 * Return type for useSessions hook.
 */
interface UseSessionsReturn {
  sessions: Session[];
  isLoading: boolean;
  error: Error | null;
}

/**
 * Fetches all available OpenCode sessions from the API.
 *
 * @returns Array of Session objects
 * @throws Error if the fetch fails or response indicates failure
 */
async function fetchSessions(): Promise<Session[]> {
  const response = await fetch(API_ENDPOINTS.SESSIONS);
  if (!response.ok) {
    throw new Error('Failed to fetch sessions');
  }
  const data: SessionsResponse = await response.json();
  if (!data.success) {
    throw new Error('Failed to fetch sessions');
  }
  return data.data.sessions;
}

/**
 * Hook for fetching all available OpenCode sessions.
 *
 * Used by the LinkSessionDialog to display available sessions
 * for linking to tasks.
 *
 * @see ralph-wiggum/specs/4.10-link-session-ui.md:L222-254
 * @returns Object with sessions array, loading state, and error
 */
export function useSessions(): UseSessionsReturn {
  const query = useQuery({
    queryKey: queryKeys.sessions,
    queryFn: fetchSessions,
  });

  return {
    sessions: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
  };
}
