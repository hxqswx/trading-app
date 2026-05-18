"use client";

import { useEffect, useState } from "react";
import type { PortfolioSummary } from "@/lib/types";

export function usePortfolio() {
  const [portfolio, setPortfolio] = useState<PortfolioSummary | null>(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res  = await fetch("/api/portfolio");
        const data = await res.json() as PortfolioSummary;
        setPortfolio(data);
      } catch (e) {
        setError(String(e));
      } finally {
        setLoading(false);
      }
    }

    load();
    const id = setInterval(load, 30_000); // refresh every 30s
    return () => clearInterval(id);
  }, []);

  return { portfolio, loading, error };
}
