import { useEffect, useCallback, useRef } from "react";
import { AppState, AppStateStatus } from "react-native";
import { useAuth } from "@clerk/clerk-expo";
import { useTradingStore } from "../store";
import { fetchPortfolio } from "../api";

const POLL_INTERVAL = 30_000; // 30 s

export function usePortfolio() {
  const { isSignedIn } = useAuth();
  const portfolio    = useTradingStore((s) => s.portfolio);
  const loading      = useTradingStore((s) => s.portfolioLoading);
  const setPortfolio = useTradingStore((s) => s.setPortfolio);
  const setLoading   = useTradingStore((s) => s.setPortfolioLoading);
  const timerRef     = useRef<ReturnType<typeof setInterval> | null>(null);

  // Keep ref so load() always has the latest values WITHOUT listing them
  // as useCallback deps — prevents load from being recreated on every fetch.
  const portfolioRef = useRef(portfolio);
  portfolioRef.current = portfolio;

  const load = useCallback(async () => {
    if (!isSignedIn) return;
    try {
      if (!portfolioRef.current) setLoading(true);
      const data = await fetchPortfolio();
      setPortfolio(data);
    } catch (e) {
      console.warn("usePortfolio error:", e);
    } finally {
      setLoading(false);
    }
  }, [isSignedIn, setPortfolio, setLoading]);

  // Load on mount / when auth state changes
  useEffect(() => {
    if (!isSignedIn) {
      setPortfolio(null);
      return;
    }
    load();
    timerRef.current = setInterval(load, POLL_INTERVAL);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isSignedIn, load]);

  // Refresh when app comes back to foreground
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state: AppStateStatus) => {
      if (state === "active") load();
    });
    return () => sub.remove();
  }, [load]);

  return { portfolio, loading, refresh: load };
}
