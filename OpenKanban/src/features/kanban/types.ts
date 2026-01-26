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

/**
 * Lightweight parent information for hierarchical display.
 * Used to show parent context on task cards without fetching full parent.
 *
 * WHY: Only id, title, type are needed for the parent badge display.
 * Fetching full parent objects would be wasteful for UI display purposes.
 *
 * @see ralph-wiggum/specs/4.9-hierarchical-display.md:L84-131
 */
export interface ParentInfo {
  id: string;
  title: string;
  /** Type of the parent issue: 'project' | 'milestone' | 'epic' | 'story' | 'task' */
  type: string;
}

export type Task = {
  id: string;
  title: string;
  description?: string;
  columnId: string;
  /**
   * Optional parent information for hierarchy display.
   * Only present when the task has a parent and backend returns parent metadata.
   *
   * @see ralph-wiggum/specs/4.9-hierarchical-display.md
   */
  parent?: ParentInfo;
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
