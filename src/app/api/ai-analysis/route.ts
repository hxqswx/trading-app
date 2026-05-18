import { NextRequest, NextResponse } from "next/server";
import { MOCK_AI_ANALYSES } from "@/lib/mock";
import type { AIAnalysis, Quote } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const { symbol, lang } = await req.json() as { symbol: string; quote: Quote; lang?: "en" | "zh" };
    if (!symbol) return NextResponse.json({ error: "symbol required" }, { status: 400 });

    const analyses = MOCK_AI_ANALYSES[symbol];
    if (!analyses) return NextResponse.json({ error: `No analysis available for ${symbol}` }, { status: 404 });

    const chosen = analyses[lang ?? "en"] ?? analyses.en;

    await new Promise((r) => setTimeout(r, 900));

    const analysis: AIAnalysis = { symbol, timestamp: Date.now(), ...chosen };
    return NextResponse.json(analysis);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
