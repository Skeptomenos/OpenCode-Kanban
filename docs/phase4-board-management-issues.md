# Phase 4 Board Management - Issues & Mitigation Plan

> **Created:** 2026-01-26
> **Status:** Post-implementation review findings
> **Related:** `ralph-wiggum/specs/4.*.md`, `docs/ROADMAP.md`

---

## Medium Priority Issues

### M1. Missing `rename-board-dialog.tsx` in Spec File Structure

**Location:** `ralph-wiggum/specs/board-management.md:L118-123`

**Description:** The spec file structure documentation doesn't list `rename-board-dialog.tsx`:
```
OpenKanban/src/features/boards/
├── components/
│   ├── board-actions-menu.tsx
│   ├── create-board-dialog.tsx
│   └── delete-board-dialog.tsx  ← Missing rename-board-dialog.tsx
```

**Impact:** Documentation inconsistency. No code impact - file exists and works correctly.

**Mitigation Plan:**
1. Update `ralph-wiggum/specs/board-management.md` file structure to include `rename-board-dialog.tsx`
2. **Owner:** Documentation task
3. **Effort:** 5 minutes
4. **Priority:** Low - can be done during next spec update

---

### M2. `useBoards` Hook Called Unconditionally with Empty String

**Location:** `src/components/layout/app-sidebar.tsx:33-37`

**Description:** The hook is called with an empty string when `projectId` is undefined:
```typescript
const {
  boards,
  isLoading: boardsLoading,
  error: boardsError,
} = useBoards(projectId ?? '');  // ← Called with '' when no projectId
```

While the hook has an `enabled: Boolean(projectId)` guard, passing an empty string means the query key becomes `['boards', { parentId: '' }]` which creates unnecessary cache entries.

**Impact:** Minor cache pollution. No functional impact due to `enabled` guard.

**Mitigation Plan:**
1. **Option A (Recommended):** Document this as intentional pattern with a comment explaining the `enabled` guard prevents execution
2. **Option B:** Refactor to conditionally call the hook using a wrapper component pattern
3. **Owner:** Frontend engineer
4. **Effort:** 15-30 minutes for Option B
5. **Priority:** Medium - address before Phase 5

**Recommended Action:**
```typescript
// Add comment to clarify intent:
// Note: Hook is safe to call with empty string - `enabled` guard prevents fetch
const { boards, isLoading: boardsLoading, error: boardsError } = useBoards(projectId ?? '');
```

---

### M3. `BoardActionsMenu` Positioned Outside `SidebarMenuButton`

**Location:** `src/components/layout/app-sidebar.tsx:160-164`

**Description:** The actions menu is a sibling of the menu button rather than using the `SidebarMenuAction` slot pattern:
```tsx
<SidebarMenuItem key={board.id} className='group/board'>
  <SidebarMenuButton ...>
    <Link href={...}>...</Link>
  </SidebarMenuButton>
  <BoardActionsMenu ... />  {/* Sibling, not using SidebarMenuAction */}
</SidebarMenuItem>
```

**Impact:** UI/layout edge case in collapsed sidebar icon-only mode. The `group/board` class properly scopes hover states for now.

**Mitigation Plan:**
1. Test behavior in collapsed sidebar icon-only mode
2. If issues arise, refactor to use `SidebarMenuAction` slot component from shadcn/ui
3. **Owner:** Frontend engineer
4. **Effort:** 30-60 minutes if refactor needed
5. **Priority:** Medium - verify during UX testing

**Test Checklist:**
- [ ] Collapse sidebar to icon-only mode
- [ ] Hover over board items - verify actions menu appears correctly
- [ ] Click actions menu - verify dropdown positions correctly
- [ ] If issues found, create follow-up ticket

---

## Low Priority Issues

### L1. Inconsistent Status Mapping Values

**Location:** 
- `src/features/boards/components/create-board-dialog.tsx:39-43`
- `src/lib/db/__tests__/repository-boards.test.ts:31`

**Description:** Status value uses hyphen in production code but underscore in tests:
```typescript
// Production (create-board-dialog.tsx)
{ id: 'in-progress', title: 'In Progress', statusMappings: ['in-progress'] }

// Tests (repository-boards.test.ts)
{ id: 'col-2', title: 'In Progress', statusMappings: ['in_progress'] }
```

**Impact:** Potential mismatch if issues use `in_progress` status - cards might not appear in correct column.

**Mitigation Plan:**
1. Audit existing issue statuses in database: `SELECT DISTINCT status FROM issues`
2. Define canonical status values in a shared constants file: `src/lib/constants/statuses.ts`
3. Update all status references to use constants
4. Add test to verify default board statuses match issue creation defaults
5. **Owner:** Backend/Data engineer
6. **Effort:** 1-2 hours
7. **Priority:** Low - address in Phase 5 or dedicated tech debt sprint

**Proposed Constants File:**
```typescript
// src/lib/constants/statuses.ts
export const ISSUE_STATUSES = {
  BACKLOG: 'backlog',
  IN_PROGRESS: 'in-progress',  // Use hyphen as canonical
  DONE: 'done',
} as const;
```

---

### L2. Missing Error Boundary on Board Components

**Location:** All dialog components in `src/features/boards/components/`

**Description:** No error boundaries wrap the mutation-heavy dialog components. If a mutation throws unexpectedly during render, the entire sidebar could crash.

**Impact:** Low - mutations have proper try/catch in API layer and `onError` callbacks in mutation hooks.

**Mitigation Plan:**
1. Create a generic `DialogErrorBoundary` component
2. Wrap `BoardActionsMenu` (which contains both dialogs) with the boundary
3. Implement fallback UI that allows retry or dismissal
4. **Owner:** Frontend engineer
5. **Effort:** 1-2 hours
6. **Priority:** Low - nice-to-have for robustness

**Example Implementation:**
```tsx
// src/components/ui/dialog-error-boundary.tsx
export class DialogErrorBoundary extends React.Component {
  state = { hasError: false };
  
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  
  render() {
    if (this.state.hasError) {
      return <div className="text-destructive text-sm">Something went wrong</div>;
    }
    return this.props.children;
  }
}
```

---

### L3. No Optimistic Updates on Mutations

**Location:** `src/features/boards/hooks/use-board-mutations.ts`

**Description:** All mutations use simple cache invalidation:
```typescript
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ['boards'] });
},
```

This causes a refetch on every mutation, resulting in a brief loading state before UI updates.

**Impact:** Slight delay after mutations before UI updates. Network-dependent UX.

**Mitigation Plan:**
1. Implement optimistic updates for `useUpdateBoard` (rename) - most visible
2. Implement optimistic updates for `useDeleteBoard` - remove from list immediately
3. Keep `useCreateBoard` as-is (needs server ID, optimistic is complex)
4. **Owner:** Frontend engineer
5. **Effort:** 2-3 hours
6. **Priority:** Low - tracked in Phase 5 roadmap

**Example for Rename:**
```typescript
export function useUpdateBoard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }) => updateBoard(id, input),
    onMutate: async ({ id, input }) => {
      await queryClient.cancelQueries({ queryKey: ['boards'] });
      const previous = queryClient.getQueryData(['boards']);
      
      queryClient.setQueriesData({ queryKey: ['boards'] }, (old) =>
        old?.map((b) => (b.id === id ? { ...b, ...input } : b))
      );
      
      return { previous };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(['boards'], context?.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['boards'] });
    },
  });
}
```

---

### L4. `BOLA` TODO Comment References Wrong Phase

**Location:** `src/services/board-service.ts:21-26`

**Description:** The TODO comment mentions "Phase 4" but Phase 4 is now complete:
```typescript
/**
 * @todo Phase 4: Implement BOLA enforcement
 * - Add ownerId column to database schema
 * ...
 */
```

**Impact:** Documentation confusion - readers might think BOLA was supposed to be in Phase 4.

**Mitigation Plan:**
1. Update TODO to reference correct future phase (Phase 6 or "Future")
2. Consider creating a ticket in issue tracker for BOLA implementation
3. **Owner:** Any engineer
4. **Effort:** 5 minutes
5. **Priority:** Low - quick fix

**Updated Comment:**
```typescript
/**
 * @todo Future: Implement BOLA enforcement (multi-tenant support)
 * - Add ownerId column to database schema
 * - Pass ownerId to all repository methods
 * - Filter queries by owner for multi-tenant security
 * @see docs/ISSUES.md for tracking
 */
```

---

### L5. Missing JSDoc on Barrel Export

**Location:** `src/features/boards/index.ts`

**Description:** Barrel file has no module-level documentation explaining what the feature provides.

**Impact:** Minor DX issue - developers must read individual files to understand feature scope.

**Mitigation Plan:**
1. Add JSDoc header to barrel file
2. **Owner:** Any engineer
3. **Effort:** 5 minutes
4. **Priority:** Low - documentation hygiene

**Proposed Update:**
```typescript
/**
 * Boards Feature Module
 * 
 * Provides UI components and hooks for board CRUD operations within projects.
 * 
 * Components:
 * - CreateBoardDialog: Dialog for creating new boards
 * - DeleteBoardDialog: Confirmation dialog for board deletion
 * - RenameBoardDialog: Dialog for renaming boards
 * - BoardActionsMenu: Dropdown menu orchestrating Rename/Delete actions
 * 
 * Hooks:
 * - useBoards: Fetch boards filtered by project
 * - useCreateBoard, useUpdateBoard, useDeleteBoard: Mutation hooks
 * 
 * @see ralph-wiggum/specs/4.3-ui-components.md
 * @module features/boards
 */

// Components
export { CreateBoardDialog } from './components/create-board-dialog';
// ... rest of exports
```

---

## Summary

| ID | Priority | Issue | Effort | Phase |
|----|----------|-------|--------|-------|
| M1 | Medium | Missing spec documentation | 5 min | Anytime |
| M2 | Medium | useBoards empty string pattern | 15-30 min | Pre-Phase 5 |
| M3 | Medium | BoardActionsMenu positioning | 30-60 min | If issues found |
| L1 | Low | Inconsistent status values | 1-2 hr | Phase 5 / Tech Debt |
| L2 | Low | Missing error boundaries | 1-2 hr | Phase 5 |
| L3 | Low | No optimistic updates | 2-3 hr | Phase 5 (roadmap) |
| L4 | Low | BOLA TODO wrong phase | 5 min | Anytime |
| L5 | Low | Missing barrel JSDoc | 5 min | Anytime |

**Total Estimated Effort:** ~6-9 hours (if all addressed)

**Recommended Immediate Actions:**
1. L4, L5, M1 - Quick documentation fixes (15 min total)
2. M2 - Add clarifying comment (5 min)

**Deferred to Phase 5:**
- L1, L2, L3 (tracked in roadmap)
- M3 (pending UX testing)
