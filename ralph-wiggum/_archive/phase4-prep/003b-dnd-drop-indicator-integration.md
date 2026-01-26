# Spec 003b: DnD Drop Indicator - Integration

> **Estimated Time**: 30-35 minutes
> **Priority**: LOW (UX Polish)
> **Risk**: MEDIUM
> **Depends On**: Spec 003 (store & component must be complete)

## Problem Statement

Continuing from Spec 003, we now need to:
1. Track drop position during drag operations
2. Render drop indicators in the column
3. Clear state when drag ends

## Prerequisites

Before starting this spec, verify that Spec 003 is complete:
- [ ] `dropTarget` state exists in store (`src/features/kanban/utils/store.ts`)
- [ ] `setDropTarget` action exists in store
- [ ] `DropIndicator` component exists (`src/features/kanban/components/drop-indicator.tsx`)

**Verification Command**:
```bash
grep "dropTarget" OpenKanban/src/features/kanban/utils/store.ts
# Should return state and action definition
```

## Technical Context

### File Paths
All files are in `OpenKanban/src/features/kanban/components/`:
- `kanban-board.tsx`: DndContext orchestration
- `board-column.tsx`: Column rendering
- `task-card.tsx`: Card rendering
- `drop-indicator.tsx`: The indicator component

### Current DnD Flow

**kanban-board.tsx** event handlers:
- `onDragStart`: Sets `activeColumn` or `activeTask` for DragOverlay
- `onDragOver`: Reorders tasks optimistically (updates Zustand)
- `onDragEnd`: Persists changes to API, clears active states
- `announcements.onDragCancel`: Handles accessibility announcements (NOTE: we need a separate `onDragCancel` prop for state cleanup)

**board-column.tsx** renders:
- Column header with title
- ScrollArea containing TaskCards
- Uses `useSortable` for column drag

### Store Access Pattern

```typescript
// Read state (reactive)
const dropTarget = useTaskStore((state) => state.dropTarget);

// Write state (non-reactive, use in handlers)
useTaskStore.getState().setDropTarget({ columnId: 'abc', index: 2 });
```

**Note**: `tasks` variable in `kanban-board.tsx` comes from:
```typescript
const tasks = useTaskStore((state) => state.tasks);
```

## Implementation Steps

### Step 1: Update onDragOver in kanban-board.tsx

Find the `onDragOver` handler (around line 372) and add drop target tracking.

**Current structure** (simplified):
```typescript
const onDragOver = (event: DragOverEvent) => {
  const { active, over } = event;
  if (!over) return;
  
  // ... existing task reordering logic
};
```

**Add drop target tracking at the START of the handler:**

```typescript
const onDragOver = (event: DragOverEvent) => {
  const { active, over } = event;
  
  // Clear drop target if not over anything
  if (!over) {
    useTaskStore.getState().setDropTarget(null);
    return;
  }

  const overData = over.data.current;
  
  // Calculate and set drop target for visual indicator
  // Only track for Task drags (not Column drags)
  if (overData && hasDraggableData(over) && active.data.current?.type === 'Task') {
    if (overData.type === 'Column') {
      // Hovering over column itself (usually empty area or header)
      const columnId = over.id.toString();
      // useTaskStore.getState().tasks contains all tasks
      const tasks = useTaskStore.getState().tasks;
      const tasksInColumn = tasks.filter(t => t.columnId === columnId);
      
      useTaskStore.getState().setDropTarget({
        columnId,
        index: tasksInColumn.length, // Drop at end
      });
    } else if (overData.type === 'Task') {
      // Hovering over a specific task
      const overTask = overData.task as Task;
      const columnId = overTask.columnId;
      const tasks = useTaskStore.getState().tasks;
      const tasksInColumn = tasks.filter(t => t.columnId === columnId);
      const overIndex = tasksInColumn.findIndex(t => t.id === overTask.id);
      
      useTaskStore.getState().setDropTarget({
        columnId,
        index: overIndex >= 0 ? overIndex : 0,
      });
    }
  }

  // ... rest of existing reordering logic (keep unchanged)
};
```

**Import Task type if not already imported:**
```typescript
import type { Task, Column } from '../types';
```

### Step 2: Clear dropTarget in onDragEnd

Find the `onDragEnd` handler (around line 337) and add cleanup.

**Add at the VERY START of the handler:**
```typescript
const onDragEnd = (event: DragEndEvent) => {
  // Clear drop indicator immediately
  useTaskStore.getState().setDropTarget(null);
  
  // ... rest of existing logic
};
```

### Step 3: Add onDragCancel handler

Check if `onDragCancel` exists. If not, add it to the DndContext.
**Note**: `accessibility={{ announcements }}` handles accessibility cancel events, but we need a top-level handler for state cleanup.

**Find the DndContext component** (around line 425):
```typescript
<DndContext
  sensors={sensors}
  onDragStart={onDragStart}
  onDragEnd={onDragEnd}
  onDragOver={onDragOver}
  // ... other props
>
```

**Add onDragCancel:**
```typescript
const onDragCancel = () => {
  useTaskStore.getState().setDropTarget(null);
  setActiveColumn(null);
  setActiveTask(null);
};

// In JSX:
<DndContext
  sensors={sensors}
  onDragStart={onDragStart}
  onDragEnd={onDragEnd}
  onDragOver={onDragOver}
  onDragCancel={onDragCancel}  // ADD THIS
  // ... other props
>
```

### Step 4: Render DropIndicator in board-column.tsx

Modify `OpenKanban/src/features/kanban/components/board-column.tsx`.

**Add imports:**
```typescript
import { Fragment } from 'react'; // Add Fragment if missing
import { DropIndicator } from './drop-indicator';
import { useTaskStore } from '../utils/store';
```

**Inside the BoardColumn component, subscribe to dropTarget:**
```typescript
export function BoardColumn({ column, tasks: tasksProp, isOverlay }: BoardColumnProps) {
  // Add this near the top of the component
  const dropTarget = useTaskStore((state) => state.dropTarget);
  // Ensure we compare strings to strings (dnd-kit uses UniqueIdentifier)
  const isDropTargetColumn = dropTarget?.columnId === column.id.toString();
  
  // ... existing code
}
```

**Find where tasks are rendered** (look for `tasks.map` or `tasksProp.map`).

Current structure (simplified):
```typescript
<ScrollArea>
  {tasks.map((task) => (
    <TaskCard key={task.id} task={task} />
  ))}
</ScrollArea>
```

**Replace with drop indicators:**
```typescript
<ScrollArea>
  {tasks.map((task, index) => (
    <Fragment key={task.id}>
      <DropIndicator 
        isActive={isDropTargetColumn && dropTarget?.index === index} 
      />
      <TaskCard task={task} />
    </Fragment>
  ))}
  {/* Drop indicator at the end of the column */}
  <DropIndicator 
    isActive={isDropTargetColumn && dropTarget?.index === tasks.length} 
  />
</ScrollArea>
```

### Step 5: Handle column ID type

The store uses `string` for `columnId`, but dnd-kit uses `UniqueIdentifier` which can be `string | number`. Ensure consistent conversion:

```typescript
// When comparing:
const isDropTargetColumn = dropTarget?.columnId === column.id.toString();
```

## Code Snippets Summary

### kanban-board.tsx changes

```typescript
// Near top with other handlers:
const onDragCancel = () => {
  useTaskStore.getState().setDropTarget(null);
  setActiveColumn(null);
  setActiveTask(null);
};

// Inside onDragOver (at the start):
if (!over) {
  useTaskStore.getState().setDropTarget(null);
  return;
}

const overData = over.data.current;
// Only track if we are dragging a Task
if (overData && hasDraggableData(over) && active.data.current?.type === 'Task') {
  if (overData.type === 'Column') {
    const columnId = over.id.toString();
    const tasks = useTaskStore.getState().tasks;
    const tasksInColumn = tasks.filter(t => t.columnId === columnId);
    useTaskStore.getState().setDropTarget({
      columnId,
      index: tasksInColumn.length,
    });
  } else if (overData.type === 'Task') {
    const overTask = overData.task as Task;
    const columnId = overTask.columnId;
    const tasks = useTaskStore.getState().tasks;
    const tasksInColumn = tasks.filter(t => t.columnId === columnId);
    const overIndex = tasksInColumn.findIndex(t => t.id === overTask.id);
    useTaskStore.getState().setDropTarget({
      columnId,
      index: overIndex >= 0 ? overIndex : 0,
    });
  }
}

// Inside onDragEnd (at the very start):
useTaskStore.getState().setDropTarget(null);

// In DndContext JSX:
onDragCancel={onDragCancel}
```

### board-column.tsx changes

```typescript
import { Fragment } from 'react';
import { DropIndicator } from './drop-indicator';
import { useTaskStore } from '../utils/store';

// Inside component:
const dropTarget = useTaskStore((state) => state.dropTarget);
const isDropTargetColumn = dropTarget?.columnId === column.id.toString();

// In render (task list):
{tasks.map((task, index) => (
  <Fragment key={task.id}>
    <DropIndicator 
      isActive={isDropTargetColumn && dropTarget?.index === index} 
    />
    <TaskCard task={task} />
  </Fragment>
))}
<DropIndicator 
  isActive={isDropTargetColumn && dropTarget?.index === tasks.length} 
/>
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
Expected: All tests pass

### Manual Testing

1. Start dev server: `cd OpenKanban && pnpm run dev`
2. Open `http://localhost:37291`
3. Navigate to a board with multiple columns and tasks

**Test Case 1: Indicator appears during drag**
- Start dragging a task card
- Move over another column
- ✓ Blue horizontal line should appear showing drop position
- ✓ Line should be between tasks (or at end of column)

**Test Case 2: Indicator follows cursor**
- While dragging, move cursor up and down within a column
- ✓ Indicator should move to show current drop position
- ✓ Movement should be smooth (transition animation)

**Test Case 3: Indicator clears on drop**
- Drop the task
- ✓ Indicator should disappear immediately

**Test Case 4: Indicator clears on cancel**
- Start dragging
- Press Escape key
- ✓ Indicator should disappear
- ✓ Task should return to original position

**Test Case 5: Empty column**
- Drag a task over an empty column
- ✓ Indicator should appear at the column (index 0 or end)

**Test Case 6: Performance**
- Drag rapidly between columns
- ✓ No lag or jank
- ✓ 60fps smooth animation

## Visual Reference

```
Before (current):              After (with indicator):
┌─────────────┐               ┌─────────────┐
│ In Progress │               │ In Progress │
├─────────────┤               ├─────────────┤
│ ┌─────────┐ │               │ ┌─────────┐ │
│ │ Task 1  │ │               │ │ Task 1  │ │
│ └─────────┘ │               │ └─────────┘ │
│ ┌─────────┐ │    Drag →     │ ══════════  │ ← Blue line
│ │ Task 2  │ │               │ ┌─────────┐ │
│ └─────────┘ │               │ │ Task 2  │ │
│             │               │ └─────────┘ │
└─────────────┘               └─────────────┘
```

## Acceptance Criteria

- [ ] `onDragOver` updates `dropTarget` state
- [ ] `onDragEnd` clears `dropTarget` state
- [ ] `onDragCancel` clears `dropTarget` state
- [ ] `DropIndicator` renders before each task in column
- [ ] `DropIndicator` renders at end of column
- [ ] Only the active indicator is visible
- [ ] Indicator follows cursor position smoothly
- [ ] Indicator disappears immediately on drop/cancel
- [ ] No performance degradation
- [ ] `pnpm run build` passes
- [ ] `pnpm run lint` passes
- [ ] `pnpm test` passes

## Commit

After both Spec 003 and 003b are complete and verified:

```bash
git add src/features/kanban/utils/store.ts \
        src/features/kanban/components/drop-indicator.tsx \
        src/features/kanban/components/kanban-board.tsx \
        src/features/kanban/components/board-column.tsx
        
git commit -m "feat(kanban): add visual drop indicators for drag-and-drop"
```
