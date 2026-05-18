import { NextRequest, NextResponse } from "next/server";
import type { TradeOrder } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const order = await req.json() as TradeOrder;
    if (!order.symbol || !order.qty || !order.side || !order.type) {
      return NextResponse.json({ error: "symbol, qty, side, type required" }, { status: 400 });
    }

    // Simulate a small processing delay
    await new Promise((r) => setTimeout(r, 400));

    // Return a simulated order confirmation
    return NextResponse.json({
      id:         `mock-${Date.now()}`,
      symbol:     order.symbol,
      side:       order.side,
      type:       order.type,
      qty:        order.qty,
      status:     "filled",
      filled_qty: order.qty,
      filled_avg_price: order.limitPrice ?? null,
      created_at: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
