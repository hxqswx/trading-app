"use client";

import { useTradingStore } from "@/lib/store";
import { fmtCurrency, fmtPercent, colorClass } from "@/lib/utils";
import { Activity } from "lucide-react";

export function Topbar() {
  const { activeSymbol, quotes } = useTradingStore();
  const quote = quotes[activeSymbol];

  return (
    <header className="h-14 border-b border-[var(--border)] bg-[var(--surface)] flex items-center px-6 gap-6 sticky top-0 z-10">
      {/* Brand */}
      <div className="flex items-center gap-2 mr-4">
        <Activity size={16} className="text-[var(--accent)]" />
        <span className="font-semibold text-sm tracking-tight">TradeAI</span>
      </div>

      {/* Active symbol ticker */}
      {quote && (
        <div className="flex items-center gap-4">
          <span className="font-mono font-semibold text-sm">{quote.symbol}</span>
          <span className="font-mono font-bold text-base">{fmtCurrency(quote.price, 4)}</span>
          <span className={`text-sm font-mono ${colorClass(quote.changePct)}`}>
            {fmtPercent(quote.changePct)}
          </span>
        </div>
      )}

      <div className="flex-1" />

      {/* Live indicator */}
      <div className="flex items-center gap-1.5 text-xs text-[var(--muted)]">
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--green)] animate-pulse" />
        Live
      </div>
    </header>
  );
}
