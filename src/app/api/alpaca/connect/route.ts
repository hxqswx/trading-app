/**
 * GET  /api/alpaca/connect  — returns current linked status + masked key
 * POST /api/alpaca/connect  — save & verify new Alpaca paper API keys
 * DELETE /api/alpaca/connect — remove linked keys
 */
import { NextRequest, NextResponse } from "next/server";
import {
  requireUser,
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

/** Always returns JSON — never lets an exception bubble to Next.js HTML handler. */
function serverErr(msg: string, status = 500) {
  console.error("[/api/alpaca/connect]", msg);
  return NextResponse.json({ error: msg }, { status });
}

// ── GET ────────────────────────────────────────────────────────────────────

export async function GET() {
  let userId: string;
  let sql: Awaited<ReturnType<typeof requireUser>>["sql"];

  try {
    ({ userId, sql } = await requireUser());
  } catch (err) {
    if (err instanceof UnauthorizedError) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (err instanceof NoDatabaseError)   return NextResponse.json({ connected: false });
    return serverErr(`requireUser failed: ${String(err)}`);
  }

  try {
    const { keyId, secretKey } = await getKeys(sql, userId);

    if (!keyId || !secretKey) {
      return NextResponse.json({ connected: false });
    }

    // Quick ping to confirm keys still work
    try {
      const acct = await getAlpacaAccountForUser(keyId, secretKey);
      return NextResponse.json({
        connected:   true,
        maskedKeyId: maskKey(keyId),
        equity:      acct.equity,
        cash:        acct.cash,
      });
    } catch (alpacaErr) {
      // Keys stored but invalid / Alpaca unreachable
      return NextResponse.json({
        connected:   false,
        maskedKeyId: maskKey(keyId),
        error:       `Saved keys rejected by Alpaca — please reconnect. (${String(alpacaErr)})`,
      });
    }
  } catch (err) {
    return serverErr(`GET error: ${String(err)}`);
  }
}

// ── POST ───────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  let userId: string;
  let sql: Awaited<ReturnType<typeof requireUser>>["sql"];

  try {
    ({ userId, sql } = await requireUser());
  } catch (err) {
    if (err instanceof UnauthorizedError) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (err instanceof NoDatabaseError)   return NextResponse.json({ error: "Database not configured" }, { status: 503 });
    return serverErr(`requireUser failed: ${String(err)}`);
  }

  let body: { keyId?: string; secretKey?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { keyId, secretKey } = body;
  if (!keyId?.trim() || !secretKey?.trim()) {
    return NextResponse.json({ error: "Both Key ID and Secret Key are required." }, { status: 400 });
  }

  const kid = keyId.trim();
  const sec = secretKey.trim();

  // ── 1. Test keys against Alpaca live ──────────────────────────────────────
  let acct: Awaited<ReturnType<typeof getAlpacaAccountForUser>>;
  try {
    acct = await getAlpacaAccountForUser(kid, sec);
  } catch (err) {
    // Surface the real Alpaca error (e.g. "Alpaca 403: request is not authorized")
    const raw   = String(err);
    const clean = raw.replace(/^Error:\s*/, "").replace(/Alpaca \d+:\s*/, "").trim();
    let friendly: string;
    try {
      const parsed = JSON.parse(clean.slice(clean.indexOf("{")));
      friendly = parsed.message ?? clean;
    } catch {
      friendly = clean || "Could not reach Alpaca — check your keys and try again.";
    }
    return NextResponse.json({ error: `Alpaca rejected the keys: ${friendly}` }, { status: 422 });
  }

  // ── 2. Save keys to DB ────────────────────────────────────────────────────
  try {
    await sql`
      INSERT INTO settings (user_id, key, value)
      VALUES (${userId}, 'alpaca_key_id', ${kid})
      ON CONFLICT (user_id, key) DO UPDATE SET value = ${kid}
    `;
    await sql`
      INSERT INTO settings (user_id, key, value)
      VALUES (${userId}, 'alpaca_secret_key', ${sec})
      ON CONFLICT (user_id, key) DO UPDATE SET value = ${sec}
    `;
  } catch (err) {
    return serverErr(`Failed to save keys: ${String(err)}`);
  }

  return NextResponse.json({
    connected:   true,
    maskedKeyId: maskKey(kid),
    equity:      acct.equity,
    cash:        acct.cash,
  });
}

// ── DELETE ─────────────────────────────────────────────────────────────────

export async function DELETE() {
  let userId: string;
  let sql: Awaited<ReturnType<typeof requireUser>>["sql"];

  try {
    ({ userId, sql } = await requireUser());
  } catch (err) {
    if (err instanceof UnauthorizedError) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (err instanceof NoDatabaseError)   return NextResponse.json({ connected: false });
    return serverErr(`requireUser failed: ${String(err)}`);
  }

  try {
    await sql`
      DELETE FROM settings
      WHERE user_id = ${userId} AND key IN ('alpaca_key_id', 'alpaca_secret_key')
    `;
    return NextResponse.json({ connected: false });
  } catch (err) {
    return serverErr(`DELETE error: ${String(err)}`);
  }
}
