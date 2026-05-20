export type AssetType = "stock" | "crypto" | "hk" | "cn";

export interface Quote {
  symbol: string;
  price: number;
  open: number;
  high: number;
  low: number;
  volume: number;
  change: number;
  changePct: number;
  timestamp: number;
  type: AssetType;
  currency: string; // "USD" | "HKD"
}

export interface Candle {
  time: number; // Unix seconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export type CandleInterval = "1m" | "5m" | "15m" | "1h" | "4h" | "1d";

export interface OrderBookLevel {
  price: number;
  size: number;
  total?: number;
}

export interface OrderBook {
  symbol: string;
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  timestamp: number;
}

export interface Position {
  symbol: string;
  qty: number;
  avgEntryPrice: number;
  currentPrice: number;
  marketValue: number;
  unrealizedPnl: number;
  unrealizedPnlPct: number;
  type: AssetType;
  currency?: string; // "USD" | "HKD" | "CNY"
}

export interface PortfolioSummary {
  equity: number;
  cash: number;
  dayPnl: number;
  dayPnlPct: number;
  totalPnl: number;
  positions: Position[];
}

export interface WatchlistItem {
  symbol:   string;
  name:     string;
  nameCN?:  string;
  type:     AssetType;
  /** Yahoo Finance ticker (for custom-added symbols not in built-in registry) */
  yfTicker?: string;
  currency?: string;
}

export interface AIAnalysis {
  symbol: string;
  sentiment: "bullish" | "bearish" | "neutral";
  summary: string;
  keyLevels: { support: number; resistance: number };
  signals: string[];
  riskLevel: "low" | "medium" | "high";
  timestamp: number;
}

export interface TradeOrder {
  symbol: string;
  side: "buy" | "sell";
  type: "market" | "limit" | "stop" | "stop_limit";
  qty: number;
  limitPrice?: number;
  stopPrice?: number;
}

// ── Notifications ──────────────────────────────────────────────────────────
export type NotificationType = "order" | "strategy" | "system";

export interface AppNotification {
  id:        string;
  type:      NotificationType;
  title:     string;
  body:      string;
  symbol?:   string;
  timestamp: number;
  read:      boolean;
}

// ── User Settings ──────────────────────────────────────────────────────────
export type PnlDisplay = "absolute" | "percent";

export interface UserSettings {
  defaultOrderType: "market" | "limit" | "stop" | "stop_limit";
  confirmOrders:    boolean;
  pnlDisplay:       PnlDisplay;
}

// ── Strategies ─────────────────────────────────────────────────────────────
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
  symbol:    string;
  strategies: StrategyResult[];
  consensus: ConsensusResult;
  candleCount: number;
  timestamp: number;
}
