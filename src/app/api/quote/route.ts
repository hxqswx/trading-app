import { NextRequest, NextResponse } from "next/server";
import { generateQuote, ASSET_META } from "@/lib/mock";

export async function GET(req: NextRequest) {
  const symbols = req.nextUrl.searchParams.get("symbols")?.split(",").filter(Boolean) ?? [];
  if (!symbols.length) return NextResponse.json({ error: "symbols required" }, { status: 400 });

  const quotes = symbols
    .filter((s) => s in ASSET_META)
    .map((s) => generateQuote(s));

  return NextResponse.json(quotes);
}
