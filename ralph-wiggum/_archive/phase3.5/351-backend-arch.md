# Spec 3.5.1: Backend Architecture Refactor

> **Context:** Phase 3.5 Refactor. Transitioning from direct Route->Repository calls to a 3-Layer Architecture (Route->Service->Repository).
> **Reference:** `coding_principles/architecture.md`, `.sisyphus/plans/phase3-refactor.md`
> **Goal:** Decouple business logic from HTTP handlers and enforce strict validation.
> **Time Estimate:** ~45 minutes

---

## 1. Service Layer Implementation

Create `src/services/` directory.

### 1.1 Issue Service (`src/services/issue-service.ts`)
- **Dependencies**: `IPMRepository`.
- **Methods**:
  - `listIssues(filter)`: Wrapper around `repo.listIssues`.
  - `createIssue(data)`: Call `repo.createIssue`.
  - `updateIssue(id, data)`: Call `repo.updateIssue`.
  - `deleteIssue(id)`: Call `repo.deleteIssue`.
- **Future-Proofing**: This layer is where BOLA checks will live (Task 3.1). For now, it's a pass-through.

### 1.2 Board Service (`src/services/board-service.ts`)
- **Dependencies**: `IPMRepository`.
- **Methods**:
  - `getBoard(id)`: Call `repo.getBoard`.
  - `createBoard(data)`: Call `repo.createBoard`.
  - ... (CRUD wrappers).

---

## 2. Service Layer Tests (TDD)

Create `src/services/__tests__/`.

### 2.1 Issue Service Tests
- **File**: `issue-service.test.ts`
- **Setup**: Use `createTestDb` (from repo tests) to inject a real SQLite instance into `SqlitePMRepository`, then inject that into `IssueService`.
- **Cases**:
  - `createIssue` -> persists to DB.
  - `listIssues` -> returns data.

---

## 3. Strict Zod Schemas

Update `src/contract/pm/schemas.ts`.

### 3.1 Strict Mode
- Add `.strict()` to:
  - `CreateIssueSchema`
  - `UpdateIssueSchema`
  - `CreateBoardSchema`
  - `UpdateBoardSchema`
- **Note**: Frontend MUST strip unknown fields (handled in Spec 3.5.2).

---

## 4. Route Handler Refactor

Update `src/app/api/**/route.ts`.

### 4.1 Pattern
```typescript
// BEFORE
const repo = new SqlitePMRepository(getDb());
const issue = repo.createIssue(data);

// AFTER
const repo = new SqlitePMRepository(getDb());
const service = new IssueService(repo);
const issue = service.createIssue(data);
```

### 4.2 Routes to Update
- `api/issues/route.ts`
- `api/issues/[id]/route.ts`
- `api/boards/route.ts`
- `api/boards/[id]/route.ts`

---

## 5. Verification
- `npm run test` -> New service tests PASS.
- `grep -r "SqlitePMRepository" src/app/api/` -> Should show usage ONLY for instantiation, but calls should go through service (e.g. `service.createIssue`).
