"use client";

import { useTradingStore } from "@/lib/store";
import { useT } from "@/lib/hooks/use-t";
import { fmtPercent, colorClass, getDataSource } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";
import { currencySymbol, ASSET_META } from "@/lib/mock";
import { getAsset } from "@/lib/asset-registry";

interface QuoteBarProps { symbol: string }

export function QuoteBar({ symbol }: QuoteBarProps) {
  const { quotes, lang } = useTradingStore();
  const t     = useT();
  const quote = quotes[symbol];
  const meta  = ASSET_META[symbol];
  const reg   = !meta ? getAsset(symbol) : undefined;
  const sym   = currencySymbol((meta?.currency ?? reg?.currency) ?? "USD");

  if (!quote) return (
    <div className="h-16 flex items-center px-4 border-b border-[var(--border)] animate-pulse">
      <div className="h-4 w-48 bg-[var(--surface-2)] rounded" />
    </div>
  );

  const up     = quote.changePct >= 0;
  const ticker = symbol.replace("USDT","").replace(/^(HK|CN)/,"");
  const name   = lang === "zh" && meta?.nameCN ? meta.nameCN : (meta?.name ?? reg?.name ?? symbol);
  const dec    = quote.price < 10 ? 4 : 2;
  const fmt    = (n: number) => `${sym}${n.toLocaleString("en-US",{minimumFractionDigits:dec,maximumFractionDigits:dec})}`;

  const src = getDataSource(quote.type);

  return (
    <div className="flex items-center gap-6 px-4 py-3 border-b border-[var(--border)] bg-[var(--surface)] flex-wrap">
      {/* ── Price block ── */}
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

      {/* ── OHLCV stats ── */}
      {[
        { label: lang === "zh" ? "开盘" : "Open",   value: fmt(quote.open) },
        { label: lang === "zh" ? "最高" : "High",   value: fmt(quote.high) },
        { label: lang === "zh" ? "最低" : "Low",    value: fmt(quote.low)  },
        { label: lang === "zh" ? "成交量" : "Volume",
          value: quote.volume >= 1e9 ? `${(quote.volume/1e9).toFixed(2)}B`
               : quote.volume >= 1e6 ? `${(quote.volume/1e6).toFixed(2)}M`
               : quote.volume.toFixed(0) },
      ].map(({ label, value }) => (
        <div key={label}>
          <span className="text-xs text-[var(--muted)]">{label}</span>
          <div className="text-sm font-mono">{value}</div>
        </div>
      ))}

      {/* ── Data source badge ── */}
      <div className="ml-auto flex items-center gap-1.5">
        {/* pulsing dot: solid for live stream, static for polled */}
        <span className="relative flex h-2 w-2 shrink-0">
          {src.live && (
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-60 ${src.dotClass}`} />
          )}
          <span className={`relative inline-flex rounded-full h-2 w-2 ${src.dotClass}`} />
        </span>
        <a
          href={src.url}
          target="_blank"
          rel="noopener noreferrer"
          title={lang === "zh" ? `数据来源：${src.name}` : `Data source: ${src.name}`}
          className={`text-[11px] font-medium hover:underline underline-offset-2 ${src.textClass}`}
        >
          {src.name}
        </a>
        {src.live && (
          <span className={`text-[10px] ${src.textClass} opacity-70`}>
            {lang === "zh" ? "实时" : "Live"}
          </span>
        )}
      </div>
    </div>
  );
}
