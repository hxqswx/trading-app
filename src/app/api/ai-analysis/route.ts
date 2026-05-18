import { NextRequest, NextResponse } from "next/server";
import { MOCK_AI_ANALYSES } from "@/lib/mock";
import type { AIAnalysis, Quote } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const { symbol, quote } = await req.json() as { symbol: string; quote: Quote };
    if (!symbol) return NextResponse.json({ error: "symbol required" }, { status: 400 });

    // Try Claude API first if key is present
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (apiKey && apiKey !== "your_anthropic_api_key_here" && quote) {
      try {
        const { default: Anthropic } = await import("@anthropic-ai/sdk");
        const client = new Anthropic({ apiKey });

        const prompt = `You are a professional quantitative analyst. Analyze ${symbol} at $${quote.price.toFixed(2)} (${quote.changePct >= 0 ? "+" : ""}${quote.changePct.toFixed(2)}% today). 24h High: $${quote.high.toFixed(2)}, Low: $${quote.low.toFixed(2)}.

Respond ONLY with raw JSON (no markdown) matching this exact shape:
{"sentiment":"bullish"|"bearish"|"neutral","summary":"2-3 sentence analysis","keyLevels":{"support":number,"resistance":number},"signals":["signal1","signal2","signal3"],"riskLevel":"low"|"medium"|"high"}`;

        const msg = await client.messages.create({
          model: "claude-sonnet-4-6",
          max_tokens: 400,
          messages: [{ role: "user", content: prompt }],
        });
        const text = msg.content[0].type === "text" ? msg.content[0].text.trim() : "";
        const parsed = JSON.parse(text) as Omit<AIAnalysis, "symbol" | "timestamp">;
        return NextResponse.json({ symbol, timestamp: Date.now(), ...parsed });
      } catch {
        // Fall through to mock
      }
    }

    // Return pre-canned mock analysis
    const mock = MOCK_AI_ANALYSES[symbol];
    if (!mock) return NextResponse.json({ error: `No analysis available for ${symbol}` }, { status: 404 });

    const analysis: AIAnalysis = { symbol, timestamp: Date.now(), ...mock };
    // Add a small simulated delay so it feels like it's "thinking"
    await new Promise((r) => setTimeout(r, 900));
    return NextResponse.json(analysis);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
