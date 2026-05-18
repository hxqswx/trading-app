import { NextRequest, NextResponse } from "next/server";
import { placeOrder } from "@/lib/alpaca";
import type { TradeOrder } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const order = await req.json() as TradeOrder;
    if (!order.symbol || !order.qty || !order.side || !order.type) {
      return NextResponse.json({ error: "symbol, qty, side, type required" }, { status: 400 });
    }

    const result = await placeOrder({
      symbol:     order.symbol,
      qty:        order.qty,
      side:       order.side,
      type:       order.type,
      limitPrice: order.limitPrice,
      stopPrice:  order.stopPrice,
    });

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
