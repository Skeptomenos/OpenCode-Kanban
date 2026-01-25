# Update CLEANUP.md Phase 4 with Enhanced Details

## Context

### Original Request
Enhance Phase 4 of `docs/CLEANUP.md` with additional details discovered during code analysis.

### Interview Summary
**Key Discussions**:
- Analyzed `session-loader.ts` - found 11 sync fs calls (not just readFileSync)
- Analyzed `kanban-board.tsx` - found TWO mutation sites (not one)
- Analyzed `column-action.tsx` - confirmed AlertDialogAction fix approach
- Analyzed `store.ts` - confirmed isLoading exists but is unused

**Research Findings**:
- API route `src/app/api/sessions/route.ts` must also be updated with `await`
- Store already has `isLoading: true` as initial state
- `PageSkeleton` component exists in `page-container.tsx` for reuse

---

## Work Objectives

### Core Objective
Update CLEANUP.md Phase 4 section with complete, actionable implementation details.

### Concrete Deliverables
- Updated `docs/CLEANUP.md` with enhanced Phase 4 tasks

### Definition of Done
- [ ] `npm run build` passes after changes
- [ ] Phase 4 section contains all 11 sync fs call locations
- [ ] Phase 4 section documents both mutation sites (227-229 AND 241-243)
- [ ] Phase 4 section includes caller update for route.ts

### Must Have
- All discovered details integrated into existing CLEANUP.md structure
- Preserve completed phases 1-3 unchanged
- Keep existing formatting style

### Must NOT Have (Guardrails)
- Do not modify any code files (this is documentation update only)
- Do not change phases 5-7
- Do not add new phases

---

## Verification Strategy

### Test Decision
- **Infrastructure exists**: N/A (documentation change)
- **User wants tests**: Manual-only
- **Framework**: none

### Manual QA Only

**Verification:**
- [ ] Open `docs/CLEANUP.md` and verify Phase 4 section is updated
- [ ] Verify all 5 tasks (4.1-4.5) have enhanced details
- [ ] Run `npm run build` to ensure no syntax errors in markdown

---

## Task Flow

```
Task 1 (single task - replace Phase 4 section)
```

## Parallelization

| Task | Depends On | Reason |
|------|------------|--------|
| 1 | None | Single edit |

---

## TODOs

- [x] 1. Replace Phase 4 section in CLEANUP.md

  **What to do**:
  - Open `docs/CLEANUP.md`
  - Find the line `## Phase 4: Architecture Fixes (1 hour)` (around line 126)
  - Replace everything from that header up to but NOT including `## Phase 5: Sentry Decision` (around line 171)
  - Insert the enhanced content below

  **Must NOT do**:
  - Do not modify any other sections
  - Do not change file encoding or line endings

  **Parallelizable**: NO (single task)

  **References**:
  - `docs/CLEANUP.md:126-168` - Current Phase 4 section to replace
  - `src/lib/session-loader.ts` - Source of 11 sync fs calls
  - `src/features/kanban/components/kanban-board.tsx:227-243` - Both mutation sites
  - `src/features/kanban/components/column-action.tsx:103` - DOM workaround
  - `src/features/kanban/utils/store.ts:25,46` - isLoading state definition

  **Replacement Content**:
  
  ```markdown
  ## Phase 4: Architecture Fixes (1 hour)

  Fix structural issues that cause subtle bugs.

  ### 4.1 Convert to Async File I/O
  - **File:** `src/lib/session-loader.ts`
  - **Problem:** Synchronous file operations block the event loop and degrade server performance.

  **All sync methods to convert (11 total):**

  | Line | Current | Replacement |
  |------|---------|-------------|
  | 12 | `fs.existsSync(projectDir)` | `try { await fs.promises.access(projectDir) } catch { return [] }` |
  | 14 | `fs.readdirSync(projectDir)` | `await fs.promises.readdir(projectDir)` |
  | 18 | `fs.readFileSync(...)` | `await fs.promises.readFile(...)` |
  | 36 | `fs.existsSync(sessionBaseDir)` | `try { await fs.promises.access(...) } catch {...}` |
  | 45 | `fs.existsSync(globalDir)` | `try { await fs.promises.access(...) } catch {...}` |
  | 46 | `fs.readdirSync(globalDir)` | `await fs.promises.readdir(globalDir)` |
  | 51 | `fs.readFileSync(...)` | `await fs.promises.readFile(...)` |
  | 62 | `fs.readdirSync(sessionBaseDir)` | `await fs.promises.readdir(sessionBaseDir)` |
  | 67 | `fs.statSync(...).isDirectory()` | `(await fs.promises.stat(...)).isDirectory()` |
  | 68 | `fs.readdirSync(projectSessionDir)` | `await fs.promises.readdir(projectSessionDir)` |
  | 71 | `fs.readFileSync(...)` | `await fs.promises.readFile(...)` |

  **Function signature changes:**
  ```typescript
  // Before
  export function getProjects(): Project[]
  export function getSessions(): { sessions: Session[], debug: string[] }

  // After
  export async function getProjects(): Promise<Project[]>
  export async function getSessions(): Promise<{ sessions: Session[], debug: string[] }>
  ```

  **Caller update required:**
  - **File:** `src/app/api/sessions/route.ts` (lines 6-7)
  - **Change:** Add `await` to both function calls:
  ```typescript
  // Before
  const { sessions, debug } = getSessions();
  const projects = getProjects();

  // After
  const { sessions, debug } = await getSessions();
  const projects = await getProjects();
  ```

  ### 4.2 Add Error Logging
  - **File:** `src/lib/session-loader.ts`
  - **Problem:** Silent catch blocks hide data corruption and debugging issues.

  **Three catch blocks to fix:**

  | Location | Current | Fix |
  |----------|---------|-----|
  | Lines 19-21 (getProjects) | `catch (e) { /* Skip */ }` | `catch (e) { console.warn('Failed to parse project:', f, e); }` |
  | Lines 53-55 (getSessions global) | `catch (e) { /* Skip */ }` | `catch (e) { console.warn('Failed to parse global session:', file, e); }` |
  | Lines 73-75 (getSessions project) | `catch (e) { /* Skip */ }` | `catch (e) { console.warn('Failed to parse session:', file, e); }` |

  ### 4.3 Fix State Mutation (TWO LOCATIONS)
  - **File:** `src/features/kanban/components/kanban-board.tsx`
  - **Problem:** Direct mutation of state object violates React/Zustand immutability. Causes unpredictable re-renders.
  - **Why bad:** `activeTask` is a reference to an object in the `tasks` array. Mutating it changes state before `setTasks` is called.

  **Location 1: Lines 227-229** (dragging task over another task)
  - **Current:** `activeTask.columnId = overTask.columnId` then `setTasks(arrayMove(tasks, ...))`
  - **Fix:**
  ```typescript
  const updatedTasks = tasks.map(t => 
    t.id === activeTask.id ? { ...t, columnId: overTask.columnId } : t
  );
  setTasks(arrayMove(updatedTasks, activeIndex, overIndex - 1));
  ```

  **Location 2: Lines 241-243** (dragging task over a column)
  - **Current:** `activeTask.columnId = overId as string` then `setTasks(arrayMove(tasks, ...))`
  - **Fix:**
  ```typescript
  const updatedTasks = tasks.map(t => 
    t.id === activeTask.id ? { ...t, columnId: overId as string } : t
  );
  setTasks(arrayMove(updatedTasks, activeIndex, activeIndex)); // no-op move, just update columnId
  ```

  ### 4.4 Fix DOM Workaround
  - **File:** `src/features/kanban/components/column-action.tsx`
  - **Problem:** Workaround for Radix AlertDialog leaving `pointer-events: none` on body after close
  - **Current (line ~103):** `setTimeout(() => (document.body.style.pointerEvents = ''), 100)` with comment "yes, you have to set a timeout"
  - **Root cause:** Using custom `Button` with `onClick` inside AlertDialog instead of `AlertDialogAction`

  **Fix steps:**
  1. Add import: `import { AlertDialogAction } from '@/components/ui/alert-dialog'`
  2. Add import: `import { buttonVariants } from '@/components/ui/button'`
  3. Replace the `<Button variant='destructive'>` with:
  ```tsx
  <AlertDialogAction 
    className={buttonVariants({ variant: 'destructive' })}
    onClick={() => {
      removeCol(id);
      toast('This column has been deleted.');
    }}
  >
    Delete
  </AlertDialogAction>
  ```
  4. Remove `setShowDeleteDialog(false)` from handler (AlertDialogAction auto-closes)
  5. Remove the `setTimeout` workaround entirely

  ### 4.5 Implement Loading State
  - **File:** `src/features/kanban/components/kanban-board.tsx`
  - **Problem:** Store has `isLoading` state (see `store.ts:25,46`) but it's never used. Board shows nothing during fetch.

  **Step 1: Add to store destructuring** (near top of component)
  ```typescript
  // Current
  const { columns, setColumns, tasks, setTasks } = useTaskStore();

  // Add isLoading and setIsLoading
  const { columns, setColumns, tasks, setTasks, isLoading, setIsLoading } = useTaskStore();
  ```

  **Step 2: Update fetch effect** (lines 45-57)
  ```typescript
  useEffect(() => {
    setIsMounted(true);
    setIsLoading(true);  // ADD THIS
    fetch('/api/sessions')
      .then(res => res.json())
      .then((data: SessionAPIResponse) => {
        const { columns: newCols, tasks: newTasks } = mapDataToKanban(data);
        setColumns(newCols);
        setTasks(newTasks);
      })
      .catch(err => console.error('Failed to load sessions', err))
      .finally(() => setIsLoading(false));  // ADD THIS
  }, [setColumns, setTasks, setIsLoading]);
  ```

  **Step 3: Add loading skeleton in render** (before main return)
  ```typescript
  // Option A: Use existing PageSkeleton from layout
  import { PageSkeleton } from '@/components/layout/page-container';

  if (isLoading) {
    return <PageSkeleton />;
  }

  // Option B: Simple inline skeleton
  if (isLoading) {
    return (
      <div className="flex gap-4 p-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-96 w-72 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }
  ```

  **Note:** Store already initializes `isLoading: true` (line 46 of store.ts), so the skeleton will show immediately on first render until data loads.
  ```

  **Acceptance Criteria**:

  **Manual Execution Verification:**
  - [ ] Open `docs/CLEANUP.md` in editor
  - [ ] Verify Phase 4 header exists at expected location
  - [ ] Verify all 5 subsections (4.1-4.5) have enhanced content
  - [ ] Verify Phase 5 section is unchanged
  - [ ] Run `npm run build` -> should pass (markdown doesn't affect build, but confirms no file corruption)

  **Commit**: YES
  - Message: `docs(cleanup): enhance Phase 4 with complete implementation details`
  - Files: `docs/CLEANUP.md`
  - Pre-commit: `npm run build`

---

## Commit Strategy

| After Task | Message | Files | Verification |
|------------|---------|-------|--------------|
| 1 | `docs(cleanup): enhance Phase 4 with complete implementation details` | docs/CLEANUP.md | npm run build |

---

## Success Criteria

### Verification Commands
```bash
npm run build  # Expected: passes (no syntax errors)
grep -c "4.1 Convert to Async" docs/CLEANUP.md  # Expected: 1
grep -c "TWO LOCATIONS" docs/CLEANUP.md  # Expected: 1
grep -c "11 total" docs/CLEANUP.md  # Expected: 1
```

### Final Checklist
- [ ] Phase 4 contains all 11 sync fs call mappings
- [ ] Phase 4 documents both mutation sites
- [ ] Phase 4 includes route.ts caller update
- [ ] Phase 4 includes AlertDialogAction fix steps
- [ ] Phase 4 includes complete loading state implementation
- [ ] No other sections modified
