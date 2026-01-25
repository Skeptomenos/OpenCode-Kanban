# Phase 3.5 Refactor: Issues & Remediation Plan

> **Created**: 2026-01-25  
> **Status**: ✅ ALL FIXED (except A.3 deferred to Phase 4)  
> **Plan Reference**: `ralph-wiggum/code/plan.md`  
> **Spec References**: `ralph-wiggum/specs/351-backend-arch.md`, `352-frontend-modernization.md`, `353-security-hygiene.md`, `354-service-completion.md`, `355-code-consistency.md`, `356-tech-debt.md`

## Overview

Post-implementation audit of Phase 3.5 refactor identified **11 issues** across 7 categories. While the plan's explicit acceptance criteria pass (build, lint, 76 tests), several gaps exist in scope coverage and implementation consistency.

| Severity | Count | Description |
|----------|-------|-------------|
| MEDIUM   | 3     | Architectural violations, potential runtime errors |
| LOW      | 8     | Inconsistencies, missing patterns, technical debt |

---

## Issue Index

| ID | Category | Severity | Summary |
|----|----------|----------|---------|
| [A.1](#a1-session-routes-bypass-service-layer) | Architecture | MEDIUM | Session routes bypass service layer |
| [A.2](#a2-issue-session-linking-routes-bypass-service-layer) | Architecture | MEDIUM | Session linking routes bypass service layer |
| [A.3](#a3-bola-stubs-are-non-functional) | Architecture | LOW | BOLA stubs exist but are inert |
| [B.1](#b1-logger-uses-raw-new-date) | Date Handling | LOW | Logger bypasses date-utils.ts |
| [C.1](#c1-pm-support-schemas-missing-strict) | Schema | LOW | PM support schemas missing .strict() |
| [C.2](#c2-opencode-schemas-missing-strict) | Schema | LOW | OpenCode schemas missing .strict() |
| [D.1](#d1-board-fetchers-missing-stripparse) | Frontend API | MEDIUM | Board API calls missing .strip().parse() |
| [D.2](#d2-projects-feature-not-modernized) | Frontend API | LOW | Projects feature uses manual fetch |
| [E.1](#e1-sessionlinking-routes-have-no-tests) | Testing | MEDIUM | No tests for session/linking routes |
| [F.1](#f1-duplicate-type-definitions) | Types | LOW | Duplicate type definitions in api.ts |
| [G.1](#g1-issueservice-missing-session-link-methods) | Code Quality | LOW | IssueService lacks session methods |

---

## Detailed Issues

### A.1: Session Routes Bypass Service Layer

**Severity**: MEDIUM  
**Spec Violation**: `351-backend-arch.md:L14-42` (Route → Service → Repository pattern)

#### Location
```
src/app/api/sessions/route.ts
```

#### Current Code (Lines 5-14)
```typescript
export async function GET() {
  try {
    // 1. Initialize Adapter (The Contract)
    const repo = new LocalOpenCodeAdapter();
    
    // 2. Fetch Data
    const [sessions, projects] = await Promise.all([
      repo.getAllSessions(),
      repo.getAllProjects()
    ]);
```

#### Problem
Route handler directly instantiates `LocalOpenCodeAdapter` and calls repository methods. No service layer intermediary exists for OpenCode session operations.

#### Mitigation Strategy
1. Create `src/services/opencode-service.ts` with methods:
   - `getAllSessions(): Promise<Session[]>`
   - `getAllProjects(): Promise<Project[]>`
2. Refactor route to use service:
   ```typescript
   const adapter = new LocalOpenCodeAdapter();
   const service = new OpenCodeService(adapter);
   const [sessions, projects] = await Promise.all([
     service.getAllSessions(),
     service.getAllProjects()
   ]);
   ```

#### Files to Modify
- CREATE: `src/services/opencode-service.ts`
- MODIFY: `src/app/api/sessions/route.ts`

---

### A.2: Issue Session Linking Routes Bypass Service Layer

**Severity**: MEDIUM  
**Spec Violation**: `351-backend-arch.md:L14-42` (Route → Service → Repository pattern)

#### Locations
```
src/app/api/issues/[id]/sessions/route.ts
src/app/api/issues/[id]/sessions/[sessionId]/route.ts
```

#### Current Code Examples

**File**: `src/app/api/issues/[id]/sessions/route.ts`
```typescript
// Line 36-38
const db = getDb();
const repo = new SqlitePMRepository(db);
const existing = repo.getIssue(id);  // Direct repo call

// Line 79
const existingLinks = repo.getSessionLinks(id);  // Direct repo call

// Line 94
repo.linkSession(id, sessionId, linkType);  // Direct repo call
```

**File**: `src/app/api/issues/[id]/sessions/[sessionId]/route.ts`
```typescript
// Lines 33-35
const db = getDb();
const repo = new SqlitePMRepository(db);
const existing = repo.getIssue(id);  // Direct repo call

// Line 46
repo.unlinkSession(id, sessionId);  // Direct repo call
```

#### Problem
Session linking operations call repository directly from routes, bypassing `IssueService`.

#### Mitigation Strategy
1. Add methods to `src/services/issue-service.ts`:
   ```typescript
   getSessionLinks(issueId: string): IssueSession[]
   linkSession(issueId: string, sessionId: string, linkType?: string | null): void
   unlinkSession(issueId: string, sessionId: string): void
   ```
2. Refactor both route files to use `IssueService` instead of `SqlitePMRepository`

#### Files to Modify
- MODIFY: `src/services/issue-service.ts` (add 3 methods)
- MODIFY: `src/app/api/issues/[id]/sessions/route.ts`
- MODIFY: `src/app/api/issues/[id]/sessions/[sessionId]/route.ts`

---

### A.3: BOLA Stubs Are Non-Functional

**Severity**: LOW (intentional stub per plan)  
**Spec Reference**: `353-security-hygiene.md:L10-18`

#### Locations
```
src/services/issue-service.ts (Lines 26-29)
src/services/board-service.ts (Lines 24-27)
```

#### Current Code
```typescript
// issue-service.ts
constructor(
  private readonly repo: IPMRepository,
  private readonly ownerId: string = DEFAULT_OWNER_ID  // Never used
) {}

listIssues(filter?: IssueFilter): Issue[] {
  return this.repo.listIssues(filter);  // ownerId not passed
}
```

#### Problem
`ownerId` is accepted but never passed to repository methods. Authorization is completely inert.

#### Mitigation Strategy (Future Phase)
1. Extend `IPMRepository` interface to accept `ownerId` parameter on all methods
2. Add `ownerId` column to database schema
3. Implement filtering in repository layer
4. **Note**: This is deferred to Phase 4 per plan

#### Files to Modify (Future)
- MODIFY: `src/lib/db/repository.ts` (interface + implementation)
- MODIFY: `src/lib/db/schema.ts` (add ownerId column)
- MODIFY: `src/services/issue-service.ts` (pass ownerId)
- MODIFY: `src/services/board-service.ts` (pass ownerId)

---

### B.1: Logger Uses Raw `new Date()`

**Severity**: LOW  
**Spec Violation**: `353-security-hygiene.md:L41-46` (centralized date handling)

#### Location
```
src/lib/logger.ts (Line 14)
```

#### Current Code
```typescript
const formatMessage = (level: string, msg: string, ctx?: LogContext): string => {
  const timestamp = new Date().toISOString();  // Should use date-utils
  // ...
};
```

#### Problem
Plan A1 centralized `Date.now()` to `date-utils.ts`, but logger uses `new Date()` directly.

#### Mitigation Strategy
1. Add ISO timestamp helper to `src/lib/date-utils.ts`:
   ```typescript
   export function nowISO(): string {
     return new Date(now()).toISOString();
   }
   ```
2. Update logger to use it:
   ```typescript
   import { nowISO } from './date-utils';
   const timestamp = nowISO();
   ```

#### Files to Modify
- MODIFY: `src/lib/date-utils.ts` (add `nowISO()` function)
- MODIFY: `src/lib/logger.ts` (use `nowISO()`)

---

### C.1: PM Support Schemas Missing `.strict()`

**Severity**: LOW  
**Spec Reference**: `351-backend-arch.md:L45-55`

#### Location
```
src/contract/pm/schemas.ts
```

#### Affected Schemas
| Schema | Lines | Status |
|--------|-------|--------|
| `IssueFilterSchema` | 59-64 | Missing `.strict()` |
| `ColumnConfigSchema` | 74-78 | Missing `.strict()` |
| `BoardFiltersSchema` | 84-89 | Missing `.strict()` |
| `LinkSessionSchema` | 123-126 | Missing `.strict()` |
| `SetConfigSchema` | 136-139 | Missing `.strict()` |
| `ApiErrorSchema` | 155-161 | Missing `.strict()` |

#### Current Code Example
```typescript
export const IssueFilterSchema = z.object({
  types: z.array(z.string()).optional(),
  statuses: z.array(z.string()).optional(),
  parentId: z.string().nullable().optional(),
  labelIds: z.array(z.string()).optional(),
});  // Missing .strict()
```

#### Problem
These schemas will accept extra properties, which may mask client bugs or allow data injection.

#### Mitigation Strategy
Add `.strict()` to each schema:
```typescript
export const IssueFilterSchema = z.object({
  // ...existing fields
}).strict();
```

#### Files to Modify
- MODIFY: `src/contract/pm/schemas.ts` (add `.strict()` to 6 schemas)

---

### C.2: OpenCode Schemas Missing `.strict()`

**Severity**: LOW  
**Spec Reference**: `351-backend-arch.md:L45-55`

#### Location
```
src/contract/opencode/schemas.ts
```

#### Affected Schemas (All)
| Schema | Lines |
|--------|-------|
| `TimestampSchema` | 5-9 |
| `ProjectSchema` | 13-22 |
| `SessionSummarySchema` | 26-30 |
| `SessionSchema` | 32-41 |
| `MessageSchema` | 45-54 |

#### Mitigation Strategy
Add `.strict()` to all 5 schemas. Note: Nested schemas (`TimestampSchema`, `SessionSummarySchema`) should be strict as well.

#### Files to Modify
- MODIFY: `src/contract/opencode/schemas.ts` (add `.strict()` to 5 schemas)

---

### D.1: Board Fetchers Missing `.strip().parse()`

**Severity**: MEDIUM  
**Spec Reference**: `352-frontend-modernization.md:L25`

#### Location
```
src/features/kanban/api.ts
```

#### Affected Functions

**`createBoard()`** (Lines 316-341)
```typescript
export async function createBoard(data: {
  name: string;
  columnConfig: Array<{ id: string; title: string; statusMappings: string[] }>;
}): Promise<BoardWithIssues> {
  const response = await fetch('/api/boards', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),  // Raw input - not stripped!
  });
  // ...
}
```

**`updateBoard()`** (Lines 362-383)
```typescript
export async function updateBoard(
  id: string,
  input: UpdateBoardInput
): Promise<BoardWithIssues> {
  const response = await fetch(`/api/boards/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),  // Raw input - not stripped!
  });
  // ...
}
```

#### Problem
Issue operations correctly use `Schema.strip().parse()` but board operations send raw input. Backend uses `.strict()` schemas which will reject extra properties with 400 errors.

#### Mitigation Strategy
1. Import board schemas:
   ```typescript
   import {
     CreateIssueSchema,
     UpdateIssueSchema,
     CreateBoardSchema,  // Add
     UpdateBoardSchema,  // Add
   } from '@/contract/pm/schemas';
   ```
2. Apply strip/parse before sending:
   ```typescript
   export async function createBoard(data: CreateBoardInput): Promise<BoardWithIssues> {
     const sanitizedInput = CreateBoardSchema.strip().parse(data);
     const response = await fetch('/api/boards', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify(sanitizedInput),
     });
     // ...
   }
   ```

#### Files to Modify
- MODIFY: `src/features/kanban/api.ts` (update `createBoard` and `updateBoard`)

---

### D.2: Projects Feature Not Modernized

**Severity**: LOW  
**Spec Reference**: `352-frontend-modernization.md` (pattern not applied to Projects)

#### Locations
```
src/features/projects/components/create-project-dialog.tsx
src/features/projects/hooks/use-projects.ts
```

#### Current Patterns

**`create-project-dialog.tsx`** (Lines 49-95)
```typescript
const projectResponse = await fetch('/api/issues', {
  method: 'POST',
  // ...
});
// Manual error handling, manual state management
```

**`use-projects.ts`** (Lines 25-53)
```typescript
const [isLoading, setIsLoading] = useState(true);
const [error, setError] = useState<string | null>(null);

const fetchProjects = useCallback(async () => {
  const response = await fetch('/api/issues?type=project');
  // ...
}, []);

useEffect(() => {
  fetchProjects();
}, [fetchProjects]);
```

#### Problem
Projects feature uses manual `fetch()` + `useState` patterns instead of TanStack Query. Inconsistent with modernized Kanban feature.

#### Mitigation Strategy
1. Create `src/features/projects/api.ts` with typed fetchers
2. Refactor `use-projects.ts` to use `useQuery`:
   ```typescript
   const { data: projects, isLoading, error } = useQuery({
     queryKey: ['projects'],
     queryFn: fetchProjects,
   });
   ```
3. Refactor `create-project-dialog.tsx` to use `useMutation`

#### Files to Modify
- CREATE: `src/features/projects/api.ts`
- MODIFY: `src/features/projects/hooks/use-projects.ts`
- MODIFY: `src/features/projects/components/create-project-dialog.tsx`

---

### E.1: Session/Linking Routes Have No Tests

**Severity**: MEDIUM  
**Spec Reference**: `351-backend-arch.md:L84-85` (test coverage requirement)

#### Missing Test Files
```
src/app/api/sessions/__tests__/          (does not exist)
src/app/api/issues/[id]/sessions/__tests__/  (does not exist)
```

#### Routes Without Tests
| Route | Methods | Current Coverage |
|-------|---------|-----------------|
| `/api/sessions` | GET | 0% |
| `/api/issues/[id]/sessions` | GET, POST | 0% |
| `/api/issues/[id]/sessions/[sessionId]` | DELETE | 0% |

#### Mitigation Strategy
1. Create test file structure:
   ```
   src/app/api/sessions/__tests__/route.test.ts
   src/app/api/issues/[id]/sessions/__tests__/route.test.ts
   src/app/api/issues/[id]/sessions/[sessionId]/__tests__/route.test.ts
   ```
2. Test cases to implement:
   - GET /api/sessions - returns sessions and projects
   - GET /api/issues/:id/sessions - returns linked sessions
   - POST /api/issues/:id/sessions - links session (success, duplicate, not found)
   - DELETE /api/issues/:id/sessions/:sessionId - unlinks session

#### Files to Create
- CREATE: `src/app/api/sessions/__tests__/route.test.ts`
- CREATE: `src/app/api/issues/[id]/sessions/__tests__/route.test.ts`
- CREATE: `src/app/api/issues/[id]/sessions/[sessionId]/__tests__/route.test.ts`

---

### F.1: Duplicate Type Definitions

**Severity**: LOW

#### Locations
```
src/features/kanban/api.ts (Lines 24-43)
src/lib/db/repository.ts (Lines 24-37)
```

#### Duplicate Types
| Type | api.ts Lines | repository.ts Lines |
|------|-------------|---------------------|
| `CreateIssueInput` | 24-31 | 24-31 |
| `UpdateIssueInput` | 37-43 | 37 |

#### Current Code (api.ts)
```typescript
export type CreateIssueInput = {
  type: string;
  parentId?: string | null;
  title: string;
  description?: string | null;
  status?: string;
  metadata?: Record<string, unknown>;
};
```

#### Problem
Same types defined in two places. Risk of drift if one is updated without the other.

#### Mitigation Strategy
1. Import types from repository in api.ts:
   ```typescript
   import type { CreateIssueInput, UpdateIssueInput } from '@/lib/db/repository';
   ```
2. Remove duplicate type definitions from api.ts

#### Files to Modify
- MODIFY: `src/features/kanban/api.ts` (remove duplicate types, add imports)

---

### G.1: IssueService Missing Session Link Methods

**Severity**: LOW  
**Related To**: [A.2](#a2-issue-session-linking-routes-bypass-service-layer)

#### Location
```
src/services/issue-service.ts
```

#### Current Methods
```typescript
export class IssueService {
  listIssues(filter?: IssueFilter): Issue[]
  createIssue(data: CreateIssueInput): Issue
  getIssue(id: string): Issue | null
  getIssueWithRelations(id: string): IssueWithRelations | null
  getIssuesWithRelations(ids: string[]): IssueWithRelations[]
  updateIssue(id: string, data: UpdateIssueInput): Issue
  deleteIssue(id: string): void
  // Missing: Session link methods
}
```

#### Missing Methods
```typescript
getSessionLinks(issueId: string): IssueSession[]
linkSession(issueId: string, sessionId: string, linkType?: string | null): void
unlinkSession(issueId: string, sessionId: string): void
```

#### Mitigation Strategy
Add the three missing methods that delegate to `this.repo`:
```typescript
getSessionLinks(issueId: string): IssueSession[] {
  return this.repo.getSessionLinks(issueId);
}

linkSession(issueId: string, sessionId: string, linkType?: string | null): void {
  this.repo.linkSession(issueId, sessionId, linkType);
}

unlinkSession(issueId: string, sessionId: string): void {
  this.repo.unlinkSession(issueId, sessionId);
}
```

#### Files to Modify
- MODIFY: `src/services/issue-service.ts` (add 3 methods)

---

## Recommended Fix Order

### Priority 1: Runtime Risk (MEDIUM severity)
1. **D.1** - Board fetchers missing `.strip().parse()` (potential 400 errors)
2. **A.1 + A.2 + G.1** - Service layer gaps (fix together as architectural unit)

### Priority 2: Consistency (LOW severity)
3. **B.1** - Logger date handling
4. **C.1 + C.2** - Schema strictness (batch fix)
5. **F.1** - Type deduplication

### Priority 3: Technical Debt (LOW severity)
6. **D.2** - Projects feature modernization
7. **E.1** - Test coverage

### Deferred: Phase 4
8. **A.3** - BOLA enforcement (requires schema migration)

---

## Verification Commands

After fixes, verify with:
```bash
cd OpenKanban
npm run build      # Must pass
npm run lint       # Must have no errors
npm run test       # All tests must pass

# Additional verification
grep -r "Date.now()\|new Date()" src/ | grep -v date-utils.ts  # Should be empty
grep -r "repo\." src/app/api/ | grep -v "new.*Repository"      # Should only show instantiation
```

---

## References

| Document | Location |
|----------|----------|
| Implementation Plan | `ralph-wiggum/code/plan.md` |
| Backend Architecture Spec | `ralph-wiggum/specs/351-backend-arch.md` |
| Frontend Modernization Spec | `ralph-wiggum/specs/352-frontend-modernization.md` |
| Security Hygiene Spec | `ralph-wiggum/specs/353-security-hygiene.md` |
| Repository Implementation | `src/lib/db/repository.ts` |
| Issue Service | `src/services/issue-service.ts` |
| Board Service | `src/services/board-service.ts` |
| Kanban API Layer | `src/features/kanban/api.ts` |
| PM Schemas | `src/contract/pm/schemas.ts` |
| OpenCode Schemas | `src/contract/opencode/schemas.ts` |
