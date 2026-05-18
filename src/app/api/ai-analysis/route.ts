import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import type { AIAnalysis, Quote, Candle } from "@/lib/types";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { symbol: string; quote: Quote; candles: Candle[] };
    const { symbol, quote, candles } = body;

    if (!symbol || !quote) {
      return NextResponse.json({ error: "symbol and quote required" }, { status: 400 });
    }

    const recentCandles = candles?.slice(-20) ?? [];
    const candleSummary = recentCandles
      .map((c) => `${new Date(c.time * 1000).toISOString().slice(0, 16)} O:${c.open} H:${c.high} L:${c.low} C:${c.close} V:${c.volume}`)
      .join("\n");

    const prompt = `You are a professional quantitative analyst. Analyze the following market data for ${symbol} and provide a concise trading analysis.

## Current Market Data
- Symbol: ${symbol}
- Current Price: $${quote.price}
- 24h Change: ${quote.changePct.toFixed(2)}%
- 24h High: $${quote.high}
- 24h Low: $${quote.low}
- Volume: ${quote.volume.toLocaleString()}

## Recent OHLCV Data (last 20 bars)
${candleSummary}

Respond with a JSON object (no markdown, just raw JSON) with this exact structure:
{
  "sentiment": "bullish" | "bearish" | "neutral",
  "summary": "2-3 sentence market analysis",
  "keyLevels": {
    "support": <number>,
    "resistance": <number>
  },
  "signals": ["signal1", "signal2", "signal3"],
  "riskLevel": "low" | "medium" | "high"
}`;

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 512,
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const parsed = JSON.parse(text.trim()) as Omit<AIAnalysis, "symbol" | "timestamp">;

    const analysis: AIAnalysis = {
      symbol,
      timestamp: Date.now(),
      ...parsed,
    };

    return NextResponse.json(analysis);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
