# Phase 5 Issues & Mitigation Strategy

> **Created**: 2026-01-27  
> **Status**: Active  
> **Phase**: 5 - UI/UX Polish & Workflow

## Overview

This document tracks issues discovered during the Phase 5 code review and browser testing session. Issues are categorized by priority with specific mitigation strategies.

---

## P0 - Critical (Blocking User Functionality)

### ISSUE-5.1: InfoSidebar Not Visually Rendering

**Severity**: Critical  
**Component**: `src/components/ui/infobar.tsx`, `src/features/kanban/components/task-card.tsx`  
**Discovered**: 2026-01-27

#### Symptom
Clicking on a task card should open the InfoSidebar showing task details, description editor, and session linking options. The panel elements exist in the accessibility tree but are not visually rendered.

#### Evidence
- Accessibility tree shows: `heading "Task A"`, `textbox "Add a description..."`, `button "Link Session"`, `button "Create Branch"`
- Screenshot shows empty right side - no visible panel
- Toggle button (`Toggle info infobar`) doesn't make panel visible either

#### Root Cause Analysis
Suspected causes (investigate in order):
1. CSS `visibility` or `display` property issue
2. Z-index conflict with other elements
3. Transform/translate positioning off-screen
4. Sheet component `open` state not propagating correctly

#### Mitigation Strategy
```bash
# Step 1: Debug CSS in browser DevTools
# Inspect the Sheet/SheetContent component for computed styles

# Step 2: Check if panel is rendered off-screen
# Look for transform: translateX(100%) or similar

# Step 3: Verify state propagation
# Add console.log in useInfobar hook to trace open/setOpen calls

# Step 4: Test without Sheet wrapper
# Temporarily render content directly to isolate issue
```

#### Files to Investigate
- `src/components/ui/infobar.tsx` - Lines 100-200 (rendering logic)
- `src/components/ui/sheet.tsx` - Radix Sheet wrapper
- `src/components/layout/info-sidebar.tsx` - Layout integration

---

### ISSUE-5.2: Board Content Left-Side Clipping

**Severity**: Critical  
**Component**: `src/app/project/[projectId]/layout.tsx`, `src/components/ui/sidebar.tsx`  
**Discovered**: 2026-01-27

#### Symptom
The leftmost Kanban column (Backlog) is partially cut off on the left edge. Column title and task card content are obscured.

#### Evidence
- Screenshots show truncated text: "...nd" in header, "...e Review" in cards
- Issue persists across multiple viewport sizes
- Affects usability - users cannot see full column

#### Root Cause Analysis
Suspected causes:
1. Sidebar width CSS variable (`--sidebar-width`) not accounting for board margin
2. Board container `margin-left` or `padding-left` insufficient
3. Flexbox/grid layout calculation error in `SidebarInset`

#### Mitigation Strategy
```bash
# Step 1: Inspect layout in DevTools
# Check computed width of sidebar vs available space for board

# Step 2: Verify CSS variables
cat src/components/ui/sidebar.tsx | grep "SIDEBAR_WIDTH"
# Ensure consistent usage across components

# Step 3: Add explicit left padding to board container
# In kanban-board.tsx or page layout

# Step 4: Test with sidebar collapsed
# Verify clipping only occurs with sidebar open
```

#### Files to Investigate
- `src/components/ui/sidebar.tsx` - Width constants and CSS variables
- `src/app/project/[projectId]/board/[boardId]/page.tsx` - Board container
- `src/features/kanban/components/kanban-board.tsx` - Board layout

---

## P1 - High (Degraded Experience)

### ISSUE-5.3: Column Reorder Not Persisted

**Severity**: High  
**Component**: `src/features/kanban/hooks/use-column-mutations.ts`, `src/features/kanban/components/kanban-board.tsx`  
**Discovered**: 2026-01-27

#### Symptom
Dragging columns to reorder them works visually but the new order is lost on page refresh. Only in-memory Zustand state is updated.

#### Evidence
- `use-column-mutations.ts` has Add/Update/Remove mutations but no reorder
- `onDragEnd` in `kanban-board.tsx` handles column drag but doesn't persist
- Board `columnConfig` in SQLite retains original order after refresh

#### Root Cause
No API mutation triggered when columns are reordered. The `updateBoard` endpoint exists but isn't called.

#### Mitigation Strategy
```typescript
// Step 1: Add reorderColumns mutation to use-column-mutations.ts
export function useReorderColumnsMutation(boardId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (columns: ColumnConfig[]) => {
      return updateBoard(boardId, { columnConfig: columns });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.board(boardId) });
    }
  });
}

// Step 2: Call mutation in kanban-board.tsx onDragEnd
// When isActiveAColumn is true, trigger the mutation

// Step 3: Verify backend accepts full columnConfig array
// PUT /api/boards/:id should handle column ordering
```

#### Files to Modify
- `src/features/kanban/hooks/use-column-mutations.ts` - Add reorder mutation
- `src/features/kanban/components/kanban-board.tsx` - Hook into onDragEnd
- `src/app/api/boards/[id]/route.ts` - Verify PATCH handles columnConfig

---

### ISSUE-5.4: Initial Load Race Condition

**Severity**: High  
**Component**: `src/features/kanban/components/kanban-board.tsx`  
**Discovered**: 2026-01-27

#### Symptom
Task cards sometimes don't appear on initial page load. After a manual page reload, cards appear correctly.

#### Evidence
- First load showed empty columns despite tasks existing in database
- No JavaScript console errors
- Reload fixed the issue immediately
- API returns correct data when called directly

#### Root Cause Analysis
Suspected causes:
1. React Query cache not hydrated before render
2. Zustand store sync timing issue with React Query
3. `useEffect` dependency array missing required values
4. Server-side vs client-side hydration mismatch

#### Mitigation Strategy
```typescript
// Step 1: Add explicit loading state
// Ensure skeleton/loading UI shows during data fetch

// Step 2: Check useEffect sync logic
// In kanban-board.tsx, verify dependency array
useEffect(() => {
  if (data && draggedTask === null) {
    setTasks(data.tasks);
  }
}, [data, draggedTask, setTasks]); // Verify all deps present

// Step 3: Add Suspense boundary if using RSC
// Wrap KanbanBoard in Suspense with fallback

// Step 4: Debug with React DevTools
// Check if query is in 'loading' state during empty render
```

#### Files to Investigate
- `src/features/kanban/components/kanban-board.tsx` - Data sync logic
- `src/app/project/[projectId]/board/[boardId]/page.tsx` - Suspense boundaries
- `src/lib/query-client.ts` - Query client configuration

---

## P2 - Medium (Polish & UX)

### ISSUE-5.5: Task Card Click Area Ambiguity

**Severity**: Medium  
**Component**: `src/features/kanban/components/task-card.tsx`  
**Discovered**: 2026-01-27

#### Symptom
Users may not realize the entire card is clickable to open details. The only visible interactive element is the drag handle.

#### Evidence
- Screenshot analysis noted "No explicit button" for opening details
- Accessibility tree shows card as clickable but no visual affordance

#### Mitigation Strategy
```tsx
// Option A: Add hover state visual feedback
<Card
  className={cn(
    'cursor-pointer p-3',
    'hover:border-primary/50 hover:shadow-md transition-all'
  )}
  onClick={handleCardClick}
>

// Option B: Add explicit "View Details" button
<Button variant="ghost" size="sm" onClick={handleCardClick}>
  <IconEye className="h-4 w-4" />
</Button>

// Option C: Add tooltip on hover
<TooltipProvider>
  <Tooltip>
    <TooltipTrigger asChild>
      <Card onClick={handleCardClick}>...</Card>
    </TooltipTrigger>
    <TooltipContent>Click to view details</TooltipContent>
  </Tooltip>
</TooltipProvider>
```

---

### ISSUE-5.6: Description Editor Shows Placeholder for Existing Tasks

**Severity**: Medium  
**Component**: `src/features/kanban/components/task-description-editor.tsx`  
**Discovered**: 2026-01-27

#### Symptom
When opening InfoSidebar for "Task A" (which has no description), the editor shows correct placeholder. However, for tasks WITH descriptions, need to verify the existing content loads correctly.

#### Evidence
- Accessibility tree showed `textbox "Add a description..."` for Task A
- Task A has empty description in database
- Need to verify tasks with descriptions show their content

#### Mitigation Strategy
```typescript
// Step 1: Verify initialDescription prop is passed correctly
<TaskDescriptionEditor
  taskId={task.id}
  initialDescription={task.description || ''}  // Ensure not undefined
/>

// Step 2: Check controlled vs uncontrolled state
// Ensure textarea uses defaultValue for initial render
// or properly syncs with parent state

// Step 3: Test with task that has description
// "Test Task for Code Review" has description - verify it shows
```

---

### ISSUE-5.7: Missing "New Board" Functionality

**Severity**: Medium  
**Component**: Sidebar  
**Discovered**: 2026-01-27

#### Symptom
"New Board" appears under expanded projects but clickability/functionality wasn't verified.

#### Mitigation Strategy
```bash
# Step 1: Verify CreateBoardDialog exists and is wired up
cat src/features/boards/components/create-board-dialog.tsx

# Step 2: Test clicking "New Board" in browser
agent-browser find text "New Board" click

# Step 3: Verify board creation flow
# - Dialog opens
# - Name can be entered
# - Submit creates board in database
# - New board appears in sidebar
```

---

## P3 - Low (Nice to Have)

### ISSUE-5.8: Session Linking Not Fully Tested

**Severity**: Low  
**Component**: `src/features/kanban/components/task-infobar-actions.tsx`  
**Discovered**: 2026-01-27

#### Symptom
"Link Session" button exists in InfoSidebar but functionality was not tested due to InfoSidebar rendering bug.

#### Mitigation Strategy
```bash
# Prerequisite: Fix ISSUE-5.1 first

# Step 1: Open InfoSidebar for a task
# Step 2: Click "Link Session" button
# Step 3: Verify dialog/modal opens
# Step 4: Test searching for sessions
# Step 5: Verify linking persists to database
# Step 6: Verify linked sessions appear in UI
```

---

### ISSUE-5.9: Create Branch Button Placeholder

**Severity**: Low  
**Component**: `src/features/kanban/components/task-infobar-actions.tsx`  
**Discovered**: 2026-01-27

#### Symptom
"Create Branch" button visible in accessibility tree. Functionality status unknown.

#### Mitigation Strategy
```bash
# Step 1: Check if button has actual implementation
grep -n "Create Branch" src/features/kanban/components/task-infobar-actions.tsx

# Step 2: If placeholder, add TODO comment
// TODO: Phase 5 Integration - Implement git branch creation

# Step 3: If implemented, test functionality
# - Click button
# - Verify dialog/action
# - Verify git integration
```

---

## Summary Table

| ID       | Title                              | Priority | Status    | Owner | Spec Link |
| -------- | ---------------------------------- | -------- | --------- | ----- | --------- |
| ISSUE-5.1 | InfoSidebar Not Rendering          | P0       | Open      | TBD   | [Spec 5.6](../ralph-wiggum/specs/5.6-fix-infobar-rendering.md) |
| ISSUE-5.2 | Board Content Clipping             | P0       | Open      | TBD   | [Spec 5.7](../ralph-wiggum/specs/5.7-fix-board-clipping.md) |
| ISSUE-5.3 | Column Reorder Not Persisted       | P1       | Open      | TBD   | [Spec 5.8](../ralph-wiggum/specs/5.8-column-reorder-persistence.md) |
| ISSUE-5.4 | Initial Load Race Condition        | P1       | Open      | TBD   | [Spec 5.9](../ralph-wiggum/specs/5.9-fix-initial-load-race.md) |
| ISSUE-5.5 | Task Card Click Ambiguity          | P2       | Open      | TBD   | [Spec 5.10](../ralph-wiggum/specs/5.10-task-card-click-affordance.md) |
| ISSUE-5.6 | Description Editor Verification    | P2       | Open      | TBD   | [Spec 5.11](../ralph-wiggum/specs/5.11-verify-description-editor.md) |
| ISSUE-5.7 | New Board Functionality            | P2       | Open      | TBD   | [Spec 5.12](../ralph-wiggum/specs/5.12-new-board-functionality.md) |
| ISSUE-5.8 | Session Linking Not Tested         | P3       | Blocked   | TBD   | [Spec 5.13](../ralph-wiggum/specs/5.13-session-linking.md) |
| ISSUE-5.9 | Create Branch Placeholder          | P3       | Open      | TBD   | [Spec 5.14](../ralph-wiggum/specs/5.14-create-branch-feature.md) |

---

## Next Steps

1. **Immediate**: Fix P0 issues (ISSUE-5.1, ISSUE-5.2) before any other Phase 5 work
2. **This Sprint**: Address P1 issues (ISSUE-5.3, ISSUE-5.4) for workflow reliability
3. **Polish**: P2 issues for improved UX
4. **Backlog**: P3 issues can be deferred to Phase 6 if needed

---

## References

- `docs/ROADMAP.md` - Phase 5 requirements
- `ralph-wiggum/specs/5.1-sidebar-overhaul.md` - Sidebar spec
- `ralph-wiggum/specs/5.2-task-card-editor.md` - Task editor spec
- `ralph-wiggum/specs/5.3-workflow-persistence.md` - D&D persistence spec
