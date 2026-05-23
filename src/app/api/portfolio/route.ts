/**
 * GET /api/portfolio
 *
 * Returns the authenticated user's personal paper-trading portfolio.
 * Each user has their own isolated positions, orders, and cash balance.
 *
 * Live market prices come from Yahoo Finance / Alpaca data API.
 * All trading state (positions, cash) lives in Neon DB per user_id.
 *
 * Fallback: if no DATABASE_URL, returns static MOCK_PORTFOLIO.
 */
import { NextResponse } from "next/server";
import { requireUser, getUserCash, UnauthorizedError, NoDatabaseError } from "@/lib/user-account";
import { getQuotes } from "@/lib/market-data";
import { MOCK_PORTFOLIO, ASSET_META } from "@/lib/mock";
import type { PortfolioSummary, Position } from "@/lib/types";

export const runtime = "nodejs";

export async function GET() {
  // ── Auth + DB ──────────────────────────────────────────────────────────────
  let userId: string;
  let sql: Awaited<ReturnType<typeof requireUser>>["sql"];

  try {
    ({ userId, sql } = await requireUser());
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (err instanceof NoDatabaseError) {
      // No DB configured — return mock data
      return NextResponse.json(MOCK_PORTFOLIO);
    }
    throw err;
  }

  // ── Load user positions from DB ────────────────────────────────────────────
  try {
    const rows = await sql`
      SELECT symbol, qty, avg_entry_price, asset_type, currency
      FROM positions
      WHERE user_id = ${userId} AND qty > 0
      ORDER BY symbol
    ` as Array<{
      symbol: string; qty: string;
      avg_entry_price: string; asset_type: string; currency: string;
    }>;

    const cash = await getUserCash(sql, userId);

    // No positions yet — return cash-only portfolio
    if (!rows.length) {
      return NextResponse.json({
        equity: cash, cash,
        dayPnl: 0, dayPnlPct: 0, totalPnl: 0,
        positions: [],
      } satisfies PortfolioSummary);
    }

    // ── Fetch live prices for all held symbols ─────────────────────────────
    const symbols  = rows.map((r) => r.symbol);
    const quotes   = await getQuotes(symbols);
    const quoteMap = new Map(quotes.map((q) => [q.symbol, q]));

    const positions: Position[] = rows.map((row) => {
      const qty           = parseFloat(row.qty);
      const avgEntryPrice = parseFloat(row.avg_entry_price);
      const meta          = ASSET_META[row.symbol];
      const q             = quoteMap.get(row.symbol);
      const currentPrice  = q?.price ?? avgEntryPrice;
      const marketValue   = qty * currentPrice;
      const unrealizedPnl = (currentPrice - avgEntryPrice) * qty;
      const unrealizedPnlPct = avgEntryPrice > 0
        ? ((currentPrice - avgEntryPrice) / avgEntryPrice) * 100
        : 0;

      return {
        symbol:         row.symbol,
        qty,
        avgEntryPrice,
        currentPrice,
        marketValue,
        unrealizedPnl,
        unrealizedPnlPct,
        type:     (meta?.type ?? row.asset_type) as Position["type"],
        currency: row.currency,
      };
    });

    const totalMarketValue = positions.reduce((s, p) => s + p.marketValue, 0);
    const equity           = cash + totalMarketValue;

    // Day P&L: use live changePct from quote feed
    const dayPnl = positions.reduce((s, p) => {
      const q = quoteMap.get(p.symbol);
      if (!q) return s;
      const prevClose = q.price / (1 + q.changePct / 100);
      return s + p.qty * (q.price - prevClose);
    }, 0);
    const dayPnlPct = (equity - dayPnl) > 0 ? (dayPnl / (equity - dayPnl)) * 100 : 0;
    const totalPnl  = positions.reduce((s, p) => s + p.unrealizedPnl, 0);

    return NextResponse.json({
      equity, cash, dayPnl, dayPnlPct, totalPnl, positions,
    } satisfies PortfolioSummary);

  } catch (err) {
    console.error("[/api/portfolio]", err);
    return NextResponse.json(MOCK_PORTFOLIO);
  }
}
