import { create } from 'zustand';
import type { Column, Task } from '../types';

export type { Task } from '../types';

export type State = {
  tasks: Task[];
  columns: Column[];
  draggedTask: string | null;
  currentBoardId: string | null;
  currentProjectId: string | null;
};

export type Actions = {
  setTasks: (tasks: Task[]) => void;
  setCols: (cols: Column[]) => void;
  dragTask: (id: string | null) => void;
  setBoardId: (boardId: string | null) => void;
  setProjectId: (projectId: string | null) => void;
};

export const useTaskStore = create<State & Actions>((set) => ({
  tasks: [],
  columns: [{ id: 'backlog', title: 'Backlog' }],
  draggedTask: null,
  currentBoardId: null,
  currentProjectId: null,

  setTasks: (tasks: Task[]) => set({ tasks }),
  setCols: (columns: Column[]) => set({ columns }),
  dragTask: (draggedTask: string | null) => set({ draggedTask }),
  setBoardId: (currentBoardId: string | null) => set({ currentBoardId }),
  setProjectId: (currentProjectId: string | null) => set({ currentProjectId }),
}));
