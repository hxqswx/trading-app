/**
 * GET /api/alpaca/history?period=1M
 *
 * Returns per-user portfolio equity history synthesised from the orders
 * table.  Shaped like the Alpaca portfolio-history response so the
 * existing PortfolioChart component keeps working with no changes.
 *
 * Strategy: replay the user's fills chronologically and estimate equity
 * at each data point using the fill price as a cost-basis proxy.
 * (True historical mark-to-market would require storing daily prices.)
 */
import { NextRequest, NextResponse } from "next/server";
import { requireUser, getUserCash, UnauthorizedError, NoDatabaseError } from "@/lib/user-account";
import { DEFAULT_CASH } from "@/lib/db/schema";

export const runtime = "nodejs";

type Period = "1D" | "1W" | "1M" | "1Y" | "All";

function periodToMs(period: Period): number {
  const h = 3_600_000;
  switch (period) {
    case "1D":  return 24 * h;
    case "1W":  return 7  * 24 * h;
    case "1M":  return 30 * 24 * h;
    case "1Y":  return 365 * 24 * h;
    case "All": return 4 * 365 * 24 * h;
  }
}

function pointsForPeriod(period: Period): number {
  switch (period) {
    case "1D":  return 78;   // ~5-min bars in a trading day
    case "1W":  return 35;   // hourly
    case "1M":  return 30;   // daily
    case "1Y":  return 52;   // weekly
    case "All": return 100;  // monthly-ish
  }
}

export async function GET(req: NextRequest) {
  let userId: string;
  let sql: Awaited<ReturnType<typeof requireUser>>["sql"];

  try {
    ({ userId, sql } = await requireUser());
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (err instanceof NoDatabaseError) {
      return NextResponse.json({ timestamp: [], equity: [], profit_loss: [] });
    }
    throw err;
  }

  try {
    const raw    = (req.nextUrl.searchParams.get("period") ?? "1M") as Period;
    const ms     = periodToMs(raw);
    const points = pointsForPeriod(raw);
    const now    = Date.now();
    const start  = now - ms;

    // Fetch all user orders (oldest first) to replay fills
    const orders = await sql`
      SELECT symbol, side, qty, fill_price, created_at
      FROM orders
      WHERE user_id = ${userId}
      ORDER BY created_at ASC
    ` as Array<{
      symbol: string; side: string;
      qty: string; fill_price: string; created_at: string;
    }>;

    const currentCash = await getUserCash(sql, userId);

    // Replay to build a running cost-basis equity estimate
    // We work backwards: current state is known, and we undo fills.
    // Simpler approach: walk forward accumulating fills.
    type Snap = { ts: number; equity: number };
    const snaps: Snap[] = [];

    // Starting state: everyone starts at DEFAULT_CASH
    let cashSim      = DEFAULT_CASH;
    let costBasisSim = 0; // sum of (qty * fill_price) for open positions

    // We'll emit a snapshot at evenly-spaced intervals
    const interval = ms / points;
    let nextSnap   = start;

    // Emit a snapshot for [start, first order)
    for (let t = start; t < (orders.length > 0 ? new Date(orders[0].created_at).getTime() : now); t += interval) {
      if (t > now) break;
      snaps.push({ ts: Math.floor(t / 1000), equity: cashSim + costBasisSim });
      nextSnap = t + interval;
    }

    // Walk through orders
    for (const o of orders) {
      const ts   = new Date(o.created_at).getTime();
      const qty  = parseFloat(o.qty);
      const px   = parseFloat(o.fill_price);
      const cost = qty * px;

      if (o.side === "buy") {
        cashSim      -= cost;
        costBasisSim += cost;
      } else {
        cashSim      += cost;
        costBasisSim -= cost;
        if (costBasisSim < 0) costBasisSim = 0;
      }

      // Emit snapshot at this event time (if within range)
      if (ts >= start && ts <= now) {
        snaps.push({ ts: Math.floor(ts / 1000), equity: cashSim + costBasisSim });
      }

      nextSnap = ts + interval;
    }

    // Fill in remaining intervals up to now using currentCash as final anchor
    if (snaps.length === 0 || snaps[snaps.length - 1].ts < Math.floor(now / 1000)) {
      snaps.push({ ts: Math.floor(now / 1000), equity: currentCash + costBasisSim });
    }

    // Dedupe and sort
    snaps.sort((a, b) => a.ts - b.ts);

    // Thin to at most `points` snapshots evenly spaced
    let result = snaps;
    if (snaps.length > points) {
      const step = Math.floor(snaps.length / points);
      result = snaps.filter((_, i) => i % step === 0 || i === snaps.length - 1);
    }

    const timestamps   = result.map((s) => s.ts);
    const equities     = result.map((s) => Math.max(s.equity, 0));
    const profit_loss  = equities.map((e) => e - DEFAULT_CASH);

    return NextResponse.json(
      { timestamp: timestamps, equity: equities, profit_loss },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (err) {
    console.error("[/api/alpaca/history]", err);
    return NextResponse.json({ timestamp: [], equity: [], profit_loss: [] });
  }
}
