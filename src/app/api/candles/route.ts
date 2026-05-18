/**
 * GET /api/candles?symbol=AAPL&interval=1h&limit=200
 *
 * Returns OHLCV candles from Yahoo Finance, cached in Redis/KV.
 * Falls back to deterministic mock data on API failure or missing data.
 */
import { NextRequest, NextResponse } from "next/server";
import { getCandles } from "@/lib/market-data";
import type { CandleInterval } from "@/lib/types";

export const runtime = "nodejs";

const VALID_INTERVALS = new Set<CandleInterval>(["1m","5m","15m","1h","4h","1d"]);

export async function GET(req: NextRequest) {
  const symbol   = req.nextUrl.searchParams.get("symbol");
  const interval = (req.nextUrl.searchParams.get("interval") ?? "1h") as CandleInterval;
  const limit    = Math.min(
    Math.max(1, parseInt(req.nextUrl.searchParams.get("limit") ?? "200")),
    500
  );

  if (!symbol) {
    return NextResponse.json({ error: "symbol is required" }, { status: 400 });
  }
  if (!VALID_INTERVALS.has(interval)) {
    return NextResponse.json({ error: `interval must be one of ${[...VALID_INTERVALS].join(",")}` }, { status: 400 });
  }

  const candles = await getCandles(symbol, interval, limit);
  return NextResponse.json(candles, {
    headers: {
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
    },
  });
}
