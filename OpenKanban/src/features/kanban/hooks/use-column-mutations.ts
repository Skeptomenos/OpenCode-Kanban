'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { v4 as uuid } from 'uuid';
import type { UniqueIdentifier } from '@dnd-kit/core';
import { updateBoard } from '../api';
import { useTaskStore } from '../utils/store';
import type { Column } from '../components/board-column';
import { logger } from '@/lib/logger';

type ColumnConfig = {
  id: string;
  title: string;
  statusMappings: string[];
};

function columnsToColumnConfig(columns: Column[]): ColumnConfig[] {
  return columns.map((col) => ({
    id: col.id.toString(),
    title: col.title,
    statusMappings: [col.id.toString()],
  }));
}

export function useColumnMutations(projectId?: string, boardId?: string) {
  const queryClient = useQueryClient();

  const addColumnMutation = useMutation({
    mutationFn: async ({ title, newColumnId }: { title: string; newColumnId: string }) => {
      const state = useTaskStore.getState();
      const effectiveBoardId = state.currentBoardId;
      if (!effectiveBoardId) {
        throw new Error('No board selected');
      }

      const newColumn: Column = { title, id: newColumnId };
      const newColumns = [...state.columns, newColumn];

      return updateBoard(effectiveBoardId, {
        columnConfig: columnsToColumnConfig(newColumns),
      });
    },
    onMutate: async ({ title, newColumnId }) => {
      const state = useTaskStore.getState();
      const previousColumns = state.columns;
      const newColumn: Column = { title, id: newColumnId };
      useTaskStore.setState({ columns: [...state.columns, newColumn] });
      return { previousColumns };
    },
    onError: (err, _vars, context) => {
      logger.error('Failed to add column', { error: String(err) });
      if (context?.previousColumns) {
        useTaskStore.setState({ columns: context.previousColumns });
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['kanban', projectId, boardId] });
    },
  });

  const updateColumnMutation = useMutation({
    mutationFn: async ({ id, newTitle }: { id: UniqueIdentifier; newTitle: string }) => {
      const state = useTaskStore.getState();
      const effectiveBoardId = state.currentBoardId;
      if (!effectiveBoardId) {
        throw new Error('No board selected');
      }

      const newColumns = state.columns.map((col) =>
        col.id === id ? { ...col, title: newTitle } : col
      );

      return updateBoard(effectiveBoardId, {
        columnConfig: columnsToColumnConfig(newColumns),
      });
    },
    onMutate: async ({ id, newTitle }) => {
      const state = useTaskStore.getState();
      const previousColumns = state.columns;
      const newColumns = state.columns.map((col) =>
        col.id === id ? { ...col, title: newTitle } : col
      );
      useTaskStore.setState({ columns: newColumns });
      return { previousColumns };
    },
    onError: (err, _vars, context) => {
      logger.error('Failed to update column', { error: String(err) });
      if (context?.previousColumns) {
        useTaskStore.setState({ columns: context.previousColumns });
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['kanban', projectId, boardId] });
    },
  });

  const removeColumnMutation = useMutation({
    mutationFn: async (id: UniqueIdentifier) => {
      const state = useTaskStore.getState();
      const effectiveBoardId = state.currentBoardId;
      if (!effectiveBoardId) {
        throw new Error('No board selected');
      }

      const newColumns = state.columns.filter((col) => col.id !== id);

      return updateBoard(effectiveBoardId, {
        columnConfig: columnsToColumnConfig(newColumns),
      });
    },
    onMutate: async (id: UniqueIdentifier) => {
      const state = useTaskStore.getState();
      const previousColumns = state.columns;
      const previousTasks = state.tasks;
      const newColumns = state.columns.filter((col) => col.id !== id);
      const newTasks = state.tasks.filter((task) => task.columnId !== id);
      useTaskStore.setState({ columns: newColumns, tasks: newTasks });
      return { previousColumns, previousTasks };
    },
    onError: (err, _id, context) => {
      logger.error('Failed to remove column', { error: String(err) });
      if (context?.previousColumns) {
        useTaskStore.setState({ columns: context.previousColumns });
      }
      if (context?.previousTasks) {
        useTaskStore.setState({ tasks: context.previousTasks });
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['kanban', projectId, boardId] });
    },
  });

  return {
    addColumn: (title: string) => addColumnMutation.mutate({ title, newColumnId: uuid() }),
    updateColumn: (id: UniqueIdentifier, newTitle: string) =>
      updateColumnMutation.mutate({ id, newTitle }),
    removeColumn: (id: UniqueIdentifier) => removeColumnMutation.mutate(id),
    isAddingColumn: addColumnMutation.isPending,
    isUpdatingColumn: updateColumnMutation.isPending,
    isRemovingColumn: removeColumnMutation.isPending,
  };
}
