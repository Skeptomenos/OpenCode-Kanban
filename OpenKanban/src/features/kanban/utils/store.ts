import { create } from 'zustand';
import { Column } from '../components/board-column';

export type Task = {
  id: string;
  title: string;
  description?: string;
  columnId: string;
};

export type State = {
  tasks: Task[];
  columns: Column[];
  draggedTask: string | null;
  isLoading: boolean;
  currentBoardId: string | null;
  currentProjectId: string | null;
};

export type Actions = {
  setTasks: (tasks: Task[]) => void;
  setCols: (cols: Column[]) => void;
  dragTask: (id: string | null) => void;
  setIsLoading: (loading: boolean) => void;
  setBoardId: (boardId: string | null) => void;
  setProjectId: (projectId: string | null) => void;
};

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
}));
