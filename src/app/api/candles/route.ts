import { NextRequest, NextResponse } from "next/server";
import { getStockCandles } from "@/lib/alpaca";
import { getCryptoCandles } from "@/lib/binance";
import { isCrypto } from "@/lib/utils";
import type { CandleInterval } from "@/lib/types";

export async function GET(req: NextRequest) {
  const symbol   = req.nextUrl.searchParams.get("symbol");
  const interval = (req.nextUrl.searchParams.get("interval") ?? "1h") as CandleInterval;
  const limit    = parseInt(req.nextUrl.searchParams.get("limit") ?? "200");

  if (!symbol) return NextResponse.json({ error: "symbol required" }, { status: 400 });

  try {
    const candles = isCrypto(symbol)
      ? await getCryptoCandles(symbol, interval, limit)
      : await getStockCandles(symbol, interval, limit);

    return NextResponse.json(candles);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
