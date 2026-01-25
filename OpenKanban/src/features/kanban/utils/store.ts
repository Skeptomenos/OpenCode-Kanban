import { create } from 'zustand';
import { UniqueIdentifier } from '@dnd-kit/core';
import { Column } from '../components/board-column';
import { v4 as uuid } from 'uuid';

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
};

export type Actions = {
  setTasks: (tasks: Task[]) => void;
  setCols: (cols: Column[]) => void;
  dragTask: (id: string | null) => void;
  setIsLoading: (loading: boolean) => void;

  // UI Helpers
  addTask: (title: string, description?: string) => Promise<void>;
  addCol: (title: string) => void;
  updateCol: (id: UniqueIdentifier, newName: string) => void;
  removeCol: (id: UniqueIdentifier) => void;
  removeTask: (id: string) => void;
};

export const useTaskStore = create<State & Actions>((set) => ({
  tasks: [],
  columns: [{ id: 'backlog', title: 'Backlog' }],
  draggedTask: null,
  isLoading: true,

  setTasks: (tasks: Task[]) => set({ tasks }),
  setCols: (columns: Column[]) => set({ columns }),
  dragTask: (draggedTask: string | null) => set({ draggedTask }),
  setIsLoading: (isLoading: boolean) => set({ isLoading }),

  addTask: async (title: string, description?: string) => {
    const state = useTaskStore.getState();
    const defaultColumnId =
      state.columns.length > 0 ? state.columns[0].id.toString() : 'backlog';

    try {
      const response = await fetch('/api/issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'task',
          title,
          description: description ?? null,
          status: defaultColumnId,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        console.error('Failed to create task:', result.error?.message);
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
      console.error('Failed to create task:', error);
    }
  },

  // TODO: Connect to Phase 2 Storage Engine
  addCol: (title: string) => {
    console.warn('Persistence not implemented (Phase 2)');
    set((state) => ({
      columns: [...state.columns, { title, id: uuid() }]
    }));
  },

  // TODO: Connect to Phase 2 Storage Engine
  updateCol: (id: UniqueIdentifier, newName: string) => {
    console.warn('Persistence not implemented (Phase 2)');
    set((state) => ({
      columns: state.columns.map((col) =>
        col.id === id ? { ...col, title: newName } : col
      )
    }));
  },

  // TODO: Connect to Phase 2 Storage Engine
  removeCol: (id: UniqueIdentifier) => {
    console.warn('Persistence not implemented (Phase 2)');
    set((state) => ({
      columns: state.columns.filter((col) => col.id !== id),
      tasks: state.tasks.filter((task) => task.columnId !== id)
    }));
  },

  removeTask: (id: string) =>
    set((state) => ({
      tasks: state.tasks.filter((task) => task.id !== id)
    }))
}));
