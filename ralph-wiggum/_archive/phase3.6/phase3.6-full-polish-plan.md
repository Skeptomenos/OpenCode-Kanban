# Implementation Plan: Phase 3.6 Full Polish

> **Status:** Ready for Implementation
> **Specs:**
> - `ralph-wiggum/specs/360-critical-fixes.md` (Already created)
> - `ralph-wiggum/specs/361-code-organization.md`
> - `ralph-wiggum/specs/362-error-handling.md`
> - `ralph-wiggum/specs/363-types-tests.md`
> - `ralph-wiggum/specs/364-docs-hygiene.md`

## Task Checklist

### Priority 1: Critical Fixes (Spec 360)
- [ ] Fix Circular Dependency (A.1)
- [ ] Fix Query Side Effect (A.5)
- [ ] Add Repository Logging (B.1)
- [ ] Add Route Integration Tests (E.1)

### Priority 2: Code Organization (Spec 361)
- [ ] Create/Update Barrel Files (A.2, A.3)
- [ ] Refactor App Imports (A.4)

### Priority 3: Error Handling (Spec 362)
- [ ] Add Request JSON Logging (B.2)
- [ ] Fix Repository Unsafe Fallback (B.3)
- [ ] Configure Query Client Error Handling (C.1)

### Priority 4: Type Safety & Tests (Spec 363)
- [ ] Fix Form/Chart Casts (D.1, D.2)
- [ ] Setup Component Testing (E.2)

### Priority 5: Hygiene (Spec 364)
- [ ] Fix NPM Config (G.1)
- [ ] Consolidate Documentation (G.3)
- [ ] Fix Pseudo-Barrels (G.2)

## Verification
- `npm run test` (All tests pass)
- `npm run build` (No circular dependency warnings)
- `npm run lint` (Clean)
