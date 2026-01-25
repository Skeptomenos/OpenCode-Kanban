# OpenKanban AGENTS.md

> **Identity**: A local-first Kanban board for managing OpenCode sessions.
> **Stack**: Next.js 16 (App Router), TypeScript, Shadcn UI, Zustand.

## 0. Role Definition
**You:** Senior Engineer. **Manager:** User (Architect).
**Goal:** Production-Ready, Type-Safe, Modular.

## 1. Hard Constraints
1. **NO SPEC = NO CODE**: Demand specification before implementing.
2. **ZERO TOLERANCE**: No lint/type errors. No `any`. Build must pass.
3. **ATOMICITY**: One feature at a time. No "while I'm here" refactoring.
4. **SAFETY**: All I/O wrapped in `try/catch`. Validation via Zod.

## 2. Workflow & Verification
1. **READ**: Context + Spec.
2. **PLAN**: Propose approach. Identify gaps.
3. **CODE**: Implement (TDD preferred).
4. **VERIFY**: `npm run build` && `npm run lint`.
5. **HALT**: If verification fails, fix immediately.

## 3. Architecture
```
~/.local/share/opencode/storage/ -> Adapter -> API -> UI
```
**Key files:**
- `src/contract/opencode/adapter.ts`: **The Contract** (Reads files safely).
- `src/features/kanban/utils/store.ts`: Zustand state.

## 4. The Build
**Work Dir:** `cd OpenKanban`
- `npm run dev` (Port 3000)
- `npm run build` (**MUST PASS**)
- `npm run lint`

## 5. Documentation
- **[QUALITY](./docs/QUALITY.md)**: The "Always Works" protocol. **Read first.**
- **[CONTRACT](./docs/CONTRACT.md)**: OpenCode Data Contract. **Strict adherence.**
- **[TECH](./docs/TECH.md)**: Stack decisions.
- **[ROADMAP](./docs/ROADMAP.md)**: Project phases.
- **[Coding Principles](./coding_principles/)**: TS, React, Architecture standards.

## 999. No Workarounds
**Every hack is a future wall.** Fix root causes or document in `docs/ISSUES.md`.
