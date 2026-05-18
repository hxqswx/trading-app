import { NextRequest, NextResponse } from "next/server";
import { getCryptoOrderBook } from "@/lib/binance";
import { isCrypto } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get("symbol");
  const depth  = parseInt(req.nextUrl.searchParams.get("depth") ?? "20");

  if (!symbol) return NextResponse.json({ error: "symbol required" }, { status: 400 });

  try {
    if (isCrypto(symbol)) {
      const book = await getCryptoOrderBook(symbol, depth);
      return NextResponse.json(book);
    }

    // For stocks: return a minimal mock order book
    // (real L2 stock data requires premium Alpaca subscription)
    return NextResponse.json({
      symbol,
      bids: [],
      asks: [],
      timestamp: Date.now(),
      note: "L2 stock data requires Alpaca premium subscription",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
