# Coding Principle Violations Report
**Date:** 2026-01-25
**Project:** OpenKanban
**Scope:** `src/` directory analysis against `coding_principles/` standards.

## 1. Executive Summary

The `OpenKanban` codebase adheres to high-level directory structure patterns but exhibits significant deviations in **implementation details**, **type safety**, and **architectural layering**.

- **Critical Architecture Violation:** The "Service Layer" is missing. Business logic leaks into Route Handlers (Layer 1) and Repositories (Layer 3).
- **Critical Security Violation:** No Ownership/BOLA checks exist. Any user can access any resource by ID.
- **Critical Frontend Violation:** Manual `fetch` in `useEffect` is pervasive, violating the "Server State" rule (must use TanStack Query).
- **Systemic Style Violation:** "No Default Exports" rule is ignored across the entire project.

---

## 2. Detailed Violations

### 2.1 Architecture Standards (`architecture.md`)

| Violation | Severity | Location | Description |
|-----------|----------|----------|-------------|
| **Missing Service Layer** | 🔴 **High** | `src/app/api/boards/[id]/route.ts` | Routes communicate directly with Repositories. Business logic (e.g., aggregating relations) is found in routes instead of a dedicated Service layer. |
| **FSD / IO Isolation** | 🔴 **High** | `src/features/kanban/components/kanban-board.tsx` | UI Components perform direct `fetch()` calls. Feature-Sliced Design requires an isolated `api.ts` layer for each feature. |
| **FSD / IO Isolation** | 🔴 **High** | `src/features/kanban/utils/store.ts` | Zustand store contains direct `fetch` implementations. State management should call API layers, not implement HTTP logic. |

### 2.2 Security & API Standards (`security.md`, `api_design.md`)

| Violation | Severity | Location | Description |
|-----------|----------|----------|-------------|
| **BOLA Vulnerability** | 💀 **Critical** | All API Routes | No `owner_id` checks. `repo.getIssue(id)` returns data without verifying if the current user owns it (`security.md:13`). |
| **Unsafe Input (Params)** | 🔴 **High** | `src/app/api/issues/[id]/route.ts` | Route parameters (`params.id`) are used directly without Zod validation (`security.md:06`). |
| **Unsafe Input (Strict)** | 🟠 **Med** | `src/contract/pm/schemas.ts` | Zod schemas (e.g., `CreateIssueSchema`) are missing `.strict()`. Unknown fields are not stripped (`security.md:07`). |
| **Response Contract** | 🟠 **Med** | `src/app/api/sessions/route.ts` | Error responses omit the required `code` and `details` fields defined in the JSON envelope contract (`api_design.md:21`). |
| **Missing Pagination** | 🟠 **Med** | `src/app/api/issues/route.ts` | List endpoints return arrays without the mandatory `meta` pagination object (`api_design.md:26`). |

### 2.3 TypeScript & Node Principles (`rules_ts.md`)

| Violation | Severity | Location | Description |
|-----------|----------|----------|-------------|
| **Default Exports** | 🟡 **Low** | `src/app/page.tsx`, `src/app/layout.tsx`, etc. | Usage of `export default` is explicitly forbidden (`rules_ts.md:41`). Found in ~17 files. |
| **Implicit Returns** | 🟡 **Low** | `src/app/api/issues/route.ts` | Functions lack explicit return types (e.g., `: Promise<NextResponse>`) (`rules_ts.md:08`). |
| **IO Validation** | 🔴 **High** | `src/features/projects/hooks/use-projects.ts` | API responses in the frontend are manually cast (`as ApiResponse`) instead of validated with Zod at the edge (`rules_ts.md:16`). |
| **Date Handling** | 🟡 **Low** | `src/lib/db/repository.ts:278` | Usage of `Date.now()`. Standards mandate `date-fns` for all date operations (`rules_ts.md:36`). |

### 2.4 React & Frontend Principles (`rules_react.md`)

| Violation | Severity | Location | Description |
|-----------|----------|----------|-------------|
| **Manual Fetching** | 🔴 **High** | `src/features/projects/hooks/use-projects.ts` | `useEffect` + `fetch` is used for server state. Standards mandate TanStack Query or SWR (`rules_react.md:14`). |
| **SSR Safety** | 🟡 **Low** | `src/features/kanban/components/kanban-board.tsx` | Uses `'document' in window` check instead of the standard `typeof window !== 'undefined'` (`rules_react.md:31`). |
| **Dangerous HTML** | 🟠 **Med** | `src/components/ui/chart.tsx` | Usage of `dangerouslySetInnerHTML` found without explicit sanitization comments (`rules_react.md:32`). |

---

## 3. Mitigation Strategies & Action Plan

### 3.1 Architecture Refactor
1.  **Create Service Layer**: Establish `src/core/services/` to house business logic.
    - Move logic from `src/app/api/boards/[id]/route.ts` (aggregation of issues/relations) into a `BoardService`.
    - Ensure Route handlers only perform: Input Validation (Zod) -> Service Call -> Response Formatting.
2.  **Feature Isolation**:
    - Create `src/features/kanban/api.ts` and `src/features/projects/api.ts`.
    - Move all `fetch` logic from components/store to these API modules.

### 3.2 Security Hardening
1.  **BOLA Prevention**:
    - Update `IPMRepository` methods to accept an `ownerId` context.
    - Enforce `WHERE owner_id = ?` in all SQL queries in `SqlitePMRepository`.
2.  **Input Hardening**:
    - Update all schemas in `src/contract/pm/schemas.ts` to use `.strict()`.
    - Implement a `validateParams(params, Schema)` helper for Next.js dynamic routes.

### 3.3 Frontend Modernization
1.  **Adopt TanStack Query**:
    - Replace `useEffect` data fetching in `useProjects` and `KanbanBoard` with `useQuery`.
    - Replace manual mutations in `store.ts` with `useMutation`.
2.  **Runtime Safety**:
    - Implement Zod validation for **API Responses** in the frontend API layer. Do not trust the backend blindly.

### 3.4 Code Style & Hygiene
1.  **Standardization**:
    - Convert all `export default` to named exports.
    - Enable ESLint rule `explicit-function-return-type` to enforce return types.
2.  **Date/SSR Fixes**:
    - Replace `Date.now()` with `getUnixTime(new Date())` from `date-fns`.
    - Standardize SSR checks to `typeof window !== 'undefined'`.
