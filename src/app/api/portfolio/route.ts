/**
 * GET /api/portfolio
 *
 * With DATABASE_URL set:
 *   Reads positions from Postgres, fetches live prices, computes full P&L summary.
 *
 * Without DATABASE_URL:
 *   Returns the static MOCK_PORTFOLIO (prices are not live).
 */
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getQuotes } from "@/lib/market-data";
import { MOCK_PORTFOLIO, ASSET_META } from "@/lib/mock";
import type { PortfolioSummary, Position } from "@/lib/types";

export const runtime = "nodejs";

export async function GET() {
  const sql = getDb();

  // ── Mock mode ─────────────────────────────────────────────────────────────
  if (!sql) {
    return NextResponse.json(MOCK_PORTFOLIO);
  }

  // ── DB mode ───────────────────────────────────────────────────────────────
  try {
    // Make sure tables exist
    await sql`SELECT 1 FROM positions LIMIT 1`;

    // Fetch positions
    const rows = await sql`
      SELECT symbol, qty, avg_entry_price, asset_type, currency
      FROM positions
      WHERE qty > 0
      ORDER BY symbol
    ` as Array<{
      symbol: string; qty: string;
      avg_entry_price: string; asset_type: string; currency: string;
    }>;

    // Fetch cash
    const cashRows = (await sql`SELECT value FROM settings WHERE key = 'cash'`) as Array<{ value: string }>;
    const cash     = cashRows.length ? parseFloat(cashRows[0].value) : 0;

    if (!rows.length) {
      // No positions — return bare portfolio
      const empty: PortfolioSummary = {
        equity: cash, cash, dayPnl: 0, dayPnlPct: 0, totalPnl: 0, positions: [],
      };
      return NextResponse.json(empty);
    }

    // Fetch live quotes for all held symbols
    const symbols  = rows.map((r) => r.symbol);
    const quotes   = await getQuotes(symbols);
    const quoteMap = new Map(quotes.map((q) => [q.symbol, q]));

    // Build positions with live prices
    const positions: Position[] = rows.map((row) => {
      const qty            = parseFloat(row.qty);
      const avgEntryPrice  = parseFloat(row.avg_entry_price);
      const meta           = ASSET_META[row.symbol];
      const q              = quoteMap.get(row.symbol);
      const currentPrice   = q?.price ?? avgEntryPrice;
      const marketValue    = qty * currentPrice;
      const unrealizedPnl  = (currentPrice - avgEntryPrice) * qty;
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

    // Portfolio-level aggregates
    const totalMarketValue = positions.reduce((s, p) => s + p.marketValue, 0);
    const equity           = cash + totalMarketValue;

    // Day P&L = sum of (qty × price × changePct%) for each position
    const dayPnl = positions.reduce((s, p) => {
      const q = quoteMap.get(p.symbol);
      return s + (q ? p.qty * q.price * (q.changePct / 100) : 0);
    }, 0);
    const dayPnlPct = equity > Math.abs(dayPnl)
      ? (dayPnl / (equity - dayPnl)) * 100
      : 0;

    const totalPnl = positions.reduce((s, p) => s + p.unrealizedPnl, 0);

    const portfolio: PortfolioSummary = {
      equity, cash, dayPnl, dayPnlPct, totalPnl, positions,
    };

    return NextResponse.json(portfolio);
  } catch (err) {
    console.error("[/api/portfolio] DB error, falling back to mock:", err);
    return NextResponse.json(MOCK_PORTFOLIO);
  }
}
