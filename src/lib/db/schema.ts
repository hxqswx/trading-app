/**
 * Database schema DDL — per-user paper trading accounts.
 *
 * Every user (identified by their Clerk user ID) gets their own isolated
 * rows in orders / positions / settings.  The `users` table is keyed by
 * the Clerk user ID so no separate ID mapping is needed.
 *
 * Compatible with Neon, Supabase, Vercel Postgres, or any PostgreSQL 13+.
 */

/** Individual DDL statements — Neon's driver requires one statement per call */
export const DDL_STATEMENTS = [
  // ── Users (Clerk user ID as primary key) ─────────────────────────────────
  `CREATE TABLE IF NOT EXISTS users (
    id         TEXT        PRIMARY KEY,
    email      TEXT        UNIQUE,
    name       TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,

  // ── Orders (per-user) ─────────────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS orders (
    id          TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    user_id     TEXT        NOT NULL,
    symbol      TEXT        NOT NULL,
    side        TEXT        NOT NULL CHECK (side IN ('buy','sell')),
    type        TEXT        NOT NULL,
    qty         NUMERIC     NOT NULL,
    limit_price NUMERIC,
    stop_price  NUMERIC,
    status      TEXT        NOT NULL DEFAULT 'filled',
    fill_price  NUMERIC,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,

  // ── Positions (per-user, composite PK) ───────────────────────────────────
  `CREATE TABLE IF NOT EXISTS positions (
    user_id         TEXT        NOT NULL,
    symbol          TEXT        NOT NULL,
    qty             NUMERIC     NOT NULL DEFAULT 0,
    avg_entry_price NUMERIC     NOT NULL DEFAULT 0,
    asset_type      TEXT        NOT NULL DEFAULT 'stock',
    currency        TEXT        NOT NULL DEFAULT 'USD',
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, symbol)
  )`,

  // ── Settings (per-user, composite PK) ────────────────────────────────────
  // Stores per-user key-value pairs; 'cash' key holds the paper cash balance.
  `CREATE TABLE IF NOT EXISTS settings (
    user_id TEXT NOT NULL,
    key     TEXT NOT NULL,
    value   TEXT NOT NULL,
    PRIMARY KEY (user_id, key)
  )`,

  // ── Indexes ───────────────────────────────────────────────────────────────
  `CREATE INDEX IF NOT EXISTS orders_user_id_idx      ON orders (user_id)`,
  `CREATE INDEX IF NOT EXISTS orders_created_at_idx   ON orders (created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS positions_user_id_idx   ON positions (user_id)`,
];

/** Default paper cash given to every new account */
export const DEFAULT_CASH = 25_000;
