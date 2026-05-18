import type { Quote, Candle, CandleInterval, OrderBook, OrderBookLevel, PortfolioSummary, AIAnalysis } from "./types";

// ── Asset registry ──────────────────────────────────────────────────────────

export const ASSET_META: Record<string, {
  name: string; type: "stock" | "crypto";
  basePrice: number; volatility: number; avgVolume: number;
  description: string; sector?: string;
}> = {
  AAPL:    { name: "Apple",      type: "stock",  basePrice: 187.42,  volatility: 0.012, avgVolume: 55_000_000,  description: "Consumer electronics & software", sector: "Technology" },
  TSLA:    { name: "Tesla",      type: "stock",  basePrice: 192.30,  volatility: 0.028, avgVolume: 120_000_000, description: "Electric vehicles & clean energy",  sector: "Automotive" },
  NVDA:    { name: "NVIDIA",     type: "stock",  basePrice: 875.80,  volatility: 0.022, avgVolume: 45_000_000,  description: "GPUs, AI & data center chips",      sector: "Semiconductors" },
  MSFT:    { name: "Microsoft",  type: "stock",  basePrice: 412.60,  volatility: 0.010, avgVolume: 22_000_000,  description: "Cloud computing & enterprise software", sector: "Technology" },
  GOOGL:   { name: "Alphabet",   type: "stock",  basePrice: 172.90,  volatility: 0.011, avgVolume: 25_000_000,  description: "Search, ads & cloud services",      sector: "Technology" },
  BTCUSDT: { name: "Bitcoin",    type: "crypto", basePrice: 68_400,  volatility: 0.018, avgVolume: 25_000,      description: "Digital gold & store of value" },
  ETHUSDT: { name: "Ethereum",   type: "crypto", basePrice: 3_520,   volatility: 0.022, avgVolume: 350_000,     description: "Smart contract blockchain platform" },
  SOLUSDT: { name: "Solana",     type: "crypto", basePrice: 182.40,  volatility: 0.030, avgVolume: 4_500_000,   description: "High-speed Layer-1 blockchain" },
};

// ── Seeded PRNG ─────────────────────────────────────────────────────────────

function lcg(seed: number) {
  const m = 0x80000000;
  const a = 1664525;
  const c = 1013904223;
  let state = (seed ^ 0xdeadbeef) >>> 0;
  return () => {
    state = ((a * state + c) >>> 0) % m;
    return state / m;
  };
}

function symbolSeed(symbol: string): number {
  let hash = 0;
  for (let i = 0; i < symbol.length; i++) {
    hash = (hash * 31 + symbol.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function normalRandom(r: () => number): number {
  // Box–Muller
  const u1 = Math.max(r(), 1e-10);
  const u2 = r();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

// ── Quote ───────────────────────────────────────────────────────────────────

export function generateQuote(symbol: string, priceOverride?: number): Quote {
  const meta = ASSET_META[symbol];
  if (!meta) throw new Error(`Unknown symbol: ${symbol}`);
  const r = lcg(symbolSeed(symbol) + Math.floor(Date.now() / 60_000));

  const price = priceOverride ?? meta.basePrice * (1 + (r() - 0.5) * 0.01);
  const changePct = (r() - 0.45) * meta.volatility * 100 * 10;
  const open = price / (1 + changePct / 100);
  const high = price * (1 + r() * meta.volatility * 1.5);
  const low  = price * (1 - r() * meta.volatility * 1.5);

  return {
    symbol, price, open, high, low,
    volume:    meta.avgVolume * (0.7 + r() * 0.6),
    change:    price - open,
    changePct,
    timestamp: Date.now(),
    type:      meta.type,
  };
}

// ── Candles ─────────────────────────────────────────────────────────────────

const INTERVAL_SECONDS: Record<CandleInterval, number> = {
  "1m": 60, "5m": 300, "15m": 900, "1h": 3600, "4h": 14400, "1d": 86400,
};

export function generateCandles(symbol: string, interval: CandleInterval, limit: number): Candle[] {
  const meta = ASSET_META[symbol];
  if (!meta) return [];

  const r       = lcg(symbolSeed(symbol) ^ (INTERVAL_SECONDS[interval] * 7));
  const barSecs = INTERVAL_SECONDS[interval];
  const now     = Math.floor(Date.now() / barSecs) * barSecs;
  const σ       = meta.volatility * Math.sqrt(barSecs / 3600); // scale to bar size

  // Walk backward to find starting price, then generate forward
  let price = meta.basePrice;
  // Drift the starting price so path ends near basePrice
  const driftPerBar = 0.0001;
  price *= Math.pow(1 - driftPerBar, limit);

  const candles: Candle[] = [];
  for (let i = 0; i < limit; i++) {
    const time   = now - (limit - 1 - i) * barSecs;
    const change = normalRandom(r) * σ + driftPerBar;
    const close  = price * (1 + change);
    const open   = price;
    const body   = Math.abs(close - open);
    const high   = Math.max(open, close) + body * r() * 0.8 + price * σ * 0.2;
    const low    = Math.min(open, close) - body * r() * 0.8 - price * σ * 0.2;
    const volume = meta.avgVolume * barSecs / 3600 * (0.5 + r());

    candles.push({ time, open, high: Math.max(high, open, close), low: Math.min(low, open, close), close, volume });
    price = close;
  }
  return candles;
}

/** 24 hourly closes for sparkline (always returns 24 points) */
export function generateSparkline(symbol: string): number[] {
  return generateCandles(symbol, "1h", 24).map((c) => c.close);
}

// ── OrderBook ────────────────────────────────────────────────────────────────

export function generateOrderBook(symbol: string, currentPrice: number, depth = 20): OrderBook {
  const meta   = ASSET_META[symbol];
  if (!meta) throw new Error(`Unknown symbol: ${symbol}`);
  const r      = lcg(symbolSeed(symbol) + Math.floor(Date.now() / 2000));
  const spread = currentPrice * 0.00015;            // 0.015% spread
  const tick   = currentPrice * 0.0001;             // 0.01% per level

  let bidTotal = 0;
  const bids: OrderBookLevel[] = Array.from({ length: depth }, (_, i) => {
    const price = currentPrice - spread / 2 - i * tick;
    const size  = (meta.avgVolume / 1_000_000) * (1 + r() * 4) * Math.exp(-i * 0.18);
    bidTotal   += size;
    return { price, size: parseFloat(size.toFixed(4)), total: parseFloat(bidTotal.toFixed(4)) };
  });

  let askTotal = 0;
  const asks: OrderBookLevel[] = Array.from({ length: depth }, (_, i) => {
    const price = currentPrice + spread / 2 + i * tick;
    const size  = (meta.avgVolume / 1_000_000) * (1 + r() * 4) * Math.exp(-i * 0.18);
    askTotal   += size;
    return { price, size: parseFloat(size.toFixed(4)), total: parseFloat(askTotal.toFixed(4)) };
  });

  return { symbol, bids, asks, timestamp: Date.now() };
}

// ── Portfolio ────────────────────────────────────────────────────────────────

export const MOCK_PORTFOLIO: PortfolioSummary = {
  equity:   127_480.50,
  cash:     24_200.00,
  dayPnl:   1_386.20,
  dayPnlPct: 1.10,
  totalPnl: 27_480.50,
  positions: [
    { symbol: "AAPL",    qty: 50,  avgEntryPrice: 172.10, currentPrice: 187.42, marketValue:  9_371.00, unrealizedPnl:  766.00, unrealizedPnlPct:  8.91, type: "stock"  },
    { symbol: "NVDA",    qty: 20,  avgEntryPrice: 420.00, currentPrice: 875.80, marketValue: 17_516.00, unrealizedPnl: 9_116.00, unrealizedPnlPct: 108.52, type: "stock" },
    { symbol: "TSLA",    qty: 30,  avgEntryPrice: 240.00, currentPrice: 192.30, marketValue:  5_769.00, unrealizedPnl: -1_431.00, unrealizedPnlPct: -19.83, type: "stock" },
    { symbol: "MSFT",    qty: 15,  avgEntryPrice: 380.00, currentPrice: 412.60, marketValue:  6_189.00, unrealizedPnl:  489.00, unrealizedPnlPct:  8.58, type: "stock"  },
    { symbol: "BTCUSDT", qty: 0.8, avgEntryPrice: 42_000, currentPrice: 68_400, marketValue: 54_720.00, unrealizedPnl: 21_120.00, unrealizedPnlPct: 62.86, type: "crypto" },
    { symbol: "ETHUSDT", qty: 3,   avgEntryPrice: 2_200,  currentPrice: 3_520,  marketValue: 10_560.00, unrealizedPnl:  3_960.00, unrealizedPnlPct: 60.00, type: "crypto" },
  ],
};

// ── AI Analyses (pre-canned, one per asset) ──────────────────────────────────

export const MOCK_AI_ANALYSES: Record<string, Omit<AIAnalysis, "symbol" | "timestamp">> = {
  AAPL: {
    sentiment: "bullish",
    summary: "Apple continues to show resilience with strong services revenue growth and stable iPhone demand. The stock is consolidating near all-time highs with supportive macro conditions for large-cap tech.",
    keyLevels: { support: 182.00, resistance: 195.00 },
    signals: ["RSI at 58 — momentum building", "Golden cross on daily chart", "Services revenue beat estimates by 6%"],
    riskLevel: "low",
  },
  TSLA: {
    sentiment: "neutral",
    summary: "Tesla faces near-term margin pressure from price cuts but long-term EV demand remains intact. Robotaxi timeline clarity is the next key catalyst. Watch the $195 level for direction.",
    keyLevels: { support: 175.00, resistance: 215.00 },
    signals: ["Volume declining — consolidation phase", "FSD v13 rollout update due next quarter", "Margin headwinds from price competition"],
    riskLevel: "medium",
  },
  NVDA: {
    sentiment: "bullish",
    summary: "NVIDIA maintains its dominant position in AI accelerator chips with Blackwell demand far exceeding supply. Data center revenue is compounding at 100%+ YoY. Valuation remains premium but justified by growth trajectory.",
    keyLevels: { support: 820.00, resistance: 950.00 },
    signals: ["AI capex cycle in full swing", "Blackwell GPU supply constraint resolving in H2", "Multiple expansion risk if AI spending slows"],
    riskLevel: "medium",
  },
  MSFT: {
    sentiment: "bullish",
    summary: "Microsoft's Azure cloud business accelerating with AI workloads. Copilot integration across enterprise products creating durable pricing power. One of the best risk-adjusted tech plays.",
    keyLevels: { support: 395.00, resistance: 435.00 },
    signals: ["Azure growth re-accelerating to 30%+", "Copilot ARR exceeding expectations", "PE at 32x — fair for growth profile"],
    riskLevel: "low",
  },
  GOOGL: {
    sentiment: "neutral",
    summary: "Alphabet faces a critical period as AI-native search challenges its core business. Gemini integration is promising but monetisation lag is a concern. YouTube and Cloud are bright spots. The stock is range-bound pending search disruption clarity.",
    keyLevels: { support: 162.00, resistance: 185.00 },
    signals: ["Search market share steady at 89%", "Cloud margins expanding — positive surprise", "AI Overviews reducing click-through rates"],
    riskLevel: "medium",
  },
  BTCUSDT: {
    sentiment: "bullish",
    summary: "Bitcoin is in a post-halving bull phase with institutional demand via ETFs providing a structural bid. Spot ETF inflows remain robust. The path to $80K+ is supported by on-chain accumulation data.",
    keyLevels: { support: 62_000, resistance: 75_000 },
    signals: ["ETF daily inflows averaging $300M+", "Halving supply shock fully priced in H2", "Long-term holder supply at cycle highs"],
    riskLevel: "medium",
  },
  ETHUSDT: {
    sentiment: "bullish",
    summary: "Ethereum's deflationary supply mechanics are reasserting post-EIP-4844. L2 activity is surging, boosting base layer fee burn. The spot ETF catalyst remains a potential re-rating event for ETH.",
    keyLevels: { support: 3_200, resistance: 4_000 },
    signals: ["Blob fees growing — L2 ecosystem healthy", "ETF approval improving institutional narrative", "Staking yield compressing supply"],
    riskLevel: "medium",
  },
  SOLUSDT: {
    sentiment: "bullish",
    summary: "Solana is the fastest-growing L1 by DEX volume and active addresses. The network has achieved 99.9%+ uptime over the past year. Meme coin activity and DePIN applications are driving transaction volume to new highs.",
    keyLevels: { support: 165.00, resistance: 205.00 },
    signals: ["DEX volume #1 across all L1s", "DePIN TVL growing 40% QoQ", "Validator count at all-time high — decentralization improving"],
    riskLevel: "high",
  },
};
