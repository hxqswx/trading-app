"use client";

/**
 * Real-time price simulator.
 *
 * On mount:
 *   1. Fetches live quotes from /api/quote for all assets (Yahoo Finance via cache)
 *   2. Seeds the Zustand store and the local price reference
 *
 * Every 800 ms:
 *   Applies a Gaussian random walk with mean-reversion around the real market price.
 *   This creates fluid tick-by-tick movement between API refreshes.
 *
 * Every 60 s:
 *   Re-fetches real quotes and snaps the random walk back to market reality,
 *   preventing excessive drift from the true price.
 *
 * Fallback:
 *   If the API fetch fails (e.g. rate-limited), the walk continues from the
 *   last known price using deterministic mock data as the initial seed.
 */
import { useEffect, useRef } from "react";
import { useTradingStore } from "@/lib/store";
import { ASSET_META, generateQuote, generateSparkline } from "@/lib/mock";
import { getAsset } from "@/lib/asset-registry";
import type { Quote } from "@/lib/types";

const TICK_MS   = 800;
const RESYNC_MS = 60_000;

function normalRandom(): number {
  const u1 = Math.max(Math.random(), 1e-10);
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * Math.random());
}

async function fetchRealQuotes(symbols: string[]): Promise<Quote[]> {
  try {
    const res = await fetch(`/api/quote?symbols=${symbols.join(",")}`, {
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json() as Quote[];
  } catch (err) {
    console.warn("[simulator] fetchRealQuotes failed, using mock seed:", err);
    return symbols.map((s) => generateQuote(s));
  }
}

/** All symbols to track = ASSET_META built-ins + any extra watchlist symbols */
function allSymbols(): string[] {
  const watchlist = useTradingStore.getState().watchlist.map((w) => w.symbol);
  return [...new Set([...Object.keys(ASSET_META), ...watchlist])];
}

export function useSimulator() {
  const { updateQuotes, addPriceHistory } = useTradingStore();
  const pricesRef  = useRef<Record<string, number>>({});
  const seededRef  = useRef(false);

  // ── Seed on mount ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (seededRef.current) return;
    seededRef.current = true;

    const symbols = allSymbols();

    (async () => {
      // Fetch real prices (falls back to mock internally)
      const quotes = await fetchRealQuotes(symbols);

      // Seed price references
      for (const q of quotes) {
        pricesRef.current[q.symbol] = q.price;
      }

      // Push to store
      updateQuotes(quotes);

      // Seed sparkline history from mock (deterministic, fast)
      symbols.forEach((symbol) => {
        generateSparkline(symbol).forEach((p) => addPriceHistory(symbol, p));
      });
    })();
  }, [updateQuotes, addPriceHistory]);

  // ── Gaussian random walk (800 ms ticks) ───────────────────────────────────
  useEffect(() => {
    const id = setInterval(() => {
      const prices = pricesRef.current;
      if (!Object.keys(prices).length) return;

      const snapQuotes = useTradingStore.getState().quotes;
      const updated: Quote[] = [];

      // Walk all tracked symbols: ASSET_META entries + any extra watchlist symbols
      const symbols = allSymbols();
      for (const symbol of symbols) {
        const prev = prices[symbol];
        if (prev == null) continue;

        const meta    = ASSET_META[symbol];
        const regEntry = !meta ? getAsset(symbol) : null;

        // Volatility and reversion parameters
        const volatility = meta?.volatility ?? 0.02;
        const basePrice  = meta?.basePrice  ?? prev;
        const σ          = volatility * 0.05;
        const reversion  = (basePrice - prev) / Math.max(basePrice, 0.0001) * 0.002;
        const next       = Math.max(prev * (1 + normalRandom() * σ + reversion), 0.0001);
        prices[symbol]   = next;

        const prevQ  = snapQuotes[symbol];
        const open   = prevQ?.open ?? next;
        const high   = prevQ ? Math.max(prevQ.high, next) : next;
        const low    = prevQ ? Math.min(prevQ.low,  next) : next;
        const change = next - open;

        // Determine type/currency from meta, registry, or existing quote
        const type     = meta?.type     ?? regEntry?.type     ?? prevQ?.type     ?? "stock";
        const currency = meta?.currency ?? regEntry?.currency ?? prevQ?.currency ?? "USD";

        updated.push({
          symbol,
          price:     next,
          open, high, low,
          volume:    prevQ?.volume ?? meta?.avgVolume ?? 1_000_000,
          change,
          changePct: open > 0 ? (change / open) * 100 : 0,
          timestamp: Date.now(),
          type,
          currency,
        });

        addPriceHistory(symbol, next);
      }

      if (updated.length) updateQuotes(updated);
    }, TICK_MS);

    return () => clearInterval(id);
  }, [updateQuotes, addPriceHistory]);

  // ── Periodic resync to real market prices (every 60 s) ───────────────────
  useEffect(() => {
    const id = setInterval(async () => {
      const symbols = allSymbols();
      const quotes  = await fetchRealQuotes(symbols);

      // Snap prices to real values (kills drift)
      for (const q of quotes) {
        pricesRef.current[q.symbol] = q.price;
        // Also update the ASSET_META basePrice used for mean-reversion
        // so the walk recenters on the new real price
        if (ASSET_META[q.symbol]) {
          (ASSET_META[q.symbol] as { basePrice: number }).basePrice = q.price;
        }
      }

      // Push fresh real quotes to the store immediately (price flash effect)
      updateQuotes(quotes);
    }, RESYNC_MS);

    return () => clearInterval(id);
  }, [updateQuotes]);
}
