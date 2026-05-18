import { NextRequest, NextResponse } from "next/server";
import { generateCandles } from "@/lib/mock";
import type { CandleInterval } from "@/lib/types";

export async function GET(req: NextRequest) {
  const symbol   = req.nextUrl.searchParams.get("symbol");
  const interval = (req.nextUrl.searchParams.get("interval") ?? "1h") as CandleInterval;
  const limit    = Math.min(parseInt(req.nextUrl.searchParams.get("limit") ?? "200"), 500);

  if (!symbol) return NextResponse.json({ error: "symbol required" }, { status: 400 });

  const candles = generateCandles(symbol, interval, limit);
  return NextResponse.json(candles);
}
