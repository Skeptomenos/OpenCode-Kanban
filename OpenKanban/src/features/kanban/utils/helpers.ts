/**
 * Kanban Utility Helpers
 *
 * Contains drag-and-drop type guard utilities for dnd-kit integration.
 * These helpers ensure type-safe handling of draggable elements.
 *
 * @see ralph-wiggum/specs/361-code-organization.md:L33-34
 * @see ralph-wiggum/specs/364-docs-hygiene.md:L33-34
 */

import { Active, DataRef, Over } from '@dnd-kit/core';
import type { ColumnDragData, TaskDragData } from '../types';

type DraggableData = ColumnDragData | TaskDragData;

/**
 * Type guard to check if a dnd-kit Active or Over element contains valid draggable data.
 *
 * @param entry - The Active or Over element from dnd-kit events
 * @returns true if the entry contains Column or Task drag data
 *
 * @example
 * ```typescript
 * const handleDragEnd = (event: DragEndEvent) => {
 *   const { active, over } = event;
 *   if (!hasDraggableData(active) || !hasDraggableData(over)) return;
 *   // Now TypeScript knows active.data and over.data are DraggableData
 * };
 * ```
 */
export function hasDraggableData<T extends Active | Over>(
  entry: T | null | undefined
): entry is T & {
  data: DataRef<DraggableData>;
} {
  if (!entry) {
    return false;
  }

  const data = entry.data.current;

  if (data?.type === 'Column' || data?.type === 'Task') {
    return true;
  }

  return false;
}
