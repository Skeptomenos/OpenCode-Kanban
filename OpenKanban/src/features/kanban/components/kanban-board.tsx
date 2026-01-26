'use client';
import { Fragment, useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const subscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

function ClientPortal({ children }: { children: ReactNode }) {
  const isClient = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return isClient ? createPortal(children, document.body) : null;
}
import { useTaskStore } from '../utils/store';
import type { Task, Column } from '../types';
import { hasDraggableData } from '../utils';
import { logger } from '@/lib/logger';
import { queryKeys, type BoardFilters } from '@/lib/query-keys';
import { KANBAN_DIMENSIONS } from '@/lib/constants/ui-dimensions';
import { BoardFilterControls } from '@/features/boards/components/board-filter-controls';
import { fetchIssues, fetchBoards, fetchBoard, updateIssue } from '../api';
import { ColumnMutationsProvider } from '../hooks/column-mutations-context';
import {
  Announcements,
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  UniqueIdentifier,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent
} from '@dnd-kit/core';
import { SortableContext, arrayMove } from '@dnd-kit/sortable';
import { BoardColumn, BoardContainer } from './board-column';
import { NewSectionDialog } from './new-section-dialog';
import { TaskCard } from './task-card';

interface KanbanBoardProps {
  projectId?: string;
  boardId?: string;
}

/**
 * Resolves the active board ID.
 * - If boardId provided, uses it
 * - Otherwise fetches boards list and returns first
 * - Throws if no board found (parent route should ensure board exists)
 *
 * @see specs/360-critical-fixes.md:L27-46 - Query functions must be pure, no mutations
 */
async function resolveBoardId(boardId?: string): Promise<string> {
  if (boardId) return boardId;

  const boards = await fetchBoards();
  if (boards.length > 0) return boards[0].id;

  // No boards found - throw error. Parent route/component handles board creation.
  // This keeps query functions pure (no side effects/mutations).
  throw new Error('No boards found. Board must be created before accessing KanbanBoard.');
}

/**
 * Fetches kanban board data: columns from board config, tasks from project or board.
 * @see specs/352-frontend-modernization.md:L44-54
 */
async function fetchKanbanData(
  projectId?: string,
  boardId?: string,
  filters?: BoardFilters
): Promise<{ boardId: string; columns: Column[]; tasks: Task[] }> {
  const resolvedBoardId = await resolveBoardId(boardId);
  const boardData = await fetchBoard(resolvedBoardId);

  const columns: Column[] = boardData.columnConfig.length > 0
    ? boardData.columnConfig.map((col) => ({ id: col.id, title: col.title }))
    : [{ id: 'backlog', title: 'Backlog' }];

  let tasks: Task[];
  if (projectId) {
    const issues = await fetchIssues({ 
      parentId: projectId,
      status: filters?.status ?? undefined,
    });
    tasks = issues.map((issue) => ({
      id: issue.id,
      title: issue.title,
      description: issue.description ?? undefined,
      columnId: issue.status,
      parent: issue.parent ?? undefined,
    }));
  } else {
    let issues = boardData.issues;
    if (filters?.status) {
      issues = issues.filter((issue) => issue.status === filters.status);
    }
    tasks = issues.map((issue) => ({
      id: issue.id,
      title: issue.title,
      description: issue.description ?? undefined,
      columnId: issue.status,
      parent: issue.parent ?? undefined,
    }));
  }

  return { boardId: resolvedBoardId, columns, tasks };
}

/**
 * Kanban board component with drag-and-drop functionality.
 *
 * ## Dual Source of Truth Architecture
 *
 * This component uses a **hybrid state management pattern** combining React Query
 * (server state) with Zustand (UI state) for optimal drag-and-drop performance:
 *
 * 1. **React Query** (`useQuery`): Fetches and caches board data from the API.
 *    This is the authoritative source for persisted state.
 *
 * 2. **Zustand** (`useTaskStore`): Holds a synchronized copy of tasks/columns
 *    for instant UI updates during drag operations.
 *
 * ### Why This Pattern?
 *
 * - **Drag Performance**: Direct Zustand updates during `onDragOver` provide
 *   60fps smoothness without waiting for network round-trips.
 *
 * - **Consistency**: After drag ends, mutations fire and React Query invalidates,
 *   ensuring the UI eventually reconciles with server state.
 *
 * - **Flicker Prevention**: The sync effect skips updates while `draggedTask`
 *   is non-null, preventing React Query refetches from resetting drag position.
 *
 * ### Data Flow
 *
 * ```
 * API -> useQuery -> sync effect -> Zustand store -> UI
 *                                         ^
 *                                         |
 *                    onDragOver (optimistic) ---+
 *                                               |
 *                    onDragEnd -> useMutation ---> API -> invalidate -> refetch
 * ```
 *
 * @see specs/352-frontend-modernization.md:L29-38 - Hybrid pattern rationale
 * @see specs/358-code-quality.md:L24 - D.1 documentation requirement
 */
export function KanbanBoard({ projectId, boardId }: KanbanBoardProps) {
  const queryClient = useQueryClient();
  const columns = useTaskStore((state) => state.columns);
  const setColumns = useTaskStore((state) => state.setCols);
  const tasks = useTaskStore((state) => state.tasks);
  const setTasks = useTaskStore((state) => state.setTasks);
  const draggedTask = useTaskStore((state) => state.draggedTask);
  const setBoardId = useTaskStore((state) => state.setBoardId);
  const setProjectId = useTaskStore((state) => state.setProjectId);
  const pickedUpTaskColumn = useRef<string>('');
  const pendingStatusUpdates = useRef<Map<string, string>>(new Map());
  /** Store previous tasks state for rollback on mutation error */
  const previousTasksRef = useRef<Task[]>([]);

  const columnsId = useMemo(() => columns.map((col) => col.id), [columns]);

  const [activeColumn, setActiveColumn] = useState<Column | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [filters, setFilters] = useState<BoardFilters>({});

  const sensors = useSensors(useSensor(MouseSensor), useSensor(TouchSensor));

  /**
   * Query for kanban board data (columns + tasks).
   * Replaces the manual useEffect fetch pattern.
   * @see specs/352-frontend-modernization.md:L44-54
   */
  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.kanban(projectId, boardId, filters),
    queryFn: () => fetchKanbanData(projectId, boardId, filters),
  });

  /**
   * Mutation for updating issue status (used during drag-and-drop).
   * @see specs/352-frontend-modernization.md:L56-61
   */
  const updateIssueMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      updateIssue(id, { status }),
    onMutate: () => {
      previousTasksRef.current = tasks;
    },
    onError: (err) => {
      logger.error('Failed to update issue status', { error: String(err) });
      setTasks(previousTasksRef.current);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.kanban(projectId, boardId, filters) });
    },
  });

  /**
   * Sync effect: Update Zustand store when query data changes.
   * CRITICAL: Skip sync while dragging to prevent visual flicker.
   * @see specs/352-frontend-modernization.md:L46-53
   */
  useEffect(() => {
    if (!data) return;
    
    const isDragging = draggedTask !== null;
    if (isDragging) return;

    setProjectId(projectId ?? null);
    setBoardId(data.boardId);
    setColumns(data.columns);
    setTasks(data.tasks);
  }, [data, draggedTask, projectId, setBoardId, setColumns, setProjectId, setTasks]);

  if (error) {
    logger.error('Failed to load kanban board', { error: String(error) });
  }

  if (isLoading) {
    return (
      <div className='flex gap-4 p-4'>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className='bg-muted h-96 w-72 animate-pulse rounded-lg'
          />
        ))}
      </div>
    );
  }

  function getDraggingTaskData(taskId: UniqueIdentifier, columnId: string) {
    const tasksInColumn = tasks.filter((task) => task.columnId === columnId);
    const taskPosition = tasksInColumn.findIndex((task) => task.id === taskId);
    const column = columns.find((col) => col.id === columnId);
    return {
      tasksInColumn,
      taskPosition,
      column
    };
  }

  const announcements: Announcements = {
    onDragStart({ active }) {
      if (!hasDraggableData(active)) return;
      if (active.data.current?.type === 'Column') {
        const startColumnIdx = columnsId.findIndex((id) => id === active.id);
        const startColumn = columns[startColumnIdx];
        return `Picked up Column ${startColumn?.title} at position: ${
          startColumnIdx + 1
        } of ${columnsId.length}`;
      } else if (active.data.current?.type === 'Task') {
        pickedUpTaskColumn.current = active.data.current.task.columnId;
        const { tasksInColumn, taskPosition, column } = getDraggingTaskData(
          active.id,
          pickedUpTaskColumn.current
        );
        return `Picked up Task ${active.data.current.task.title} at position: ${
          taskPosition + 1
        } of ${tasksInColumn.length} in column ${column?.title}`;
      }
    },
    onDragOver({ active, over }) {
      if (!hasDraggableData(active) || !hasDraggableData(over)) return;

      if (
        active.data.current?.type === 'Column' &&
        over.data.current?.type === 'Column'
      ) {
        const overColumnIdx = columnsId.findIndex((id) => id === over.id);
        return `Column ${active.data.current.column.title} was moved over ${
          over.data.current.column.title
        } at position ${overColumnIdx + 1} of ${columnsId.length}`;
      } else if (
        active.data.current?.type === 'Task' &&
        over.data.current?.type === 'Task'
      ) {
        const { tasksInColumn, taskPosition, column } = getDraggingTaskData(
          over.id,
          over.data.current.task.columnId
        );
        if (over.data.current.task.columnId !== pickedUpTaskColumn.current) {
          return `Task ${
            active.data.current.task.title
          } was moved over column ${column?.title} in position ${
            taskPosition + 1
          } of ${tasksInColumn.length}`;
        }
        return `Task was moved over position ${taskPosition + 1} of ${
          tasksInColumn.length
        } in column ${column?.title}`;
      }
    },
    onDragEnd({ active, over }) {
      if (!hasDraggableData(active) || !hasDraggableData(over)) {
        return;
      }
      if (
        active.data.current?.type === 'Column' &&
        over.data.current?.type === 'Column'
      ) {
        const overColumnPosition = columnsId.findIndex((id) => id === over.id);

        return `Column ${
          active.data.current.column.title
        } was dropped into position ${overColumnPosition + 1} of ${
          columnsId.length
        }`;
      } else if (
        active.data.current?.type === 'Task' &&
        over.data.current?.type === 'Task'
      ) {
        const { tasksInColumn, taskPosition, column } = getDraggingTaskData(
          over.id,
          over.data.current.task.columnId
        );
        if (over.data.current.task.columnId !== pickedUpTaskColumn.current) {
          return `Task was dropped into column ${column?.title} in position ${
            taskPosition + 1
          } of ${tasksInColumn.length}`;
        }
        return `Task was dropped into position ${taskPosition + 1} of ${
          tasksInColumn.length
        } in column ${column?.title}`;
      }
    },
    onDragCancel({ active }) {
      if (!hasDraggableData(active)) return;
      return `Dragging ${active.data.current?.type} cancelled.`;
    }
  };

  function onDragStart(event: DragStartEvent) {
    if (!hasDraggableData(event.active)) return;
    const data = event.active.data.current;
    if (data?.type === 'Column') {
      setActiveColumn(data.column);
      return;
    }

    if (data?.type === 'Task') {
      setActiveTask(data.task);
      return;
    }
  }

  function onDragCancel() {
    useTaskStore.getState().setDropTarget(null);
    setActiveColumn(null);
    setActiveTask(null);
  }

  function onDragEnd(event: DragEndEvent) {
    useTaskStore.getState().setDropTarget(null);
    setActiveColumn(null);
    setActiveTask(null);

    const { active, over } = event;
    
    if (pendingStatusUpdates.current.size > 0) {
      const updates = Array.from(pendingStatusUpdates.current.entries());
      pendingStatusUpdates.current.clear();
      updates.forEach(([taskId, newStatus]) => {
        updateIssueMutation.mutate({ id: taskId, status: newStatus });
      });
    }
    
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (!hasDraggableData(active)) return;

    const activeData = active.data.current;

    if (activeId === overId) return;

    const isActiveAColumn = activeData?.type === 'Column';
    if (!isActiveAColumn) return;

    const activeColumnIndex = columns.findIndex((col) => col.id === activeId);
    const overColumnIndex = columns.findIndex((col) => col.id === overId);

    if (activeColumnIndex === -1 || overColumnIndex === -1) {
      logger.warn('DnD column reorder aborted: column not found', { activeId, overId });
      return;
    }

    setColumns(arrayMove(columns, activeColumnIndex, overColumnIndex));
  }

  function onDragOver(event: DragOverEvent) {
    const { active, over } = event;
    
    if (!over) {
      useTaskStore.getState().setDropTarget(null);
      return;
    }

    const overData = over.data.current;
    
    if (overData && hasDraggableData(over) && active.data.current?.type === 'Task') {
      if (overData.type === 'Column') {
        const columnId = over.id.toString();
        const storeTasks = useTaskStore.getState().tasks;
        const tasksInColumn = storeTasks.filter(t => t.columnId === columnId);
        useTaskStore.getState().setDropTarget({
          columnId,
          index: tasksInColumn.length,
        });
      } else if (overData.type === 'Task') {
        const overTask = overData.task as Task;
        const columnId = overTask.columnId;
        const storeTasks = useTaskStore.getState().tasks;
        const tasksInColumn = storeTasks.filter(t => t.columnId === columnId);
        const overIndex = tasksInColumn.findIndex(t => t.id === overTask.id);
        useTaskStore.getState().setDropTarget({
          columnId,
          index: overIndex >= 0 ? overIndex : 0,
        });
      }
    }

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    if (!hasDraggableData(active) || !hasDraggableData(over)) return;

    const activeData = active.data.current;

    const isActiveATask = activeData?.type === 'Task';
    const isOverATask = overData?.type === 'Task';

    if (!isActiveATask) return;

    if (isActiveATask && isOverATask) {
      const activeIndex = tasks.findIndex((t) => t.id === activeId);
      const overIndex = tasks.findIndex((t) => t.id === overId);

      if (activeIndex === -1 || overIndex === -1) {
        logger.warn('DnD task reorder aborted: task not found', { activeId, overId });
        return;
      }

      const activeTask = tasks[activeIndex];
      const overTask = tasks[overIndex];
      if (activeTask && overTask && activeTask.columnId !== overTask.columnId) {
        pendingStatusUpdates.current.set(activeTask.id, overTask.columnId);
        const updatedTasks = tasks.map((t) =>
          t.id === activeTask.id ? { ...t, columnId: overTask.columnId } : t
        );
        setTasks(arrayMove(updatedTasks, activeIndex, overIndex - 1));
      } else {
        setTasks(arrayMove(tasks, activeIndex, overIndex));
      }
    }

    const isOverAColumn = overData?.type === 'Column';

    if (isActiveATask && isOverAColumn) {
      const activeIndex = tasks.findIndex((t) => t.id === activeId);

      if (activeIndex === -1) {
        logger.warn('DnD task-to-column aborted: task not found', { activeId });
        return;
      }

      const activeTask = tasks[activeIndex];
      const overIdStr = String(overId);
      if (activeTask && activeTask.columnId !== overIdStr) {
        pendingStatusUpdates.current.set(activeTask.id, overIdStr);
        const updatedTasks = tasks.map((t) =>
          t.id === activeTask.id ? { ...t, columnId: overIdStr } : t
        );
        setTasks(arrayMove(updatedTasks, activeIndex, activeIndex));
      }
    }
  }

  return (
    <ColumnMutationsProvider projectId={projectId} boardId={boardId}>
      <BoardFilterControls filters={filters} onFiltersChange={setFilters} />
      <DndContext
        accessibility={{
          announcements
        }}
        sensors={sensors}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDragOver={onDragOver}
        onDragCancel={onDragCancel}
      >
        <BoardContainer>
          <SortableContext items={columnsId}>
            {columns?.map((col, index) => (
              <Fragment key={col.id}>
                <BoardColumn column={col} />
                {index === columns?.length - 1 && (
                  <div className={KANBAN_DIMENSIONS.COLUMN_WIDTH}>
                    <NewSectionDialog />
                  </div>
                )}
              </Fragment>
            ))}
            {!columns.length && <NewSectionDialog />}
          </SortableContext>
        </BoardContainer>

        <ClientPortal>
          <DragOverlay>
            {activeColumn && (
              <BoardColumn
                isOverlay
                column={activeColumn}
                tasks={tasks.filter(
                  (task) => task.columnId === activeColumn.id
                )}
              />
            )}
            {activeTask && <TaskCard task={activeTask} isOverlay />}
          </DragOverlay>
        </ClientPortal>
      </DndContext>
    </ColumnMutationsProvider>
  );
}
