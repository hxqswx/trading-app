/**
 * GET /api/strategies?symbol=AAPL[&interval=1d][&limit=120]
 *
 * Fetches candles from the cache / Yahoo Finance, runs all six trading
 * strategies, and returns the full signal matrix plus consensus.
 */
import { NextRequest, NextResponse } from "next/server";
import { getCandles } from "@/lib/market-data";
import { runAllStrategies, getConsensus } from "@/lib/strategies";
import { ASSET_META } from "@/lib/mock";
import type { CandleInterval, StrategiesResponse } from "@/lib/types";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const symbol   = searchParams.get("symbol") ?? "";
  const interval = (searchParams.get("interval") ?? "1d") as CandleInterval;
  const limit    = Math.min(parseInt(searchParams.get("limit") ?? "120", 10), 500);

  if (!symbol) {
    return NextResponse.json({ error: "symbol is required" }, { status: 400 });
  }
  if (!(symbol in ASSET_META)) {
    return NextResponse.json({ error: `Unknown symbol: ${symbol}` }, { status: 400 });
  }

  try {
    const candles    = await getCandles(symbol, interval, limit);
    const strategies = runAllStrategies(candles);
    const consensus  = getConsensus(strategies);

    const body: StrategiesResponse = {
      symbol,
      strategies,
      consensus,
      candleCount: candles.length,
      timestamp:   Date.now(),
    };

    return NextResponse.json(body, {
      headers: { "Cache-Control": "s-maxage=30, stale-while-revalidate=60" },
    });
  } catch (err) {
    console.error("[/api/strategies]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
