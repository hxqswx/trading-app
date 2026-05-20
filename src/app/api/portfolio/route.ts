/**
 * GET /api/portfolio
 *
 * Routing:
 *   Alpaca enabled (APCA_* credentials set):
 *     - US stock positions   → Alpaca paper account  (real fills, live prices)
 *     - Non-US positions     → Neon DB (crypto, HK, A-shares, forex)
 *     - Cash / equity        → Alpaca account (reflects all US stock trades)
 *     - Day P&L              → Alpaca equity − last_equity (US) + non-US calc
 *
 *   Alpaca disabled:
 *     - All positions        → Neon DB
 *     - Cash                 → Neon DB settings table
 *
 *   No DATABASE_URL:
 *     - Returns static MOCK_PORTFOLIO (prices not live)
 */
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { DDL_STATEMENTS, DEFAULT_CASH } from "@/lib/db/schema";
import { getQuotes } from "@/lib/market-data";
import { MOCK_PORTFOLIO, ASSET_META } from "@/lib/mock";
import {
  isAlpacaEnabled, getAlpacaAccount, getAlpacaPositions,
} from "@/lib/alpaca";
import type { PortfolioSummary, Position } from "@/lib/types";

export const runtime = "nodejs";

export async function GET() {
  // ── Alpaca + DB mode ──────────────────────────────────────────────────────
  if (isAlpacaEnabled()) {
    return getAlpacaPortfolio();
  }

  const sql = getDb();

  // ── Mock mode ─────────────────────────────────────────────────────────────
  if (!sql) {
    return NextResponse.json(MOCK_PORTFOLIO);
  }

  // ── DB-only mode ──────────────────────────────────────────────────────────
  return getDbPortfolio(sql);
}

// ── Alpaca-backed portfolio ───────────────────────────────────────────────────

async function getAlpacaPortfolio(): Promise<NextResponse> {
  const sql = getDb();

  try {
    // Fetch Alpaca account + positions in parallel
    const [alpacaAccount, alpacaRawPositions] = await Promise.all([
      getAlpacaAccount(),
      getAlpacaPositions(),
    ]);

    const cash = parseFloat(alpacaAccount.cash);

    // Convert Alpaca long positions to our Position type
    const usPositions: Position[] = alpacaRawPositions
      .filter((p) => p.side === "long" && parseFloat(p.qty) > 0)
      .map((p) => {
        const qty              = parseFloat(p.qty);
        const avgEntryPrice    = parseFloat(p.avg_entry_price);
        const currentPrice     = parseFloat(p.current_price);
        const marketValue      = parseFloat(p.market_value);
        const unrealizedPnl    = parseFloat(p.unrealized_pl);
        // Alpaca returns plpc as a decimal (0.05 = 5 %)
        const unrealizedPnlPct = parseFloat(p.unrealized_plpc) * 100;

        return {
          symbol: p.symbol,
          qty,
          avgEntryPrice,
          currentPrice,
          marketValue,
          unrealizedPnl,
          unrealizedPnlPct,
          type:     "stock" as const,
          currency: "USD",
        };
      });

    // Non-US positions from Neon DB (crypto, HK, CN, forex)
    const nonUsPositions: Position[] = sql
      ? await getNonUsDbPositions(sql)
      : [];

    const allPositions     = [...usPositions, ...nonUsPositions];
    const totalMarketValue = allPositions.reduce((s, p) => s + p.marketValue, 0);
    const equity           = cash + totalMarketValue;

    // Day P&L: Alpaca gives equity vs last_equity for the US portion
    const alpacaEquity     = parseFloat(alpacaAccount.equity);
    const alpacaLastEquity = parseFloat(alpacaAccount.last_equity);
    const usDayPnl         = alpacaEquity - alpacaLastEquity;

    // Non-US day P&L from live price change
    const nonUsDayPnl = nonUsPositions.reduce((s, p) => {
      // We don't have prev-close handy, so skip — stays at zero for non-US
      return s;
    }, 0);

    const dayPnl    = usDayPnl + nonUsDayPnl;
    const dayPnlPct = alpacaLastEquity > 0 ? (dayPnl / alpacaLastEquity) * 100 : 0;
    const totalPnl  = allPositions.reduce((s, p) => s + p.unrealizedPnl, 0);

    const portfolio: PortfolioSummary = {
      equity, cash, dayPnl, dayPnlPct, totalPnl,
      positions: allPositions,
    };

    return NextResponse.json(portfolio);
  } catch (err) {
    console.error("[/api/portfolio] Alpaca fetch failed, falling back:", err);
    // Fall back to DB or mock
    if (!sql) return NextResponse.json(MOCK_PORTFOLIO);
    return getDbPortfolio(sql);
  }
}

// ── Non-US positions from Neon DB ─────────────────────────────────────────────

async function getNonUsDbPositions(
  sql: NonNullable<ReturnType<typeof getDb>>
): Promise<Position[]> {
  try {
    // Auto-init if needed — in Alpaca mode start with empty non-US positions
    try {
      await sql`SELECT 1 FROM positions LIMIT 1`;
    } catch {
      for (const stmt of DDL_STATEMENTS) { await sql.query(stmt); }
      await sql`INSERT INTO settings (key, value) VALUES ('cash', ${String(DEFAULT_CASH)}) ON CONFLICT (key) DO NOTHING`;
      // Do NOT seed mock positions in Alpaca mode — user starts with a clean slate
    }

    // Only non-stock positions (crypto, hk, cn, forex)
    const rows = await sql`
      SELECT symbol, qty, avg_entry_price, asset_type, currency
      FROM positions
      WHERE qty > 0 AND asset_type != 'stock'
      ORDER BY symbol
    ` as Array<{
      symbol: string; qty: string;
      avg_entry_price: string; asset_type: string; currency: string;
    }>;

    if (!rows.length) return [];

    // Fetch live quotes for these symbols
    const symbols  = rows.map((r) => r.symbol);
    const quotes   = await getQuotes(symbols);
    const quoteMap = new Map(quotes.map((q) => [q.symbol, q]));

    return rows.map((row) => {
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
        symbol: row.symbol,
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
  } catch (err) {
    console.warn("[/api/portfolio] getNonUsDbPositions failed:", err);
    return [];
  }
}

// ── Pure DB portfolio (Alpaca disabled) ──────────────────────────────────────

async function getDbPortfolio(
  sql: NonNullable<ReturnType<typeof getDb>>
): Promise<NextResponse> {
  try {
    // Auto-init tables on first use
    try {
      await sql`SELECT 1 FROM positions LIMIT 1`;
    } catch {
      for (const stmt of DDL_STATEMENTS) { await sql.query(stmt); }
      await sql`INSERT INTO settings (key, value) VALUES ('cash', ${String(DEFAULT_CASH)}) ON CONFLICT (key) DO NOTHING`;
      for (const pos of MOCK_PORTFOLIO.positions) {
        await sql`
          INSERT INTO positions (symbol, qty, avg_entry_price, asset_type, currency)
          VALUES (${pos.symbol}, ${pos.qty}, ${pos.avgEntryPrice}, ${pos.type}, ${pos.currency ?? "USD"})
          ON CONFLICT (symbol) DO NOTHING
        `;
      }
    }

    const rows = await sql`
      SELECT symbol, qty, avg_entry_price, asset_type, currency
      FROM positions
      WHERE qty > 0
      ORDER BY symbol
    ` as Array<{
      symbol: string; qty: string;
      avg_entry_price: string; asset_type: string; currency: string;
    }>;

    const cashRows = (await sql`SELECT value FROM settings WHERE key = 'cash'`) as Array<{ value: string }>;
    const cash     = cashRows.length ? parseFloat(cashRows[0].value) : 0;

    if (!rows.length) {
      return NextResponse.json({
        equity: cash, cash, dayPnl: 0, dayPnlPct: 0, totalPnl: 0, positions: [],
      } satisfies PortfolioSummary);
    }

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
        symbol: row.symbol, qty, avgEntryPrice, currentPrice, marketValue,
        unrealizedPnl, unrealizedPnlPct,
        type:     (meta?.type ?? row.asset_type) as Position["type"],
        currency: row.currency,
      };
    });

    const totalMarketValue = positions.reduce((s, p) => s + p.marketValue, 0);
    const equity           = cash + totalMarketValue;

    const dayPnl = positions.reduce((s, p) => {
      const q = quoteMap.get(p.symbol);
      return s + (q ? p.qty * q.price * (q.changePct / 100) : 0);
    }, 0);
    const dayPnlPct = equity > Math.abs(dayPnl) ? (dayPnl / (equity - dayPnl)) * 100 : 0;
    const totalPnl  = positions.reduce((s, p) => s + p.unrealizedPnl, 0);

    return NextResponse.json({
      equity, cash, dayPnl, dayPnlPct, totalPnl, positions,
    } satisfies PortfolioSummary);
  } catch (err) {
    console.error("[/api/portfolio] DB error, falling back to mock:", err);
    return NextResponse.json(MOCK_PORTFOLIO);
  }
}
