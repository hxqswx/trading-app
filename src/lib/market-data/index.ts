/**
 * Market data entry point.
 *
 * Layered routing strategy:
 *   US Stocks → Alpaca Data API (real-time IEX feed, requires credentials)
 *               Yahoo Finance v8/chart (fallback when Alpaca is unavailable)
 *   Crypto    → Binance REST (free, no auth)
 *   HK/CN/FX  → Yahoo Finance v8/chart
 *
 * All results are cached in Redis/KV or in-memory.
 *
 * Cache TTLs:
 *   Quotes            30 s
 *   Intraday candles   5 min
 *   Daily candles     30 min
 */
import type { Quote, Candle, CandleInterval } from "@/lib/types";
import { getCache } from "@/lib/cache";
import { fetchLiveQuotes, fetchYFCandles } from "./yahoo";
import { fetchAlpacaQuotes, fetchAlpacaCandles, US_STOCK_SYMBOLS } from "./alpaca";
import { isAlpacaEnabled } from "@/lib/alpaca";
import { generateQuote, generateCandles } from "@/lib/mock";
import { BINANCE_SYMBOLS } from "@/lib/asset-registry";

const TTL_QUOTE           =     30; // seconds
const TTL_CANDLE_INTRADAY = 5 * 60;
const TTL_CANDLE_DAILY    = 30 * 60;

// ── Quotes ────────────────────────────────────────────────────────────────────

/**
 * Get live quotes for an array of symbols.
 * Hits cache first; fetches only the missing ones from the appropriate provider.
 *
 * Routing priority:
 *   1. Cache hit
 *   2. Alpaca (US stocks, when credentials are set)
 *   3. Yahoo Finance / Binance (fallback or non-US)
 */
export async function getQuotes(symbols: string[]): Promise<Quote[]> {
  if (!symbols.length) return [];

  const cache   = getCache();
  const cached: Quote[]  = [];
  const toFetch: string[] = [];

  await Promise.all(
    symbols.map(async (sym) => {
      const hit = await cache.get<Quote>(`q:${sym}`);
      if (hit) cached.push(hit);
      else toFetch.push(sym);
    })
  );

  if (toFetch.length) {
    const alpacaEnabled = isAlpacaEnabled();

    // Split symbols by provider
    const alpacaSyms  = alpacaEnabled ? toFetch.filter((s) => US_STOCK_SYMBOLS.has(s)) : [];
    const yahooSyms   = toFetch.filter(
      (s) => !BINANCE_SYMBOLS.has(s) && (!alpacaEnabled || !US_STOCK_SYMBOLS.has(s))
    );
    // Crypto (Binance) is handled inside fetchLiveQuotes
    const binanceSyms = toFetch.filter((s) => BINANCE_SYMBOLS.has(s));

    const [alpacaQuotes, restQuotes] = await Promise.all([
      alpacaSyms.length
        ? fetchAlpacaQuotes(alpacaSyms)
        : Promise.resolve([] as Quote[]),
      (yahooSyms.length || binanceSyms.length)
        ? fetchLiveQuotes([...binanceSyms, ...yahooSyms])
        : Promise.resolve([] as Quote[]),
    ]);

    // For any Alpaca symbol that returned a mock (no data), fall back to Yahoo
    const alpacaFailed = alpacaSyms.filter(
      (s, i) => alpacaQuotes[i]?.price === generateQuote(s).price
    );
    const yahooFallback = alpacaFailed.length
      ? await fetchLiveQuotes(alpacaFailed)
      : [];

    const fresh = [...alpacaQuotes, ...restQuotes, ...yahooFallback];

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
 *
 * Routing:
 *   US stocks (Alpaca enabled) → Alpaca historical bars
 *   Crypto                     → Binance klines (via fetchYFCandles)
 *   HK / CN / FX / fallback   → Yahoo Finance v8/chart
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

  // Try Alpaca for US stocks
  if (isAlpacaEnabled() && US_STOCK_SYMBOLS.has(symbol)) {
    const candles = await fetchAlpacaCandles(symbol, interval, limit);
    if (candles?.length) {
      await cache.set(key, candles, ttl);
      return candles.slice(-limit);
    }
    // Fall through to Yahoo Finance on failure
  }

  // Crypto (Binance) + all other markets (Yahoo Finance)
  const candles = await fetchYFCandles(symbol, interval, limit);
  await cache.set(key, candles, ttl);
  return candles;
}

// ── Single quote (convenience) ────────────────────────────────────────────────

export async function getQuote(symbol: string): Promise<Quote> {
  const [q] = await getQuotes([symbol]);
  return q ?? generateQuote(symbol);
}
