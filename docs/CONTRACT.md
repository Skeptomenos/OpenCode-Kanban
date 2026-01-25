# The OpenCode Data Contract

> **MANDATE:** This contract is the SINGLE SOURCE OF TRUTH for OpenCode data.
> **VIOLATION:** Reading OpenCode files without this contract is strictly FORBIDDEN.

## 1. The Why
OpenCode is an external system. Its data format is outside our control.
To prevent corruption and crashes, we adhere to a Strict Data Contract (Anti-Corruption Layer).

## 2. The Components

### The Schema (`src/contract/opencode/schemas.ts`)
*   **Role:** Defines the runtime validation logic (Zod).
*   **Action:** Validates every byte read from disk.
*   **Result:** Corrupt data is rejected at the edge.

### The Types (`src/contract/opencode/types.ts`)
*   **Role:** Defines the compile-time truth (TypeScript).
*   **Action:** Inferred strictly from the Schema.
*   **Result:** You cannot use a field that doesn't exist.

### The Adapter (`src/contract/opencode/adapter.ts`)
*   **Role:** The only allowed reader.
*   **Action:** Implements `IOpenCodeRepository`.
*   **Result:** Encapsulates `fs` logic.

## 3. The Usage Rules

**DO NOT:**
*   ❌ Read `~/.local/share/opencode` directly using `fs`.
*   ❌ Cast JSON to `any`.
*   ❌ Guess field names.

**DO:**
*   ✅ Use `LocalOpenCodeAdapter`.
*   ✅ Rely on `OpenCodeSession` and `OpenCodeProject` types.

## 4. Example

```typescript
// Correct Usage
const repo = new LocalOpenCodeAdapter();
const sessions = await repo.getAllSessions(); // Returns validated OpenCodeSession[]
```
