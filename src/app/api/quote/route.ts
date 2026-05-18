/**
 * GET /api/quote?symbols=AAPL,BTCUSDT,HK0700
 *
 * Returns live quotes via Yahoo Finance, cached in Redis/KV.
 * Falls back to deterministic mock data when the external API is unavailable.
 */
import { NextRequest, NextResponse } from "next/server";
import { ASSET_META } from "@/lib/mock";
import { getQuotes } from "@/lib/market-data";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const raw     = req.nextUrl.searchParams.get("symbols") ?? "";
  const symbols = raw.split(",").map((s) => s.trim()).filter((s) => s in ASSET_META);

  if (!symbols.length) {
    return NextResponse.json({ error: "No valid symbols provided" }, { status: 400 });
  }

  const quotes = await getQuotes(symbols);
  return NextResponse.json(quotes, {
    headers: {
      // Let the browser cache for 15 s while still allowing revalidation
      "Cache-Control": "public, s-maxage=15, stale-while-revalidate=30",
    },
  });
}
