/**
 * Per-user account provisioning helpers.
 *
 * requireUser()
 *   - Reads the Clerk session → gets userId
 *   - Returns 401 signal if unauthenticated
 *   - Lazily provisions the user's DB record + initial $25 K cash on first call
 *   - Returns { userId, sql } ready for user-scoped queries
 */
import { auth, currentUser } from "@/auth";
import { getDb } from "@/lib/db";
import { runMigrations } from "@/lib/db/migrate";
import { DEFAULT_CASH } from "@/lib/db/schema";
import type { SqlClient } from "@/lib/db";

// Tracks which users have been provisioned in the current worker process.
// Avoids a DB round-trip on every request.
const _provisioned = new Set<string>();

/** Thrown when the caller is not authenticated. HTTP 401. */
export class UnauthorizedError extends Error {
  readonly status = 401;
  constructor() { super("Unauthorized"); }
}

/** Thrown when DATABASE_URL is not set. HTTP 503. */
export class NoDatabaseError extends Error {
  readonly status = 503;
  constructor() { super("Database not configured"); }
}

/**
 * Call this at the top of every authenticated API route.
 * Returns the authenticated Clerk userId and a ready-to-use SQL client.
 */
export async function requireUser(): Promise<{ userId: string; sql: SqlClient }> {
  const { userId } = await auth();
  if (!userId) throw new UnauthorizedError();

  const sql = getDb();
  if (!sql) throw new NoDatabaseError();

  // Run migrations once per worker boot
  await runMigrations(sql);

  // Provision this user if not seen yet in this process
  if (!_provisioned.has(userId)) {
    await provisionUser(sql, userId);
    _provisioned.add(userId);
  }

  return { userId, sql };
}

/**
 * Ensure the user exists in the `users` table and has a cash balance row
 * in `settings`.  Safe to call multiple times (ON CONFLICT DO NOTHING).
 */
async function provisionUser(sql: SqlClient, userId: string): Promise<void> {
  try {
    // Fetch name/email from Clerk (may be null in some flows)
    const clerkUser = await currentUser();
    const email = clerkUser?.primaryEmailAddress?.emailAddress ?? null;
    const name  = clerkUser?.fullName ?? null;

    // Upsert user record
    await sql`
      INSERT INTO users (id, email, name)
      VALUES (${userId}, ${email}, ${name})
      ON CONFLICT (id) DO UPDATE
        SET email = COALESCE(EXCLUDED.email, users.email),
            name  = COALESCE(EXCLUDED.name,  users.name)
    `;

    // Give the user their starting paper cash (only if they don't have one)
    await sql`
      INSERT INTO settings (user_id, key, value)
      VALUES (${userId}, 'cash', ${String(DEFAULT_CASH)})
      ON CONFLICT (user_id, key) DO NOTHING
    `;
  } catch (err) {
    console.error("[provisionUser] failed for", userId, err);
    // Non-fatal — queries will still work if provisioning partially succeeded
  }
}

/**
 * Get the paper cash balance for a user.
 */
export async function getUserCash(sql: SqlClient, userId: string): Promise<number> {
  const rows = await sql`
    SELECT value FROM settings WHERE user_id = ${userId} AND key = 'cash'
  ` as Array<{ value: string }>;
  return rows.length ? parseFloat(rows[0].value) : DEFAULT_CASH;
}

/**
 * Set the paper cash balance for a user.
 */
export async function setUserCash(sql: SqlClient, userId: string, cash: number): Promise<void> {
  await sql`
    INSERT INTO settings (user_id, key, value)
    VALUES (${userId}, 'cash', ${String(cash)})
    ON CONFLICT (user_id, key) DO UPDATE SET value = ${String(cash)}
  `;
}
