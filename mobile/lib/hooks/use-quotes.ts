import { useEffect, useRef, useCallback } from "react";
import { AppState, AppStateStatus } from "react-native";
import { useTradingStore } from "../store";
import { fetchQuotes } from "../api";

const POLL_INTERVAL = 15_000; // 15 s

/**
 * Polls quotes for the current watchlist and pushes them into the store.
 * Call once at the app root (e.g. in the tabs layout).
 */
export function useQuotePoller() {
  const watchlist    = useTradingStore((s) => s.watchlist);
  const updateQuotes = useTradingStore((s) => s.updateQuotes);
  const timerRef     = useRef<ReturnType<typeof setInterval> | null>(null);

  const poll = useCallback(async () => {
    if (watchlist.length === 0) return;
    try {
      const symbols = watchlist.map((w) => w.symbol);
      const quotes  = await fetchQuotes(symbols);
      updateQuotes(quotes);
    } catch (e) {
      console.warn("useQuotePoller error:", e);
    }
  }, [watchlist, updateQuotes]);

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

/** Returns all quotes as an array. */
export function useAllQuotes() {
  return useTradingStore((s) => Object.values(s.quotes));
}
