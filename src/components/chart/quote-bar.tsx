"use client";

import { useTradingStore } from "@/lib/store";
import { fmtCurrency, fmtPercent, fmtLarge, colorClass } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";

interface QuoteBarProps {
  symbol: string;
}

export function QuoteBar({ symbol }: QuoteBarProps) {
  const { quotes } = useTradingStore();
  const quote = quotes[symbol];

  if (!quote) return (
    <div className="h-16 flex items-center px-4 border-b border-[var(--border)] animate-pulse">
      <div className="h-4 w-48 bg-[var(--surface-2)] rounded" />
    </div>
  );

  const up = quote.changePct >= 0;

  return (
    <div className="flex items-center gap-6 px-4 py-3 border-b border-[var(--border)] bg-[var(--surface)] flex-wrap">
      {/* Symbol + price */}
      <div className="flex items-baseline gap-3">
        <span className="text-lg font-bold">{symbol.replace("USDT", "")}</span>
        <span className="text-2xl font-mono font-bold">
          {fmtCurrency(quote.price, quote.price < 10 ? 4 : 2)}
        </span>
        <span className={`flex items-center gap-1 text-sm font-mono font-semibold ${colorClass(quote.changePct)}`}>
          {up ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          {fmtPercent(quote.changePct)}
        </span>
      </div>

      <div className="h-8 w-px bg-[var(--border)]" />

      {/* Stats */}
      {[
        { label: "Open",   value: fmtCurrency(quote.open, 2) },
        { label: "High",   value: fmtCurrency(quote.high, 2) },
        { label: "Low",    value: fmtCurrency(quote.low, 2) },
        { label: "Volume", value: fmtLarge(quote.volume) },
      ].map(({ label, value }) => (
        <div key={label} className="flex flex-col">
          <span className="text-xs text-[var(--muted)]">{label}</span>
          <span className="text-sm font-mono">{value}</span>
        </div>
      ))}
    </div>
  );
}
