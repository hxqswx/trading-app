/**
 * POST /api/order
 *
 * Places a simulated (or live Alpaca paper) trade order.
 *
 * Routing:
 *   US stocks + Alpaca enabled  → submit to Alpaca Paper Trading API,
 *                                  use Alpaca fill price, then record in Neon DB
 *   Everything else             → Yahoo Finance price, record in Neon DB only
 *
 * DB mode (DATABASE_URL set):
 *   - Persists order to `orders` table
 *   - Updates `positions` table (weighted-avg cost basis on buys, reduce qty on sells)
 *   - Adjusts cash in `settings`
 *
 * Mock mode (no DATABASE_URL):
 *   - Returns a simulated fill confirmation (no persistence)
 */
import { NextRequest, NextResponse } from "next/server";
import type { TradeOrder } from "@/lib/types";
import { getDb } from "@/lib/db";
import { DDL_STATEMENTS, DEFAULT_CASH } from "@/lib/db/schema";
import { getQuote } from "@/lib/market-data";
import { ASSET_META, MOCK_PORTFOLIO } from "@/lib/mock";
import { getAsset } from "@/lib/asset-registry";
import {
  isAlpacaEnabled, submitAlpacaOrder,
} from "@/lib/alpaca";
import { US_STOCK_SYMBOLS } from "@/lib/market-data/alpaca";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const order = await req.json() as TradeOrder;

    // ── Validation ────────────────────────────────────────────────────────────
    if (!order.symbol || !order.qty || !order.side || !order.type) {
      return NextResponse.json(
        { error: "symbol, qty, side, and type are required" },
        { status: 400 }
      );
    }
    if (order.qty <= 0) {
      return NextResponse.json({ error: "qty must be positive" }, { status: 400 });
    }
    const regEntry = getAsset(order.symbol);
    if (!(order.symbol in ASSET_META) && !regEntry) {
      return NextResponse.json({ error: `Unknown symbol: ${order.symbol}` }, { status: 400 });
    }

    const meta = ASSET_META[order.symbol] ?? {
      type:     regEntry!.type,
      currency: regEntry!.currency,
    };

    // ── Fill price ────────────────────────────────────────────────────────────
    const useAlpaca   = isAlpacaEnabled() && US_STOCK_SYMBOLS.has(order.symbol);
    let fillPrice: number;
    let alpacaOrderId: string | undefined;

    if (useAlpaca) {
      // ── Alpaca paper trading path ──────────────────────────────────────────
      try {
        const alpacaOrder = await submitAlpacaOrder({
          symbol:      order.symbol,
          qty:         order.qty,
          side:        order.side,
          type:        order.type as "market" | "limit" | "stop" | "stop_limit",
          limit_price: order.limitPrice,
          stop_price:  order.stopPrice,
        });
        alpacaOrderId = alpacaOrder.id;
        // filled_avg_price is set immediately for paper market orders
        fillPrice = alpacaOrder.filled_avg_price
          ? parseFloat(alpacaOrder.filled_avg_price)
          : (await getQuote(order.symbol)).price;
      } catch (alpacaErr) {
        console.error("[/api/order] Alpaca order failed, falling back to local price:", alpacaErr);
        const liveQuote = await getQuote(order.symbol);
        fillPrice = order.type === "limit" && order.limitPrice
          ? order.limitPrice
          : liveQuote.price;
      }
    } else {
      // ── Local price path (crypto, HK, CN, forex) ──────────────────────────
      const liveQuote = await getQuote(order.symbol);
      fillPrice = order.type === "limit" && order.limitPrice
        ? order.limitPrice
        : liveQuote.price;
    }

    const totalCost = fillPrice * order.qty;
    const sql       = getDb();

    // ── DB path ───────────────────────────────────────────────────────────────
    if (sql) {
      // Auto-init tables on first use
      try {
        await sql`SELECT 1 FROM orders LIMIT 1`;
      } catch {
        try {
          for (const stmt of DDL_STATEMENTS) { await sql.query(stmt); }
          await sql`
            INSERT INTO settings (key, value)
            VALUES ('cash', ${String(DEFAULT_CASH)})
            ON CONFLICT (key) DO NOTHING
          `;
          // Only seed mock positions in pure DB mode (no Alpaca) for demo purposes
          if (!isAlpacaEnabled()) {
            for (const pos of MOCK_PORTFOLIO.positions) {
              await sql`
                INSERT INTO positions (symbol, qty, avg_entry_price, asset_type, currency)
                VALUES (${pos.symbol}, ${pos.qty}, ${pos.avgEntryPrice}, ${pos.type}, ${pos.currency ?? "USD"})
                ON CONFLICT (symbol) DO NOTHING
              `;
            }
          }
        } catch (initErr) {
          console.error("[/api/order] auto-init failed — falling back to mock mode:", initErr);
          return NextResponse.json({
            id:          alpacaOrderId ?? `ord-${Date.now()}`,
            symbol:      order.symbol,
            side:        order.side,
            type:        order.type,
            qty:         order.qty,
            status:      "filled",
            filled_qty:  order.qty,
            fill_price:  fillPrice,
            total_cost:  totalCost,
            currency:    meta.currency,
            created_at:  new Date().toISOString(),
            db_mode:     false,
            alpaca_mode: useAlpaca,
          });
        }
      }

      // Fetch current cash
      const cashRow = (await sql`SELECT value FROM settings WHERE key = 'cash'`) as Array<{ value: string }>;
      const cash    = cashRow.length ? parseFloat(cashRow[0].value) : 0;

      if (order.side === "buy" && totalCost > cash) {
        return NextResponse.json(
          { error: `Insufficient cash. Need ${totalCost.toFixed(2)}, have ${cash.toFixed(2)}` },
          { status: 422 }
        );
      }

      // Fetch existing position
      const posRows  = (await sql`SELECT qty, avg_entry_price FROM positions WHERE symbol = ${order.symbol}`) as Array<{ qty: string; avg_entry_price: string }>;
      const existing = posRows[0] as { qty: string; avg_entry_price: string } | undefined;
      const existQty = existing ? parseFloat(existing.qty) : 0;

      if (order.side === "sell" && order.qty > existQty) {
        return NextResponse.json(
          { error: `Insufficient position. Have ${existQty}, trying to sell ${order.qty}` },
          { status: 422 }
        );
      }

      // Insert order record
      await sql`
        INSERT INTO orders (symbol, side, type, qty, limit_price, stop_price, status, fill_price)
        VALUES (
          ${order.symbol}, ${order.side}, ${order.type}, ${order.qty},
          ${order.limitPrice ?? null}, ${order.stopPrice ?? null},
          'filled', ${fillPrice}
        )
      `;

      if (order.side === "buy") {
        const newQty      = existQty + order.qty;
        const existAvg    = existing ? parseFloat(existing.avg_entry_price) : 0;
        const newAvgPrice = (existQty * existAvg + order.qty * fillPrice) / newQty;

        await sql`
          INSERT INTO positions (symbol, qty, avg_entry_price, asset_type, currency)
          VALUES (${order.symbol}, ${newQty}, ${newAvgPrice}, ${meta.type}, ${meta.currency})
          ON CONFLICT (symbol) DO UPDATE
            SET qty             = ${newQty},
                avg_entry_price = ${newAvgPrice},
                updated_at      = NOW()
        `;
        await sql`UPDATE settings SET value = ${String(cash - totalCost)} WHERE key = 'cash'`;
      } else {
        const newQty = existQty - order.qty;
        if (newQty <= 0) {
          await sql`DELETE FROM positions WHERE symbol = ${order.symbol}`;
        } else {
          await sql`UPDATE positions SET qty = ${newQty}, updated_at = NOW() WHERE symbol = ${order.symbol}`;
        }
        await sql`UPDATE settings SET value = ${String(cash + totalCost)} WHERE key = 'cash'`;
      }
    }

    // ── Response ──────────────────────────────────────────────────────────────
    return NextResponse.json({
      id:          alpacaOrderId ?? `ord-${Date.now()}`,
      symbol:      order.symbol,
      side:        order.side,
      type:        order.type,
      qty:         order.qty,
      status:      "filled",
      filled_qty:  order.qty,
      fill_price:  fillPrice,
      total_cost:  totalCost,
      currency:    meta.currency,
      created_at:  new Date().toISOString(),
      db_mode:     !!sql,
      alpaca_mode: useAlpaca,
    });
  } catch (err) {
    console.error("[/api/order]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
