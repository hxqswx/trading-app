"use client";

import { useEffect } from "react";
import { useTradingStore } from "@/lib/store";
import { PriceChart } from "@/components/chart/price-chart";
import { QuoteBar } from "@/components/chart/quote-bar";
import { OrderBook } from "@/components/orderbook/orderbook";
import { TradePanel } from "@/components/chart/trade-panel";
import { AIPanel } from "@/components/ai-panel/ai-panel";
import { Watchlist } from "@/components/watchlist/watchlist";
import { Card } from "@/components/ui/card";
import { ASSET_META } from "@/lib/mock";
import { fmtCurrency, fmtPercent } from "@/lib/utils";

interface TradeViewProps { symbol: string }

export function TradeView({ symbol }: TradeViewProps) {
  const { setActiveSymbol } = useTradingStore();
  useEffect(() => { setActiveSymbol(symbol); }, [symbol, setActiveSymbol]);

  return (
    <div className="flex h-full min-h-0">
      {/* Left watchlist */}
      <aside className="w-64 border-r border-[var(--border)] shrink-0 hidden xl:flex flex-col overflow-hidden">
        <Watchlist />
      </aside>

      {/* Center: chart + stats */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <QuoteBar symbol={symbol} />

        <div className="flex-1 flex min-h-0 overflow-hidden">
          {/* Chart area */}
          <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
            <div className="p-4 pb-0">
              <Card className="overflow-hidden p-4">
                <PriceChart symbol={symbol} />
              </Card>
            </div>
            <RangeBar symbol={symbol} />
            <AssetInfo symbol={symbol} />
          </div>

          {/* Orderbook */}
          <aside className="w-60 border-l border-[var(--border)] shrink-0 hidden lg:flex flex-col overflow-hidden">
            <div className="flex-1 p-3 overflow-hidden flex flex-col">
              <OrderBook symbol={symbol} />
            </div>
          </aside>
        </div>
      </div>

      {/* Right: trade + AI */}
      <aside className="w-72 border-l border-[var(--border)] shrink-0 flex flex-col overflow-hidden">
        <div className="flex-1 flex flex-col gap-4 p-4 overflow-y-auto">
          <TradePanel symbol={symbol} />
          <AIPanel symbol={symbol} />
        </div>
      </aside>
    </div>
  );
}

function RangeBar({ symbol }: { symbol: string }) {
  const { quotes } = useTradingStore();
  const q = quotes[symbol];
  if (!q) return null;

  const range = q.high - q.low;
  const pos   = range > 0 ? ((q.price - q.low) / range) * 100 : 50;

  return (
    <div className="mx-4 mt-3 px-4 py-3 bg-[var(--surface)] border border-[var(--border)] rounded-xl flex items-center gap-5 flex-wrap">
      <div className="flex items-center gap-3 flex-1 min-w-48">
        <span className="text-xs font-mono text-[var(--red)]">{fmtCurrency(q.low,2)}</span>
        <div className="flex-1 h-1.5 bg-[var(--surface-2)] rounded-full relative">
          <div className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[var(--red)] to-[var(--green)]" style={{ width: "100%" }} />
          <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white border-2 border-[var(--accent)] shadow-sm"
            style={{ left: `calc(${pos}% - 6px)` }} />
        </div>
        <span className="text-xs font-mono text-[var(--green)]">{fmtCurrency(q.high,2)}</span>
      </div>
      <div className="flex items-center gap-5 text-xs text-[var(--muted)]">
        <span>24h range</span>
        <span className="text-[var(--foreground)]">{q.type === "crypto" ? "Crypto" : "Equity"}</span>
        <span>Vol: <span className="font-mono text-[var(--foreground)]">
          {q.volume >= 1e9 ? `${(q.volume/1e9).toFixed(1)}B` : q.volume >= 1e6 ? `${(q.volume/1e6).toFixed(1)}M` : q.volume.toFixed(0)}
        </span></span>
      </div>
    </div>
  );
}

function AssetInfo({ symbol }: { symbol: string }) {
  const meta = ASSET_META[symbol];
  if (!meta) return null;

  return (
    <div className="mx-4 mt-3 mb-4 px-4 py-3 bg-[var(--surface)] border border-[var(--border)] rounded-xl">
      <div className="flex items-start gap-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 mt-0.5 ${
          meta.type === "crypto" ? "bg-[rgba(188,140,255,0.12)] text-[var(--purple)]" : "bg-[rgba(88,166,255,0.12)] text-[var(--accent)]"
        }`}>
          {symbol.replace("USDT","").slice(0,2)}
        </div>
        <div>
          <div className="font-semibold text-sm">{meta.name} <span className="text-[var(--muted)] font-normal">({symbol.replace("USDT","")})</span></div>
          <div className="text-xs text-[var(--muted)] mt-0.5">{meta.description}</div>
          {meta.sector && <div className="text-[10px] mt-1.5 px-2 py-0.5 rounded-full bg-[var(--surface-2)] text-[var(--muted)] inline-block">{meta.sector}</div>}
        </div>
      </div>
    </div>
  );
}
