/**
 * GET  /api/alpaca/connect  — returns current linked status + masked key
 * POST /api/alpaca/connect  — save & verify new Alpaca paper API keys
 * DELETE /api/alpaca/connect — remove linked keys
 */
import { NextRequest, NextResponse } from "next/server";
import {
  requireUser,
  getUserCash,
  UnauthorizedError,
  NoDatabaseError,
} from "@/lib/user-account";
import { getAlpacaAccountForUser } from "@/lib/alpaca";

export const runtime = "nodejs";

// ── helpers ────────────────────────────────────────────────────────────────

async function getKeys(
  sql: Awaited<ReturnType<typeof requireUser>>["sql"],
  userId: string,
): Promise<{ keyId: string | null; secretKey: string | null }> {
  const rows = await sql`
    SELECT key, value FROM settings
    WHERE user_id = ${userId} AND key IN ('alpaca_key_id', 'alpaca_secret_key')
  ` as Array<{ key: string; value: string }>;

  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return {
    keyId:     map["alpaca_key_id"]     ?? null,
    secretKey: map["alpaca_secret_key"] ?? null,
  };
}

function maskKey(key: string): string {
  if (key.length <= 8) return "****";
  return key.slice(0, 4) + "****" + key.slice(-4);
}

// ── GET ────────────────────────────────────────────────────────────────────

export async function GET() {
  let userId: string;
  let sql: Awaited<ReturnType<typeof requireUser>>["sql"];

  try {
    ({ userId, sql } = await requireUser());
  } catch (err) {
    if (err instanceof UnauthorizedError)  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (err instanceof NoDatabaseError)    return NextResponse.json({ connected: false });
    throw err;
  }

  try {
    const { keyId, secretKey } = await getKeys(sql, userId);

    if (!keyId || !secretKey) {
      return NextResponse.json({ connected: false });
    }

    // Try a quick account call to confirm keys still work
    try {
      const acct = await getAlpacaAccountForUser(keyId, secretKey);
      return NextResponse.json({
        connected:   true,
        maskedKeyId: maskKey(keyId),
        equity:      acct.equity,
        cash:        acct.cash,
      });
    } catch {
      // Keys stored but invalid
      return NextResponse.json({
        connected:   false,
        maskedKeyId: maskKey(keyId),
        error:       "Keys saved but Alpaca returned an error — please reconnect.",
      });
    }
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// ── POST ───────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  let userId: string;
  let sql: Awaited<ReturnType<typeof requireUser>>["sql"];

  try {
    ({ userId, sql } = await requireUser());
  } catch (err) {
    if (err instanceof UnauthorizedError)  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (err instanceof NoDatabaseError)    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
    throw err;
  }

  let body: { keyId?: string; secretKey?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { keyId, secretKey } = body;
  if (!keyId?.trim() || !secretKey?.trim()) {
    return NextResponse.json({ error: "keyId and secretKey are required" }, { status: 400 });
  }

  // Verify keys work before saving
  try {
    const acct = await getAlpacaAccountForUser(keyId.trim(), secretKey.trim());

    // Save to settings
    await sql`
      INSERT INTO settings (user_id, key, value)
      VALUES (${userId}, 'alpaca_key_id', ${keyId.trim()})
      ON CONFLICT (user_id, key) DO UPDATE SET value = ${keyId.trim()}
    `;
    await sql`
      INSERT INTO settings (user_id, key, value)
      VALUES (${userId}, 'alpaca_secret_key', ${secretKey.trim()})
      ON CONFLICT (user_id, key) DO UPDATE SET value = ${secretKey.trim()}
    `;

    return NextResponse.json({
      connected:   true,
      maskedKeyId: maskKey(keyId.trim()),
      equity:      acct.equity,
      cash:        acct.cash,
    });
  } catch (err) {
    return NextResponse.json(
      { error: `Could not connect to Alpaca: ${String(err)}` },
      { status: 422 },
    );
  }
}

// ── DELETE ─────────────────────────────────────────────────────────────────

export async function DELETE() {
  let userId: string;
  let sql: Awaited<ReturnType<typeof requireUser>>["sql"];

  try {
    ({ userId, sql } = await requireUser());
  } catch (err) {
    if (err instanceof UnauthorizedError)  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (err instanceof NoDatabaseError)    return NextResponse.json({ ok: true });
    throw err;
  }

  try {
    await sql`
      DELETE FROM settings
      WHERE user_id = ${userId} AND key IN ('alpaca_key_id', 'alpaca_secret_key')
    `;
    return NextResponse.json({ connected: false });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
