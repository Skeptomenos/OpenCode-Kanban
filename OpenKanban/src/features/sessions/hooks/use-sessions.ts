'use client';

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import type { Session, SessionsResponse } from '../types';

interface UseSessionsReturn {
  sessions: Session[];
  isLoading: boolean;
  error: Error | null;
}

async function fetchSessions(query?: string): Promise<Session[]> {
  const url = query
    ? `${API_ENDPOINTS.SESSIONS}?q=${encodeURIComponent(query)}`
    : API_ENDPOINTS.SESSIONS;
  const response = await fetch(url);
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
 * Fetches OpenCode sessions with optional server-side search.
 * @see ralph-wiggum/specs/5.4-search-cleanup.md:L13-17
 */
export function useSessions(searchQuery?: string): UseSessionsReturn {
  const query = useQuery({
    queryKey: queryKeys.sessions(searchQuery),
    queryFn: () => fetchSessions(searchQuery),
  });

  return {
    sessions: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
  };
}
