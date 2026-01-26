/**
 * Boards Feature Module
 *
 * Provides UI components and hooks for board CRUD operations within projects.
 *
 * Components:
 * - CreateBoardDialog: Dialog for creating new boards
 * - DeleteBoardDialog: Confirmation dialog for board deletion
 * - RenameBoardDialog: Dialog for renaming boards
 * - BoardActionsMenu: Dropdown menu orchestrating Rename/Delete actions
 *
 * Hooks:
 * - useBoards: Fetch boards filtered by project
 * - useCreateBoard, useUpdateBoard, useDeleteBoard: Mutation hooks
 *
 * @see ralph-wiggum/specs/4.3-ui-components.md
 * @module features/boards
 */

// Components
export { CreateBoardDialog } from './components/create-board-dialog';
export { DeleteBoardDialog } from './components/delete-board-dialog';
export { RenameBoardDialog } from './components/rename-board-dialog';
export { BoardActionsMenu } from './components/board-actions-menu';

// Hooks
export { useBoards } from './hooks/use-boards';
export {
  useCreateBoard,
  useUpdateBoard,
  useDeleteBoard,
} from './hooks/use-board-mutations';
