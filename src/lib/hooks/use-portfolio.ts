"use client";

import { useEffect } from "react";
import { useTradingStore } from "@/lib/store";

/**
 * Reads the shared portfolio from the Zustand store and keeps it fresh.
 * Any component can call usePortfolio() — they all read the same state.
 * When TradePanel calls fetchPortfolio() after a trade, every consumer
 * (dashboard, portfolio page, trade panel) updates instantly.
 */
export function usePortfolio() {
  const portfolio        = useTradingStore((s) => s.portfolio);
  const portfolioLoading = useTradingStore((s) => s.portfolioLoading);
  const fetchPortfolio   = useTradingStore((s) => s.fetchPortfolio);

  useEffect(() => {
    // Initial load + periodic refresh every 30 s
    fetchPortfolio();
    const id = setInterval(fetchPortfolio, 30_000);
    return () => clearInterval(id);
  // fetchPortfolio is a stable Zustand action — safe to omit from deps
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { portfolio, loading: portfolioLoading, error: null, refetch: fetchPortfolio };
}
