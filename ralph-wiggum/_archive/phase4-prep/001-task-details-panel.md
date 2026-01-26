# Spec 001: Task Details Panel Click Handler

> **Estimated Time**: 30 minutes
> **Priority**: HIGH (Blocker)
> **Risk**: LOW

## Problem Statement

When users click on a task card in the Kanban board, the info sidebar shows "No content available" instead of displaying the task's details. This is a critical UX blocker.

## Root Cause

The `TaskCard` component has no click handler. The info sidebar (`InfoSidebar`) expects content to be set via `useInfobar().setContent()`, but `TaskCard` never calls this function.

**Current State:**
```typescript
// task-card.tsx - NO click handler exists
export function TaskCard({ task, isOverlay }: TaskCardProps) {
  // Only drag-and-drop logic, no click handling
  return (
    <Card ref={setNodeRef} style={style} className={...}>
      {/* No onClick */}
    </Card>
  );
}
```

**Expected State:**
- Clicking a task card should open the info sidebar
- Sidebar should display task title and description
- Clicking during drag should NOT trigger the sidebar

## Technical Context

### Files to Modify

**Primary File:**
- `OpenKanban/src/features/kanban/components/task-card.tsx`

### Key Dependencies

**useInfobar Hook** (`OpenKanban/src/components/ui/infobar.tsx:66-73`):
```typescript
function useInfobar() {
  const context = React.useContext(InfobarContext);
  if (!context) {
    throw new Error('useInfobar must be used within a InfobarProvider.');
  }
  return context;
}
// Returns: { setContent, setOpen, content, open, ... }
```

**InfobarContent Type** (`OpenKanban/src/components/ui/infobar.tsx:46-49`):
```typescript
export type InfobarContent = {
  title: string;
  sections: DescriptiveSection[];
};

export type DescriptiveSection = {
  title: string;
  description: string;
  links?: HelpfulLink[];
};
```

**Task Type** (`OpenKanban/src/features/kanban/types.ts:12-17`):
```typescript
export type Task = {
  id: string;
  title: string;
  description?: string;
  columnId: string;
};
```

**Existing Pattern** (`OpenKanban/src/components/ui/info-button.tsx:29-38`):
```typescript
const { setContent, setOpen } = useInfobar();

const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
  setContent(content);
  setOpen(true);
  props.onClick?.(e);
};
```

## Implementation Steps

### Step 1: Add use client directive

Ensure `task-card.tsx` starts with `'use client';` since it uses client-side hooks (`useInfobar`, `useSortable`).

### Step 2: Add imports

Add these imports at the top of `task-card.tsx`:

```typescript
import { useInfobar, type InfobarContent } from '@/components/ui/infobar';
import { cn } from '@/lib/utils';
```

### Step 3: Get infobar context

Inside the `TaskCard` component, add:

```typescript
const { setContent, setOpen } = useInfobar();
```

### Step 4: Create click handler

Add the handler function inside the component:

```typescript
const handleCardClick = () => {
  // Don't trigger during drag operations
  if (isOverlay || isDragging) return;
  
  const content: InfobarContent = {
    title: task.title,
    sections: [
      {
        title: 'Description',
        description: task.description || 'No description provided.',
        links: []
      }
    ]
  };
  
  setContent(content);
  setOpen(true);
};
```

### Step 5: Attach click handler to Card

Update the Card component to include onClick. Also add `cursor-pointer` for UX:

```typescript
<Card
  ref={setNodeRef}
  style={style}
  className={cn(variants({
    dragging: isOverlay ? 'overlay' : isDragging ? 'over' : undefined
  }), 'cursor-pointer')}  // Add cursor-pointer
  onClick={handleCardClick}  // Add click handler
>
```

## Expected Final Code

```typescript
'use client'; // Ensure this is present

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useInfobar, type InfobarContent } from '@/components/ui/infobar';
import type { Task, TaskDragData } from '../types';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cva } from 'class-variance-authority';
import { IconGripVertical } from '@tabler/icons-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils'; // Ensure this is imported

interface TaskCardProps {
  task: Task;
  isOverlay?: boolean;
}

export function TaskCard({ task, isOverlay }: TaskCardProps) {
  const { setContent, setOpen } = useInfobar();
  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: task.id,
    data: {
      type: 'Task',
      task
    } satisfies TaskDragData,
    attributes: {
      roleDescription: 'Task'
    }
  });

  const style = {
    transition,
    transform: CSS.Translate.toString(transform)
  };

  const variants = cva('mb-2', {
    variants: {
      dragging: {
        over: 'ring-2 opacity-30',
        overlay: 'ring-2 ring-primary'
      }
    }
  });

  const handleCardClick = () => {
    if (isOverlay || isDragging) return;
    
    const content: InfobarContent = {
      title: task.title,
      sections: [
        {
          title: 'Description',
          description: task.description || 'No description provided.',
          links: []
        }
      ]
    };
    
    setContent(content);
    setOpen(true);
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(variants({
        dragging: isOverlay ? 'overlay' : isDragging ? 'over' : undefined
      }), 'cursor-pointer')}
      onClick={handleCardClick}
    >
      <CardHeader className='space-between border-secondary relative flex flex-row border-b-2 px-3 py-3'>
        <Button
          variant={'ghost'}
          {...attributes}
          {...listeners}
          className='text-secondary-foreground/50 -ml-2 h-auto cursor-grab p-1'
        >
          <span className='sr-only'>Move task</span>
          <IconGripVertical />
        </Button>
        <Badge variant={'outline'} className='ml-auto font-semibold'>
          Task
        </Badge>
      </CardHeader>
      <CardContent className='px-3 pt-3 pb-6 text-left whitespace-pre-wrap'>
        {task.title}
      </CardContent>
    </Card>
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

### Manual Testing

1. Start dev server: `cd OpenKanban && pnpm run dev`
2. Open `http://localhost:37291`
3. Navigate to any project board with tasks

**Test Case 1: Click opens sidebar**
- Click on any task card
- ✓ Info sidebar should slide open from the right
- ✓ Sidebar header should show the task title
- ✓ Sidebar body should show "Description" section with task description

**Test Case 2: Click during drag does NOT open sidebar**
- Start dragging a task card (grab the grip icon)
- While dragging, release over the card body
- ✓ Sidebar should NOT open

**Test Case 3: Overlay card click**
- Start dragging a task
- The floating overlay card should not respond to clicks (it's for visual feedback only)

## Acceptance Criteria

- [ ] `pnpm run build` passes with no errors
- [ ] `pnpm run lint` passes with no errors
- [ ] Clicking task card opens info sidebar
- [ ] Sidebar displays task title as header
- [ ] Sidebar displays task description in sections
- [ ] Clicking during drag does not trigger sidebar
- [ ] Cursor changes to pointer on hover
- [ ] No regression in drag-and-drop functionality

## Commit

After verification passes:
```bash
git add OpenKanban/src/features/kanban/components/task-card.tsx
git commit -m "fix(kanban): add click handler to TaskCard for info sidebar"
```
