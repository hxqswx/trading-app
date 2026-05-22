/**
 * API client for the Next.js backend.
 * Base URL is set via EXPO_PUBLIC_API_URL environment variable.
 * All requests attach the Bearer token from the store when available.
 */
import type { Quote, PortfolioSummary, Candle, CandleInterval } from "./types";

// ---------------------------------------------------------------------------
// Base URL
// ---------------------------------------------------------------------------
function baseUrl(): string {
  const url = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";
  return url.replace(/\/$/, "");
}

// ---------------------------------------------------------------------------
// Fetch wrapper
// ---------------------------------------------------------------------------
async function apiFetch<T>(
  path: string,
  opts: RequestInit = {}
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(opts.headers as Record<string, string> | undefined),
  };

  const res = await fetch(`${baseUrl()}${path}`, { ...opts, headers });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`API ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Quotes — GET /api/quote?symbols=A,B,C → Quote[]
// ---------------------------------------------------------------------------
export async function fetchQuotes(symbols: string[]): Promise<Quote[]> {
  const params = new URLSearchParams({ symbols: symbols.join(",") });
  return apiFetch<Quote[]>(`/api/quote?${params}`);
}

// ---------------------------------------------------------------------------
// Portfolio
// ---------------------------------------------------------------------------
export async function fetchPortfolio(): Promise<PortfolioSummary> {
  return apiFetch<PortfolioSummary>("/api/portfolio");
}

// ---------------------------------------------------------------------------
// Candles — GET /api/candles?symbol=&interval=&limit= → Candle[]
// ---------------------------------------------------------------------------
export async function fetchCandles(
  symbol: string,
  interval: CandleInterval = "1h",
  limit: number = 200
): Promise<Candle[]> {
  const params = new URLSearchParams({ symbol, interval, limit: String(limit) });
  return apiFetch<Candle[]>(`/api/candles?${params}`);
}

// ---------------------------------------------------------------------------
// AI Analysis — POST /api/ai-analysis { symbol, quote, lang? } → AIAnalysis
// ---------------------------------------------------------------------------
export interface AiAnalysis {
  symbol:    string;
  sentiment: "bullish" | "bearish" | "neutral";
  riskLevel: "low" | "medium" | "high";
  keyLevels: { support: number; resistance: number };
  signals:   string[];
  summary:   string;
  timestamp: number;
}

export async function fetchAiAnalysis(
  symbol: string,
  quote:  Quote,
  lang:   "en" | "zh" = "zh"
): Promise<AiAnalysis> {
  return apiFetch<AiAnalysis>("/api/ai-analysis", {
    method: "POST",
    body:   JSON.stringify({ symbol, quote, lang }),
  });
}

// ---------------------------------------------------------------------------
// Strategies — GET /api/strategies?symbol= → StrategiesResponse
// ---------------------------------------------------------------------------
export type Signal = "STRONG_BUY" | "BUY" | "HOLD" | "SELL" | "STRONG_SELL";

export interface StrategyResult {
  id:            string;
  name:          string;
  nameZh:        string;
  signal:        Signal;
  strength:      1 | 2 | 3 | 4 | 5;
  reason:        string;
  reasonZh:      string;
  description:   string;
  descriptionZh: string;
  values:        Record<string, number | string>;
}

export interface ConsensusResult {
  signal:  Signal;
  score:   number;
  bullish: number;
  bearish: number;
  neutral: number;
}

export interface StrategiesResponse {
  symbol:      string;
  strategies:  StrategyResult[];
  consensus:   ConsensusResult;
  candleCount: number;
  timestamp:   number;
}

export async function fetchStrategies(symbol: string): Promise<StrategiesResponse> {
  return apiFetch<StrategiesResponse>(`/api/strategies?symbol=${encodeURIComponent(symbol)}`);
}

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------
export interface OrderPayload {
  symbol:    string;
  side:      "buy" | "sell";
  qty:       number;
  orderType: "market" | "limit" | "stop" | "stop_limit";
  limitPrice?: number;
  stopPrice?:  number;
}

export interface OrderResponse {
  success: boolean;
  orderId: string;
  message: string;
}

export async function placeOrder(payload: OrderPayload): Promise<OrderResponse> {
  return apiFetch<OrderResponse>("/api/order", {
    method: "POST",
    body:   JSON.stringify(payload),
  });
}

// ---------------------------------------------------------------------------
// AI Terminal
// ---------------------------------------------------------------------------

export interface LLMStatus {
  ok:        boolean;
  model:     string;
  latencyMs: number;
  provider:  string;
}

export interface NewsItem {
  title:     string;
  url:       string;
  source:    string;
  pubDate:   string;
  sentiment: "bullish" | "bearish" | "neutral";
}

export async function checkAIStatus(): Promise<LLMStatus> {
  return apiFetch<LLMStatus>("/api/ai/status");
}

export async function fetchAINews(symbol: string, name: string): Promise<{ items: NewsItem[] }> {
  const params = new URLSearchParams({ symbol, name });
  return apiFetch<{ items: NewsItem[] }>(`/api/ai/news?${params}`);
}

/** Streams AI terminal analysis, calling onChunk for each text delta. */
export async function streamAnalysis(
  params: {
    symbol: string; name: string;
    price: number; changePct: number;
    high: number; low: number; volume: number;
    currency: string; lang: string;
  },
  onChunk: (delta: string) => void,
  signal?: AbortSignal,
): Promise<void> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };

  const res = await fetch(`${baseUrl()}/api/ai/stream`, {
    method: "POST",
    headers,
    body: JSON.stringify(params),
    signal,
  });

  if (!res.ok) throw new Error(`Stream error: ${res.status}`);

  // React Native 0.81 / Hermes supports ReadableStream
  const reader  = res.body?.getReader();
  if (!reader) throw new Error("Streaming not supported");

  const decoder = new TextDecoder();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const raw   = decoder.decode(value, { stream: true });
    const lines = raw.split("\n").filter((l) => l.startsWith("data: "));
    for (const line of lines) {
      const payload = line.slice(6).trim();
      if (payload === "[DONE]") return;
      try {
        const parsed = JSON.parse(payload) as { delta: string };
        if (parsed.delta) onChunk(parsed.delta);
      } catch { /* skip */ }
    }
  }
}

export interface ChatMessage {
  role:    "user" | "assistant";
  content: string;
}

export async function chatWithAI(
  messages:    ChatMessage[],
  symbol:      string,
  onChunk:     (delta: string) => void,
  signal?:     AbortSignal,
): Promise<void> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };

  const res = await fetch(`${baseUrl()}/api/ai/chat`, {
    method: "POST",
    headers,
    body: JSON.stringify({ messages, symbol }),
    signal,
  });

  if (!res.ok) throw new Error(`Chat error: ${res.status}`);

  const reader = res.body?.getReader();
  if (!reader) throw new Error("Streaming not supported");

  const decoder = new TextDecoder();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const raw   = decoder.decode(value, { stream: true });
    const lines = raw.split("\n").filter((l) => l.startsWith("data: "));
    for (const line of lines) {
      const payload = line.slice(6).trim();
      if (payload === "[DONE]") return;
      try {
        const parsed = JSON.parse(payload) as { delta: string };
        if (parsed.delta) onChunk(parsed.delta);
      } catch { /* skip */ }
    }
  }
}
