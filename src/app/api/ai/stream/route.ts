/**
 * POST /api/ai/stream
 *
 * Body: { symbol, name, price, changePct, high, low, volume, currency, strategies?, lang? }
 *
 * 1. Fetches Google News RSS for the symbol
 * 2. Builds a structured analysis prompt
 * 3. Streams the LLM response back as Server-Sent Events (text/event-stream)
 *
 * Falls back to a mock analysis when the local LLM is not running.
 */

import { NextRequest } from "next/server";
import { ANALYST_SYSTEM_PROMPT, buildAnalysisPrompt, streamChat, LLM_BASE } from "@/lib/llm";

export const dynamic = "force-dynamic";

const MOCK_ANALYSIS = `SENTIMENT → NEUTRAL [M] — Insufficient local LLM connection.

KEY LEVELS
  Support:    Check recent swing lows
  Resistance: Check recent swing highs

SIGNALS
  [M] ⬆ Local LLM offline — start LM Studio or Ollama to enable AI analysis
  [M] → Connect to http://localhost:1234/v1 (LM Studio) or :11434 (Ollama)
  [L] → Set LOCAL_LLM_URL in .env.local then restart the dev server

RISK → MEDIUM — Unable to assess without live data feed

─────────────────────────────────────────
TIP: Download LM Studio from lmstudio.ai
     Load any GGUF model and start the server
     This dashboard will auto-detect it
─────────────────────────────────────────`;

export async function POST(req: NextRequest) {
  const body = await req.json() as {
    symbol:     string;
    name:       string;
    price:      number;
    changePct:  number;
    high:       number;
    low:        number;
    volume:     number;
    currency:   string;
    strategies?: string;
    lang?:       "en" | "zh";
  };

  // ── Fetch news ─────────────────────────────────────────────────────────
  let newsText = "";
  try {
    const baseUrl  = req.nextUrl.origin;
    const newsRes  = await fetch(
      `${baseUrl}/api/ai/news?symbol=${encodeURIComponent(body.symbol)}&name=${encodeURIComponent(body.name)}`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (newsRes.ok) {
      const data = await newsRes.json() as { items: { title: string; sentiment: string }[] };
      newsText = data.items.slice(0, 6)
        .map((n) => `  [${n.sentiment.toUpperCase()[0]}] ${n.title}`)
        .join("\n");
    }
  } catch {
    // News is optional — continue without it
  }

  const prompt  = buildAnalysisPrompt({ ...body, news: newsText });
  const messages = [
    { role: "system" as const, content: ANALYST_SYSTEM_PROMPT },
    { role: "user"   as const, content: prompt },
  ];

  // ── Check LLM availability ─────────────────────────────────────────────
  let llmAvailable = false;
  try {
    const check = await fetch(`${LLM_BASE}/models`, { signal: AbortSignal.timeout(2000) });
    llmAvailable = check.ok;
  } catch {
    llmAvailable = false;
  }

  // ── SSE encoder ────────────────────────────────────────────────────────
  const encoder = new TextEncoder();

  function sseChunk(text: string) {
    return encoder.encode(`data: ${JSON.stringify({ delta: text })}\n\n`);
  }

  // ── Fallback stream (LLM offline) ─────────────────────────────────────
  if (!llmAvailable) {
    const stream = new ReadableStream({
      async start(controller) {
        const lines = MOCK_ANALYSIS.split("\n");
        for (const line of lines) {
          controller.enqueue(sseChunk(line + "\n"));
          await new Promise((r) => setTimeout(r, 30));
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      },
    });
    return new Response(stream, {
      headers: {
        "Content-Type":      "text/event-stream",
        "Cache-Control":     "no-cache",
        "X-Accel-Buffering": "no",
      },
    });
  }

  // ── Real LLM stream ────────────────────────────────────────────────────
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const llmRes = await streamChat(messages, { temperature: 0.3, maxTokens: 600 });
        if (!llmRes.ok || !llmRes.body) {
          throw new Error(`LLM HTTP ${llmRes.status}`);
        }

        const reader  = llmRes.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const raw  = decoder.decode(value, { stream: true });
          const lines = raw.split("\n").filter((l) => l.startsWith("data: "));

          for (const line of lines) {
            const payload = line.slice(6).trim();
            if (payload === "[DONE]") {
              controller.enqueue(encoder.encode("data: [DONE]\n\n"));
              controller.close();
              return;
            }
            try {
              const parsed  = JSON.parse(payload) as {
                choices: { delta?: { content?: string } }[];
              };
              const delta = parsed.choices[0]?.delta?.content;
              if (delta) controller.enqueue(sseChunk(delta));
            } catch {
              // Skip malformed SSE frames
            }
          }
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      } catch (err) {
        const errMsg = `\n\n[ERROR] ${String(err)}\n`;
        controller.enqueue(sseChunk(errMsg));
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type":      "text/event-stream",
      "Cache-Control":     "no-cache",
      "X-Accel-Buffering": "no",
    },
  });
}
