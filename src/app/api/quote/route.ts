import { NextRequest, NextResponse } from "next/server";
import { getStockQuotes } from "@/lib/alpaca";
import { getCryptoQuotes } from "@/lib/binance";
import { isCrypto } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const symbols = req.nextUrl.searchParams.get("symbols")?.split(",").filter(Boolean) ?? [];
  if (!symbols.length) return NextResponse.json({ error: "symbols required" }, { status: 400 });

  const stocks = symbols.filter((s) => !isCrypto(s));
  const cryptos = symbols.filter((s) => isCrypto(s));

  try {
    const [stockQuotes, cryptoQuotes] = await Promise.all([
      stocks.length  ? getStockQuotes(stocks)   : [],
      cryptos.length ? getCryptoQuotes(cryptos) : [],
    ]);

    return NextResponse.json([...stockQuotes, ...cryptoQuotes]);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
