# Phase 3.5 Post-Implementation Review: Issues & Mitigation Plan

> **Created**: 2026-01-25
> **Updated**: 2026-01-25
> **Status**: 🔧 IN PROGRESS (4/27 issues fixed)
> **Review Type**: Comprehensive code audit post Phase 3.5 completion
> **Reviewer**: Automated audit with parallel agent analysis

## Executive Summary

Phase 3.5 implementation claims are **verified as complete**. Build passes, lint passes, and 104 tests pass. However, this comprehensive review identified **27 issues** across 7 categories that should be addressed for production readiness.

| Severity | Count | Description |
|----------|-------|-------------|
| MEDIUM   | 7 → **2 remaining** | Runtime risk, error handling gaps, missing boundaries |
| LOW      | 17    | Consistency issues, type safety refinements, code quality |
| INFO     | 3     | Documentation drift, warnings |

### ✅ Fixed Issues (5 total)
- **C.1**: Kanban API try-catch - All 9 fetch functions wrapped
- **C.2**: Projects API try-catch - All 3 fetch functions wrapped  
- **C.3**: Adapter getAllProjects fs.promises wrapped
- **C.4**: Adapter getAllSessions fs.promises wrapped
- **E.1**: Root error boundary created at `src/app/error.tsx`

---

## Issue Index

### Category A: Type Safety Issues (5 issues)

| ID | Severity | Summary |
|----|----------|---------|
| [A.1](#a1-unsafe-jsonparse-cast-in-repository) | MEDIUM | Unsafe JSON.parse cast in repository getConfig |
| [A.2](#a2-globalthis-force-cast-for-singleton) | LOW | globalThis force cast for singleton pattern |
| [A.3](#a3-formdata-unsafe-cast) | LOW | FormData unsafe cast to string |
| [A.4](#a4-dnd-kit-uniqueidentifier-cast) | LOW | dnd-kit UniqueIdentifier cast to string |
| [A.5](#a5-empty-object-context-cast) | LOW | Empty object cast in form context |

### Category B: Schema/Validation Issues (1 issue)

| ID | Severity | Summary |
|----|----------|---------|
| [B.1](#b1-apisuccessschema-missing-strict) | LOW | ApiSuccessSchema missing .strict() |

### Category C: Error Handling Issues (8 issues)

| ID | Severity | Summary |
|----|----------|---------|
| [C.1](#c1-kanban-api-missing-try-catch) | ~~MEDIUM~~ ✅ FIXED | Kanban API fetchers missing try-catch |
| [C.2](#c2-projects-api-missing-try-catch) | ~~MEDIUM~~ ✅ FIXED | Projects API fetchers missing try-catch |
| [C.3](#c3-adapter-getallprojects-naked-fs) | ~~MEDIUM~~ ✅ FIXED | Adapter getAllProjects has naked fs.promises |
| [C.4](#c4-adapter-getallsessions-naked-fs) | ~~MEDIUM~~ ✅ FIXED | Adapter getAllSessions has naked fs.promises |
| [C.5](#c5-layout-silent-catch) | LOW | Layout theme script silent catch |
| [C.6](#c6-adapter-silent-catch-blocks) | LOW | Adapter silent catch blocks in indexing |
| [C.7](#c7-rollback-swallowed-error) | LOW | Rollback function swallows errors |
| [C.8](#c8-sessions-route-inconsistent-error-format) | LOW | Sessions route missing error code |

### Category D: Architecture Issues (2 issues)

| ID | Severity | Summary |
|----|----------|---------|
| [D.1](#d1-dual-source-of-truth) | LOW | React Query syncs to Zustand (dual source of truth) |
| [D.2](#d2-overlapping-loading-state) | LOW | Zustand isLoading overlaps with React Query |

### Category E: React/Component Issues (3 issues)

| ID | Severity | Summary |
|----|----------|---------|
| [E.1](#e1-insufficient-error-boundaries) | ~~MEDIUM~~ ✅ FIXED | Only one error.tsx exists, no root boundary |
| [E.2](#e2-inconsistent-mutation-pattern) | LOW | NewTaskDialog uses onSuccess instead of optimistic updates |
| [E.3](#e3-throwerror-not-configured) | LOW | React Query throwOnError not enabled |

### Category F: Code Quality Issues (5 issues)

| ID | Severity | Summary |
|----|----------|---------|
| [F.1](#f1-ad-hoc-query-keys) | LOW | Query keys defined ad-hoc, no factory |
| [F.2](#f2-hardcoded-pagination-limit) | LOW | Sessions API hardcoded to 100 limit |
| [F.3](#f3-npm-pnpm-config-warning) | INFO | npm warning about shamefully-hoist |
| [F.4](#f4-bola-stubs-inert) | LOW | BOLA stubs completely inert |
| [F.5](#f5-async-helpers-in-component) | LOW | Async helpers defined inside component |

### Category G: Documentation Issues (3 issues)

| ID | Severity | Summary |
|----|----------|---------|
| [G.1](#g1-roadmap-outdated) | INFO | Roadmap says Phase 2 complete |
| [G.2](#g2-readme-version-mismatch) | INFO | README says Next.js 14, using 16 |
| [G.3](#g3-split-documentation) | INFO | Docs split between root and OpenKanban |

---

## Detailed Issues & Mitigation

### Category A: Type Safety Issues

---

#### A.1: Unsafe JSON.parse Cast in Repository

**Severity**: MEDIUM
**Location**: `src/lib/db/repository.ts:590`

##### Current Code
```typescript
getConfig<T = unknown>(key: string): T | undefined {
  const result = this.db
    .select()
    .from(schema.config)
    .where(eq(schema.config.key, key))
    .get();

  if (!result) return undefined;

  try {
    return JSON.parse(result.value) as T;  // ❌ Unsafe cast
  } catch {
    return undefined;
  }
}
```

##### Problem
`JSON.parse` returns `any`. Casting directly to generic `T` bypasses type safety. If the stored JSON doesn't match `T`, the application will have runtime type mismatches.

##### Mitigation Strategy
1. Add optional Zod schema parameter for validation:
```typescript
getConfig<T = unknown>(key: string, schema?: z.ZodType<T>): T | undefined {
  const result = this.db
    .select()
    .from(schema.config)
    .where(eq(schema.config.key, key))
    .get();

  if (!result) return undefined;

  try {
    const parsed = JSON.parse(result.value);
    if (schema) {
      const validated = schema.safeParse(parsed);
      return validated.success ? validated.data : undefined;
    }
    return parsed as T;  // Legacy behavior for untyped access
  } catch {
    return undefined;
  }
}
```

##### Files to Modify
- MODIFY: `src/lib/db/repository.ts`
- MODIFY: `src/lib/db/repository.ts` (interface `IPMRepository`)

##### Estimated Effort
15 minutes

---

#### A.2: globalThis Force Cast for Singleton

**Severity**: LOW
**Location**: `src/lib/db/connection.ts:101, 120, 136`

##### Current Code
```typescript
type GlobalWithDb = typeof globalThis & {
  __kanbanDb?: BetterSQLite3Database<typeof schema>;
  __kanbanSqlite?: Database.Database;
};

const globalWithDb = globalThis as GlobalWithDb;
```

##### Problem
Force-casting `globalThis` is a common pattern for singleton management in Node.js/Next.js but technically bypasses TypeScript's type system.

##### Mitigation Strategy
This is an acceptable pattern for development-mode singletons. Document the pattern:
```typescript
/**
 * Type assertion for global singleton storage.
 * This pattern is standard for Next.js dev mode to prevent
 * connection exhaustion during hot reloading.
 * @see https://nextjs.org/docs/pages/building-your-application/data-fetching/get-server-side-props#caveats
 */
const globalWithDb = globalThis as GlobalWithDb;
```

##### Files to Modify
- MODIFY: `src/lib/db/connection.ts` (add documentation comment)

##### Estimated Effort
5 minutes

---

#### A.3: FormData Unsafe Cast

**Severity**: LOW
**Location**: `src/features/projects/components/create-project-dialog.tsx:63-64`

##### Current Code
```typescript
const formData = new FormData(form);
const name = formData.get('name') as string;
const description = formData.get('description') as string;
```

##### Problem
`FormData.get()` returns `FormDataEntryValue | null` where `FormDataEntryValue` is `string | File`. Direct cast to `string` is unsafe if a file input exists or the field is missing.

##### Mitigation Strategy
Add proper null/type checks:
```typescript
const formData = new FormData(form);
const nameValue = formData.get('name');
const descValue = formData.get('description');

// Type guard ensures string and non-null
if (typeof nameValue !== 'string' || !nameValue.trim()) {
  toast.error('Project name is required');
  return;
}

const name = nameValue.trim();
const description = typeof descValue === 'string' ? descValue.trim() : undefined;
```

##### Files to Modify
- MODIFY: `src/features/projects/components/create-project-dialog.tsx`

##### Estimated Effort
10 minutes

---

#### A.4: dnd-kit UniqueIdentifier Cast

**Severity**: LOW
**Location**: `src/features/kanban/components/kanban-board.tsx:372, 374`

##### Current Code
```typescript
if (activeTask && activeTask.columnId !== overId) {
  pendingStatusUpdates.current.set(activeTask.id, overId as string);
  const updatedTasks = tasks.map((t) =>
    t.id === activeTask.id ? { ...t, columnId: overId as string } : t
  );
```

##### Problem
`UniqueIdentifier` from dnd-kit is `string | number`. If numeric IDs are ever introduced, this cast will cause type mismatches.

##### Mitigation Strategy
Use `String()` for explicit conversion:
```typescript
const columnId = String(overId);
pendingStatusUpdates.current.set(activeTask.id, columnId);
const updatedTasks = tasks.map((t) =>
  t.id === activeTask.id ? { ...t, columnId } : t
);
```

##### Files to Modify
- MODIFY: `src/features/kanban/components/kanban-board.tsx`

##### Estimated Effort
5 minutes

---

#### A.5: Empty Object Context Cast

**Severity**: LOW
**Location**: `src/components/ui/form.tsx:48, 92`

##### Current Code
```typescript
const FormFieldContext = React.createContext<FormFieldContextValue>(
  {} as FormFieldContextValue
);
```

##### Problem
Empty object cast to complex type. Accessing properties on this default will fail silently or return `undefined`.

##### Mitigation Strategy
This is a standard React context pattern. The context should never be accessed outside a provider. Add runtime check:
```typescript
const FormFieldContext = React.createContext<FormFieldContextValue | null>(null);

export function useFormField() {
  const context = React.useContext(FormFieldContext);
  if (!context) {
    throw new Error('useFormField must be used within a FormField');
  }
  return context;
}
```

##### Files to Modify
- MODIFY: `src/components/ui/form.tsx`

##### Estimated Effort
10 minutes

---

### Category B: Schema/Validation Issues

---

#### B.1: ApiSuccessSchema Missing .strict()

**Severity**: LOW
**Location**: `src/contract/pm/schemas.ts:159-163`

##### Current Code
```typescript
export const ApiSuccessSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.literal(true),
    data: dataSchema,
  });  // Missing .strict()
```

##### Problem
Without `.strict()`, the schema accepts extra properties, which may mask client bugs or allow unexpected data.

##### Mitigation Strategy
Add `.strict()`:
```typescript
export const ApiSuccessSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.literal(true),
    data: dataSchema,
  }).strict();
```

##### Files to Modify
- MODIFY: `src/contract/pm/schemas.ts`

##### Estimated Effort
2 minutes

---

### Category C: Error Handling Issues

---

#### C.1: Kanban API Missing try-catch

**Severity**: ✅ FIXED (2026-01-25)
**Location**: `src/features/kanban/api.ts` (multiple functions)

##### Affected Functions
- `fetchIssues()` - Line 94-106
- `createIssue()` - Line 115-137
- `updateIssue()` - Line 147-172
- `deleteIssue()` - Line 180-196
- `fetchIssue()` - Line 204-222
- `fetchBoards()` - Line 255-268
- `fetchBoard()` - Line 276-289
- `createBoard()` - Line 310-342
- `updateBoard()` - Line 364-397

##### Current Code Example
```typescript
export async function fetchIssues(filters?: {...}): Promise<Issue[]> {
  // ... build URL
  const response = await fetch(url);  // ❌ No try-catch
  const result: ApiResponse<Issue[]> = await response.json();  // ❌ No try-catch
  // ...
}
```

##### Problem
Network failures, DNS errors, or malformed JSON will cause unhandled promise rejections. These bubble up and can crash the application or leave UI in broken state.

##### Mitigation Strategy
Wrap all fetch operations in try-catch:
```typescript
export async function fetchIssues(filters?: {...}): Promise<Issue[]> {
  const params = new URLSearchParams();
  // ... build URL
  
  let response: Response;
  try {
    response = await fetch(url);
  } catch (error) {
    throw new ApiError(
      'Network error: Failed to connect to server',
      'NETWORK_ERROR'
    );
  }

  let result: ApiResponse<Issue[]>;
  try {
    result = await response.json();
  } catch (error) {
    throw new ApiError(
      'Invalid response from server',
      'PARSE_ERROR',
      response.status
    );
  }

  if (!result.success) {
    throw new ApiError(
      result.error.message,
      result.error.code,
      response.status
    );
  }

  return result.data;
}
```

##### Files to Modify
- MODIFY: `src/features/kanban/api.ts` (9 functions)

##### Estimated Effort
45 minutes

---

#### C.2: Projects API Missing try-catch

**Severity**: ✅ FIXED (2026-01-25)
**Location**: `src/features/projects/api.ts` (multiple functions)

##### Affected Functions
- `fetchProjects()` - Line 75-88
- `createProjectWithBoard()` - Line 155-201
- `createProject()` - Line 222-256

##### Mitigation Strategy
Same pattern as C.1 - wrap all fetch operations in try-catch.

##### Files to Modify
- MODIFY: `src/features/projects/api.ts` (3 functions)

##### Estimated Effort
20 minutes

---

#### C.3: Adapter getAllProjects Naked fs.promises

**Severity**: ✅ FIXED (2026-01-25)
**Location**: `src/contract/opencode/adapter.ts:118-143`

##### Current Code
```typescript
async getAllProjects(): Promise<OpenCodeProject[]> {
  const projectDir = path.join(this.storagePath, 'project');
  if (!fs.existsSync(projectDir)) return [];

  const projects: OpenCodeProject[] = [];
  const files = await fs.promises.readdir(projectDir);  // ❌ No try-catch
  // ...
}
```

##### Problem
If the directory exists but is unreadable (permissions), this throws an unhandled error.

##### Mitigation Strategy
Wrap in try-catch:
```typescript
async getAllProjects(): Promise<OpenCodeProject[]> {
  const projectDir = path.join(this.storagePath, 'project');
  if (!fs.existsSync(projectDir)) return [];

  const projects: OpenCodeProject[] = [];
  
  let files: string[];
  try {
    files = await fs.promises.readdir(projectDir);
  } catch (error) {
    logger.error('Failed to read project directory', { 
      projectDir, 
      error: String(error) 
    });
    return [];  // Graceful degradation
  }
  // ...
}
```

##### Files to Modify
- MODIFY: `src/contract/opencode/adapter.ts`

##### Estimated Effort
10 minutes

---

#### C.4: Adapter getAllSessions Naked fs.promises

**Severity**: ✅ FIXED (2026-01-25)
**Location**: `src/contract/opencode/adapter.ts:145-189`

##### Current Code
```typescript
async getAllSessions(): Promise<OpenCodeSession[]> {
  const sessionBaseDir = path.join(this.storagePath, 'session');
  if (!fs.existsSync(sessionBaseDir)) return [];
  // ...
  const dirs = await fs.promises.readdir(sessionBaseDir);  // ❌ No try-catch
  for (const dir of dirs) {
    // ...
    if ((await fs.promises.stat(projectPath)).isDirectory()) {  // ❌ No try-catch
```

##### Mitigation Strategy
Same pattern as C.3 - wrap fs operations in try-catch blocks.

##### Files to Modify
- MODIFY: `src/contract/opencode/adapter.ts`

##### Estimated Effort
15 minutes

---

#### C.5: Layout Silent Catch

**Severity**: LOW
**Location**: `src/app/layout.tsx:46`

##### Current Code
```typescript
<script
  dangerouslySetInnerHTML={{
    __html: `
      try {
        // theme detection logic
      } catch (_) {
        // Silent catch intentional: inline script runs before React hydration,
        // logging is not useful here, and failure is acceptable (graceful degradation)
      }
    `
  }}
/>
```

##### Problem
Silent catch blocks can mask issues. However, this is documented as intentional.

##### Mitigation Strategy
No action required. The comment documents the intentional behavior. Consider adding a console.debug for development:
```javascript
catch (_) {
  if (process.env.NODE_ENV === 'development') {
    console.debug('[theme-init] Failed to set theme color, using default');
  }
}
```

##### Files to Modify
- Optional: `src/app/layout.tsx`

##### Estimated Effort
5 minutes (optional)

---

#### C.6: Adapter Silent Catch Blocks

**Severity**: LOW
**Location**: `src/contract/opencode/adapter.ts:74, 92`

##### Current Code
```typescript
// Line 74 in indexDir
try {
  const stat = await fs.promises.stat(filePath);
  newIndex.set(sessionId, { filePath, updatedAt: stat.mtimeMs });
} catch {
  // File may have been deleted between readdir and stat - skip
}

// Line 92 in ensureSessionIndex
try {
  if ((await fs.promises.stat(projectPath)).isDirectory()) {
    await indexDir(projectPath);
  }
} catch {
  // Directory may have been deleted - skip
}
```

##### Problem
Silent catches for race conditions. The comments document the intent, but logging would help debugging.

##### Mitigation Strategy
Add debug logging:
```typescript
} catch (error) {
  logger.debug('File removed during indexing, skipping', { 
    filePath, 
    error: String(error) 
  });
}
```

##### Files to Modify
- MODIFY: `src/contract/opencode/adapter.ts`

##### Estimated Effort
5 minutes

---

#### C.7: Rollback Swallowed Error

**Severity**: LOW
**Location**: `src/features/projects/api.ts:207-216`

##### Current Code
```typescript
async function rollbackProject(projectId: string): Promise<void> {
  try {
    await fetch(`/api/issues/${projectId}`, { method: 'DELETE' });
  } catch (rollbackError) {
    logger.error('Failed to rollback project after board failure', {
      projectId,
      error: String(rollbackError),
    });
    // Error is logged but not rethrown
  }
}
```

##### Problem
Rollback failure is logged but caller doesn't know rollback failed. This is "best-effort" cleanup which is acceptable but could leave orphaned data.

##### Mitigation Strategy
Return success/failure status:
```typescript
async function rollbackProject(projectId: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/issues/${projectId}`, { method: 'DELETE' });
    return response.ok;
  } catch (rollbackError) {
    logger.error('Failed to rollback project after board failure', {
      projectId,
      error: String(rollbackError),
    });
    return false;
  }
}

// In caller:
const rollbackSuccess = await rollbackProject(project.id);
if (!rollbackSuccess) {
  logger.warn('Orphaned project may exist', { projectId: project.id });
}
```

##### Files to Modify
- MODIFY: `src/features/projects/api.ts`

##### Estimated Effort
10 minutes

---

#### C.8: Sessions Route Inconsistent Error Format

**Severity**: LOW
**Location**: `src/app/api/sessions/route.ts:26-29`

##### Current Code
```typescript
return NextResponse.json({ 
  success: false, 
  error: { message: 'Failed to load sessions' }  // ❌ Missing 'code'
}, { status: 500 });
```

##### Problem
Other routes include an error `code` property (e.g., `INTERNAL_ERROR`, `VALIDATION_ERROR`). This route omits it, breaking consistency.

##### Mitigation Strategy
Add the `code` property:
```typescript
return NextResponse.json({ 
  success: false, 
  error: { 
    message: 'Failed to load sessions',
    code: 'INTERNAL_ERROR'
  }
}, { status: 500 });
```

##### Files to Modify
- MODIFY: `src/app/api/sessions/route.ts`

##### Estimated Effort
2 minutes

---

### Category D: Architecture Issues

---

#### D.1: Dual Source of Truth

**Severity**: LOW
**Location**: `src/features/kanban/components/kanban-board.tsx:152-162`

##### Current Code
```typescript
useEffect(() => {
  if (!data) return;
  
  const isDragging = draggedTask !== null;
  if (isDragging) return;

  setProjectId(projectId ?? null);
  setBoardId(data.boardId);
  setColumns(data.columns);
  setTasks(data.tasks);
}, [data, draggedTask, projectId, setBoardId, setColumns, setProjectId, setTasks]);
```

##### Problem
React Query fetches data, then syncs it to Zustand store via useEffect. This creates two sources of truth:
1. React Query cache
2. Zustand store

The sync is skipped during drag operations to prevent flicker, but this architectural pattern adds complexity.

##### Mitigation Strategy
**Option A (Minimal)**: Document the pattern clearly
```typescript
/**
 * Sync React Query data to Zustand store.
 * 
 * WHY ZUSTAND? Drag-and-drop operations need optimistic local state
 * that persists across renders. React Query's cache is the source
 * of truth for server state, but Zustand holds the "working copy"
 * during active DND operations.
 * 
 * SKIP DURING DRAG: Prevents visual flicker when query refetches
 * complete mid-drag.
 */
useEffect(() => { ... });
```

**Option B (Refactor)**: Use React Query's `setQueryData` for optimistic updates instead of Zustand.

##### Files to Modify
- MODIFY: `src/features/kanban/components/kanban-board.tsx` (add documentation)

##### Estimated Effort
10 minutes (Option A) / 2 hours (Option B)

---

#### D.2: Overlapping Loading State

**Severity**: LOW
**Location**: `src/features/kanban/utils/store.ts:13, 33`

##### Current Code
```typescript
export type State = {
  // ...
  isLoading: boolean;  // ❌ Overlaps with React Query
  // ...
};

export const useTaskStore = create<State & Actions>((set) => ({
  // ...
  isLoading: true,  // Default to loading
  // ...
}));
```

##### Problem
`isLoading` in Zustand duplicates React Query's `isLoading` state. The Zustand version is never updated after initial load.

##### Mitigation Strategy
Remove from Zustand, use React Query's state:
```typescript
// In store.ts - remove isLoading
export type State = {
  tasks: Task[];
  columns: Column[];
  draggedTask: string | null;
  // isLoading: boolean;  // REMOVED
  currentBoardId: string | null;
  currentProjectId: string | null;
};

// In kanban-board.tsx - use React Query's isLoading
const { data, isLoading, error } = useQuery({...});

if (isLoading) {
  return <LoadingSkeleton />;
}
```

##### Files to Modify
- MODIFY: `src/features/kanban/utils/store.ts`
- MODIFY: `src/features/kanban/components/kanban-board.tsx` (already uses Query isLoading)

##### Estimated Effort
15 minutes

---

### Category E: React/Component Issues

---

#### E.1: Insufficient Error Boundaries

**Severity**: ✅ FIXED (2026-01-25)
**Location**: App-wide

##### Current State
Only one `error.tsx` exists:
```
src/app/project/[projectId]/board/[boardId]/error.tsx
```

##### Missing Boundaries
- `/app/error.tsx` - Root error boundary
- `/app/project/error.tsx` - Project list errors
- `/app/project/[projectId]/error.tsx` - Project-level errors

##### Problem
Errors outside the board page will show Next.js default error UI, which is poor UX.

##### Mitigation Strategy
Create error boundaries at key route segments:

**`src/app/error.tsx`**:
```typescript
'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { logger } from '@/lib/logger';

export default function RootError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error('Application error', { message: error.message, digest: error.digest });
  }, [error]);

  return (
    <div className="flex h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-semibold">Something went wrong</h1>
      <p className="text-muted-foreground">
        An unexpected error occurred. Please try again.
      </p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
```

##### Files to Create
- CREATE: `src/app/error.tsx`
- Optional: `src/app/project/error.tsx`
- Optional: `src/app/project/[projectId]/error.tsx`

##### Estimated Effort
20 minutes

---

#### E.2: Inconsistent Mutation Pattern

**Severity**: LOW
**Location**: `src/features/kanban/components/new-task-dialog.tsx:29-46`

##### Current Code
```typescript
const createIssueMutation = useMutation({
  mutationFn: (input: CreateIssueInput) => createIssue(input),
  onSuccess: (issue) => {
    const newTask: Task = {
      id: issue.id,
      title: issue.title,
      description: issue.description ?? undefined,
      columnId: issue.status,
    };
    setTasks([...tasks, newTask]);  // ❌ Manual push in onSuccess
  },
  // ...
});
```

##### Problem
Other mutations use optimistic updates in `onMutate` with rollback in `onError`. This one pushes to store in `onSuccess`, which is less consistent and causes UI delay.

##### Mitigation Strategy
Convert to optimistic update pattern:
```typescript
const createIssueMutation = useMutation({
  mutationFn: (input: CreateIssueInput) => createIssue(input),
  onMutate: async (input) => {
    const previousTasks = tasks;
    const optimisticTask: Task = {
      id: `temp-${Date.now()}`,  // Temporary ID
      title: input.title,
      description: input.description ?? undefined,
      columnId: input.status ?? 'backlog',
    };
    setTasks([...tasks, optimisticTask]);
    return { previousTasks, optimisticTask };
  },
  onSuccess: (issue, _vars, context) => {
    // Replace temp task with real one
    setTasks(tasks.map(t => 
      t.id === context?.optimisticTask.id 
        ? { ...t, id: issue.id }
        : t
    ));
  },
  onError: (err, _vars, context) => {
    logger.error('Failed to create task', { error: String(err) });
    if (context?.previousTasks) {
      setTasks(context.previousTasks);
    }
  },
  onSettled: () => {
    void queryClient.invalidateQueries({ queryKey: ['kanban', currentProjectId, currentBoardId] });
  },
});
```

##### Files to Modify
- MODIFY: `src/features/kanban/components/new-task-dialog.tsx`

##### Estimated Effort
20 minutes

---

#### E.3: throwOnError Not Configured

**Severity**: LOW
**Location**: `src/lib/query-client.ts`

##### Current Code
```typescript
function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30 * 1000,
        retry: 1,
        refetchOnWindowFocus: true,
        // throwOnError not set
      },
      // ...
    },
  });
}
```

##### Problem
Without `throwOnError: true`, React Query errors are only accessible via the `error` property. They don't trigger Next.js `error.tsx` boundaries.

##### Mitigation Strategy
Enable for critical queries or globally:
```typescript
queries: {
  staleTime: 30 * 1000,
  retry: 1,
  refetchOnWindowFocus: true,
  throwOnError: (error) => {
    // Only throw for non-recoverable errors
    return error instanceof ApiError && error.status >= 500;
  },
},
```

##### Files to Modify
- MODIFY: `src/lib/query-client.ts`

##### Estimated Effort
10 minutes

---

### Category F: Code Quality Issues

---

#### F.1: Ad-hoc Query Keys

**Severity**: LOW
**Location**: Multiple files

##### Current State
Query keys are defined inline:
```typescript
// use-projects.ts
export const PROJECTS_QUERY_KEY = ['projects'] as const;

// kanban-board.tsx
queryKey: ['kanban', projectId, boardId]

// use-column-mutations.ts
queryKey: ['kanban', projectId, boardId]
```

##### Problem
No central registry. Risk of typos and inconsistency as app grows.

##### Mitigation Strategy
Create query key factory:

**`src/lib/query-keys.ts`**:
```typescript
export const queryKeys = {
  projects: {
    all: ['projects'] as const,
    detail: (id: string) => ['projects', id] as const,
  },
  kanban: {
    board: (projectId?: string, boardId?: string) => 
      ['kanban', projectId, boardId] as const,
  },
  sessions: {
    all: ['sessions'] as const,
  },
} as const;
```

##### Files to Create/Modify
- CREATE: `src/lib/query-keys.ts`
- MODIFY: `src/features/projects/hooks/use-projects.ts`
- MODIFY: `src/features/kanban/components/kanban-board.tsx`
- MODIFY: `src/features/kanban/hooks/use-column-mutations.ts`
- MODIFY: `src/features/kanban/components/new-task-dialog.tsx`

##### Estimated Effort
30 minutes

---

#### F.2: Hardcoded Pagination Limit

**Severity**: LOW
**Location**: `src/app/api/sessions/route.ts:20`

##### Current Code
```typescript
return NextResponse.json({
  success: true,
  data: {
    sessions: sessions.slice(0, 100),  // ❌ Hardcoded limit
    projects
  }
});
```

##### Problem
Hardcoded limit without pagination support. No way for clients to request more or paginate.

##### Mitigation Strategy
Add query parameter support:
```typescript
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(
      parseInt(searchParams.get('limit') ?? '100', 10),
      500  // Max limit
    );
    const offset = parseInt(searchParams.get('offset') ?? '0', 10);

    // ... fetch data ...

    return NextResponse.json({
      success: true,
      data: {
        sessions: sessions.slice(offset, offset + limit),
        projects,
        pagination: {
          total: sessions.length,
          limit,
          offset,
          hasMore: offset + limit < sessions.length,
        }
      }
    });
  }
}
```

##### Files to Modify
- MODIFY: `src/app/api/sessions/route.ts`

##### Estimated Effort
15 minutes

---

#### F.3: npm/pnpm Config Warning

**Severity**: INFO
**Location**: `package.json` / npm config

##### Current Behavior
```
npm warn Unknown project config "shamefully-hoist"
```

##### Problem
`shamefully-hoist` is a pnpm-specific config. It appears in npm output as a warning.

##### Mitigation Strategy
Either:
1. **Migrate to pnpm** (recommended per ROADMAP.md Pre-Phase 4):
   ```bash
   rm -rf node_modules package-lock.json
   pnpm install
   ```
2. **Remove the config** if staying with npm:
   - Check `.npmrc` or `package.json` for `shamefully-hoist`
   - Remove the line

##### Files to Modify
- MODIFY: `.npmrc` (if exists) or `package.json`

##### Estimated Effort
5 minutes

---

#### F.4: BOLA Stubs Inert

**Severity**: LOW
**Location**: `src/services/issue-service.ts:26-29`, `src/services/board-service.ts:24-27`

##### Current Code
```typescript
constructor(
  private readonly repo: IPMRepository,
  private readonly ownerId: string = DEFAULT_OWNER_ID  // Never used
) {}
```

##### Problem
`ownerId` parameter exists but is never passed to repository methods. Authorization is completely inert.

##### Mitigation Strategy
This is **documented as deferred to Phase 4**. Add TODO comment:
```typescript
constructor(
  private readonly repo: IPMRepository,
  /**
   * @todo Phase 4: Implement BOLA enforcement
   * - Add ownerId column to database schema
   * - Pass ownerId to all repository methods
   * - Filter queries by owner for multi-tenant security
   * @see docs/PHASE-3.5-REFACTOR-ISSUES.md#a3-bola-stubs-are-non-functional
   */
  private readonly ownerId: string = DEFAULT_OWNER_ID
) {}
```

##### Files to Modify
- MODIFY: `src/services/issue-service.ts` (add TODO comment)
- MODIFY: `src/services/board-service.ts` (add TODO comment)

##### Estimated Effort
5 minutes

---

#### F.5: Async Helpers in Component

**Severity**: LOW
**Location**: `src/features/kanban/components/kanban-board.tsx:48-95`

##### Current Code
```typescript
export function KanbanBoard({ projectId, boardId }: KanbanBoardProps) {
  // These are defined inside the component
  async function resolveBoardId(boardId?: string): Promise<string> { ... }
  async function fetchKanbanData(...): Promise<{...}> { ... }
  
  // ... rest of component
}
```

##### Problem
These functions are recreated on every render. While they're only used as `queryFn` (which React Query memoizes), it's cleaner to hoist them.

##### Mitigation Strategy
Move outside component or to separate file:
```typescript
// Move to top of file or to api.ts
async function resolveBoardId(boardId?: string): Promise<string> { ... }
async function fetchKanbanData(
  projectId?: string,
  boardId?: string
): Promise<{...}> { ... }

export function KanbanBoard({ projectId, boardId }: KanbanBoardProps) {
  // Now uses hoisted functions
  const { data, isLoading, error } = useQuery({
    queryKey: ['kanban', projectId, boardId],
    queryFn: () => fetchKanbanData(projectId, boardId),
  });
  // ...
}
```

##### Files to Modify
- MODIFY: `src/features/kanban/components/kanban-board.tsx`

##### Estimated Effort
10 minutes

---

### Category G: Documentation Issues

---

#### G.1: Roadmap Outdated

**Severity**: INFO
**Location**: `docs/ROADMAP.md:96-98`

##### Current Content
```markdown
**State:** Phase 2 COMPLETE. Ready for Phase 3.
```

##### Problem
Roadmap says Phase 2 complete, but Phase 3.5 is now complete.

##### Mitigation Strategy
Update status:
```markdown
**State:** Phase 3.5 COMPLETE. Ready for Phase 4.
```

##### Files to Modify
- MODIFY: `docs/ROADMAP.md`

##### Estimated Effort
5 minutes

---

#### G.2: README Version Mismatch

**Severity**: INFO
**Location**: `README.md` (root), `OpenKanban/README.md`

##### Current Content
```markdown
- **Framework**: Next.js 14 (App Router)
```

##### Actual Version
```json
"next": "^16.0.7"
```

##### Mitigation Strategy
Update both READMEs:
```markdown
- **Framework**: [Next.js 16](https://nextjs.org) (App Router)
```

##### Files to Modify
- MODIFY: `README.md`
- MODIFY: `OpenKanban/README.md`

##### Estimated Effort
5 minutes

---

#### G.3: Split Documentation

**Severity**: INFO
**Location**: Project structure

##### Current State
```
/docs/
  ├── CONTRACT.md
  ├── MAPPING.md
  ├── QUALITY.md
  ├── ROADMAP.md
  ├── SCHEMA.md
  └── TECH.md

/OpenKanban/docs/
  ├── PHASE-3.5-REFACTOR-ISSUES.md
  └── phase3-issues-report.md
```

##### Problem
Documentation split between root `/docs` and `/OpenKanban/docs`. Confusing for developers.

##### Mitigation Strategy
Consolidate to `/OpenKanban/docs/` since that's the actual application:
```bash
mv docs/* OpenKanban/docs/
rmdir docs
# Update references in AGENTS.md, README.md
```

##### Files to Modify
- MOVE: All files from `/docs` to `/OpenKanban/docs`
- MODIFY: `AGENTS.md` (update paths)
- MODIFY: `README.md` (update paths)

##### Estimated Effort
15 minutes

---

## Recommended Fix Order

### Priority 1: Runtime Safety (MEDIUM severity) — ~2 hours

| Order | Issue | Est. Time | Status |
|-------|-------|-----------|--------|
| 1 | C.1 - Kanban API try-catch | 45 min | ✅ DONE |
| 2 | C.2 - Projects API try-catch | 20 min | ✅ DONE |
| 3 | C.3 + C.4 - Adapter fs try-catch | 25 min | ✅ DONE |
| 4 | E.1 - Root error boundary | 20 min | ✅ DONE |
| 5 | A.1 - Repository getConfig safety | 15 min | ⏳ Pending |

### Priority 2: Consistency (~1 hour)

| Order | Issue | Est. Time |
|-------|-------|-----------|
| 6 | C.8 - Sessions error format | 2 min |
| 7 | B.1 - ApiSuccessSchema strict | 2 min |
| 8 | F.1 - Query key factory | 30 min |
| 9 | A.3 + A.4 - Type safety fixes | 15 min |

### Priority 3: Code Quality (~1 hour)

| Order | Issue | Est. Time |
|-------|-------|-----------|
| 10 | E.2 - NewTaskDialog optimistic updates | 20 min |
| 11 | D.2 - Remove Zustand isLoading | 15 min |
| 12 | F.5 - Hoist async helpers | 10 min |
| 13 | C.6 - Adapter debug logging | 5 min |

### Priority 4: Documentation (~30 min)

| Order | Issue | Est. Time |
|-------|-------|-----------|
| 14 | G.1 + G.2 - Update roadmap/readme | 10 min |
| 15 | D.1 - Document dual source pattern | 10 min |
| 16 | A.2 + F.4 - Add documentation comments | 10 min |

### Deferred

| Issue | Reason |
|-------|--------|
| G.3 - Consolidate docs | Low priority, requires updating references |
| F.2 - Pagination | Feature work, not bug fix |
| F.3 - pnpm migration | Per ROADMAP Pre-Phase 4 |
| A.5 - Form context | Shadcn pattern, low risk |
| E.3 - throwOnError | Requires testing strategy |
| C.5 - Layout silent catch | Intentional, documented |
| C.7 - Rollback pattern | Best-effort is acceptable |

---

## Verification Commands

After fixes, verify with:
```bash
cd OpenKanban

# Core verification
npm run build      # Must pass
npm run lint       # Must have no errors
npm run test       # All 104+ tests must pass

# Specific checks
grep -r "await fetch" src/features/ | wc -l           # Should show wrapped fetches
grep -r "fs.promises" src/contract/ | wc -l           # Should show wrapped fs calls
ls src/app/error.tsx                                   # Should exist
grep "code:" src/app/api/sessions/route.ts            # Should show error code
```

---

## References

| Document | Location |
|----------|----------|
| Original Issues Report | `OpenKanban/docs/PHASE-3.5-REFACTOR-ISSUES.md` |
| Implementation Plan | `ralph-wiggum/code/plan.md` |
| Backend Arch Spec | `ralph-wiggum/specs/351-backend-arch.md` |
| Frontend Spec | `ralph-wiggum/specs/352-frontend-modernization.md` |
| Security Spec | `ralph-wiggum/specs/353-security-hygiene.md` |
