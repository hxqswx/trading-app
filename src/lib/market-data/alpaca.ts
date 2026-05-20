/**
 * Alpaca Data API — US stock quotes and historical bars.
 *
 * Uses the IEX feed (free tier, real-time during market hours).
 * Requires APCA_API_KEY_ID and APCA_API_SECRET_KEY.
 *
 * Endpoints used:
 *   Quotes:   GET /v2/stocks/snapshots?symbols=AAPL,MSFT&feed=iex
 *   Candles:  GET /v2/stocks/bars?symbols=AAPL&timeframe=1Hour&feed=iex
 */

import type { Quote, Candle, CandleInterval } from "@/lib/types";
import { ASSET_CATALOG } from "@/lib/asset-registry";
import { ASSET_META, generateQuote } from "@/lib/mock";
import { isAlpacaEnabled, alpacaHeaders, ALPACA_DATA_URL } from "@/lib/alpaca";

// ── Symbol set ────────────────────────────────────────────────────────────

/** All US-market stock symbols in the catalog (routed to Alpaca when enabled). */
export const US_STOCK_SYMBOLS = new Set(
  ASSET_CATALOG.filter((a) => a.market === "US").map((a) => a.symbol)
);

// ── Interval mapping ──────────────────────────────────────────────────────

const ALPACA_TIMEFRAME: Record<CandleInterval, string> = {
  "1m":  "1Min",
  "5m":  "5Min",
  "15m": "15Min",
  "1h":  "1Hour",
  "4h":  "4Hour",
  "1d":  "1Day",
};

// ── Internal fetch helper ─────────────────────────────────────────────────

async function dataGet<T>(path: string): Promise<T> {
  const res = await fetch(`${ALPACA_DATA_URL}${path}`, {
    headers: alpacaHeaders(),
    cache:   "no-store",
    signal:  AbortSignal.timeout(10_000),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Alpaca data ${res.status} ${path}: ${body}`);
  }
  return res.json() as Promise<T>;
}

// ── Snapshot types ────────────────────────────────────────────────────────

interface AlpacaBar {
  o: number; h: number; l: number; c: number; v: number; t: string;
}

interface AlpacaSnapshot {
  latestTrade?:  { p: number; s: number; t: string };
  latestQuote?:  { ap: number; bp: number; t: string };
  dailyBar?:     AlpacaBar;
  prevDailyBar?: AlpacaBar;
}

// ── Quotes ────────────────────────────────────────────────────────────────

/**
 * Fetch latest quotes for US stocks via Alpaca snapshots.
 * Returns empty array (silently) when Alpaca is not configured.
 */
export async function fetchAlpacaQuotes(symbols: string[]): Promise<Quote[]> {
  if (!symbols.length || !isAlpacaEnabled()) return [];

  try {
    const encoded = encodeURIComponent(symbols.join(","));
    const data    = await dataGet<{ snapshots: Record<string, AlpacaSnapshot> }>(
      `/v2/stocks/snapshots?symbols=${encoded}&feed=iex`
    );
    const snaps = data.snapshots ?? {};

    return symbols.map((sym) => {
      const snap = snaps[sym];
      if (!snap?.latestTrade?.p) return generateQuote(sym);

      const meta      = ASSET_META[sym];
      const price     = snap.latestTrade.p;
      const prevClose = snap.prevDailyBar?.c ?? snap.dailyBar?.o ?? price;
      const change    = price - prevClose;
      const changePct = prevClose > 0 ? (change / prevClose) * 100 : 0;

      return {
        symbol:    sym,
        price,
        open:      snap.dailyBar?.o ?? prevClose,
        high:      snap.dailyBar?.h ?? price,
        low:       snap.dailyBar?.l ?? price,
        volume:    snap.dailyBar?.v ?? meta?.avgVolume ?? 0,
        change,
        changePct,
        timestamp: Date.now(),
        type:      "stock" as const,
        currency:  "USD",
      };
    });
  } catch (err) {
    console.warn("[alpaca-data] fetchAlpacaQuotes failed:", err);
    return [];
  }
}

// ── Candles ───────────────────────────────────────────────────────────────

interface AlpacaHistoricalBar {
  t: string;
  o: number; h: number; l: number; c: number; v: number;
}

/**
 * Fetch historical OHLCV bars for a US stock from Alpaca.
 * Returns null on failure so the caller can fall back to Yahoo Finance.
 */
export async function fetchAlpacaCandles(
  symbol:   string,
  interval: CandleInterval,
  limit:    number,
): Promise<Candle[] | null> {
  if (!isAlpacaEnabled()) return null;

  try {
    const tf   = ALPACA_TIMEFRAME[interval];
    const data = await dataGet<{ bars: Record<string, AlpacaHistoricalBar[]> }>(
      `/v2/stocks/bars?symbols=${symbol}&timeframe=${tf}&limit=${limit}&adjustment=raw&feed=iex&sort=asc`
    );
    const bars = data.bars?.[symbol];
    if (!bars?.length) return null;

    return bars.map((b) => ({
      time:   Math.floor(new Date(b.t).getTime() / 1000),
      open:   b.o,
      high:   b.h,
      low:    b.l,
      close:  b.c,
      volume: b.v,
    }));
  } catch (err) {
    console.warn(`[alpaca-data] fetchAlpacaCandles failed for ${symbol}:`, err);
    return null;
  }
}
