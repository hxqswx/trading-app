import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

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
