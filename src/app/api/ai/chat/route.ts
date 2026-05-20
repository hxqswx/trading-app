/**
 * POST /api/ai/chat
 *
 * Body: { messages: ChatMessage[], lang? }
 *
 * Interactive chat with conversation history.
 * Streams response as SSE (text/event-stream).
 * Falls back to mock when LLM is offline.
 */

import { NextRequest } from "next/server";
import { ANALYST_SYSTEM_PROMPT, streamChat, ChatMessage, isConfigured } from "@/lib/llm";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { messages, lang } = await req.json() as {
    messages: ChatMessage[];
    lang?: "en" | "zh";
  };

  const systemContent = ANALYST_SYSTEM_PROMPT +
    (lang === "zh" ? "\n\nRespond in Chinese (Simplified). Keep technical terms in English." : "");

  const full: ChatMessage[] = [
    { role: "system", content: systemContent },
    ...messages.slice(-20), // keep last 20 turns to stay within context
  ];

  const encoder = new TextEncoder();

  function sseChunk(text: string) {
    return encoder.encode(`data: ${JSON.stringify({ delta: text })}\n\n`);
  }

  // ── Check availability ──────────────────────────────────────────────────
  if (!isConfigured()) {
    const offline =
      "⚠  AI not configured.\n\n" +
      "Add your Gemini API key to .env.local:\n" +
      "  AI_API_KEY=your_key_here\n\n" +
      "Get a free key at: https://aistudio.google.com → API Keys\n" +
      "Free tier: 1,500 requests/day · no credit card required.\n\n" +
      "Restart the dev server after adding the key.";

    const stream = new ReadableStream({
      async start(controller) {
        controller.enqueue(sseChunk(offline));
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

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const llmRes = await streamChat(full, { temperature: 0.4, maxTokens: 800 });
        if (!llmRes.ok || !llmRes.body) throw new Error(`LLM HTTP ${llmRes.status}`);

        const reader  = llmRes.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const raw   = decoder.decode(value, { stream: true });
          const lines = raw.split("\n").filter((l) => l.startsWith("data: "));

          for (const line of lines) {
            const payload = line.slice(6).trim();
            if (payload === "[DONE]") {
              controller.enqueue(encoder.encode("data: [DONE]\n\n"));
              controller.close();
              return;
            }
            try {
              const parsed = JSON.parse(payload) as {
                choices: { delta?: { content?: string } }[];
              };
              const delta = parsed.choices[0]?.delta?.content;
              if (delta) controller.enqueue(sseChunk(delta));
            } catch {
              // Skip malformed frames
            }
          }
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      } catch (err) {
        controller.enqueue(sseChunk(`\n[ERROR] ${String(err)}`));
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
