"use client";

/**
 * Real-time Alpaca trade stream hook.
 *
 * Connects to /api/alpaca-stream (SSE proxy) and updates the Zustand store
 * with live trade prices for US stocks in the watchlist.
 *
 * On disconnect/error, EventSource automatically reconnects (built-in browser behaviour).
 * This hook runs alongside use-simulator.ts — Alpaca prices override the random walk
 * for US stocks whenever the market is open and streaming data is available.
 */

import { useEffect, useRef } from "react";
import { useTradingStore } from "@/lib/store";
import { ASSET_CATALOG } from "@/lib/asset-registry";
import { ASSET_META } from "@/lib/mock";
import type { Quote } from "@/lib/types";

/** US-market symbols available on Alpaca */
const US_MARKET_SET = new Set(
  ASSET_CATALOG.filter((a) => a.market === "US").map((a) => a.symbol)
);

/** Returns the US-stock symbols currently in the watchlist */
function usStocksInWatchlist(): string[] {
  return useTradingStore.getState().watchlist
    .map((w) => w.symbol)
    .filter((s) => US_MARKET_SET.has(s));
}

interface AlpacaTradeEvent {
  symbol:    string;
  price:     number;
  size:      number;
  timestamp: string;
}

export function useAlpacaStream() {
  const { updateQuotes, addPriceHistory } = useTradingStore();
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const symbols = usStocksInWatchlist();
    if (!symbols.length) return;

    const url = `/api/alpaca-stream?symbols=${symbols.join(",")}`;

    // Close any previous connection before opening a new one
    esRef.current?.close();

    const es = new EventSource(url);
    esRef.current = es;

    es.onmessage = (event: MessageEvent<string>) => {
      try {
        const { symbol, price, timestamp } = JSON.parse(event.data) as AlpacaTradeEvent;
        if (!symbol || !price) return;

        const prevQ    = useTradingStore.getState().quotes[symbol];
        const meta     = ASSET_META[symbol];
        const open     = prevQ?.open ?? price;
        const high     = prevQ ? Math.max(prevQ.high, price) : price;
        const low      = prevQ ? Math.min(prevQ.low,  price) : price;
        const change   = price - open;
        const changePct = open > 0 ? (change / open) * 100 : 0;

        const quote: Quote = {
          symbol,
          price,
          open, high, low,
          volume:    prevQ?.volume ?? meta?.avgVolume ?? 0,
          change,
          changePct,
          timestamp: timestamp ? new Date(timestamp).getTime() : Date.now(),
          type:      "stock",
          currency:  "USD",
        };

        updateQuotes([quote]);
        addPriceHistory(symbol, price);
      } catch {
        // Ignore malformed messages
      }
    };

    es.onerror = () => {
      // EventSource reconnects automatically — just log the hiccup
      console.warn("[alpaca-stream] SSE connection interrupted, reconnecting…");
    };

    return () => {
      es.close();
      esRef.current = null;
    };
    // Run once on mount; the watchlist rarely changes during a session
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updateQuotes, addPriceHistory]);
}
