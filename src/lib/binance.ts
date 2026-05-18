import type { Candle, CandleInterval, Quote, OrderBook, OrderBookLevel } from "./types";

const BASE = "https://api.binance.com";

async function binanceFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { next: { revalidate: 0 } });
  if (!res.ok) throw new Error(`Binance ${res.status}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

// ── Quote ─────────────────────────────────────────────────────────────────────

interface Binance24h {
  symbol:             string;
  lastPrice:          string;
  openPrice:          string;
  highPrice:          string;
  lowPrice:           string;
  volume:             string;
  priceChange:        string;
  priceChangePercent: string;
  closeTime:          number;
}

export async function getCryptoQuote(symbol: string): Promise<Quote> {
  const data = await binanceFetch<Binance24h>(`/api/v3/ticker/24hr?symbol=${symbol}`);
  return {
    symbol,
    price:     parseFloat(data.lastPrice),
    open:      parseFloat(data.openPrice),
    high:      parseFloat(data.highPrice),
    low:       parseFloat(data.lowPrice),
    volume:    parseFloat(data.volume),
    change:    parseFloat(data.priceChange),
    changePct: parseFloat(data.priceChangePercent),
    timestamp: data.closeTime,
    type:      "crypto",
  };
}

export async function getCryptoQuotes(symbols: string[]): Promise<Quote[]> {
  if (!symbols.length) return [];
  const data = await binanceFetch<Binance24h[]>(`/api/v3/ticker/24hr`);
  const set = new Set(symbols);
  return data
    .filter((d) => set.has(d.symbol))
    .map((d) => ({
      symbol:    d.symbol,
      price:     parseFloat(d.lastPrice),
      open:      parseFloat(d.openPrice),
      high:      parseFloat(d.highPrice),
      low:       parseFloat(d.lowPrice),
      volume:    parseFloat(d.volume),
      change:    parseFloat(d.priceChange),
      changePct: parseFloat(d.priceChangePercent),
      timestamp: d.closeTime,
      type:      "crypto" as const,
    }));
}

// ── Candles ───────────────────────────────────────────────────────────────────

const intervalMap: Record<CandleInterval, string> = {
  "1m":  "1m",
  "5m":  "5m",
  "15m": "15m",
  "1h":  "1h",
  "4h":  "4h",
  "1d":  "1d",
};

export async function getCryptoCandles(
  symbol: string,
  interval: CandleInterval = "1h",
  limit = 200
): Promise<Candle[]> {
  const iv = intervalMap[interval];
  const raw = await binanceFetch<[number, string, string, string, string, string, ...unknown[]][]>(
    `/api/v3/klines?symbol=${symbol}&interval=${iv}&limit=${limit}`
  );
  return raw.map((k) => ({
    time:   Math.floor(k[0] / 1000),
    open:   parseFloat(k[1]),
    high:   parseFloat(k[2]),
    low:    parseFloat(k[3]),
    close:  parseFloat(k[4]),
    volume: parseFloat(k[5]),
  }));
}

// ── OrderBook ─────────────────────────────────────────────────────────────────

export async function getCryptoOrderBook(symbol: string, depth = 20): Promise<OrderBook> {
  const data = await binanceFetch<{ bids: [string, string][]; asks: [string, string][] }>(
    `/api/v3/depth?symbol=${symbol}&limit=${depth}`
  );

  let bidTotal = 0;
  let askTotal = 0;

  const bids: OrderBookLevel[] = data.bids.map(([price, size]) => {
    const p = parseFloat(price);
    const s = parseFloat(size);
    bidTotal += s;
    return { price: p, size: s, total: bidTotal };
  });

  const asks: OrderBookLevel[] = data.asks.map(([price, size]) => {
    const p = parseFloat(price);
    const s = parseFloat(size);
    askTotal += s;
    return { price: p, size: s, total: askTotal };
  });

  return { symbol, bids, asks, timestamp: Date.now() };
}
