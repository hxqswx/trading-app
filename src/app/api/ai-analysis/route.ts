import { NextRequest, NextResponse } from "next/server";
import { MOCK_AI_ANALYSES } from "@/lib/mock";
import type { AIAnalysis, Quote } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const { symbol } = await req.json() as { symbol: string; quote: Quote };
    if (!symbol) return NextResponse.json({ error: "symbol required" }, { status: 400 });

    const mock = MOCK_AI_ANALYSES[symbol];
    if (!mock) return NextResponse.json({ error: `No analysis available for ${symbol}` }, { status: 404 });

    // Simulate a brief "thinking" delay for realism
    await new Promise((r) => setTimeout(r, 900));

    const analysis: AIAnalysis = { symbol, timestamp: Date.now(), ...mock };
    return NextResponse.json(analysis);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
