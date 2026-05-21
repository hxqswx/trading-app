import { useEffect, useCallback, useRef } from "react";
import { AppState, AppStateStatus } from "react-native";
import { useTradingStore } from "../store";
import { fetchPortfolio } from "../api";

const POLL_INTERVAL = 30_000; // 30 s

export function usePortfolio() {
  const token           = useTradingStore((s) => s.token);
  const portfolio       = useTradingStore((s) => s.portfolio);
  const loading         = useTradingStore((s) => s.portfolioLoading);
  const setPortfolio    = useTradingStore((s) => s.setPortfolio);
  const setLoading      = useTradingStore((s) => s.setPortfolioLoading);
  const timerRef        = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      if (!portfolio) setLoading(true);
      const data = await fetchPortfolio();
      setPortfolio(data);
    } catch (e) {
      console.warn("usePortfolio error:", e);
    } finally {
      setLoading(false);
    }
  }, [token, portfolio, setPortfolio, setLoading]);

  // Load on mount / when token changes
  useEffect(() => {
    if (!token) {
      setPortfolio(null);
      return;
    }
    load();
    timerRef.current = setInterval(load, POLL_INTERVAL);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  // Refresh when app comes back to foreground
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state: AppStateStatus) => {
      if (state === "active") load();
    });
    return () => sub.remove();
  }, [load]);

  return { portfolio, loading, refresh: load };
}
