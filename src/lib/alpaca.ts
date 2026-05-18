import type { Candle, CandleInterval, Quote, PortfolioSummary, Position } from "./types";

const BASE = process.env.ALPACA_BASE_URL ?? "https://paper-api.alpaca.markets";
const DATA = process.env.ALPACA_DATA_URL ?? "https://data.alpaca.markets";
const KEY = process.env.ALPACA_KEY ?? "";
const SECRET = process.env.ALPACA_SECRET ?? "";

const headers = {
  "APCA-API-KEY-ID": KEY,
  "APCA-API-SECRET-KEY": SECRET,
  "Content-Type": "application/json",
};

async function apiFetch<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers, next: { revalidate: 0 } });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Alpaca ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

// ── Quotes ────────────────────────────────────────────────────────────────────

interface AlpacaLatestTrade {
  trades: Record<string, { p: number; s: number; t: string }>;
}
interface AlpacaSnapshot {
  snapshots: Record<string, {
    latestTrade: { p: number; s: number; t: string };
    dailyBar:    { o: number; h: number; l: number; c: number; v: number };
    prevDailyBar:{ c: number };
  }>;
}

export async function getStockQuote(symbol: string): Promise<Quote> {
  const data = await apiFetch<AlpacaSnapshot>(
    `${DATA}/v2/stocks/snapshots?symbols=${symbol}`
  );
  const snap = data.snapshots[symbol];
  if (!snap) throw new Error(`No snapshot for ${symbol}`);

  const price = snap.latestTrade.p;
  const open  = snap.dailyBar.o;
  const prev  = snap.prevDailyBar.c;
  const change = price - prev;

  return {
    symbol,
    price,
    open,
    high: snap.dailyBar.h,
    low:  snap.dailyBar.l,
    volume: snap.dailyBar.v,
    change,
    changePct: (change / prev) * 100,
    timestamp: Date.now(),
    type: "stock",
  };
}

export async function getStockQuotes(symbols: string[]): Promise<Quote[]> {
  if (!symbols.length) return [];
  const joined = symbols.join(",");
  const data = await apiFetch<AlpacaSnapshot>(
    `${DATA}/v2/stocks/snapshots?symbols=${joined}`
  );
  return symbols.map((sym) => {
    const snap = data.snapshots[sym];
    if (!snap) return null;
    const price = snap.latestTrade.p;
    const prev  = snap.prevDailyBar.c;
    const change = price - prev;
    return {
      symbol: sym,
      price,
      open: snap.dailyBar.o,
      high: snap.dailyBar.h,
      low:  snap.dailyBar.l,
      volume: snap.dailyBar.v,
      change,
      changePct: (change / prev) * 100,
      timestamp: Date.now(),
      type: "stock" as const,
    };
  }).filter(Boolean) as Quote[];
}

// ── Candles ───────────────────────────────────────────────────────────────────

const intervalMap: Record<CandleInterval, string> = {
  "1m":  "1Min",
  "5m":  "5Min",
  "15m": "15Min",
  "1h":  "1Hour",
  "4h":  "4Hour",
  "1d":  "1Day",
};

interface AlpacaBar {
  t: string;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
}

export async function getStockCandles(
  symbol: string,
  interval: CandleInterval = "1h",
  limit = 200
): Promise<Candle[]> {
  const tf = intervalMap[interval];
  const url = `${DATA}/v2/stocks/${symbol}/bars?timeframe=${tf}&limit=${limit}&sort=asc`;
  const data = await apiFetch<{ bars: AlpacaBar[] }>(url);
  return (data.bars ?? []).map((b) => ({
    time:   Math.floor(new Date(b.t).getTime() / 1000),
    open:   b.o,
    high:   b.h,
    low:    b.l,
    close:  b.c,
    volume: b.v,
  }));
}

// ── Portfolio ─────────────────────────────────────────────────────────────────

interface AlpacaAccount {
  equity: string;
  cash: string;
  portfolio_value: string;
}
interface AlpacaPosition {
  symbol: string;
  qty: string;
  avg_entry_price: string;
  current_price: string;
  market_value: string;
  unrealized_pl: string;
  unrealized_plpc: string;
}

export async function getPortfolio(): Promise<PortfolioSummary> {
  const [account, positions] = await Promise.all([
    apiFetch<AlpacaAccount>(`${BASE}/v2/account`),
    apiFetch<AlpacaPosition[]>(`${BASE}/v2/positions`),
  ]);

  const equity = parseFloat(account.equity);
  const cash   = parseFloat(account.cash);

  const mapped: Position[] = positions.map((p) => ({
    symbol:           p.symbol,
    qty:              parseFloat(p.qty),
    avgEntryPrice:    parseFloat(p.avg_entry_price),
    currentPrice:     parseFloat(p.current_price),
    marketValue:      parseFloat(p.market_value),
    unrealizedPnl:    parseFloat(p.unrealized_pl),
    unrealizedPnlPct: parseFloat(p.unrealized_plpc) * 100,
    type:             "stock",
  }));

  const totalPnl = mapped.reduce((s, p) => s + p.unrealizedPnl, 0);

  return {
    equity,
    cash,
    dayPnl: 0,
    dayPnlPct: 0,
    totalPnl,
    positions: mapped,
  };
}

// ── Orders ────────────────────────────────────────────────────────────────────

export async function placeOrder(params: {
  symbol: string;
  qty: number;
  side: "buy" | "sell";
  type: "market" | "limit" | "stop" | "stop_limit";
  limitPrice?: number;
  stopPrice?: number;
}) {
  const body: Record<string, unknown> = {
    symbol:        params.symbol,
    qty:           params.qty,
    side:          params.side,
    type:          params.type,
    time_in_force: "day",
  };
  if (params.limitPrice) body.limit_price = params.limitPrice.toString();
  if (params.stopPrice)  body.stop_price  = params.stopPrice.toString();

  const res = await fetch(`${BASE}/v2/orders`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Order failed: ${text}`);
  }
  return res.json();
}
