# Spec 3.5.6: Technical Debt Cleanup

> **Context:** Completing the "Modernization" of the Projects feature and adding missing tests.
> **Reference:** `OpenKanban/docs/PHASE-3.5-REFACTOR-ISSUES.md` (Issues D.2, E.1)
> **Goal:** Consistent TanStack Query usage and 100% route test coverage.
> **Time Estimate:** ~45 minutes

---

## 1. Projects Feature Modernization (Issue D.2)

### 1.1 API Client
Create `src/features/projects/api.ts`:
- `fetchProjects()`: GET `/api/issues?type=project`.
- `createProject(data)`: POST `/api/issues` (use `.strip().parse()`).

### 1.2 Hook Refactor
Update `src/features/projects/hooks/use-projects.ts`:
- Use `useQuery({ queryKey: ['projects'], queryFn: api.fetchProjects })`.
- Return query result directly.

### 1.3 Component Refactor
Update `src/features/projects/components/create-project-dialog.tsx`:
- Use `useMutation` for creation.
- On success: `queryClient.invalidateQueries(['projects'])`.

---

## 2. Session Route Tests (Issue E.1)

### 2.1 Session Route Tests
Create `src/app/api/sessions/__tests__/route.test.ts`:
- **Mock**: `OpenCodeService` (not adapter).
- **Test Cases**:
  - GET: Returns sessions/projects (success).
  - GET: Returns empty array (empty state).
  - GET: Returns 500 (service throws).

### 2.2 Session Linking Tests
Create `src/app/api/issues/[id]/sessions/__tests__/route.test.ts`:
- **Test Cases**:
  - GET: Success (returns links).
  - GET: 404 (issue not found).
  - POST: 201 (success).
  - POST: 400 (missing sessionId).
  - POST: 409 (duplicate link).

Create `.../[sessionId]/__tests__/route.test.ts`:
- **Test Cases**:
  - DELETE: 200 (success).
  - DELETE: 404 (link not found).

---

## 3. Verification
- `npm run test` -> New tests pass.
- **Manual Check**:
  - Open React Query DevTools -> `['projects']` query exists.
  - Create Project -> Optimistic update or refetch visible in DevTools.
