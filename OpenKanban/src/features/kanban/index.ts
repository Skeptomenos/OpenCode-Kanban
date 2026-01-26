/**
 * Kanban Feature Barrel File
 *
 * Exposes the public API for the kanban feature.
 * All imports from this feature should go through this file.
 *
 * @see ralph-wiggum/specs/361-code-organization.md:L25-30
 */

// =============================================================================
// Components
// =============================================================================
export { KanbanBoard } from './components/kanban-board';
export { KanbanViewPage } from './components/kanban-view-page';

// =============================================================================
// Hooks
// =============================================================================
export { useColumnMutations } from './hooks/use-column-mutations';

// =============================================================================
// State
// =============================================================================
export { useTaskStore } from './utils/store';
export type { State, Actions } from './utils/store';

// =============================================================================
// API Layer
// =============================================================================
export {
  // Issue operations
  fetchIssues,
  fetchIssue,
  createIssue,
  updateIssue,
  deleteIssue,
  // Board operations
  fetchBoards,
  fetchBoard,
  createBoard,
  updateBoard,
  // Error class
  ApiError,
} from './api';

export type {
  CreateIssueInput,
  UpdateIssueInput,
  BoardListItem,
  BoardWithIssues,
  CreateBoardInput,
  UpdateBoardInput,
} from './api';

// =============================================================================
// Types
// =============================================================================
export type {
  Task,
  Column,
  ColumnType,
  TaskType,
  ColumnDragData,
  TaskDragData,
} from './types';
