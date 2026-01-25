'use client';

import { QueryClient } from '@tanstack/react-query';

/**
 * Creates a QueryClient instance with optimized defaults for OpenKanban.
 *
 * Why singleton pattern with lazy initialization:
 * - Next.js App Router can create multiple instances during SSR
 * - We want to share state across client components
 * - Lazy init ensures client-only instantiation
 */
function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Stale time: 30 seconds - balances freshness vs API calls
        staleTime: 30 * 1000,
        // Retry failed requests once (not 3x) for faster feedback
        retry: 1,
        // Refetch on window focus for data freshness
        refetchOnWindowFocus: true,
      },
      mutations: {
        // Retry mutations once for transient failures
        retry: 1,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined = undefined;

/**
 * Returns a QueryClient instance.
 * - Server: Creates a new instance each request (prevents data leakage)
 * - Browser: Reuses singleton (maintains cache across navigations)
 */
export function getQueryClient(): QueryClient {
  if (typeof window === 'undefined') {
    // Server: always create fresh to prevent data leakage between requests
    return makeQueryClient();
  }
  // Browser: lazy singleton pattern
  if (!browserQueryClient) {
    browserQueryClient = makeQueryClient();
  }
  return browserQueryClient;
}
