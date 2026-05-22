import { useEffect, useRef, useCallback, useMemo } from "react";
import { AppState, AppStateStatus } from "react-native";
import { useTradingStore } from "../store";
import { fetchQuotes } from "../api";

const POLL_INTERVAL = 15_000; // 15 s

/**
 * Polls quotes for the current watchlist and pushes them into the store.
 * Call once at the app root (e.g. in the tabs layout DataBootstrap).
 */
export function useQuotePoller() {
  const watchlist    = useTradingStore((s) => s.watchlist);
  const marketLists  = useTradingStore((s) => s.marketLists);
  const updateQuotes = useTradingStore((s) => s.updateQuotes);
  const timerRef     = useRef<ReturnType<typeof setInterval> | null>(null);

  // Merge watchlist + all market list symbols, deduped.
  const allSymbols = useMemo(() => {
    const set = new Set<string>();
    watchlist.forEach((w) => set.add(w.symbol));
    Object.values(marketLists).forEach((list) =>
      list.forEach((w) => set.add(w.symbol))
    );
    return Array.from(set);
  }, [watchlist, marketLists]);

  const symbolsRef = useRef(allSymbols);
  symbolsRef.current = allSymbols;

  const poll = useCallback(async () => {
    if (symbolsRef.current.length === 0) return;
    try {
      const quotes = await fetchQuotes(symbolsRef.current);
      updateQuotes(quotes);
    } catch (e) {
      console.warn("useQuotePoller error:", e);
    }
  }, [updateQuotes]); // updateQuotes is a stable store function reference

  useEffect(() => {
    poll();
    timerRef.current = setInterval(poll, POLL_INTERVAL);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [poll]);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (state: AppStateStatus) => {
      if (state === "active") poll();
    });
    return () => sub.remove();
  }, [poll]);
}

/** Returns the quote for a single symbol. */
export function useQuote(symbol: string) {
  return useTradingStore((s) => s.quotes[symbol] ?? null);
}

/**
 * Returns all quotes as a stable array.
 * Uses useMemo so a new array is NOT created on every render —
 * this prevents the useSyncExternalStore infinite-loop bug in Zustand v5.
 */
export function useAllQuotes() {
  // s.quotes is a stable object reference; only changes when updateQuotes() fires.
  const quotes = useTradingStore((s) => s.quotes);
  return useMemo(() => Object.values(quotes), [quotes]);
}
