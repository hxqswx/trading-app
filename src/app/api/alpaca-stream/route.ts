/**
 * GET /api/alpaca-stream?symbols=AAPL,MSFT
 *
 * Server-Sent Events proxy for the Alpaca WebSocket trade stream.
 * Keeps API credentials server-side (never sent to the browser).
 *
 * Protocol:
 *   1. Client connects with EventSource
 *   2. Server opens a WebSocket to wss://stream.data.alpaca.markets/v2/iex
 *   3. Server authenticates and subscribes to real-time trades
 *   4. Each trade message is forwarded to the client as an SSE event
 *   5. When the client disconnects, the WebSocket is closed
 *
 * SSE event format (one JSON object per line):
 *   data: {"symbol":"AAPL","price":213.52,"size":100,"timestamp":"2024-..."}
 */
import { NextRequest } from "next/server";
import { isAlpacaEnabled, ALPACA_STREAM_URL } from "@/lib/alpaca";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Alpaca WebSocket message types
interface AlpacaMsg {
  T:    string;   // "success" | "error" | "subscription" | "t" (trade) | "q" (quote)
  msg?: string;   // "connected" | "authenticated"
  S?:   string;   // symbol
  p?:   number;   // price
  s?:   number;   // size
  t?:   string;   // timestamp
}

export async function GET(req: NextRequest) {
  const symbolsParam = req.nextUrl.searchParams.get("symbols") ?? "";
  const symbols      = symbolsParam.split(",").map((s) => s.trim()).filter(Boolean);

  if (!isAlpacaEnabled()) {
    return new Response("Alpaca credentials not configured", { status: 503 });
  }
  if (!symbols.length) {
    return new Response("symbols query param required", { status: 400 });
  }

  const KEY    = process.env.APCA_API_KEY_ID     ?? "";
  const SECRET = process.env.APCA_API_SECRET_KEY ?? "";
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      // Send an initial keep-alive comment so the client knows it connected
      controller.enqueue(encoder.encode(`: connected\n\n`));

      const ws = new WebSocket(ALPACA_STREAM_URL);

      ws.addEventListener("open", () => {
        ws.send(JSON.stringify({ action: "auth", key: KEY, secret: SECRET }));
      });

      ws.addEventListener("message", (event: MessageEvent<string>) => {
        try {
          const messages = JSON.parse(event.data) as AlpacaMsg[];
          for (const msg of messages) {
            // After auth succeeds, subscribe to trades
            if (msg.T === "success" && msg.msg === "authenticated") {
              ws.send(JSON.stringify({ action: "subscribe", trades: symbols }));
              continue;
            }

            // Trade message — forward as SSE event
            if (msg.T === "t" && msg.S && msg.p != null) {
              const payload = JSON.stringify({
                symbol:    msg.S,
                price:     msg.p,
                size:      msg.s ?? 0,
                timestamp: msg.t ?? new Date().toISOString(),
              });
              controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
            }
          }
        } catch {
          // Ignore parse errors — keep stream alive
        }
      });

      ws.addEventListener("error", () => {
        // Close the SSE stream; EventSource on the client will auto-reconnect
        try { controller.close(); } catch { /* already closed */ }
      });

      ws.addEventListener("close", () => {
        try { controller.close(); } catch { /* already closed */ }
      });

      // Clean up when the client disconnects (req.signal fires "abort")
      req.signal.addEventListener("abort", () => {
        try { ws.close(1000, "client disconnected"); } catch { /* ignore */ }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type":      "text/event-stream; charset=utf-8",
      "Cache-Control":     "no-cache, no-transform",
      "Connection":        "keep-alive",
      "X-Accel-Buffering": "no",   // disable nginx buffering
    },
  });
}
