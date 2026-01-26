/**
 * Centralized API endpoint paths.
 * Single source of truth for all API routes used in the application.
 */

export const API_ENDPOINTS = {
  SESSIONS: '/api/sessions',
  
  issueSessionLinks: (issueId: string) => `/api/issues/${issueId}/sessions`,
  issueSessionLink: (issueId: string, sessionId: string) =>
    `/api/issues/${issueId}/sessions/${sessionId}`,
} as const;
