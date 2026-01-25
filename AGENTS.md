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
4. **SAFETY**: All I/O wrapped in `try/catch`. Validation via Zod. Secrets via ENV.

## 2. Rule Activation
*You must strictly apply the following rules based on the task:*

- **General:** `coding_principles/architecture.md`, `coding_principles/workflow.md`, `coding_principles/documentation.md`
- **TypeScript/React:** `coding_principles/rules_ts.md`, `coding_principles/rules_react.md`, `coding_principles/logging.md`
- **Database/SQL:** `coding_principles/rules_sql.md`
- **API/Security:** `coding_principles/api_design.md`, `coding_principles/security.md`
- **Testing:** `coding_principles/testing.md`

## 3. Workflow Loop
1. **READ**: Context + Spec + Active Rules.
2. **PLAN**: Propose approach. Identify gaps in Spec.
3. **TDD**: Write failing test -> Validate failure (preferred).
4. **CODE**: Implement -> Refactor -> Type Check.
5. **VERIFY**: `npm run build` && `npm run lint`.
6. **HALT**: If verification fails, fix immediately.

## 4. Architecture
```
~/.local/share/opencode/storage/ -> Adapter -> API -> UI
```
*Follow the 3-Layer Principle: Presentation (UI), Service (Logic), Data (Adapter).*

**Key files:**
- `src/contract/opencode/adapter.ts`: **The Contract** (Reads files safely).
- `src/features/kanban/utils/store.ts`: Zustand state.

## 5. The Build
**Work Dir:** `cd OpenKanban`
- `npm run dev` (Port 3000)
- `npm run build` (**MUST PASS**)
- `npm run lint`

## 6. Project Documentation
- **[QUALITY](./docs/QUALITY.md)**: The "Always Works" protocol. **Read first.**
- **[CONTRACT](./docs/CONTRACT.md)**: OpenCode Data Contract. **Strict adherence.**
- **[TECH](./docs/TECH.md)**: Stack decisions.
- **[ROADMAP](./docs/ROADMAP.md)**: Project phases.

## 999. No Workarounds
**Every hack is a future wall.** Fix root causes or document in `docs/ISSUES.md`.
