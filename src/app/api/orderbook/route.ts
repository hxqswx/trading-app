import { NextRequest, NextResponse } from "next/server";
import { generateOrderBook, generateQuote } from "@/lib/mock";

export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get("symbol");
  const depth  = Math.min(parseInt(req.nextUrl.searchParams.get("depth") ?? "20"), 30);

  if (!symbol) return NextResponse.json({ error: "symbol required" }, { status: 400 });

  const quote = generateQuote(symbol);
  const book  = generateOrderBook(symbol, quote.price, depth);
  return NextResponse.json(book);
}
