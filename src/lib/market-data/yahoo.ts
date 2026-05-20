/**
 * Market data providers — no API key required.
 *
 * Provider routing:
 *   Crypto  → Binance REST  (free, no auth, real-time WebSocket-level accuracy)
 *   Stocks  → Yahoo Finance v8/finance/chart  (no crumb/cookie needed)
 *
 * Both fall back to deterministic mock data on network error.
 *
 * Why Binance for crypto instead of Yahoo Finance BTC-USD?
 *   The Binance ticker gives true bid/ask volume with ms precision.
 *   Yahoo Finance's crypto data lags 1–2 minutes and has lower volume accuracy.
 *
 * Why v8/chart instead of v7/quote for stocks?
 *   Yahoo deprecated v7 for unauthenticated use — it now requires a crumb cookie
 *   that expires every few minutes. The v8/chart endpoint still works with just
 *   a browser User-Agent and returns both current price (meta section) and OHLCV
 *   candle history in a single call.
 */

import type { Quote, Candle, CandleInterval } from "@/lib/types";
import { ASSET_META, generateQuote, generateCandles } from "@/lib/mock";
import { CATALOG_YF_TICKER, BINANCE_SYMBOLS } from "@/lib/asset-registry";

// ── Symbol routing — driven by the asset registry ─────────────────────────

/** All known Binance crypto symbols (from registry) */
const BINANCE_SYM: Record<string, string> = Object.fromEntries(
  [...BINANCE_SYMBOLS].map((s) => [s, s])   // BTCUSDT → BTCUSDT, etc.
);

/** Internal symbol → Yahoo Finance ticker (full registry) */
export const YF_TICKER: Record<string, string> = CATALOG_YF_TICKER;

/** Yahoo Finance interval/range for each of our candle intervals */
const YF_RANGE: Record<CandleInterval, { interval: string; range: string }> = {
  "1m":  { interval: "1m",  range: "1d"  },
  "5m":  { interval: "5m",  range: "5d"  },
  "15m": { interval: "15m", range: "5d"  },
  "1h":  { interval: "60m", range: "30d" },
  "4h":  { interval: "60m", range: "60d" }, // decimated client-side to 4h bars
  "1d":  { interval: "1d",  range: "1y"  },
};

/** Binance interval codes */
const BINANCE_INTERVAL: Record<CandleInterval, string> = {
  "1m": "1m", "5m": "5m", "15m": "15m", "1h": "1h", "4h": "4h", "1d": "1d",
};

// ── Shared fetch ───────────────────────────────────────────────────────────

const BROWSER_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

async function getJSON<T>(url: string, timeoutMs = 8000): Promise<T> {
  const res = await fetch(url, {
    headers: {
      "User-Agent": BROWSER_UA,
      "Accept":     "application/json, */*",
      "Referer":    "https://finance.yahoo.com/",
    },
    signal: AbortSignal.timeout(timeoutMs),
    cache:  "no-store",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
  return res.json() as Promise<T>;
}

// ── Binance — crypto quotes ────────────────────────────────────────────────

interface BinanceTicker {
  symbol:             string;
  lastPrice:          string;
  openPrice:          string;
  highPrice:          string;
  lowPrice:           string;
  volume:             string;
  priceChange:        string;
  priceChangePercent: string;
}

async function fetchBinanceQuotes(symbols: string[]): Promise<Quote[]> {
  if (!symbols.length) return [];
  try {
    const binSyms = symbols.map((s) => BINANCE_SYM[s]);
    // Single symbol → object; multiple symbols → array
    if (binSyms.length === 1) {
      const t = await getJSON<BinanceTicker>(
        `https://api.binance.com/api/v3/ticker/24hr?symbol=${binSyms[0]}`
      );
      return [binanceTickerToQuote(symbols[0], t)];
    }
    const encoded = encodeURIComponent(JSON.stringify(binSyms));
    const tickers = await getJSON<BinanceTicker[]>(
      `https://api.binance.com/api/v3/ticker/24hr?symbols=${encoded}`
    );
    const byBinSym = new Map(tickers.map((t) => [t.symbol, t]));
    return symbols.map((s) => {
      const t = byBinSym.get(BINANCE_SYM[s]);
      return t ? binanceTickerToQuote(s, t) : generateQuote(s);
    });
  } catch (err) {
    console.warn("[market-data] Binance quotes failed:", err);
    return symbols.map((s) => generateQuote(s));
  }
}

function binanceTickerToQuote(internalSym: string, t: BinanceTicker): Quote {
  const meta   = ASSET_META[internalSym];
  const price  = parseFloat(t.lastPrice);
  const open   = parseFloat(t.openPrice);
  return {
    symbol:    internalSym,
    price,
    open,
    high:      parseFloat(t.highPrice),
    low:       parseFloat(t.lowPrice),
    volume:    parseFloat(t.volume),
    change:    parseFloat(t.priceChange),
    changePct: parseFloat(t.priceChangePercent),
    timestamp: Date.now(),
    type:      meta?.type     ?? "crypto",
    currency:  meta?.currency ?? "USD",
  };
}

// ── Binance — crypto candles ───────────────────────────────────────────────

type BinanceKline = [number, string, string, string, string, string, ...unknown[]];

async function fetchBinanceCandles(
  symbol:   string,
  interval: CandleInterval,
  limit:    number,
): Promise<Candle[] | null> {
  try {
    const binSym = BINANCE_SYM[symbol];
    if (!binSym) return null;
    const klines = await getJSON<BinanceKline[]>(
      `https://api.binance.com/api/v3/klines?symbol=${binSym}&interval=${BINANCE_INTERVAL[interval]}&limit=${limit}`
    );
    return klines.map((k) => ({
      time:   Math.floor(k[0] / 1000),   // ms → s
      open:   parseFloat(k[1]),
      high:   parseFloat(k[2]),
      low:    parseFloat(k[3]),
      close:  parseFloat(k[4]),
      volume: parseFloat(k[5]),
    }));
  } catch (err) {
    console.warn("[market-data] Binance candles failed:", err);
    return null;
  }
}

// ── Yahoo Finance v8/chart — stock quotes ─────────────────────────────────

interface YFChartMeta {
  symbol:                string;
  regularMarketPrice?:   number;
  regularMarketOpen?:    number;
  regularMarketDayHigh?: number;
  regularMarketDayLow?:  number;
  regularMarketVolume?:  number;
  chartPreviousClose?:   number;
  previousClose?:        number;
  currency?:             string;
  regularMarketChangePercent?: number;
}

interface YFV8Response {
  chart?: {
    result?: Array<{
      meta:       YFChartMeta;
      timestamp:  number[];
      indicators: {
        quote: Array<{
          open:   (number | null)[];
          high:   (number | null)[];
          low:    (number | null)[];
          close:  (number | null)[];
          volume: (number | null)[];
        }>;
      };
    }>;
    error?: { code: string; description: string } | null;
  };
}

/** Fetch a single stock quote from the v8/chart meta section (no crumb needed) */
async function fetchYFQuote(internalSym: string): Promise<Quote | null> {
  const yfTick = YF_TICKER[internalSym];
  if (!yfTick) return null;
  try {
    const data = await getJSON<YFV8Response>(
      `https://query1.finance.yahoo.com/v8/finance/chart/${yfTick}?interval=1d&range=2d&includePrePost=false`
    );
    const result = data?.chart?.result?.[0];
    const m      = result?.meta;
    if (!m || !m.regularMarketPrice) return null;

    const meta     = ASSET_META[internalSym];
    const price    = m.regularMarketPrice;
    const prevClose = m.chartPreviousClose ?? m.previousClose ?? price;
    const change   = price - prevClose;
    const changePct = prevClose > 0
      ? (m.regularMarketChangePercent ?? (change / prevClose) * 100)
      : 0;

    return {
      symbol:    internalSym,
      price,
      open:      m.regularMarketOpen    ?? prevClose,
      high:      m.regularMarketDayHigh ?? price,
      low:       m.regularMarketDayLow  ?? price,
      volume:    m.regularMarketVolume  ?? meta?.avgVolume ?? 0,
      change,
      changePct,
      timestamp: Date.now(),
      type:      meta?.type     ?? "stock",
      currency:  m.currency     ?? meta?.currency ?? "USD",
    };
  } catch (err) {
    console.warn(`[market-data] YF quote failed for ${internalSym}:`, err);
    return null;
  }
}

// ── Public: fetchLiveQuotes ───────────────────────────────────────────────

/**
 * Fetch live quotes for multiple symbols.
 *  - Crypto → Binance (batch, one request)
 *  - Stocks → Yahoo Finance v8/chart (parallel individual requests)
 *  - Unknown → mock fallback
 */
export async function fetchLiveQuotes(symbols: string[]): Promise<Quote[]> {
  const cryptoSyms = symbols.filter((s) => s in BINANCE_SYM);
  const stockSyms  = symbols.filter((s) => s in YF_TICKER);
  const unknownSyms = symbols.filter((s) => !(s in BINANCE_SYM) && !(s in YF_TICKER));

  const [cryptoQuotes, stockQuotes] = await Promise.all([
    fetchBinanceQuotes(cryptoSyms),
    Promise.all(stockSyms.map(async (s) => (await fetchYFQuote(s)) ?? generateQuote(s))),
  ]);

  const all = [
    ...cryptoQuotes,
    ...stockQuotes,
    ...unknownSyms.map((s) => generateQuote(s)),
  ];

  const map = new Map(all.map((q) => [q.symbol, q]));
  return symbols.map((s) => map.get(s) ?? generateQuote(s));
}

// ── Public: fetchYFCandles ────────────────────────────────────────────────

/**
 * Fetch OHLCV candles.
 *  - Crypto → Binance klines
 *  - Stocks → Yahoo Finance v8/chart
 */
export async function fetchYFCandles(
  internalSymbol: string,
  interval:       CandleInterval,
  limit:          number,
): Promise<Candle[]> {
  // ── Binance path for crypto ──────────────────────────────────────────
  if (internalSymbol in BINANCE_SYM) {
    const candles = await fetchBinanceCandles(internalSymbol, interval, limit);
    return candles ?? generateCandles(internalSymbol, interval, limit);
  }

  // ── Yahoo Finance path for stocks ────────────────────────────────────
  const yfTick = YF_TICKER[internalSymbol];
  if (!yfTick) return generateCandles(internalSymbol, interval, limit);

  const { interval: yfInterval, range } = YF_RANGE[interval];

  try {
    const data = await getJSON<YFV8Response>(
      `https://query1.finance.yahoo.com/v8/finance/chart/${yfTick}?interval=${yfInterval}&range=${range}&includePrePost=false`
    );

    const result     = data?.chart?.result?.[0];
    const timestamps = result?.timestamp ?? [];
    const q          = result?.indicators?.quote?.[0];

    if (!result || !timestamps.length || !q) {
      return generateCandles(internalSymbol, interval, limit);
    }

    const candles: Candle[] = [];
    for (let i = 0; i < timestamps.length; i++) {
      const o = q.open[i], h = q.high[i], l = q.low[i], c = q.close[i], v = q.volume[i];
      if (o == null || h == null || l == null || c == null) continue;
      candles.push({ time: timestamps[i], open: o, high: h, low: l, close: c, volume: v ?? 0 });
    }

    if (!candles.length) return generateCandles(internalSymbol, interval, limit);

    // 4h: aggregate 1h candles into 4h bars
    const out = interval === "4h" ? aggregateCandles(candles, 4) : candles;
    return out.slice(-limit);
  } catch (err) {
    console.warn(`[market-data] YF candles failed for ${internalSymbol}:`, err);
    return generateCandles(internalSymbol, interval, limit);
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────

function aggregateCandles(candles: Candle[], n: number): Candle[] {
  const out: Candle[] = [];
  for (let i = 0; i < candles.length; i += n) {
    const g = candles.slice(i, i + n);
    if (!g.length) continue;
    out.push({
      time:   g[0].time,
      open:   g[0].open,
      high:   Math.max(...g.map((c) => c.high)),
      low:    Math.min(...g.map((c) => c.low)),
      close:  g[g.length - 1].close,
      volume: g.reduce((s, c) => s + c.volume, 0),
    });
  }
  return out;
}
