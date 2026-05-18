/**
 * Yahoo Finance data fetcher — no API key required.
 *
 * Uses two endpoints:
 *  - v7/finance/quote  — batch spot quotes (up to ~100 symbols per request)
 *  - v8/finance/chart  — per-symbol OHLCV candle history
 *
 * All our internal symbols are mapped to Yahoo Finance tickers below.
 * Falls back to mock data on any error (rate-limit, network, market closed, etc.)
 */
import type { Quote, Candle, CandleInterval } from "@/lib/types";
import { ASSET_META, generateQuote, generateCandles } from "@/lib/mock";

// ── Ticker mapping ────────────────────────────────────────────────────────────

/** Internal symbol → Yahoo Finance ticker */
export const YF_TICKER: Record<string, string> = {
  // Crypto (Yahoo Finance suffixes them with -USD)
  BTCUSDT: "BTC-USD",
  ETHUSDT: "ETH-USD",
  SOLUSDT: "SOL-USD",
  // US Equities
  AAPL:   "AAPL",
  TSLA:   "TSLA",
  NVDA:   "NVDA",
  MSFT:   "MSFT",
  GOOGL:  "GOOGL",
  // US-listed Chinese ADRs
  BABA:   "BABA",
  PDD:    "PDD",
  JD:     "JD",
  BIDU:   "BIDU",
  NIO:    "NIO",
  // Hong Kong (suffix .HK, strip leading zeros for display)
  HK0700: "0700.HK",
  HK9988: "9988.HK",
  HK3690: "3690.HK",
  HK1810: "1810.HK",
  // Mainland China A-shares (Shanghai = .SS, Shenzhen = .SZ)
  CNMTAI: "600519.SS",
  CNCATL: "300750.SZ",
  CNBYD:  "002594.SZ",
  CNPING: "601318.SS",
  CNICBC: "601398.SS",
};

/** Reverse map: Yahoo Finance ticker → internal symbol */
const YF_TO_INTERNAL: Record<string, string> = Object.fromEntries(
  Object.entries(YF_TICKER).map(([k, v]) => [v, k])
);

// ── Interval / range mapping for v8 chart endpoint ───────────────────────────

const YF_RANGE: Record<CandleInterval, { interval: string; range: string }> = {
  "1m":  { interval: "1m",  range: "1d"   },
  "5m":  { interval: "5m",  range: "5d"   },
  "15m": { interval: "15m", range: "5d"   },
  "1h":  { interval: "60m", range: "30d"  },
  "4h":  { interval: "60m", range: "60d"  }, // decimated client-side
  "1d":  { interval: "1d",  range: "1y"   },
};

// ── Shared fetch options ──────────────────────────────────────────────────────

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (compatible; TradeAI/1.0; +https://github.com/hxqswx/trading-app)",
  "Accept":     "application/json",
};

const FETCH_OPTS: RequestInit = { headers: HEADERS, next: { revalidate: 0 } };

// ── v7 batch quote ────────────────────────────────────────────────────────────

interface YFV7Item {
  symbol:                       string;
  regularMarketPrice:           number;
  regularMarketOpen?:           number;
  regularMarketDayHigh?:        number;
  regularMarketDayLow?:         number;
  regularMarketVolume?:         number;
  regularMarketChangePercent?:  number;
  regularMarketPreviousClose?:  number;
  previousClose?:               number;
  chartPreviousClose?:          number;
  currency?:                    string;
}

/**
 * Fetch live quotes for multiple symbols in a single HTTP request.
 * Unmapped or failed symbols fall back to mock generateQuote().
 */
export async function fetchLiveQuotes(symbols: string[]): Promise<Quote[]> {
  const mappable   = symbols.filter((s) => s in YF_TICKER);
  const unmappable = symbols.filter((s) => !(s in YF_TICKER));

  const results: Quote[] = unmappable.map((s) => generateQuote(s));
  if (!mappable.length) return results;

  const yfSymbols = mappable.map((s) => YF_TICKER[s]).join(",");
  const fields    = [
    "regularMarketPrice", "regularMarketOpen",
    "regularMarketDayHigh", "regularMarketDayLow", "regularMarketVolume",
    "regularMarketChangePercent", "regularMarketPreviousClose",
    "previousClose", "chartPreviousClose", "currency",
  ].join(",");

  try {
    const url = `https://query2.finance.yahoo.com/v7/finance/quote?symbols=${yfSymbols}&fields=${fields}`;
    const res  = await fetch(url, FETCH_OPTS);
    if (!res.ok) throw new Error(`YF v7 HTTP ${res.status}`);

    const data: { quoteResponse?: { result?: YFV7Item[] } } = await res.json();
    const items = data?.quoteResponse?.result ?? [];

    const byYfTicker = new Map(items.map((r) => [r.symbol, r]));

    for (const internalSym of mappable) {
      const yfTick = YF_TICKER[internalSym];
      const r      = byYfTicker.get(yfTick);
      if (!r || typeof r.regularMarketPrice !== "number") {
        results.push(generateQuote(internalSym));
        continue;
      }

      const meta      = ASSET_META[internalSym];
      const prevClose = r.regularMarketPreviousClose
        ?? r.previousClose
        ?? r.chartPreviousClose
        ?? r.regularMarketPrice;
      const price     = r.regularMarketPrice;
      const change    = price - prevClose;
      const changePct = prevClose > 0
        ? (r.regularMarketChangePercent ?? (change / prevClose) * 100)
        : 0;

      results.push({
        symbol:    internalSym,
        price,
        open:      r.regularMarketOpen    ?? prevClose,
        high:      r.regularMarketDayHigh ?? price,
        low:       r.regularMarketDayLow  ?? price,
        volume:    r.regularMarketVolume  ?? meta?.avgVolume ?? 0,
        change,
        changePct,
        timestamp: Date.now(),
        type:      meta?.type     ?? "stock",
        currency:  r.currency     ?? meta?.currency ?? "USD",
      });
    }
  } catch (err) {
    console.warn("[market-data] fetchLiveQuotes failed, using mock:", err);
    for (const s of mappable) results.push(generateQuote(s));
  }

  // Preserve original order
  const map = new Map(results.map((q) => [q.symbol, q]));
  return symbols.map((s) => map.get(s) ?? generateQuote(s));
}

// ── v8 candle history ─────────────────────────────────────────────────────────

interface YFV8Indicators {
  quote: Array<{
    open:   (number | null)[];
    high:   (number | null)[];
    low:    (number | null)[];
    close:  (number | null)[];
    volume: (number | null)[];
  }>;
}

/**
 * Fetch OHLCV candles from Yahoo Finance v8 chart endpoint.
 * Falls back to deterministic mock candles on any error.
 */
export async function fetchYFCandles(
  internalSymbol: string,
  interval:       CandleInterval,
  limit:          number,
): Promise<Candle[]> {
  const yfTick = YF_TICKER[internalSymbol];
  if (!yfTick) return generateCandles(internalSymbol, interval, limit);

  const { interval: yfInterval, range } = YF_RANGE[interval];

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yfTick}?interval=${yfInterval}&range=${range}`;
    const res  = await fetch(url, FETCH_OPTS);
    if (!res.ok) throw new Error(`YF v8 HTTP ${res.status}`);

    const data: { chart?: { result?: Array<{ timestamp: number[]; indicators: YFV8Indicators }> } }
      = await res.json();

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
      candles.push({
        time:   timestamps[i],
        open:   o,
        high:   h,
        low:    l,
        close:  c,
        volume: v ?? 0,
      });
    }

    if (!candles.length) return generateCandles(internalSymbol, interval, limit);

    // 4h: Yahoo Finance doesn't have a native 4h interval — decimate 1h candles
    const out = interval === "4h" ? aggregateCandles(candles, 4) : candles;
    return out.slice(-limit);
  } catch (err) {
    console.warn(`[market-data] fetchYFCandles(${internalSymbol}) failed, using mock:`, err);
    return generateCandles(internalSymbol, interval, limit);
  }
}

/** Aggregate N consecutive 1h candles into a single 4h candle */
function aggregateCandles(candles: Candle[], n: number): Candle[] {
  const out: Candle[] = [];
  for (let i = 0; i < candles.length; i += n) {
    const group = candles.slice(i, i + n);
    if (!group.length) continue;
    out.push({
      time:   group[0].time,
      open:   group[0].open,
      high:   Math.max(...group.map((c) => c.high)),
      low:    Math.min(...group.map((c) => c.low)),
      close:  group[group.length - 1].close,
      volume: group.reduce((s, c) => s + c.volume, 0),
    });
  }
  return out;
}
