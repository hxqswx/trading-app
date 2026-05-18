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

interface TradeViewProps {
  symbol: string;
}

export function TradeView({ symbol }: TradeViewProps) {
  const { setActiveSymbol } = useTradingStore();

  useEffect(() => {
    setActiveSymbol(symbol);
  }, [symbol, setActiveSymbol]);

  return (
    <div className="flex h-full">
      {/* Left: watchlist */}
      <aside className="w-64 border-r border-[var(--border)] flex flex-col overflow-hidden shrink-0">
        <Watchlist />
      </aside>

      {/* Center: chart + info */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Quote bar */}
        <QuoteBar symbol={symbol} />

        {/* Main chart area */}
        <div className="flex-1 flex min-h-0">
          {/* Chart */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            <Card className="m-4 mb-0 rounded-xl overflow-hidden p-4">
              <PriceChart symbol={symbol} />
            </Card>

            {/* Market stats row */}
            <MarketStatsRow symbol={symbol} />
          </div>

          {/* Right: orderbook */}
          <div className="w-64 border-l border-[var(--border)] flex flex-col overflow-hidden shrink-0">
            <div className="flex-1 p-3 overflow-hidden flex flex-col">
              <OrderBook symbol={symbol} />
            </div>
          </div>
        </div>
      </div>

      {/* Right sidebar: trade + AI */}
      <aside className="w-72 border-l border-[var(--border)] flex flex-col overflow-hidden shrink-0">
        <div className="flex-1 flex flex-col gap-4 p-4 overflow-y-auto">
          <TradePanel symbol={symbol} />
          <AIPanel symbol={symbol} />
        </div>
      </aside>
    </div>
  );
}

function MarketStatsRow({ symbol }: { symbol: string }) {
  const { quotes } = useTradingStore();
  const quote = quotes[symbol];

  if (!quote) return null;

  const range = quote.high - quote.low;
  const rangePosition = range > 0 ? ((quote.price - quote.low) / range) * 100 : 50;

  return (
    <div className="mx-4 my-3 p-4 bg-[var(--surface)] border border-[var(--border)] rounded-xl">
      <div className="flex items-center gap-6 flex-wrap">
        <div>
          <div className="text-xs text-[var(--muted)] mb-1">24h Range</div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono number-red">{quote.low.toLocaleString()}</span>
            <div className="w-24 h-1.5 bg-[var(--surface-2)] rounded-full overflow-hidden">
              <div
                className="h-full bg-[var(--accent)] rounded-full"
                style={{ width: `${rangePosition}%` }}
              />
            </div>
            <span className="text-xs font-mono number-green">{quote.high.toLocaleString()}</span>
          </div>
        </div>

        <div className="h-8 w-px bg-[var(--border)]" />

        <div>
          <div className="text-xs text-[var(--muted)] mb-1">Asset</div>
          <div className="text-xs font-semibold capitalize">{quote.type}</div>
        </div>

        <div>
          <div className="text-xs text-[var(--muted)] mb-1">24h Volume</div>
          <div className="text-xs font-mono">
            {quote.volume >= 1e9
              ? `${(quote.volume / 1e9).toFixed(2)}B`
              : quote.volume >= 1e6
              ? `${(quote.volume / 1e6).toFixed(2)}M`
              : quote.volume.toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
}
