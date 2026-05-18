export type AssetType = "stock" | "crypto";

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
  symbol: string;
  name: string;
  type: AssetType;
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
