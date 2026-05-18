"use client";

import { useRouter } from "next/navigation";
import { useTradingStore } from "@/lib/store";
import { useT } from "@/lib/hooks/use-t";
import { fmtPercent, colorClass } from "@/lib/utils";
import { currencySymbol, ASSET_META } from "@/lib/mock";
import { Sparkline } from "@/components/ui/sparkline";
import { Search } from "lucide-react";
import { useState } from "react";
import type { Quote } from "@/lib/types";

export function Watchlist() {
  const { watchlist, quotes, priceHistory, activeSymbol, setActiveSymbol } = useTradingStore();
  const [query, setQuery] = useState("");
  const t      = useT();
  const router = useRouter();

  function handleSelect(symbol: string) {
    setActiveSymbol(symbol);
    router.push(`/trade/${symbol}`);
  }

  const filtered = watchlist.filter((w) =>
    !query ||
    w.symbol.toLowerCase().includes(query.toLowerCase()) ||
    w.name.toLowerCase().includes(query.toLowerCase()) ||
    ASSET_META[w.symbol]?.nameCN?.includes(query)
  );

  const cryptos   = filtered.filter((w) => w.type === "crypto");
  const stocks    = filtered.filter((w) => w.type === "stock");
  const hkStocks  = filtered.filter((w) => w.type === "hk");
  const cnStocks  = filtered.filter((w) => w.type === "cn");

  return (
    <div className="flex flex-col h-full bg-[var(--surface)]">
      <div className="px-4 pt-4 pb-3 border-b border-[var(--border)] shrink-0">
        <h2 className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider mb-3">{t.watchlist.title}</h2>
        <div className="flex items-center gap-2 bg-[var(--surface-2)] rounded-lg px-3 py-1.5">
          <Search size={13} className="text-[var(--muted)] shrink-0" />
          <input value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder={t.watchlist.search}
            className="bg-transparent text-xs flex-1 focus:outline-none placeholder:text-[var(--muted)] min-w-0" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {cryptos.length > 0 && <>
          <SectionLabel label={t.watchlist.crypto} />
          {cryptos.map((item) => (
            <AssetRow key={item.symbol} symbol={item.symbol} quote={quotes[item.symbol]} history={priceHistory[item.symbol] ?? []} active={activeSymbol === item.symbol} onSelect={handleSelect} />
          ))}
        </>}

        {stocks.length > 0 && <>
          <SectionLabel label={t.watchlist.equities} />
          {stocks.map((item) => (
            <AssetRow key={item.symbol} symbol={item.symbol} quote={quotes[item.symbol]} history={priceHistory[item.symbol] ?? []} active={activeSymbol === item.symbol} onSelect={handleSelect} />
          ))}
        </>}

        {cnStocks.length > 0 && <>
          <SectionLabel label={t.watchlist.mainlandCN} />
          {cnStocks.map((item) => (
            <AssetRow key={item.symbol} symbol={item.symbol} quote={quotes[item.symbol]} history={priceHistory[item.symbol] ?? []} active={activeSymbol === item.symbol} onSelect={handleSelect} />
          ))}
        </>}

        {hkStocks.length > 0 && <>
          <SectionLabel label={t.watchlist.cnHk} />
          {hkStocks.map((item) => (
            <AssetRow key={item.symbol} symbol={item.symbol} quote={quotes[item.symbol]} history={priceHistory[item.symbol] ?? []} active={activeSymbol === item.symbol} onSelect={handleSelect} />
          ))}
        </>}
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

function AssetRow({ symbol, quote, history, active, onSelect }: {
  symbol: string; quote: Quote | undefined;
  history: number[]; active: boolean; onSelect: (s: string) => void;
}) {
  const { lang } = useTradingStore();
  const meta  = ASSET_META[symbol];
  const isUp  = (quote?.changePct ?? 0) >= 0;
  const price = quote?.price;
  const pct   = quote?.changePct ?? 0;
  const sym   = meta ? currencySymbol(meta.currency) : "$";
  const dec   = price !== undefined && price < 10 ? 4 : 2;
  const displayName = lang === "zh" && meta?.nameCN ? meta.nameCN : (meta?.name ?? symbol);
  const ticker = symbol.replace("USDT","").replace(/^(HK|CN)/,"");

  const iconColor = meta?.type === "crypto"
    ? "bg-[rgba(188,140,255,0.12)] text-[var(--purple)]"
    : meta?.type === "hk"
    ? "bg-[rgba(255,160,0,0.12)] text-[var(--yellow)]"
    : meta?.type === "cn"
    ? "bg-[rgba(248,81,73,0.10)] text-[#ff6b6b]"
    : "bg-[rgba(88,166,255,0.12)] text-[var(--accent)]";

  return (
    <button onClick={() => onSelect(symbol)}
      className={`w-full flex items-center gap-3 px-4 py-3 transition-colors text-left border-l-2 ${
        active ? "bg-[var(--surface-2)] border-[var(--accent)]" : "border-transparent hover:bg-[var(--surface-2)]"
      }`}
    >
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${iconColor}`}>
        {ticker.slice(0, 2)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-1">
          <span className="text-sm font-semibold truncate">{ticker}</span>
          {price !== undefined
            ? <span className="text-xs font-mono font-semibold shrink-0">
                {sym}{price < 10 ? price.toFixed(dec) : price.toLocaleString("en-US",{minimumFractionDigits:dec,maximumFractionDigits:dec})}
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
  );
}
