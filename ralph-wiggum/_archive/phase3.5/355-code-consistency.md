# Spec 3.5.5: Code Consistency & Hygiene

> **Context:** Fixing low-severity inconsistencies identified in post-refactor audit.
> **Reference:** `OpenKanban/docs/PHASE-3.5-REFACTOR-ISSUES.md` (Issues B.1, C.1, C.2, F.1)
> **Goal:** Consistent date handling, strict schemas, and single source of truth for types.
> **Time Estimate:** ~30 minutes

---

## 1. Date Handling (Issue B.1)

### 1.1 Utilities
Update `src/lib/date-utils.ts`:
- Add `export function nowISO(): string { return new Date(now()).toISOString(); }`.

### 1.2 Logger
Update `src/lib/logger.ts`:
- Replace `new Date().toISOString()` with `nowISO()`.

---

## 2. Schema Strictness (Issues C.1, C.2)

### 2.1 PM Schemas
Update `src/contract/pm/schemas.ts`:
- Add `.strict()` to:
  - `IssueFilterSchema`
  - `ColumnConfigSchema`
  - `BoardFiltersSchema`
  - `LinkSessionSchema`
  - `SetConfigSchema`
  - `ApiErrorSchema`

### 2.2 OpenCode Schemas
Update `src/contract/opencode/schemas.ts`:
- Add `.strict()` to:
  - `TimestampSchema`
  - `ProjectSchema`
  - `SessionSummarySchema`
  - `SessionSchema`
  - `MessageSchema`

---

## 3. Type Deduplication (Issue F.1)

### 3.1 Kanban API Types
Update `src/features/kanban/api.ts`:
- Remove local definitions of `CreateIssueInput`, `UpdateIssueInput`.
- Import them from `@/lib/db/repository`.

---

## 4. Verification
- `npm run build` -> Should pass.
- `npm run test` -> Should pass.
- **Strictness Check**: `grep "\.strict()" src/contract/pm/schemas.ts | wc -l` -> Should be >= 6.
- **Date Check**: `grep "new Date()" src/lib/logger.ts` -> Should return 0 matches.
