"use client";

import { useEffect, useState, useCallback } from "react";
import type { OrderBook as OB } from "@/lib/types";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { useT } from "@/lib/hooks/use-t";
import { currencySymbol, ASSET_META } from "@/lib/mock";

interface OrderBookProps { symbol: string }

export function OrderBook({ symbol }: OrderBookProps) {
  const [book, setBook]       = useState<OB | null>(null);
  const [loading, setLoading] = useState(true);
  const t   = useT();
  const sym = currencySymbol(ASSET_META[symbol]?.currency ?? "USD");

  const fetchBook = useCallback(async () => {
    try {
      const res  = await fetch(`/api/orderbook?symbol=${symbol}&depth=16`);
      const data = await res.json() as OB;
      setBook(data);
      setLoading(false);
    } catch { setLoading(false); }
  }, [symbol]);

  useEffect(() => {
    setLoading(true);
    fetchBook();
    const id = setInterval(fetchBook, 1500);
    return () => clearInterval(id);
  }, [fetchBook]);

  const maxBidTotal = book?.bids[book.bids.length - 1]?.total ?? 1;
  const maxAskTotal = book?.asks[book.asks.length - 1]?.total ?? 1;

  return (
    <Card className="p-0 overflow-hidden flex flex-col h-full">
      <CardHeader className="px-4 pt-4 pb-3 mb-0">
        <CardTitle>{t.orderbook.title}</CardTitle>
        <span className="text-xs text-[var(--muted)]">{symbol.replace("USDT","").replace(/^(HK|CN)/,"")}</span>
      </CardHeader>

      <div className="grid grid-cols-3 px-4 pb-2 text-[10px] text-[var(--muted)] uppercase tracking-wide shrink-0">
        <span>{t.orderbook.price}</span>
        <span className="text-right">{t.orderbook.size}</span>
        <span className="text-right">{t.orderbook.total}</span>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center text-xs text-[var(--muted)] animate-pulse">
          {t.loading}
        </div>
      ) : (
        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          {/* Asks (reversed) */}
          <div className="flex-1 overflow-y-auto flex flex-col-reverse px-4 gap-0.5">
            {(book?.asks ?? []).slice(0, 12).map((level, i) => (
              <div key={i} className="relative grid grid-cols-3 text-xs font-mono py-0.5">
                <div className="absolute inset-y-0 right-0 bg-[rgba(248,81,73,0.08)]" style={{ width: `${((level.total ?? 0) / maxAskTotal) * 100}%` }} />
                <span className="number-red relative z-10">{sym}{level.price.toFixed(2)}</span>
                <span className="text-right relative z-10">{level.size.toFixed(4)}</span>
                <span className="text-right text-[var(--muted)] relative z-10">{(level.total ?? 0).toFixed(2)}</span>
              </div>
            ))}
          </div>

          {/* Spread */}
          {book && book.bids.length > 0 && book.asks.length > 0 && (
            <div className="px-4 py-1.5 border-y border-[var(--border)] flex items-center justify-between shrink-0">
              <span className="text-xs text-[var(--muted)]">{t.orderbook.spread}</span>
              <span className="text-xs font-mono">
                {(book.asks[0].price - book.bids[0].price).toFixed(4)}
                <span className="text-[var(--muted)] ml-1">
                  ({((book.asks[0].price - book.bids[0].price) / book.asks[0].price * 100).toFixed(3)}%)
                </span>
              </span>
            </div>
          )}

          {/* Bids */}
          <div className="flex-1 overflow-y-auto px-4 gap-0.5 flex flex-col">
            {(book?.bids ?? []).slice(0, 12).map((level, i) => (
              <div key={i} className="relative grid grid-cols-3 text-xs font-mono py-0.5">
                <div className="absolute inset-y-0 right-0 bg-[rgba(63,185,80,0.08)]" style={{ width: `${((level.total ?? 0) / maxBidTotal) * 100}%` }} />
                <span className="number-green relative z-10">{sym}{level.price.toFixed(2)}</span>
                <span className="text-right relative z-10">{level.size.toFixed(4)}</span>
                <span className="text-right text-[var(--muted)] relative z-10">{(level.total ?? 0).toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
