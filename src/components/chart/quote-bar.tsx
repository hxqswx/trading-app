"use client";

import { useTradingStore } from "@/lib/store";
import { useT } from "@/lib/hooks/use-t";
import { fmtPercent, colorClass } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";
import { currencySymbol, ASSET_META } from "@/lib/mock";

interface QuoteBarProps { symbol: string }

export function QuoteBar({ symbol }: QuoteBarProps) {
  const { quotes, lang } = useTradingStore();
  const t     = useT();
  const quote = quotes[symbol];
  const meta  = ASSET_META[symbol];
  const sym   = currencySymbol(meta?.currency ?? "USD");

  if (!quote) return (
    <div className="h-16 flex items-center px-4 border-b border-[var(--border)] animate-pulse">
      <div className="h-4 w-48 bg-[var(--surface-2)] rounded" />
    </div>
  );

  const up     = quote.changePct >= 0;
  const ticker = symbol.replace("USDT","").replace(/^HK/,"");
  const name   = lang === "zh" && meta?.nameCN ? meta.nameCN : (meta?.name ?? symbol);
  const dec    = quote.price < 10 ? 4 : 2;
  const fmt    = (n: number) => `${sym}${n.toLocaleString("en-US",{minimumFractionDigits:dec,maximumFractionDigits:dec})}`;

  return (
    <div className="flex items-center gap-6 px-4 py-3 border-b border-[var(--border)] bg-[var(--surface)] flex-wrap">
      <div className="flex items-baseline gap-3">
        <div>
          <div className="text-base font-bold leading-none">{ticker}</div>
          <div className="text-xs text-[var(--muted)] mt-0.5">{name}</div>
        </div>
        <span className="text-2xl font-mono font-bold">{fmt(quote.price)}</span>
        <span className={`flex items-center gap-1 text-sm font-mono font-semibold ${colorClass(quote.changePct)}`}>
          {up ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          {fmtPercent(quote.changePct)}
        </span>
      </div>

      <div className="h-8 w-px bg-[var(--border)]" />

      {[
        { label: lang === "zh" ? "开盘" : "Open",   value: fmt(quote.open) },
        { label: lang === "zh" ? "最高" : "High",   value: fmt(quote.high) },
        { label: lang === "zh" ? "最低" : "Low",    value: fmt(quote.low)  },
        { label: lang === "zh" ? "成交量" : "Volume", value: quote.volume >= 1e9 ? `${(quote.volume/1e9).toFixed(2)}B` : quote.volume >= 1e6 ? `${(quote.volume/1e6).toFixed(2)}M` : quote.volume.toFixed(0) },
      ].map(({ label, value }) => (
        <div key={label}>
          <span className="text-xs text-[var(--muted)]">{label}</span>
          <div className="text-sm font-mono">{value}</div>
        </div>
      ))}
    </div>
  );
}
