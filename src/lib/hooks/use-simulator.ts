"use client";

import { useEffect, useRef } from "react";
import { useTradingStore } from "@/lib/store";
import { ASSET_META, generateQuote } from "@/lib/mock";
import type { Quote } from "@/lib/types";

const TICK_MS = 800; // update every 800ms

function normalRandom(): number {
  const u1 = Math.max(Math.random(), 1e-10);
  const u2 = Math.random();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

/** Client-side price simulation. Maintains a random walk from the initial mock prices. */
export function useSimulator() {
  const { quotes, updateQuotes, addPriceHistory } = useTradingStore();
  const pricesRef = useRef<Record<string, number>>({});

  // Seed initial prices from mock data on mount
  useEffect(() => {
    const symbols = Object.keys(ASSET_META);
    const initial = symbols.map((symbol) => {
      const q = generateQuote(symbol);
      pricesRef.current[symbol] = q.price;
      return q;
    });
    updateQuotes(initial);
    // seed sparkline history
    symbols.forEach((symbol) => {
      // Pre-fill 24 history points from mock candles
      const { generateSparkline } = require("@/lib/mock") as { generateSparkline: (s: string) => number[] };
      generateSparkline(symbol).forEach((p) => addPriceHistory(symbol, p));
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Tick loop
  useEffect(() => {
    if (Object.keys(pricesRef.current).length === 0) return;

    const id = setInterval(() => {
      const updated: Quote[] = [];
      for (const [symbol, meta] of Object.entries(ASSET_META)) {
        const prev = pricesRef.current[symbol];
        if (!prev) continue;

        // Gaussian random walk
        const σ = meta.volatility * 0.05; // per-tick σ (fraction of daily vol)
        const drift = normalRandom() * σ;
        // Mean-reversion towards basePrice so price doesn't wander too far
        const reversion = (meta.basePrice - prev) / meta.basePrice * 0.002;
        const next = prev * (1 + drift + reversion);
        pricesRef.current[symbol] = next;

        const prevQuote = quotes[symbol];
        const open      = prevQuote?.open ?? next;
        const high      = prevQuote ? Math.max(prevQuote.high, next) : next;
        const low       = prevQuote ? Math.min(prevQuote.low, next)  : next;
        const change    = next - open;

        updated.push({
          symbol,
          price:     next,
          open,
          high,
          low,
          volume:    prevQuote?.volume ?? meta.avgVolume,
          change,
          changePct: (change / open) * 100,
          timestamp: Date.now(),
          type:      meta.type,
        });

        addPriceHistory(symbol, next);
      }
      if (updated.length) updateQuotes(updated);
    }, TICK_MS);

    return () => clearInterval(id);
  }, [quotes, updateQuotes, addPriceHistory]);
}
