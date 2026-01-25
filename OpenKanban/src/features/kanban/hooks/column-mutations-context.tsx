'use client';

import { createContext, useContext, type ReactNode } from 'react';
import type { UniqueIdentifier } from '@dnd-kit/core';
import { useColumnMutations } from './use-column-mutations';

type ColumnMutationsContextValue = {
  addColumn: (title: string) => void;
  updateColumn: (id: UniqueIdentifier, newTitle: string) => void;
  removeColumn: (id: UniqueIdentifier) => void;
  isAddingColumn: boolean;
  isUpdatingColumn: boolean;
  isRemovingColumn: boolean;
};

const ColumnMutationsContext = createContext<ColumnMutationsContextValue | null>(null);

export function ColumnMutationsProvider({
  children,
  projectId,
  boardId,
}: {
  children: ReactNode;
  projectId?: string;
  boardId?: string;
}) {
  const mutations = useColumnMutations(projectId, boardId);

  return (
    <ColumnMutationsContext.Provider value={mutations}>
      {children}
    </ColumnMutationsContext.Provider>
  );
}

export function useColumnMutationsContext(): ColumnMutationsContextValue {
  const context = useContext(ColumnMutationsContext);
  if (!context) {
    throw new Error('useColumnMutationsContext must be used within ColumnMutationsProvider');
  }
  return context;
}
