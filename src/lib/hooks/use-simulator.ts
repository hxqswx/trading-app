"use client";

import { useEffect, useRef } from "react";
import { useTradingStore } from "@/lib/store";
import { ASSET_META, generateQuote, generateSparkline } from "@/lib/mock";
import type { Quote } from "@/lib/types";

const TICK_MS = 800;

function normalRandom(): number {
  const u1 = Math.max(Math.random(), 1e-10);
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * Math.random());
}

export function useSimulator() {
  const { updateQuotes, addPriceHistory } = useTradingStore();
  const pricesRef = useRef<Record<string, number>>({});
  const seededRef = useRef(false);

  // Seed initial prices + sparkline history once
  useEffect(() => {
    if (seededRef.current) return;
    seededRef.current = true;

    const symbols  = Object.keys(ASSET_META);
    const initial: Quote[] = symbols.map((symbol) => {
      const q = generateQuote(symbol);
      pricesRef.current[symbol] = q.price;
      return q;
    });
    updateQuotes(initial);

    symbols.forEach((symbol) => {
      generateSparkline(symbol).forEach((p) => addPriceHistory(symbol, p));
    });
  }, [updateQuotes, addPriceHistory]);

  // Tick every 800ms — Gaussian random walk with mean-reversion
  useEffect(() => {
    const id = setInterval(() => {
      if (!Object.keys(pricesRef.current).length) return;

      const updated: Quote[] = [];
      const snapQuotes = useTradingStore.getState().quotes;

      for (const [symbol, meta] of Object.entries(ASSET_META)) {
        const prev = pricesRef.current[symbol];
        if (!prev) continue;

        const σ         = meta.volatility * 0.05;
        const reversion = (meta.basePrice - prev) / meta.basePrice * 0.002;
        const next      = prev * (1 + normalRandom() * σ + reversion);
        pricesRef.current[symbol] = next;

        const prevQ  = snapQuotes[symbol];
        const open   = prevQ?.open ?? next;
        const high   = prevQ ? Math.max(prevQ.high, next) : next;
        const low    = prevQ ? Math.min(prevQ.low,  next) : next;
        const change = next - open;

        updated.push({
          symbol,
          price:    next,
          open, high, low,
          volume:    prevQ?.volume ?? meta.avgVolume,
          change,
          changePct: (change / open) * 100,
          timestamp: Date.now(),
          type:      meta.type,
          currency:  meta.currency,
        });

        addPriceHistory(symbol, next);
      }

      if (updated.length) updateQuotes(updated);
    }, TICK_MS);

    return () => clearInterval(id);
  }, [updateQuotes, addPriceHistory]);
}
