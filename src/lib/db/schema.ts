/**
 * Database schema DDL.
 * Compatible with Neon, Supabase, Vercel Postgres, or any PostgreSQL 13+.
 */

/** Individual DDL statements — Neon's driver requires one statement per call */
export const DDL_STATEMENTS = [
  // Registered users
  `CREATE TABLE IF NOT EXISTS users (
    id            TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    email         TEXT        UNIQUE NOT NULL,
    name          TEXT        NOT NULL,
    password_hash TEXT        NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  // Trade orders history
  `CREATE TABLE IF NOT EXISTS orders (
    id          TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
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
  // Open positions
  `CREATE TABLE IF NOT EXISTS positions (
    symbol          TEXT    PRIMARY KEY,
    qty             NUMERIC NOT NULL DEFAULT 0,
    avg_entry_price NUMERIC NOT NULL DEFAULT 0,
    asset_type      TEXT    NOT NULL DEFAULT 'stock',
    currency        TEXT    NOT NULL DEFAULT 'USD',
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  // Key-value settings (e.g. cash balance)
  `CREATE TABLE IF NOT EXISTS settings (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
  )`,
  // Indexes
  `CREATE INDEX IF NOT EXISTS orders_symbol_idx     ON orders (symbol)`,
  `CREATE INDEX IF NOT EXISTS orders_created_at_idx ON orders (created_at DESC)`,
];

/** Combined DDL string (kept for compatibility) */
export const DDL = DDL_STATEMENTS.join(";\n") + ";";

/** Default cash balance for a fresh account */
export const DEFAULT_CASH = 24_200;
