# Spec 3.5.4: Service Layer Completion

> **Context:** Post-refactor cleanup. Fixing architectural gaps where Session routes bypass the Service layer, and Board APIs lack validation.
> **Reference:** `OpenKanban/docs/PHASE-3.5-REFACTOR-ISSUES.md` (Issues A.1, A.2, G.1, D.1)
> **Goal:** 100% Service Layer coverage and runtime safety.
> **Time Estimate:** ~45 minutes

---

## 1. OpenCode Service (Issue A.1)

### 1.1 Implementation
Create `src/services/opencode-service.ts`:
- **Class**: `OpenCodeService`
- **Dependencies**: `LocalOpenCodeAdapter` (injected via constructor)
- **Pattern**:
  ```typescript
  export class OpenCodeService {
    constructor(private readonly adapter: LocalOpenCodeAdapter) {}
    // methods...
  }
  ```
- **Methods**:
  - `getAllSessions(): Promise<Session[]>`
  - `getAllProjects(): Promise<Project[]>`

### 1.2 Route Refactor
Update `src/app/api/sessions/route.ts`:
- Instantiate adapter -> Instantiate service -> Call service.

---

## 2. Issue Session Linking (Issues A.2, G.1)

### 2.1 Service Updates
Update `src/services/issue-service.ts`.
- **Add Methods**:
  - `getSessionLinks(issueId: string): IssueSession[]`
  - `linkSession(issueId: string, sessionId: string, linkType?: string | null): void`
  - `unlinkSession(issueId: string, sessionId: string): void`
- **Logic**: Delegate to `this.repo`.

### 2.2 Route Refactor
Update `src/app/api/issues/[id]/sessions/route.ts` and `.../[sessionId]/route.ts`:
- Replace direct `SqlitePMRepository` usage with `IssueService`.

---

## 3. Board API Safety (Issue D.1)

### 3.1 Schema Import
Update `src/features/kanban/api.ts`.
- Import `CreateBoardSchema`, `UpdateBoardSchema` from `@/contract/pm/schemas`.

### 3.2 Validation
Update `createBoard` and `updateBoard` functions:
- **Try/Catch Block**: Wrap validation in try/catch.
- **Validation**: `const cleanData = CreateBoardSchema.strip().parse(data);`
- **Error Handling**: If validation fails, throw a user-friendly error (e.g. "Invalid board data") instead of sending to API.
- **Fetch**: Send `cleanData` (not raw `data`).

---

## 4. Testing Requirements (New)

### 4.1 Unit Tests
Create `src/services/__tests__/opencode-service.test.ts`:
- Mock `LocalOpenCodeAdapter`.
- Test `getAllSessions` calls adapter.
- Test error propagation.

Update `src/services/__tests__/issue-service.test.ts`:
- Test new session linking methods (mock repo).

---

## 5. Verification
- `grep -r "repo\." src/app/api/` -> Should confirm no direct repo calls in session routes.
- Manual: Link a session to an issue -> verify success.
- Manual: Create a board -> verify 200 OK (not 400).
