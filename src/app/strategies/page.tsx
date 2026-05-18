"use client";

/**
 * /strategies — Strategy Screener.
 *
 * Shows all six strategies applied to any selected asset from the watchlist.
 * Includes a multi-asset consensus overview in a scannable table.
 */
import { useEffect, useState, useCallback } from "react";
import { useTradingStore } from "@/lib/store";
import { useT } from "@/lib/hooks/use-t";
import { StrategyPanel } from "@/components/strategies/strategy-panel";
import { DEFAULT_WATCHLIST } from "@/lib/store";
import { ASSET_META, currencySymbol } from "@/lib/mock";
import type { WatchlistItem } from "@/lib/types";
import type { StrategiesResponse, Signal } from "@/lib/types";
import { TrendingUp, TrendingDown, Minus, RefreshCw, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

// ── Signal badge (shared style helpers) ───────────────────────────────────
const SIGNAL_BG: Record<Signal, string> = {
  STRONG_BUY:  "bg-[rgba(63,185,80,0.15)] border-[rgba(63,185,80,0.3)] text-[var(--green)]",
  BUY:         "bg-[rgba(63,185,80,0.08)] border-[rgba(63,185,80,0.2)] text-[var(--green)]",
  HOLD:        "bg-[var(--surface-2)] border-[var(--border)] text-[var(--muted)]",
  SELL:        "bg-[rgba(248,81,73,0.08)] border-[rgba(248,81,73,0.2)] text-[var(--red)]",
  STRONG_SELL: "bg-[rgba(248,81,73,0.15)] border-[rgba(248,81,73,0.3)] text-[var(--red)]",
};

function SignalBadge({ signal, label }: { signal: Signal; label: string }) {
  const icon =
    signal === "BUY" || signal === "STRONG_BUY"   ? <TrendingUp  size={10} /> :
    signal === "SELL" || signal === "STRONG_SELL" ? <TrendingDown size={10} /> :
                                                     <Minus        size={10} />;
  return (
    <span className={cn(
      "inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[10px] font-bold whitespace-nowrap",
      SIGNAL_BG[signal]
    )}>
      {icon}{label}
    </span>
  );
}

// ── Multi-asset overview row ───────────────────────────────────────────────
interface AssetRow {
  symbol: string;
  name:   string;
  data:   StrategiesResponse | null;
  loading: boolean;
}

function AssetOverviewRow({ row, lang, onSelect, t }: {
  row: AssetRow;
  lang: string;
  onSelect: (sym: string) => void;
  t: ReturnType<typeof useT>;
}) {
  const meta  = ASSET_META[row.symbol];
  const ticker = row.symbol.replace("USDT","").replace(/^(HK|CN)/,"");
  const name   = lang === "zh" && meta?.nameCN ? meta.nameCN : row.name;

  const labelMap: Record<Signal, string> = {
    STRONG_BUY:  t.strategies.strongBuy,
    BUY:         t.strategies.buy,
    HOLD:        t.strategies.hold,
    SELL:        t.strategies.sell,
    STRONG_SELL: t.strategies.strongSell,
  };

  return (
    <button onClick={() => onSelect(row.symbol)}
      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[var(--surface-2)] transition-colors text-left group">
      {/* Asset */}
      <div className="w-40 shrink-0">
        <p className="text-sm font-medium">{ticker}</p>
        <p className="text-[11px] text-[var(--muted)] truncate">{name}</p>
      </div>

      {/* Strategy signals mini-grid */}
      <div className="flex-1 flex gap-1.5 flex-wrap">
        {row.loading ? (
          [...Array(6)].map((_, i) => (
            <div key={i} className="w-14 h-5 rounded bg-[var(--surface-2)] animate-pulse" />
          ))
        ) : row.data ? (
          row.data.strategies.map((s) => (
            <SignalBadge key={s.id} signal={s.signal}
              label={lang === "zh" ? s.nameZh.slice(0, 3) : s.name.split(" ")[0]} />
          ))
        ) : (
          <span className="text-xs text-[var(--muted)]">—</span>
        )}
      </div>

      {/* Consensus */}
      <div className="w-24 shrink-0 flex justify-center">
        {row.data ? (
          <SignalBadge signal={row.data.consensus.signal}
            label={labelMap[row.data.consensus.signal]} />
        ) : row.loading ? (
          <div className="w-16 h-5 rounded bg-[var(--surface-2)] animate-pulse" />
        ) : <span className="text-xs text-[var(--muted)]">—</span>}
      </div>

      <ChevronRight size={14} className="text-[var(--muted)] group-hover:text-[var(--foreground)] shrink-0 transition-colors" />
    </button>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────
export default function StrategiesPage() {
  const { lang, quotes } = useTradingStore();
  const t = useT();

  // Selected asset for the detailed panel
  const [selected, setSelected] = useState(DEFAULT_WATCHLIST[0].symbol);

  // Overview rows
  const [rows, setRows] = useState<AssetRow[]>(() =>
    DEFAULT_WATCHLIST.map((w: WatchlistItem) => ({ symbol: w.symbol, name: w.name, data: null, loading: false }))
  );

  // Load one row
  const loadRow = useCallback(async (symbol: string) => {
    setRows((prev) => prev.map((r) => r.symbol === symbol ? { ...r, loading: true } : r));
    try {
      const res  = await fetch(`/api/strategies?symbol=${symbol}&interval=1d&limit=120`);
      const data = res.ok ? (await res.json() as StrategiesResponse) : null;
      setRows((prev) => prev.map((r) => r.symbol === symbol ? { ...r, data, loading: false } : r));
    } catch {
      setRows((prev) => prev.map((r) => r.symbol === symbol ? { ...r, loading: false } : r));
    }
  }, []);

  // Load all rows on mount — batched with small delay to avoid rate-limiting
  useEffect(() => {
    DEFAULT_WATCHLIST.forEach((w: WatchlistItem, i: number) => {
      setTimeout(() => loadRow(w.symbol), i * 200);
    });
  }, [loadRow]);

  function refreshAll() {
    DEFAULT_WATCHLIST.forEach((w: WatchlistItem, i: number) => {
      setTimeout(() => loadRow(w.symbol), i * 200);
    });
  }

  const meta     = ASSET_META[selected];
  const quote    = quotes[selected];
  const ticker   = selected.replace("USDT","").replace(/^(HK|CN)/,"");
  const name     = lang === "zh" && meta?.nameCN ? meta.nameCN : meta?.name ?? selected;
  const sym      = currencySymbol(meta?.currency ?? "USD");
  const dec      = (quote?.price ?? 1) < 10 ? 4 : 2;

  return (
    <div className="flex h-full min-h-0">

      {/* ── Left: overview table ───────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden border-r border-[var(--border)]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between shrink-0">
          <div>
            <h1 className="font-bold text-lg">{t.strategies.title}</h1>
            <p className="text-xs text-[var(--muted)] mt-0.5">{t.strategies.subtitle}</p>
          </div>
          <button onClick={refreshAll}
            className="flex items-center gap-1.5 text-xs text-[var(--muted)] hover:text-[var(--foreground)] px-3 py-1.5 rounded-lg border border-[var(--border)] hover:border-[var(--accent)] transition-colors">
            <RefreshCw size={12} /> {t.strategies.refresh}
          </button>
        </div>

        {/* Column headers */}
        <div className="flex items-center gap-3 px-4 py-2 border-b border-[var(--border)] text-[11px] text-[var(--muted)] shrink-0">
          <div className="w-40 shrink-0">{t.strategies.asset}</div>
          <div className="flex-1">{t.strategies.signals}</div>
          <div className="w-24 text-center shrink-0">{t.strategies.consensus}</div>
          <div className="w-4 shrink-0" />
        </div>

        {/* Rows */}
        <div className="flex-1 overflow-y-auto divide-y divide-[var(--border)]">
          {rows.map((row) => (
            <AssetOverviewRow key={row.symbol} row={row} lang={lang} onSelect={setSelected} t={t} />
          ))}
        </div>
      </div>

      {/* ── Right: detailed panel for selected asset ───────────────────── */}
      <aside className="w-80 xl:w-96 shrink-0 hidden md:flex flex-col overflow-hidden">
        {/* Asset header */}
        <div className="px-4 py-4 border-b border-[var(--border)] shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold">{ticker}</span>
                <span className="text-xs text-[var(--muted)]">{name}</span>
              </div>
              {quote && (
                <p className="text-sm font-mono mt-0.5">
                  {sym}{quote.price.toLocaleString("en-US", {
                    minimumFractionDigits: dec, maximumFractionDigits: dec
                  })}
                </p>
              )}
            </div>
            <Link href={`/trade/${selected}`}
              className="text-xs text-[var(--accent)] hover:underline flex items-center gap-1">
              {t.strategies.trade} <ChevronRight size={12} />
            </Link>
          </div>
        </div>

        {/* Strategy panel */}
        <div className="flex-1 overflow-y-auto p-4">
          <StrategyPanel symbol={selected} />
        </div>
      </aside>

    </div>
  );
}
