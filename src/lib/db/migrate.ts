/**
 * One-time schema migration: upgrades the old single-user schema
 * (positions.symbol PK, settings.key PK, no user_id anywhere)
 * to the new per-user schema (composite PKs, user_id columns).
 *
 * Safe to run on every cold start — checks column existence first.
 */
import type { SqlClient } from "./index";
import { DDL_STATEMENTS } from "./schema";

let _migrated = false; // module-level guard: run at most once per worker

export async function runMigrations(sql: SqlClient): Promise<void> {
  if (_migrated) return;
  _migrated = true;

  try {
    // ── Detect old schema and drop incompatible tables ──────────────────────

    // positions: old PK was (symbol), new PK is (user_id, symbol)
    // If user_id column is absent we must drop and recreate (data is fake anyway)
    await sql.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = 'positions'
        ) AND NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'positions' AND column_name = 'user_id'
        ) THEN
          DROP TABLE positions;
        END IF;
      END $$
    `);

    // settings: old PK was (key), new PK is (user_id, key)
    await sql.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = 'settings'
        ) AND NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'settings' AND column_name = 'user_id'
        ) THEN
          DROP TABLE settings;
        END IF;
      END $$
    `);

    // orders: old table had no user_id — add column with 'legacy' default
    // (keeps historical rows visible, just not linked to any real user)
    await sql.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = 'orders'
        ) AND NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'user_id'
        ) THEN
          ALTER TABLE orders ADD COLUMN user_id TEXT NOT NULL DEFAULT 'legacy';
        END IF;
      END $$
    `);

    // users: old table had password_hash (NextAuth era) — drop it so the
    // new Clerk-keyed schema can be created cleanly
    await sql.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'password_hash'
        ) THEN
          DROP TABLE users CASCADE;
        END IF;
      END $$
    `);

    // ── Create / ensure new tables ──────────────────────────────────────────
    for (const stmt of DDL_STATEMENTS) {
      await sql.query(stmt);
    }
  } catch (err) {
    console.error("[migrate] Migration error:", err);
    // Don't re-throw — allow app to continue; DDL errors are usually
    // "already exists" style and non-fatal.
  }
}
