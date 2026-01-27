'use client';

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import type { Session, Message, SessionDetailResponse } from '../types';

interface UseSessionReturn {
  session: Session | null;
  messages: Message[];
  isLoading: boolean;
  error: Error | null;
}

async function fetchSession(sessionId: string): Promise<{ session: Session; messages: Message[] }> {
  const response = await fetch(`/api/sessions/${sessionId}`);
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Session not found');
    }
    throw new Error('Failed to fetch session');
  }
  const data: SessionDetailResponse = await response.json();
  if (!data.success) {
    throw new Error('Failed to fetch session');
  }
  return data.data;
}

export function useSession(sessionId: string | null): UseSessionReturn {
  const query = useQuery({
    queryKey: queryKeys.session(sessionId ?? ''),
    queryFn: () => fetchSession(sessionId!),
    enabled: !!sessionId,
  });

  return {
    session: query.data?.session ?? null,
    messages: query.data?.messages ?? [],
    isLoading: query.isLoading,
    error: query.error,
  };
}
