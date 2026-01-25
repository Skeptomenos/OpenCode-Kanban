'use client';
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Task, useTaskStore } from '../utils/store';
import { hasDraggableData } from '../utils';
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
import type { Column } from './board-column';
import NewSectionDialog from './new-section-dialog';
import { TaskCard } from './task-card';

interface ColumnConfig {
  id: string;
  title: string;
  statusMappings: string[];
}

interface ApiIssue {
  id: string;
  type: string;
  title: string;
  description?: string | null;
  status: string;
  parentId?: string | null;
  metadata?: Record<string, unknown>;
  createdAt: number;
  updatedAt: number;
  sessionIds?: string[];
  labelIds?: string[];
}

interface BoardWithIssues {
  id: string;
  name: string;
  filters: Record<string, unknown>;
  columnConfig: ColumnConfig[];
  createdAt: number;
  updatedAt: number;
  issues: ApiIssue[];
}

interface KanbanBoardProps {
  projectId?: string;
  boardId?: string;
}

export function KanbanBoard({ projectId, boardId }: KanbanBoardProps) {
  const columns = useTaskStore((state) => state.columns);
  const setColumns = useTaskStore((state) => state.setCols);
  const tasks = useTaskStore((state) => state.tasks);
  const setTasks = useTaskStore((state) => state.setTasks);
  const isLoading = useTaskStore((state) => state.isLoading);
  const setIsLoading = useTaskStore((state) => state.setIsLoading);
  const setBoardId = useTaskStore((state) => state.setBoardId);
  const pickedUpTaskColumn = useRef<string>('');

  const columnsId = useMemo(() => columns.map((col) => col.id), [columns]);

  const [activeColumn, setActiveColumn] = useState<Column | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(useSensor(MouseSensor), useSensor(TouchSensor));

  const initializeBoard = useCallback(async () => {
    try {
      let activeBoardId = boardId;

      if (!activeBoardId) {
        const boardsResponse = await fetch('/api/boards');
        const boardsResult = await boardsResponse.json();

        if (!boardsResult.success) {
          console.error('Failed to fetch boards:', boardsResult.error?.message);
          setIsLoading(false);
          return;
        }

        const boards: Array<{ id: string; name: string }> = boardsResult.data;

        if (boards.length === 0) {
          const createResponse = await fetch('/api/boards', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: 'Default Board',
              columnConfig: [{ id: 'backlog', title: 'Backlog', statusMappings: ['backlog'] }],
            }),
          });
          const createResult = await createResponse.json();

          if (!createResult.success) {
            console.error('Failed to create default board:', createResult.error?.message);
            setIsLoading(false);
            return;
          }
          activeBoardId = createResult.data.id;
        } else {
          activeBoardId = boards[0].id;
        }
      }

      const boardResponse = await fetch(`/api/boards/${activeBoardId}`);
      const boardResult = await boardResponse.json();

      if (!boardResult.success) {
        console.error('Failed to fetch board details:', boardResult.error?.message);
        setIsLoading(false);
        return;
      }

      const boardData: BoardWithIssues = boardResult.data;

      setBoardId(activeBoardId ?? null);

      const uiColumns: Column[] = boardData.columnConfig.map((col) => ({
        id: col.id,
        title: col.title,
      }));
      setColumns(uiColumns.length > 0 ? uiColumns : [{ id: 'backlog', title: 'Backlog' }]);

      const uiTasks: Task[] = boardData.issues.map((issue) => ({
        id: issue.id,
        title: issue.title,
        description: issue.description ?? undefined,
        columnId: issue.status,
      }));
      setTasks(uiTasks);

      setIsLoading(false);
    } catch (error) {
      console.error('Failed to initialize board:', error);
      setIsLoading(false);
    }
  }, [boardId, setBoardId, setColumns, setIsLoading, setTasks]);

  useEffect(() => {
    initializeBoard();
  }, [initializeBoard]);

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

  function onDragEnd(event: DragEndEvent) {
    setActiveColumn(null);
    setActiveTask(null);

    const { active, over } = event;
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

    setColumns(arrayMove(columns, activeColumnIndex, overColumnIndex));
  }

  function onDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    if (!hasDraggableData(active) || !hasDraggableData(over)) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    const isActiveATask = activeData?.type === 'Task';
    const isOverATask = overData?.type === 'Task';

    if (!isActiveATask) return;

    if (isActiveATask && isOverATask) {
      const activeIndex = tasks.findIndex((t) => t.id === activeId);
      const overIndex = tasks.findIndex((t) => t.id === overId);
      const activeTask = tasks[activeIndex];
      const overTask = tasks[overIndex];
      if (activeTask && overTask && activeTask.columnId !== overTask.columnId) {
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
      const activeTask = tasks[activeIndex];
      if (activeTask) {
        const updatedTasks = tasks.map((t) =>
          t.id === activeTask.id ? { ...t, columnId: overId as string } : t
        );
        setTasks(arrayMove(updatedTasks, activeIndex, activeIndex));
      }
    }
  }

  return (
    <DndContext
      accessibility={{
        announcements
      }}
      sensors={sensors}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
    >
      <BoardContainer>
        <SortableContext items={columnsId}>
          {columns?.map((col, index) => (
            <Fragment key={col.id}>
              <BoardColumn column={col} />
              {index === columns?.length - 1 && (
                <div className='w-[300px]'>
                  <NewSectionDialog />
                </div>
              )}
            </Fragment>
          ))}
          {!columns.length && <NewSectionDialog />}
        </SortableContext>
      </BoardContainer>

      {'document' in window &&
        createPortal(
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
          </DragOverlay>,
          document.body
        )}
    </DndContext>
  );
}
