/**
 * POST /api/order
 *
 * Places a paper trade for the authenticated user.
 * All state (positions, cash, order history) is stored per user_id in Neon DB.
 * Live fill prices come from Yahoo Finance / Alpaca data API.
 *
 * Returns 401 if not authenticated.
 * Returns mock fill if DATABASE_URL is not set.
 */
import { NextRequest, NextResponse } from "next/server";
import type { TradeOrder } from "@/lib/types";
import { requireUser, getUserCash, setUserCash, UnauthorizedError, NoDatabaseError } from "@/lib/user-account";
import { getQuote } from "@/lib/market-data";
import { ASSET_META } from "@/lib/mock";
import { getAsset } from "@/lib/asset-registry";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  // ── Auth ───────────────────────────────────────────────────────────────────
  let userId: string;
  let sql: Awaited<ReturnType<typeof requireUser>>["sql"];

  try {
    ({ userId, sql } = await requireUser());
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (err instanceof NoDatabaseError) {
      // No DB — return mock fill
      const order = await req.json() as TradeOrder;
      const quote = await getQuote(order.symbol).catch(() => ({ price: order.limitPrice ?? 100 }));
      return NextResponse.json({
        id: `mock-${Date.now()}`, symbol: order.symbol, side: order.side,
        type: order.type, qty: order.qty, status: "filled",
        fill_price: (quote as { price: number }).price,
        db_mode: false,
      });
    }
    throw err;
  }

  // ── Parse + validate ───────────────────────────────────────────────────────
  let order: TradeOrder;
  try {
    order = await req.json() as TradeOrder;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

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

  // ── Live fill price ────────────────────────────────────────────────────────
  let fillPrice: number;
  try {
    const liveQuote = await getQuote(order.symbol);
    fillPrice = (order.type === "limit" && order.limitPrice)
      ? order.limitPrice
      : liveQuote.price;
  } catch {
    fillPrice = order.limitPrice ?? 0;
    if (!fillPrice) {
      return NextResponse.json({ error: "Could not fetch live price" }, { status: 502 });
    }
  }

  const totalCost = fillPrice * order.qty;

  try {
    // ── Fetch current cash ──────────────────────────────────────────────────
    const cash = await getUserCash(sql, userId);

    if (order.side === "buy" && totalCost > cash) {
      return NextResponse.json(
        { error: `Insufficient cash. Need $${totalCost.toFixed(2)}, have $${cash.toFixed(2)}` },
        { status: 422 }
      );
    }

    // ── Fetch existing position for this user ───────────────────────────────
    const posRows = await sql`
      SELECT qty, avg_entry_price
      FROM positions
      WHERE user_id = ${userId} AND symbol = ${order.symbol}
    ` as Array<{ qty: string; avg_entry_price: string }>;

    const existing  = posRows[0];
    const existQty  = existing ? parseFloat(existing.qty) : 0;

    if (order.side === "sell" && order.qty > existQty) {
      return NextResponse.json(
        { error: `Insufficient position. Have ${existQty}, trying to sell ${order.qty}` },
        { status: 422 }
      );
    }

    // ── Record order ────────────────────────────────────────────────────────
    const orderRow = await sql`
      INSERT INTO orders (user_id, symbol, side, type, qty, limit_price, stop_price, status, fill_price)
      VALUES (
        ${userId}, ${order.symbol}, ${order.side}, ${order.type}, ${order.qty},
        ${order.limitPrice ?? null}, ${order.stopPrice ?? null},
        'filled', ${fillPrice}
      )
      RETURNING id
    ` as Array<{ id: string }>;

    const orderId = orderRow[0]?.id ?? `ord-${Date.now()}`;

    // ── Update position + cash ──────────────────────────────────────────────
    if (order.side === "buy") {
      const newQty      = existQty + order.qty;
      const existAvg    = existing ? parseFloat(existing.avg_entry_price) : 0;
      const newAvgPrice = (existQty * existAvg + order.qty * fillPrice) / newQty;

      await sql`
        INSERT INTO positions (user_id, symbol, qty, avg_entry_price, asset_type, currency)
        VALUES (${userId}, ${order.symbol}, ${newQty}, ${newAvgPrice}, ${meta.type}, ${meta.currency})
        ON CONFLICT (user_id, symbol) DO UPDATE
          SET qty             = ${newQty},
              avg_entry_price = ${newAvgPrice},
              updated_at      = NOW()
      `;
      await setUserCash(sql, userId, cash - totalCost);
    } else {
      // sell
      const newQty = existQty - order.qty;
      if (newQty <= 0.000001) {
        await sql`DELETE FROM positions WHERE user_id = ${userId} AND symbol = ${order.symbol}`;
      } else {
        await sql`
          UPDATE positions SET qty = ${newQty}, updated_at = NOW()
          WHERE user_id = ${userId} AND symbol = ${order.symbol}
        `;
      }
      await setUserCash(sql, userId, cash + totalCost);
    }

    return NextResponse.json({
      id:         orderId,
      symbol:     order.symbol,
      side:       order.side,
      type:       order.type,
      qty:        order.qty,
      status:     "filled",
      fill_price: fillPrice,
      total_cost: totalCost,
      currency:   meta.currency,
      created_at: new Date().toISOString(),
      db_mode:    true,
    });

  } catch (err) {
    console.error("[/api/order]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
