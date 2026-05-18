"use client";

import { useRouter } from "next/navigation";
import { useTradingStore } from "@/lib/store";
import { fmtCurrency, fmtPercent, colorClass } from "@/lib/utils";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";

export function Watchlist() {
  const { watchlist, quotes, activeSymbol, setActiveSymbol } = useTradingStore();
  const router = useRouter();

  function handleSelect(symbol: string) {
    setActiveSymbol(symbol);
    router.push(`/trade/${symbol}`);
  }

  return (
    <Card className="flex flex-col h-full p-0 overflow-hidden">
      <CardHeader className="px-4 pt-4 pb-3 mb-0">
        <CardTitle>Watchlist</CardTitle>
      </CardHeader>

      <div className="flex-1 overflow-y-auto">
        {watchlist.map((item) => {
          const quote = quotes[item.symbol];
          const up    = (quote?.changePct ?? 0) >= 0;

          return (
            <button
              key={item.symbol}
              onClick={() => handleSelect(item.symbol)}
              className={`w-full flex items-center justify-between px-4 py-3 hover:bg-[var(--surface-2)] transition-colors text-left border-b border-[var(--border)] last:border-0 ${
                activeSymbol === item.symbol ? "bg-[var(--surface-2)]" : ""
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                  item.type === "crypto"
                    ? "bg-[rgba(188,140,255,0.15)] text-[var(--purple)]"
                    : "bg-[rgba(88,166,255,0.15)] text-[var(--accent)]"
                }`}>
                  {item.symbol.slice(0, 2)}
                </div>
                <div>
                  <div className="text-sm font-semibold leading-none mb-0.5">{item.symbol.replace("USDT", "")}</div>
                  <div className="text-xs text-[var(--muted)]">{item.name}</div>
                </div>
              </div>

              {quote ? (
                <div className="text-right">
                  <div className="text-sm font-mono font-semibold">
                    {fmtCurrency(quote.price, quote.price < 1 ? 4 : 2)}
                  </div>
                  <div className={`text-xs font-mono flex items-center justify-end gap-0.5 ${colorClass(quote.changePct)}`}>
                    {up ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                    {fmtPercent(quote.changePct)}
                  </div>
                </div>
              ) : (
                <div className="text-xs text-[var(--muted)] animate-pulse">Loading…</div>
              )}
            </button>
          );
        })}
      </div>
    </Card>
  );
}
