# Spec 003: DnD Drop Indicator - Store & Component

> **Estimated Time**: 25-30 minutes
> **Priority**: LOW (UX Polish)
> **Risk**: LOW
> **Depends On**: Nothing (can run in parallel with 003b)

## Problem Statement

When dragging tasks between columns, there's no clear visual indicator showing where the task will be dropped. Users must guess the drop position.

## Solution Overview

This spec covers **Part 1 of 2**:
1. Add `dropTarget` state to Zustand store
2. Create the `DropIndicator` visual component

The next spec (003b) covers integrating these into the Kanban board.

## Technical Context

### Current State

The Kanban board uses:
- **dnd-kit** for drag-and-drop (`@dnd-kit/core`, `@dnd-kit/sortable`)
- **Zustand** for state management
- **CVA** (class-variance-authority) for conditional styling

**Current store** (`src/features/kanban/utils/store.ts`):
```typescript
export type State = {
  tasks: Task[];
  columns: Column[];
  draggedTask: string | null;      // Tracks which task is being dragged
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
```

**Missing**: No state to track WHERE the drop will occur (which column, which index).

## Implementation Steps

### Step 1: Add dropTarget state to store

Modify `OpenKanban/src/features/kanban/utils/store.ts`:

**Add to State type:**
```typescript
export type State = {
  tasks: Task[];
  columns: Column[];
  draggedTask: string | null;
  currentBoardId: string | null;
  currentProjectId: string | null;
  dropTarget: {
    columnId: string;
    index: number;
  } | null;  // NEW
};
```

**Add to Actions type:**
```typescript
export type Actions = {
  setTasks: (tasks: Task[]) => void;
  setCols: (cols: Column[]) => void;
  dragTask: (id: string | null) => void;
  setBoardId: (boardId: string | null) => void;
  setProjectId: (projectId: string | null) => void;
  setDropTarget: (target: { columnId: string; index: number } | null) => void;  // NEW
};
```

**Update store implementation:**
```typescript
export const useTaskStore = create<State & Actions>((set) => ({
  tasks: [],
  columns: [{ id: 'backlog', title: 'Backlog' }],
  draggedTask: null,
  currentBoardId: null,
  currentProjectId: null,
  dropTarget: null,  // NEW

  setTasks: (tasks: Task[]) => set({ tasks }),
  setCols: (columns: Column[]) => set({ columns }),
  dragTask: (draggedTask: string | null) => set({ draggedTask }),
  setBoardId: (currentBoardId: string | null) => set({ currentBoardId }),
  setProjectId: (currentProjectId: string | null) => set({ currentProjectId }),
  setDropTarget: (dropTarget) => set({ dropTarget }),  // NEW
}));
```

### Step 2: Create DropIndicator component

Create new file `OpenKanban/src/features/kanban/components/drop-indicator.tsx`:

```typescript
'use client';

import { cn } from '@/lib/utils';

interface DropIndicatorProps {
  isActive: boolean;
}

/**
 * Visual indicator showing where a dragged item will be dropped.
 * Renders as a horizontal blue line when active.
 */
export function DropIndicator({ isActive }: DropIndicatorProps) {
  return (
    <div
      className={cn(
        'pointer-events-none h-0.5 w-full rounded-full transition-all duration-150 ease-out',
        isActive
          ? 'my-1 h-1 bg-primary opacity-100'
          : 'my-0 h-0 bg-transparent opacity-0'
      )}
      aria-hidden="true"
    />
  );
}
```

**Design Notes:**
- `pointer-events-none`: Doesn't interfere with drop detection
- `h-0.5` → `h-1`: Grows slightly when active for visibility
- `my-0` → `my-1`: Adds margin when active so it doesn't shift layout abruptly
- `transition-all duration-150`: Smooth animation
- `bg-primary`: Uses theme primary color (blue)
- `aria-hidden="true"`: Decorative, not for screen readers

## Expected Final Files

### store.ts (Complete)

```typescript
import { create } from 'zustand';
import type { Column, Task } from '../types';

export type { Task } from '../types';

export type State = {
  tasks: Task[];
  columns: Column[];
  draggedTask: string | null;
  currentBoardId: string | null;
  currentProjectId: string | null;
  dropTarget: {
    columnId: string;
    index: number;
  } | null;
};

export type Actions = {
  setTasks: (tasks: Task[]) => void;
  setCols: (cols: Column[]) => void;
  dragTask: (id: string | null) => void;
  setBoardId: (boardId: string | null) => void;
  setProjectId: (projectId: string | null) => void;
  setDropTarget: (target: { columnId: string; index: number } | null) => void;
};

export const useTaskStore = create<State & Actions>((set) => ({
  tasks: [],
  columns: [{ id: 'backlog', title: 'Backlog' }],
  draggedTask: null,
  currentBoardId: null,
  currentProjectId: null,
  dropTarget: null,

  setTasks: (tasks: Task[]) => set({ tasks }),
  setCols: (columns: Column[]) => set({ columns }),
  dragTask: (draggedTask: string | null) => set({ draggedTask }),
  setBoardId: (currentBoardId: string | null) => set({ currentBoardId }),
  setProjectId: (currentProjectId: string | null) => set({ currentProjectId }),
  setDropTarget: (dropTarget) => set({ dropTarget }),
}));
```

### drop-indicator.tsx (Complete)

```typescript
'use client';

import { cn } from '@/lib/utils';

interface DropIndicatorProps {
  isActive: boolean;
}

/**
 * Visual indicator showing where a dragged item will be dropped.
 * Renders as a horizontal blue line when active.
 */
export function DropIndicator({ isActive }: DropIndicatorProps) {
  return (
    <div
      className={cn(
        'pointer-events-none h-0.5 w-full rounded-full transition-all duration-150 ease-out',
        isActive
          ? 'my-1 h-1 bg-primary opacity-100'
          : 'my-0 h-0 bg-transparent opacity-0'
      )}
      aria-hidden="true"
    />
  );
}
```

## Verification

### Build Check
```bash
cd OpenKanban && pnpm run build
```
Expected: Build successful, no type errors

### Lint Check
```bash
cd OpenKanban && pnpm run lint
```
Expected: No errors

### Test Check
```bash
cd OpenKanban && pnpm test
```
Expected: All existing tests pass

### Type Check
The new state and action should be properly typed:
- `dropTarget` can be `null` or `{ columnId: string, index: number }`
- `setDropTarget` accepts the same type

## Acceptance Criteria

- [ ] `State` type includes `dropTarget: { columnId: string; index: number } | null`
- [ ] `Actions` type includes `setDropTarget`
- [ ] Store initializes with `dropTarget: null`
- [ ] `setDropTarget` action updates state correctly
- [ ] `DropIndicator` component created
- [ ] Component renders nothing visible when `isActive=false`
- [ ] Component renders blue line when `isActive=true`
- [ ] Smooth CSS transition between states
- [ ] `pnpm run build` passes
- [ ] `pnpm run lint` passes
- [ ] `pnpm test` passes

## Commit

After verification passes:
```bash
git add OpenKanban/src/features/kanban/utils/store.ts \
        OpenKanban/src/features/kanban/components/drop-indicator.tsx
        
git commit -m "feat(kanban): add dropTarget state and DropIndicator component"
```
