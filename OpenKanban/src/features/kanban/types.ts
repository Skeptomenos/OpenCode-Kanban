/**
 * Centralized types for the kanban feature.
 *
 * WHY: Extracting shared types here breaks the circular dependency
 * between store.ts and board-column.tsx. Both now import from types.ts
 * instead of from each other.
 *
 * @see ralph-wiggum/specs/360-critical-fixes.md:L13-20
 */
import type { UniqueIdentifier } from '@dnd-kit/core';

export type Task = {
  id: string;
  title: string;
  description?: string;
  columnId: string;
};

export interface Column {
  id: UniqueIdentifier;
  title: string;
}

export type ColumnType = 'Column';

export type TaskType = 'Task';

export interface ColumnDragData {
  type: ColumnType;
  column: Column;
}

export interface TaskDragData {
  type: TaskType;
  task: Task;
}
