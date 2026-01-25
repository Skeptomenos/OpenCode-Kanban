import { create } from 'zustand';
import { UniqueIdentifier } from '@dnd-kit/core';
import { Column } from '../components/board-column';
import { v4 as uuid } from 'uuid';
import { logger } from '@/lib/logger';

export type Task = {
  id: string;
  title: string;
  description?: string;
  columnId: string; // Renamed from status
};

export type State = {
  tasks: Task[];
  columns: Column[];
  draggedTask: string | null;
  isLoading: boolean;
  currentBoardId: string | null;
  /** The currently active project ID for scoping tasks */
  currentProjectId: string | null;
};

export type Actions = {
  setTasks: (tasks: Task[]) => void;
  setCols: (cols: Column[]) => void;
  dragTask: (id: string | null) => void;
  setIsLoading: (loading: boolean) => void;
  setBoardId: (boardId: string | null) => void;
  setProjectId: (projectId: string | null) => void;

  // Data Fetching
  /**
   * Fetch tasks for a specific project from the API.
   * Calls GET /api/issues?parentId=[projectId] and updates tasks state.
   * @see specs/33-board-integration.md:L20-22
   */
  fetchTasks: (projectId: string) => Promise<void>;

  // UI Helpers
  addTask: (title: string, description?: string) => Promise<void>;
  addCol: (title: string) => Promise<void>;
  updateCol: (id: UniqueIdentifier, newName: string) => Promise<void>;
  removeCol: (id: UniqueIdentifier) => Promise<void>;
  removeTask: (id: string) => Promise<void>;
  updateTaskStatus: (taskId: string, newStatus: string) => Promise<boolean>;
};

/**
 * Converts UI columns to board columnConfig format for API persistence.
 * Each column maps to a status with the same ID.
 */
function columnsToColumnConfig(columns: Column[]): Array<{
  id: string;
  title: string;
  statusMappings: string[];
}> {
  return columns.map((col) => ({
    id: col.id.toString(),
    title: col.title,
    // Column ID equals the status it represents
    statusMappings: [col.id.toString()],
  }));
}

/**
 * Persists the current column configuration to the board via API.
 * Returns true on success, false on failure.
 */
async function persistColumnConfig(
  boardId: string,
  columns: Column[]
): Promise<boolean> {
  try {
    const response = await fetch(`/api/boards/${boardId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        columnConfig: columnsToColumnConfig(columns),
      }),
    });

    const result = await response.json();
    if (!result.success) {
      logger.error('Failed to persist column config', { message: result.error?.message });
      return false;
    }
    return true;
  } catch (error) {
    logger.error('Failed to persist column config', { error: String(error) });
    return false;
  }
}

export const useTaskStore = create<State & Actions>((set) => ({
  tasks: [],
  columns: [{ id: 'backlog', title: 'Backlog' }],
  draggedTask: null,
  isLoading: true,
  currentBoardId: null,
  currentProjectId: null,

  setTasks: (tasks: Task[]) => set({ tasks }),
  setCols: (columns: Column[]) => set({ columns }),
  dragTask: (draggedTask: string | null) => set({ draggedTask }),
  setIsLoading: (isLoading: boolean) => set({ isLoading }),
  setBoardId: (currentBoardId: string | null) => set({ currentBoardId }),
  setProjectId: (currentProjectId: string | null) => set({ currentProjectId }),

  fetchTasks: async (projectId: string) => {
    set({ isLoading: true });
    try {
      const response = await fetch(`/api/issues?parentId=${encodeURIComponent(projectId)}`);
      const result = await response.json();

      if (!result.success) {
        logger.error('Failed to fetch tasks', { message: result.error?.message });
        set({ isLoading: false });
        return;
      }

      const tasks: Task[] = result.data.map((issue: { id: string; title: string; description?: string | null; status: string }) => ({
        id: issue.id,
        title: issue.title,
        description: issue.description ?? undefined,
        columnId: issue.status,
      }));

      set({ tasks, isLoading: false });
    } catch (error) {
      logger.error('Failed to fetch tasks', { error: String(error) });
      set({ isLoading: false });
    }
  },

  addTask: async (title: string, description?: string) => {
    const state = useTaskStore.getState();
    const defaultColumnId =
      state.columns.length > 0 ? state.columns[0].id.toString() : 'backlog';

    // Include parentId to scope tasks to the current project
    // @see specs/33-board-integration.md:L25-28
    const payload: {
      type: string;
      title: string;
      description: string | null;
      status: string;
      parentId?: string;
    } = {
      type: 'task',
      title,
      description: description ?? null,
      status: defaultColumnId,
    };

    // Only include parentId if we have a current project context
    if (state.currentProjectId) {
      payload.parentId = state.currentProjectId;
    }

    try {
      const response = await fetch('/api/issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!result.success) {
        logger.error('Failed to create task', { message: result.error?.message });
        return;
      }

      const issue = result.data;
      set((state) => ({
        tasks: [
          ...state.tasks,
          {
            id: issue.id,
            title: issue.title,
            description: issue.description ?? undefined,
            columnId: issue.status,
          },
        ],
      }));
    } catch (error) {
      logger.error('Failed to create task', { error: String(error) });
    }
  },

  addCol: async (title: string) => {
    const state = useTaskStore.getState();
    const newColumn: Column = { title, id: uuid() };
    const newColumns = [...state.columns, newColumn];

    set({ columns: newColumns });

    if (state.currentBoardId) {
      const success = await persistColumnConfig(state.currentBoardId, newColumns);
      if (!success) {
        set({ columns: state.columns });
      }
    }
  },

  updateCol: async (id: UniqueIdentifier, newName: string) => {
    const state = useTaskStore.getState();
    const newColumns = state.columns.map((col) =>
      col.id === id ? { ...col, title: newName } : col
    );

    set({ columns: newColumns });

    if (state.currentBoardId) {
      const success = await persistColumnConfig(state.currentBoardId, newColumns);
      if (!success) {
        set({ columns: state.columns });
      }
    }
  },

  removeCol: async (id: UniqueIdentifier) => {
    const state = useTaskStore.getState();
    const newColumns = state.columns.filter((col) => col.id !== id);
    const newTasks = state.tasks.filter((task) => task.columnId !== id);

    set({ columns: newColumns, tasks: newTasks });

    if (state.currentBoardId) {
      const success = await persistColumnConfig(state.currentBoardId, newColumns);
      if (!success) {
        set({ columns: state.columns, tasks: state.tasks });
      }
    }
  },

  removeTask: async (id: string) => {
    try {
      const response = await fetch(`/api/issues/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!result.success) {
        logger.error('Failed to delete task', { message: result.error?.message });
        return;
      }

      set((state) => ({
        tasks: state.tasks.filter((task) => task.id !== id),
      }));
    } catch (error) {
      logger.error('Failed to delete task', { error: String(error) });
    }
  },

  updateTaskStatus: async (taskId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/issues/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      const result = await response.json();

      if (!result.success) {
        logger.error('Failed to update task status', { message: result.error?.message });
        return false;
      }

      return true;
    } catch (error) {
      logger.error('Failed to update task status', { error: String(error) });
      return false;
    }
  }
}));
