# Implementation Plan: Phase 3.5 Refactor

> **Status:** Ready for Implementation
> **Specs:**
> - `ralph-wiggum/specs/351-backend-arch.md`
> - `ralph-wiggum/specs/352-frontend-modernization.md`
> - `ralph-wiggum/specs/353-security-hygiene.md`

## Overview
Refactoring OpenKanban to strict architectural compliance before Phase 4.

## Task Checklist

### Part 1: Backend Architecture
- [ ] Install dependencies (`eslint-plugin-import`)
- [ ] Implement `IssueService` and `BoardService`
- [ ] Add Service Layer tests
- [ ] Update Zod schemas to `.strict()`
- [ ] Refactor API Routes to use Services

### Part 2: Frontend Modernization
- [ ] Install `@tanstack/react-query`
- [ ] Create `QueryClient` provider
- [ ] Create `kanban/api.ts` client (with strict stripping)
- [ ] Refactor `store.ts` (Hybrid Pattern)
- [ ] Refactor `KanbanViewPage` (Use Query + Sync)

### Part 3: Hygiene
- [ ] Add BOLA stubs (ownerId)
- [ ] Enforce "No Default Export" (except Pages/Layouts)
- [ ] Centralize Date handling

## Verification
- `npm run test` (All Green)
- `npm run lint` (All Green)
- Manual Drag-and-Drop Check
