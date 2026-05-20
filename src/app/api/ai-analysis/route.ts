/**
 * POST /api/ai-analysis
 *
 * Body: { symbol, quote, lang? }
 *
 * 1. Fetches strategy signals for the symbol (used as context)
 * 2. Calls the local LLM for a structured JSON analysis
 * 3. Falls back to MOCK_AI_ANALYSES when LLM is offline
 */

import { NextRequest, NextResponse } from "next/server";
import { MOCK_AI_ANALYSES, ASSET_META } from "@/lib/mock";
import type { AIAnalysis, Quote } from "@/lib/types";
import { getStructuredAnalysis, checkLLMStatus } from "@/lib/llm";

export async function POST(req: NextRequest) {
  try {
    const { symbol, quote, lang } = await req.json() as {
      symbol: string;
      quote:  Quote;
      lang?:  "en" | "zh";
    };
    if (!symbol) return NextResponse.json({ error: "symbol required" }, { status: 400 });

    // ── Try real LLM first ──────────────────────────────────────────────
    const llmStatus = await checkLLMStatus();

    if (llmStatus.ok && quote) {
      const meta = ASSET_META[symbol];

      // Fetch strategy signals for context
      let strategiesText = "";
      try {
        const baseUrl  = req.nextUrl.origin;
        const sgRes    = await fetch(`${baseUrl}/api/strategies`, {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ symbol }),
          signal:  AbortSignal.timeout(5000),
        });
        if (sgRes.ok) {
          const sg = await sgRes.json() as {
            strategies: { name: string; signal: string }[];
          };
          strategiesText = (sg.strategies ?? [])
            .map((s) => `  ${s.name}: ${s.signal}`)
            .join("\n");
        }
      } catch {
        // Optional
      }

      const result = await getStructuredAnalysis({
        symbol,
        name:      meta?.name    ?? symbol,
        price:     quote.price,
        changePct: quote.changePct,
        high:      quote.high,
        low:       quote.low,
        volume:    quote.volume,
        currency:  quote.currency ?? "USD",
        strategies: strategiesText,
        lang,
      });

      if (result) {
        const analysis: AIAnalysis = {
          symbol,
          timestamp: Date.now(),
          ...result,
        };
        return NextResponse.json(analysis);
      }
    }

    // ── Mock fallback ────────────────────────────────────────────────────
    const analyses = MOCK_AI_ANALYSES[symbol];
    if (!analyses) return NextResponse.json({ error: `No analysis available for ${symbol}` }, { status: 404 });

    const chosen = analyses[lang ?? "en"] ?? analyses.en;
    await new Promise((r) => setTimeout(r, 600));
    const analysis: AIAnalysis = { symbol, timestamp: Date.now(), ...chosen };
    return NextResponse.json(analysis);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
