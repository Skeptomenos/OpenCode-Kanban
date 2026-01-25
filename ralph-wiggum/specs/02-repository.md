# Spec 2: Repository Layer (TDD)

> **Context:** Phase 2 of OpenKanban. Foundation is laid.
> **Goal:** Implement the storage engine with strict TDD.
> **Time Estimate:** ~30 minutes

---

## 1. Repository Interface

Create `OpenKanban/src/lib/db/repository.ts` defining the contract:

```typescript
export interface IPMRepository {
  // Issues
  createIssue(data: CreateIssueInput): Issue;
  getIssue(id: string): Issue | null;
  listIssues(filter?: IssueFilter): Issue[];
  updateIssue(id: string, data: UpdateIssueInput): Issue;
  deleteIssue(id: string): void; // Cascade delete

  // Config
  getConfig(key: string): unknown;
  setConfig(key: string, value: unknown): void;
}
```
*Define necessary input types (`CreateIssueInput`, etc.) in the same file or a types file.*

---

## 2. Test-Driven Implementation

Create `OpenKanban/src/lib/db/__tests__/repository.test.ts`.

### 2.1 Setup
- Use `better-sqlite3` in-memory database (`:memory:`) for isolation.
- Use `drizzle-orm` to push schema to the in-memory DB before each test.

### 2.2 Test Cases (Write these FIRST)
1. **Create Issue**: Verify properties, auto-generated ID, and timestamps.
2. **Hierarchy**: Create parent and child. Verify `parentId` relationship.
3. **Cascade Delete**: Delete parent, verify child is deleted (or updated based on logic - spec says cascade).
4. **Config**: Set and get a JSON configuration value.

### 2.3 Implementation
- Implement `SqlitePMRepository` class in `src/lib/db/repository.ts` implementing `IPMRepository`.
- Use Drizzle queries for all operations.
- Ensure `metadata` JSON parsing/stringifying is handled.

---

## 3. Verification
- Run `npx vitest run src/lib/db/__tests__/repository.test.ts`.
- All tests must pass.
