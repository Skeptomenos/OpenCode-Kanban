/**
 * Session types for the Link Session UI feature.
 *
 * WHY: This feature enables linking OpenCode sessions to Kanban tasks,
 * providing evidence/implementation details for work items.
 *
 * @see ralph-wiggum/specs/4.10-link-session-ui.md:L88-192
 * @see src/contract/opencode/schemas.ts:L32-41 - SessionSchema (source of truth)
 */

/**
 * OpenCode Session metadata for linking to issues.
 *
 * Mirrors the SessionSchema from opencode/schemas.ts but as a TypeScript interface
 * for use in React components and hooks.
 */
export interface Session {
  id: string;
  title: string;
  slug: string;
  projectID: string;
  directory: string;
  parentID?: string | null;
  time: {
    created: number;
    updated: number;
    initialized?: number;
  };
  summary?: {
    additions?: number;
    deletions?: number;
    files?: number;
  };
}

/**
 * Link between an issue and a session.
 *
 * Represents a row in the issue_sessions table.
 * Created when a user links an OpenCode session to a task.
 */
export interface SessionLink {
  id: string;
  issueId: string;
  sessionId: string;
  linkType?: string | null;
  createdAt: string;
}

export interface SessionsResponse {
  success: boolean;
  data: {
    sessions: Session[];
    projects: unknown[];
  };
}

export interface MessagePart {
  id: string;
  type: 'text' | 'tool_call' | 'tool_result';
  text?: string;
  synthetic?: boolean;
  time: { start: number; end: number };
  messageID: string;
  sessionID: string;
}

export interface Message {
  id: string;
  sessionID: string;
  role: 'user' | 'assistant' | 'system';
  time: { created: number; completed?: number };
  parts: MessagePart[];
}

export interface SessionDetailResponse {
  success: boolean;
  data: {
    session: Session;
    messages: Message[];
  };
}
