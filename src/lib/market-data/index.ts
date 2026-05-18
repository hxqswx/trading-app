/**
 * Market data entry point.
 *
 * Layered strategy:
 *   Redis/KV cache  →  Yahoo Finance live data  →  deterministic mock fallback
 *
 * Cache TTLs:
 *   Quotes            30 s  (near real-time for intraday trading)
 *   Intraday candles   5 min
 *   Daily candles     30 min
 */
import type { Quote, Candle, CandleInterval } from "@/lib/types";
import { getCache } from "@/lib/cache";
import { fetchLiveQuotes, fetchYFCandles } from "./yahoo";
import { generateQuote, generateCandles } from "@/lib/mock";

const TTL_QUOTE          =     30; // seconds
const TTL_CANDLE_INTRADAY = 5 * 60;
const TTL_CANDLE_DAILY    = 30 * 60;

// ── Quotes ────────────────────────────────────────────────────────────────────

/**
 * Get live quotes for an array of symbols.
 * Hits cache first; fetches only the missing ones from Yahoo Finance.
 */
export async function getQuotes(symbols: string[]): Promise<Quote[]> {
  if (!symbols.length) return [];

  const cache  = getCache();
  const cached: Quote[] = [];
  const toFetch: string[] = [];

  await Promise.all(
    symbols.map(async (sym) => {
      const hit = await cache.get<Quote>(`q:${sym}`);
      if (hit) cached.push(hit);
      else toFetch.push(sym);
    })
  );

  if (toFetch.length) {
    const fresh = await fetchLiveQuotes(toFetch);
    await Promise.all(
      fresh.map((q) => cache.set(`q:${q.symbol}`, q, TTL_QUOTE))
    );
    cached.push(...fresh);
  }

  // Restore original order
  const map = new Map(cached.map((q) => [q.symbol, q]));
  return symbols.map((s) => map.get(s) ?? generateQuote(s));
}

// ── Candles ───────────────────────────────────────────────────────────────────

/**
 * Get OHLCV candles for a symbol.
 * Cache key includes symbol + interval so different intervals are cached separately.
 */
export async function getCandles(
  symbol:   string,
  interval: CandleInterval,
  limit:    number,
): Promise<Candle[]> {
  const cache = getCache();
  const key   = `c:${symbol}:${interval}`;
  const ttl   = interval === "1d" ? TTL_CANDLE_DAILY : TTL_CANDLE_INTRADAY;

  const cached = await cache.get<Candle[]>(key);
  if (cached) return cached.slice(-limit);

  const candles = await fetchYFCandles(symbol, interval, limit);
  await cache.set(key, candles, ttl);
  return candles;
}

// ── Single quote (convenience) ────────────────────────────────────────────────

export async function getQuote(symbol: string): Promise<Quote> {
  const [q] = await getQuotes([symbol]);
  return q ?? generateQuote(symbol);
}
