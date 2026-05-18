"use client";

import { useRouter } from "next/navigation";
import { useTradingStore } from "@/lib/store";
import { fmtCurrency, fmtPercent, colorClass } from "@/lib/utils";
import { Sparkline } from "@/components/ui/sparkline";
import { ASSET_META } from "@/lib/mock";
import { Search } from "lucide-react";
import { useState } from "react";

export function Watchlist() {
  const { watchlist, quotes, priceHistory, activeSymbol, setActiveSymbol } = useTradingStore();
  const [query, setQuery] = useState("");
  const router = useRouter();

  function handleSelect(symbol: string) {
    setActiveSymbol(symbol);
    router.push(`/trade/${symbol}`);
  }

  const filtered = watchlist.filter((w) =>
    !query || w.symbol.toLowerCase().includes(query.toLowerCase()) || w.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-[var(--surface)]">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-[var(--border)]">
        <h2 className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider mb-3">Watchlist</h2>
        <div className="flex items-center gap-2 bg-[var(--surface-2)] rounded-lg px-3 py-1.5">
          <Search size={13} className="text-[var(--muted)] shrink-0" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search…"
            className="bg-transparent text-xs flex-1 focus:outline-none placeholder:text-[var(--muted)] min-w-0"
          />
        </div>
      </div>

      {/* Asset rows */}
      <div className="flex-1 overflow-y-auto">
        {/* Section: Crypto */}
        <SectionLabel label="Crypto" />
        {filtered.filter((w) => w.type === "crypto").map((item) => (
          <AssetRow key={item.symbol} item={item} quote={quotes[item.symbol]} history={priceHistory[item.symbol] ?? []} active={activeSymbol === item.symbol} onSelect={handleSelect} />
        ))}

        {/* Section: Stocks */}
        <SectionLabel label="Equities" />
        {filtered.filter((w) => w.type === "stock").map((item) => (
          <AssetRow key={item.symbol} item={item} quote={quotes[item.symbol]} history={priceHistory[item.symbol] ?? []} active={activeSymbol === item.symbol} onSelect={handleSelect} />
        ))}
      </div>
    </div>
  );
}

function SectionLabel({ label }: { label: string }) {
  return (
    <div className="px-4 py-2 text-[10px] font-semibold text-[var(--muted)] uppercase tracking-widest bg-[var(--surface)]">
      {label}
    </div>
  );
}

function AssetRow({
  item, quote, history, active, onSelect,
}: {
  item: { symbol: string; name: string; type: string };
  quote: import("@/lib/types").Quote | undefined;
  history: number[];
  active: boolean;
  onSelect: (s: string) => void;
}) {
  const meta  = ASSET_META[item.symbol];
  const isUp  = (quote?.changePct ?? 0) >= 0;
  const price = quote?.price;
  const pct   = quote?.changePct ?? 0;

  return (
    <button
      onClick={() => onSelect(item.symbol)}
      className={`w-full flex items-center gap-3 px-4 py-3 transition-colors text-left border-l-2 ${
        active
          ? "bg-[var(--surface-2)] border-[var(--accent)]"
          : "border-transparent hover:bg-[var(--surface-2)]"
      }`}
    >
      {/* Icon */}
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
        meta?.type === "crypto"
          ? "bg-[rgba(188,140,255,0.12)] text-[var(--purple)]"
          : "bg-[rgba(88,166,255,0.12)] text-[var(--accent)]"
      }`}>
        {item.symbol.replace("USDT","").slice(0,2)}
      </div>

      {/* Name + price */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-1">
          <span className="text-sm font-semibold truncate">{item.symbol.replace("USDT","")}</span>
          {price !== undefined ? (
            <span className="text-xs font-mono font-semibold shrink-0">
              {fmtCurrency(price, price < 1 ? 5 : price < 100 ? 2 : 2)}
            </span>
          ) : (
            <span className="text-xs text-[var(--muted)] animate-pulse">…</span>
          )}
        </div>
        <div className="flex items-center justify-between mt-0.5">
          <span className="text-[11px] text-[var(--muted)] truncate">{item.name}</span>
          {quote && (
            <span className={`text-[11px] font-mono shrink-0 ${colorClass(pct)}`}>
              {fmtPercent(pct)}
            </span>
          )}
        </div>
      </div>

      {/* Sparkline */}
      {history.length > 4 && (
        <Sparkline data={history.slice(-24)} width={52} height={24} positive={isUp} />
      )}
    </button>
  );
}
