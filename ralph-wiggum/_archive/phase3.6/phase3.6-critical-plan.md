# Implementation Plan: Phase 3.6 Critical Fixes

> **Status:** Ready for Implementation
> **Specs:** `ralph-wiggum/specs/360-critical-fixes.md`

## Task Checklist

### Priority 1: Architecture
- [ ] Fix Circular Dependency (A.1) - Extract types
- [ ] Fix Query Side Effect (A.5) - Remove mutation from query

### Priority 2: Observability
- [ ] Add Logging to Repository JSON parsing (B.1)

### Priority 3: Testing
- [ ] Add Integration Tests for Issues Route (E.1)
- [ ] Add Integration Tests for Boards Route (E.1)

## Verification
- `npm run test`
- `npm run build`
