/**
 * Neon Postgres client.
 * Returns null if DATABASE_URL is not set — every caller must handle that
 * gracefully so the app works in "no-DB" mode with mock data.
 */
import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

// Pinned to <false, false> so tagged-template results are Record<string,any>[]
export type SqlClient = NeonQueryFunction<false, false>;

let _sql: SqlClient | null = null;

export function getDb(): SqlClient | null {
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  // Module-level singleton — reused within the same Node.js worker process
  if (!_sql) _sql = neon(url) as SqlClient;
  return _sql;
}
