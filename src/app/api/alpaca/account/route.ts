/**
 * GET /api/alpaca/account
 *
 * Returns the authenticated user's paper-trading account summary
 * (cash + equity from DB), shaped like an AlpacaAccount response
 * so existing UI components that call this endpoint keep working.
 */
import { NextResponse } from "next/server";
import { requireUser, getUserCash, UnauthorizedError, NoDatabaseError } from "@/lib/user-account";
import { DEFAULT_CASH } from "@/lib/db/schema";

export const runtime = "nodejs";

export async function GET() {
  let userId: string;
  let sql: Awaited<ReturnType<typeof requireUser>>["sql"];

  try {
    ({ userId, sql } = await requireUser());
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (err instanceof NoDatabaseError) {
      // Return a sensible default when no DB is configured
      return NextResponse.json({
        id: "paper", cash: String(DEFAULT_CASH),
        buying_power: String(DEFAULT_CASH),
        equity: String(DEFAULT_CASH),
        portfolio_value: String(DEFAULT_CASH),
        last_equity: String(DEFAULT_CASH),
        daytrading_buying_power: String(DEFAULT_CASH * 4),
      });
    }
    throw err;
  }

  try {
    const cash = await getUserCash(sql, userId);

    // Calculate total equity from positions
    const posRows = await sql`
      SELECT qty, avg_entry_price FROM positions WHERE user_id = ${userId} AND qty > 0
    ` as Array<{ qty: string; avg_entry_price: string }>;

    // Simple equity estimate: cash + cost basis (live prices not fetched here for speed)
    const posValue = posRows.reduce((s, r) =>
      s + parseFloat(r.qty) * parseFloat(r.avg_entry_price), 0);
    const equity = cash + posValue;

    return NextResponse.json({
      id:                      userId,
      cash:                    String(cash),
      buying_power:            String(cash),
      equity:                  String(equity),
      portfolio_value:         String(equity),
      last_equity:             String(equity),
      daytrading_buying_power: String(cash * 4),
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
