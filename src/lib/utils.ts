import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { AssetType } from "@/lib/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function fmt(value: number, decimals = 2): string {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function fmtCurrency(value: number, decimals = 2): string {
  return "$" + fmt(value, decimals);
}

export function fmtPercent(value: number): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${fmt(value, 2)}%`;
}

export function fmtLarge(value: number): string {
  if (Math.abs(value) >= 1e9) return `${fmt(value / 1e9, 2)}B`;
  if (Math.abs(value) >= 1e6) return `${fmt(value / 1e6, 2)}M`;
  if (Math.abs(value) >= 1e3) return `${fmt(value / 1e3, 2)}K`;
  return fmt(value, 2);
}

export function fmtTime(ts: number): string {
  return new Date(ts).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function colorClass(value: number): string {
  if (value > 0) return "number-green";
  if (value < 0) return "number-red";
  return "number-muted";
}

export function isCrypto(symbol: string): boolean {
  return symbol.endsWith("USDT") || symbol.endsWith("BTC") || symbol.endsWith("ETH");
}

export function assetType(symbol: string): "crypto" | "stock" {
  return isCrypto(symbol) ? "crypto" : "stock";
}

// ── Data source info ──────────────────────────────────────────────────────────

export type DataSourceId = "alpaca" | "binance" | "yahoo";

export interface DataSourceInfo {
  /** Short identifier */
  id: DataSourceId;
  /** Display name */
  name: string;
  /** URL of the provider */
  url: string;
  /**
   * true  = WebSocket / server-pushed ticks (Alpaca stream, Binance WS)
   * false = REST poll every 30-60 s
   */
  live: boolean;
  /** Tailwind colour classes for the dot/text */
  dotClass: string;
  textClass: string;
}

const SOURCES: Record<DataSourceId, DataSourceInfo> = {
  alpaca: {
    id:        "alpaca",
    name:      "Alpaca",
    url:       "https://alpaca.markets",
    live:      true,
    dotClass:  "bg-emerald-400",
    textClass: "text-emerald-400",
  },
  binance: {
    id:        "binance",
    name:      "Binance",
    url:       "https://binance.com",
    live:      true,
    dotClass:  "bg-yellow-400",
    textClass: "text-yellow-400",
  },
  yahoo: {
    id:        "yahoo",
    name:      "Yahoo Finance",
    url:       "https://finance.yahoo.com",
    live:      false,
    dotClass:  "bg-[var(--muted)]",
    textClass: "text-[var(--muted)]",
  },
};

/**
 * Returns the data provider information for a given asset type.
 * Works on both client and server — reads NEXT_PUBLIC_ALPACA_ENABLED for
 * client-side rendering without exposing secret keys.
 */
export function getDataSource(type: AssetType): DataSourceInfo {
  if (type === "crypto")  return SOURCES.binance;
  if (type === "stock") {
    const alpacaOn = process.env.NEXT_PUBLIC_ALPACA_ENABLED === "true";
    return alpacaOn ? SOURCES.alpaca : SOURCES.yahoo;
  }
  // hk, cn, forex → Yahoo Finance
  return SOURCES.yahoo;
}
