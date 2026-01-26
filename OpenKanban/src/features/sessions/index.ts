/**
 * Sessions Feature Module
 *
 * Provides UI components and hooks for linking OpenCode sessions to Kanban tasks.
 *
 * Components:
 * - LinkSessionDialog: Dialog for searching and linking sessions to tasks
 *
 * Hooks:
 * - useSessions: Fetch all available OpenCode sessions
 * - useSessionLinks: Fetch session links for a specific issue
 * - useLinkSession: Mutation to link a session to an issue
 * - useUnlinkSession: Mutation to unlink a session from an issue
 *
 * @see ralph-wiggum/specs/4.10-link-session-ui.md
 * @module features/sessions
 */

// Components
export { LinkSessionDialog } from './components/link-session-dialog';

// Hooks
export { useSessions } from './hooks/use-sessions';
export {
  useLinkSession,
  useUnlinkSession,
  useSessionLinks,
} from './hooks/use-session-mutations';

// Types
export type { Session, SessionLink, SessionsResponse } from './types';
