/**
 * API client for the Next.js backend.
 * Base URL is set via EXPO_PUBLIC_API_URL environment variable.
 * All requests attach the Bearer token from the store when available.
 */
import type { Quote, PortfolioSummary, Candle, CandleInterval } from "./types";
import { useTradingStore } from "./store";

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
  const token = useTradingStore.getState().token;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(opts.headers as Record<string, string> | undefined),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${baseUrl()}${path}`, { ...opts, headers });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`API ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------
export interface SignInPayload {
  email:    string;
  password: string;
}

export interface SignInResponse {
  token: string;
  user:  { id: string; email: string; name: string };
}

export async function signIn(payload: SignInPayload): Promise<SignInResponse> {
  return apiFetch<SignInResponse>("/api/mobile-token", {
    method: "POST",
    body:   JSON.stringify(payload),
  });
}

// ---------------------------------------------------------------------------
// Quotes
// ---------------------------------------------------------------------------
export interface QuotesResponse {
  quotes: Quote[];
  ts:     number;
}

export async function fetchQuotes(symbols: string[]): Promise<Quote[]> {
  const params = new URLSearchParams({ symbols: symbols.join(",") });
  const res = await apiFetch<QuotesResponse>(`/api/quotes?${params}`);
  return res.quotes;
}

// ---------------------------------------------------------------------------
// Portfolio
// ---------------------------------------------------------------------------
export async function fetchPortfolio(): Promise<PortfolioSummary> {
  return apiFetch<PortfolioSummary>("/api/portfolio");
}

// ---------------------------------------------------------------------------
// Candles (chart data)
// ---------------------------------------------------------------------------
export interface CandlesResponse {
  candles:  Candle[];
  symbol:   string;
  interval: CandleInterval;
}

export async function fetchCandles(
  symbol: string,
  interval: CandleInterval = "1h"
): Promise<Candle[]> {
  const params = new URLSearchParams({ symbol, interval });
  const res = await apiFetch<CandlesResponse>(`/api/candles?${params}`);
  return res.candles;
}

// ---------------------------------------------------------------------------
// AI Analysis
// ---------------------------------------------------------------------------
export interface AiAnalysis {
  sentiment:  "bullish" | "bearish" | "neutral";
  riskLevel:  "low" | "medium" | "high";
  support:    number;
  resistance: number;
  signals:    string[];
  summary:    string;
  updatedAt:  string;
}

export async function fetchAiAnalysis(symbol: string): Promise<AiAnalysis> {
  return apiFetch<AiAnalysis>(`/api/ai-analysis?symbol=${encodeURIComponent(symbol)}`);
}

// ---------------------------------------------------------------------------
// Strategies
// ---------------------------------------------------------------------------
export interface StrategySignal {
  name:      string;
  signal:    "strong_buy" | "buy" | "hold" | "sell" | "strong_sell";
  value:     number;
}

export interface StrategyResult {
  symbol:    string;
  signals:   StrategySignal[];
  consensus: "strong_buy" | "buy" | "hold" | "sell" | "strong_sell";
  score:     number;
}

export async function fetchStrategies(symbol: string): Promise<StrategyResult> {
  return apiFetch<StrategyResult>(`/api/strategies?symbol=${encodeURIComponent(symbol)}`);
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
