# SQL & Database Principles (2026)

> **Mandate:** Data Integrity, Performance, and Safety.

## 1. 📐 Schema Design
- **Primary Keys:** Every table MUST have an `id` (UUIDv4/v7 preferred for distributed systems, or BigInt).
- **Timestamps:** Mandatory `created_at` (UTC) and `updated_at` (UTC).
- **Foreign Keys:** Always enforce referential integrity at the DB level.
- **Normalization:** 3NF by default. Denormalize only with explicit justification.

## 2. 🔒 Safety & Security
- **Parameterization:** NEVER interpolate strings. Use parameterized queries ($1, ?).
  ```sql
  -- ❌ CRITICAL RISK
  EXEC("SELECT * FROM users WHERE name = '" + input + "'");
  
  -- ✅ SAFE
  query("SELECT * FROM users WHERE name = ?", [input]);
  ```
- **Least Privilege:** Application users should not have `DROP` or `ALTER` rights.

## 3. ⚡ Performance
- **Indexing:** Index all columns used in `WHERE`, `JOIN`, and `ORDER BY`.
- **Selectivity:** NO `SELECT *`. Explicitly list required columns.
- **N+1 Problem:** Detect and fix N+1 query patterns in application logic (use batching/JOINs).

## 4. 📝 Migrations
- **Version Control:** Database schema changes must be versioned (files like `001_init.sql`).
- **Idempotency:** Migrations should be able to run multiple times without failure (IF NOT EXISTS).
- **Down Migrations:** Always provide a rollback script.

## 5. ⚠️ Negative Patterns (Don'ts)
- **NO** logic in Stored Procedures (keep business logic in the app layer).
- **NO** soft deletes without a strategy (consider a separate history table).
- **NO** storing generic JSON if a structured table fits (Schema > Schemaless).

---
**Up:** [[../03_Principle_Files_Strategy]]
