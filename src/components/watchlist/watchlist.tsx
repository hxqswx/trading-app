"use client";

import { useRouter } from "next/navigation";
import { useTradingStore } from "@/lib/store";
import { useT } from "@/lib/hooks/use-t";
import { fmtPercent, colorClass } from "@/lib/utils";
import { currencySymbol, ASSET_META } from "@/lib/mock";
import { getAsset } from "@/lib/asset-registry";
import { Sparkline } from "@/components/ui/sparkline";
import { Search, Plus, X, RotateCcw } from "lucide-react";
import { useState } from "react";
import type { Quote } from "@/lib/types";
import { AddAssetModal } from "./add-asset-modal";

export function Watchlist() {
  const { watchlist, quotes, priceHistory, activeSymbol, setActiveSymbol, removeFromWatchlist, resetWatchlist } = useTradingStore();
  const [query,    setQuery]    = useState("");
  const [showAdd,  setShowAdd]  = useState(false);
  const [hovering, setHovering] = useState<string | null>(null);
  const t      = useT();
  const router = useRouter();

  function handleSelect(symbol: string) {
    setActiveSymbol(symbol);
    router.push(`/trade/${symbol}`);
  }

  const filtered = watchlist.filter((w) => {
    if (!query) return true;
    const ql = query.toLowerCase();
    const meta = ASSET_META[w.symbol] ?? getAsset(w.symbol);
    return (
      w.symbol.toLowerCase().includes(ql) ||
      w.name.toLowerCase().includes(ql) ||
      (w.nameCN ?? "").includes(query) ||
      meta?.nameCN?.includes(query) ||
      meta?.name?.toLowerCase().includes(ql)
    );
  });

  const forexPairs = filtered.filter((w) => w.type === "forex");
  const cryptos    = filtered.filter((w) => w.type === "crypto");
  const stocks     = filtered.filter((w) => w.type === "stock");
  const hkStocks   = filtered.filter((w) => w.type === "hk");
  const cnStocks   = filtered.filter((w) => w.type === "cn");

  return (
    <>
      <div className="flex flex-col h-full bg-[var(--surface)]">
        {/* Header */}
        <div className="px-4 pt-4 pb-3 border-b border-[var(--border)] shrink-0">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">
              {t.watchlist.title}
              <span className="ml-1.5 text-[var(--muted)]/60">({watchlist.length})</span>
            </h2>
            <div className="flex items-center gap-1">
              <button
                onClick={() => { if (confirm(t.watchlist.resetConfirm)) resetWatchlist(); }}
                title={t.watchlist.reset}
                className="w-6 h-6 flex items-center justify-center rounded text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-2)] transition-colors"
              >
                <RotateCcw size={11} />
              </button>
              <button
                onClick={() => setShowAdd(true)}
                title={t.watchlist.addAsset}
                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[var(--accent)]/15 text-[var(--accent)] hover:bg-[var(--accent)]/25 transition-colors text-[11px] font-semibold"
              >
                <Plus size={12} />
                {t.watchlist.add}
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="flex items-center gap-2 bg-[var(--surface-2)] rounded-lg px-3 py-1.5">
            <Search size={13} className="text-[var(--muted)] shrink-0" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t.watchlist.search}
              className="bg-transparent text-xs flex-1 focus:outline-none placeholder:text-[var(--muted)] min-w-0"
            />
            {query && (
              <button onClick={() => setQuery("")} className="text-[var(--muted)] hover:text-[var(--foreground)]">
                <X size={11} />
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {forexPairs.length > 0 && <>
            <SectionLabel label={t.watchlist.forex} />
            {forexPairs.map((item) => (
              <AssetRow
                key={item.symbol} symbol={item.symbol}
                quote={quotes[item.symbol]} history={priceHistory[item.symbol] ?? []}
                active={activeSymbol === item.symbol}
                hovering={hovering === item.symbol}
                onSelect={handleSelect}
                onRemove={() => removeFromWatchlist(item.symbol)}
                onHover={setHovering}
              />
            ))}
          </>}

          {cryptos.length > 0 && <>
            <SectionLabel label={t.watchlist.crypto} />
            {cryptos.map((item) => (
              <AssetRow
                key={item.symbol} symbol={item.symbol}
                quote={quotes[item.symbol]} history={priceHistory[item.symbol] ?? []}
                active={activeSymbol === item.symbol}
                hovering={hovering === item.symbol}
                onSelect={handleSelect}
                onRemove={() => removeFromWatchlist(item.symbol)}
                onHover={setHovering}
              />
            ))}
          </>}

          {stocks.length > 0 && <>
            <SectionLabel label={t.watchlist.equities} />
            {stocks.map((item) => (
              <AssetRow
                key={item.symbol} symbol={item.symbol}
                quote={quotes[item.symbol]} history={priceHistory[item.symbol] ?? []}
                active={activeSymbol === item.symbol}
                hovering={hovering === item.symbol}
                onSelect={handleSelect}
                onRemove={() => removeFromWatchlist(item.symbol)}
                onHover={setHovering}
              />
            ))}
          </>}

          {cnStocks.length > 0 && <>
            <SectionLabel label={t.watchlist.mainlandCN} />
            {cnStocks.map((item) => (
              <AssetRow
                key={item.symbol} symbol={item.symbol}
                quote={quotes[item.symbol]} history={priceHistory[item.symbol] ?? []}
                active={activeSymbol === item.symbol}
                hovering={hovering === item.symbol}
                onSelect={handleSelect}
                onRemove={() => removeFromWatchlist(item.symbol)}
                onHover={setHovering}
              />
            ))}
          </>}

          {hkStocks.length > 0 && <>
            <SectionLabel label={t.watchlist.cnHk} />
            {hkStocks.map((item) => (
              <AssetRow
                key={item.symbol} symbol={item.symbol}
                quote={quotes[item.symbol]} history={priceHistory[item.symbol] ?? []}
                active={activeSymbol === item.symbol}
                hovering={hovering === item.symbol}
                onSelect={handleSelect}
                onRemove={() => removeFromWatchlist(item.symbol)}
                onHover={setHovering}
              />
            ))}
          </>}

          {filtered.length === 0 && (
            <div className="py-12 text-center text-[var(--muted)] text-xs space-y-2">
              <p className="opacity-50">{query ? t.watchlist.noMatch : t.watchlist.empty}</p>
              <button onClick={() => setShowAdd(true)} className="text-[var(--accent)] hover:underline">
                + {t.watchlist.addAsset}
              </button>
            </div>
          )}
        </div>
      </div>

      {showAdd && <AddAssetModal onClose={() => setShowAdd(false)} />}
    </>
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
  symbol, quote, history, active, hovering, onSelect, onRemove, onHover,
}: {
  symbol: string; quote: Quote | undefined;
  history: number[]; active: boolean; hovering: boolean;
  onSelect: (s: string) => void;
  onRemove: () => void;
  onHover: (s: string | null) => void;
}) {
  const { lang } = useTradingStore();

  // Prefer registry entry (has more complete data), fall back to ASSET_META
  const regEntry = getAsset(symbol);
  const meta     = ASSET_META[symbol] ?? (regEntry ? {
    name: regEntry.name, nameCN: regEntry.nameCN,
    type: regEntry.type, currency: regEntry.currency,
    basePrice: regEntry.basePrice,
  } : null);

  const isUp   = (quote?.changePct ?? 0) >= 0;
  const price  = quote?.price;
  const pct    = quote?.changePct ?? 0;
  const assetType = meta?.type ?? regEntry?.type ?? quote?.type;
  const isForex   = assetType === "forex";

  // Currency symbol: forex rates have no prefix — they are the rate itself
  const sym = isForex ? "" : (meta ? currencySymbol(meta.currency) : "$");
  // Decimal places: forex needs 4 dp (6 for very small rates like JPYCNY, KRWCNY)
  const dec = isForex
    ? (price !== undefined && price < 0.01 ? 6 : 4)
    : (price !== undefined && price < 10 ? 4 : 2);

  // Chinese name: check watchlist item's nameCN, then registry, then ASSET_META
  const displayName = lang === "zh"
    ? (regEntry?.nameCN ?? meta?.nameCN ?? meta?.name ?? symbol)
    : (meta?.name ?? regEntry?.name ?? symbol);

  // Ticker label: forex shows "USD/CNY"; crypto strips "USDT"; HK/CN strips prefix
  const ticker = isForex
    ? symbol.slice(0, 3) + "/" + symbol.slice(3)
    : symbol.replace("USDT","").replace(/^(HK|CN)/,"");

  const iconColor =
    isForex             ? "bg-[rgba(16,185,129,0.12)] text-emerald-400"          :
    meta?.type === "crypto" ? "bg-[rgba(188,140,255,0.12)] text-[var(--purple)]" :
    meta?.type === "hk"     ? "bg-[rgba(255,160,0,0.12)] text-[var(--yellow)]"   :
    meta?.type === "cn"     ? "bg-[rgba(248,81,73,0.10)] text-[#ff6b6b]"          :
                              "bg-[rgba(88,166,255,0.12)] text-[var(--accent)]";

  return (
    <div
      className="relative group"
      onMouseEnter={() => onHover(symbol)}
      onMouseLeave={() => onHover(null)}
    >
      <button
        onClick={() => onSelect(symbol)}
        className={`w-full flex items-center gap-3 px-4 py-3 transition-colors text-left border-l-2 ${
          active ? "bg-[var(--surface-2)] border-[var(--accent)]" : "border-transparent hover:bg-[var(--surface-2)]"
        }`}
      >
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${iconColor} ${isForex ? "text-[10px] font-bold" : "text-xs font-bold"}`}>
          {isForex ? symbol.slice(0, 3) : ticker.slice(0, 2)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-1">
            <span className="text-sm font-semibold truncate">{ticker}</span>
            {price !== undefined
              ? <span className="text-xs font-mono font-semibold shrink-0">
                  {sym}{isForex || price < 10
                    ? price.toFixed(dec)
                    : price.toLocaleString("en-US",{minimumFractionDigits:dec,maximumFractionDigits:dec})}
                </span>
              : <span className="text-xs text-[var(--muted)] animate-pulse">…</span>}
          </div>
          <div className="flex items-center justify-between mt-0.5">
            <span className="text-[11px] text-[var(--muted)] truncate">{displayName}</span>
            {quote && <span className={`text-[11px] font-mono shrink-0 ${colorClass(pct)}`}>{fmtPercent(pct)}</span>}
          </div>
        </div>
        {history.length > 4 && (
          <Sparkline data={history.slice(-24)} width={52} height={24} positive={isUp} />
        )}
      </button>

      {/* Remove button — appears on hover */}
      {hovering && (
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          title="Remove from watchlist"
          className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded bg-[var(--surface-2)] hover:bg-red-500/20 hover:text-red-400 text-[var(--muted)] transition-colors"
        >
          <X size={10} />
        </button>
      )}
    </div>
  );
}
