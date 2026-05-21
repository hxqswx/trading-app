// Shared types — identical to web src/lib/types.ts

export type AssetType = "stock" | "crypto" | "hk" | "cn" | "forex";

export interface Quote {
  symbol:    string;
  price:     number;
  open:      number;
  high:      number;
  low:       number;
  volume:    number;
  change:    number;
  changePct: number;
  timestamp: number;
  type:      AssetType;
  currency:  string;
}

export interface Candle {
  time:   number;
  open:   number;
  high:   number;
  low:    number;
  close:  number;
  volume: number;
}

export type CandleInterval = "1m" | "5m" | "15m" | "1h" | "4h" | "1d";

export interface Position {
  symbol:           string;
  qty:              number;
  avgEntryPrice:    number;
  currentPrice:     number;
  marketValue:      number;
  unrealizedPnl:    number;
  unrealizedPnlPct: number;
  type:             AssetType;
  currency?:        string;
}

export interface PortfolioSummary {
  equity:    number;
  cash:      number;
  dayPnl:    number;
  dayPnlPct: number;
  totalPnl:  number;
  positions: Position[];
}

export interface WatchlistItem {
  symbol:  string;
  name:    string;
  nameCN?: string;
  type:    AssetType;
}

export interface HistoryPoint {
  ts:     number;
  equity: number;
}

export type Theme = "dark" | "light";
