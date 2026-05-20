/**
 * POST /api/init
 *
 * Idempotent schema creation + optional portfolio seeding.
 * Call once after setting DATABASE_URL, or from the UI's "Connect DB" button.
 * Safe to call multiple times — all DDL uses IF NOT EXISTS.
 */
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { DDL_STATEMENTS, DEFAULT_CASH } from "@/lib/db/schema";
import { MOCK_PORTFOLIO } from "@/lib/mock";

export const runtime = "nodejs";

export async function POST() {
  const sql = getDb();
  if (!sql) {
    return NextResponse.json(
      { ok: false, message: "DATABASE_URL is not set. Running in mock-data mode." },
      { status: 200 }
    );
  }

  try {
    // 1. Create tables — one statement at a time (Neon rejects multi-command calls)
    for (const stmt of DDL_STATEMENTS) {
      await sql.query(stmt);
    }

    // 2. Seed portfolio if no positions exist yet
    const existing = (await sql`SELECT COUNT(*) AS cnt FROM positions`) as Array<{ cnt: string }>;
    const count    = Number(existing[0].cnt);

    if (count === 0) {
      for (const pos of MOCK_PORTFOLIO.positions) {
        await sql`
          INSERT INTO positions (symbol, qty, avg_entry_price, asset_type, currency)
          VALUES (${pos.symbol}, ${pos.qty}, ${pos.avgEntryPrice}, ${pos.type}, ${pos.currency ?? "USD"})
          ON CONFLICT (symbol) DO NOTHING
        `;
      }
    }

    // 3. Seed default cash if not present
    await sql`
      INSERT INTO settings (key, value)
      VALUES ('cash', ${String(DEFAULT_CASH)})
      ON CONFLICT (key) DO NOTHING
    `;

    const posCount = (await sql`SELECT COUNT(*) AS cnt FROM positions`) as Array<{ cnt: string }>;
    return NextResponse.json({
      ok:       true,
      message:  "Database initialised successfully.",
      positions: Number(posCount[0].cnt),
      cash:     DEFAULT_CASH,
    });
  } catch (err) {
    console.error("[/api/init]", err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}

/** GET for quick status check */
export async function GET() {
  const sql = getDb();
  if (!sql) return NextResponse.json({ connected: false, mode: "mock" });

  try {
    const res = (await sql`SELECT COUNT(*) AS cnt FROM positions`) as Array<{ cnt: string }>;
    return NextResponse.json({
      connected:  true,
      mode:       "database",
      positions:  Number(res[0].cnt),
    });
  } catch {
    return NextResponse.json({ connected: false, mode: "mock (tables missing — POST /api/init)" });
  }
}
