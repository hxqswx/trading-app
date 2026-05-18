"use client";

import { useEffect, useRef } from "react";
import { useTradingStore } from "@/lib/store";
import type { Quote } from "@/lib/types";

/** Polls all watchlist quotes every 5 seconds via REST.
 *  Upgrades to Binance WebSocket for crypto tickers when available.
 */
export function useQuotes() {
  const { watchlist, updateQuotes } = useTradingStore();
  const wsRef = useRef<WebSocket | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // REST polling for all assets
  useEffect(() => {
    async function poll() {
      const symbols = watchlist.map((w) => w.symbol).join(",");
      if (!symbols) return;
      try {
        const res = await fetch(`/api/quote?symbols=${symbols}`);
        if (!res.ok) return;
        const quotes = await res.json() as Quote[];
        if (Array.isArray(quotes)) updateQuotes(quotes);
      } catch { /* ignore */ }
    }

    poll();
    pollRef.current = setInterval(poll, 5000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [watchlist, updateQuotes]);

  // Binance WebSocket for real-time crypto mini-tickers
  useEffect(() => {
    const cryptos = watchlist
      .filter((w) => w.type === "crypto")
      .map((w) => w.symbol.toLowerCase());

    if (!cryptos.length) return;

    const streams = cryptos.map((s) => `${s}@miniTicker`).join("/");
    const ws = new WebSocket(`wss://stream.binance.com:9443/stream?streams=${streams}`);
    wsRef.current = ws;

    ws.onmessage = (evt) => {
      try {
        const msg = JSON.parse(evt.data as string) as {
          data: { s: string; c: string; o: string; h: string; l: string; v: string };
        };
        const d = msg.data;
        const price = parseFloat(d.c);
        const open  = parseFloat(d.o);
        const change = price - open;

        const q: Quote = {
          symbol:    d.s,
          price,
          open,
          high:      parseFloat(d.h),
          low:       parseFloat(d.l),
          volume:    parseFloat(d.v),
          change,
          changePct: (change / open) * 100,
          timestamp: Date.now(),
          type:      "crypto",
        };
        updateQuotes([q]);
      } catch { /* ignore */ }
    };

    return () => {
      ws.close();
    };
  }, [watchlist, updateQuotes]);
}
