"use client";

import { useRouter } from "next/navigation";
import { usePortfolio } from "@/lib/hooks/use-portfolio";
import { useTradingStore } from "@/lib/store";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { fmtCurrency, fmtPercent, colorClass } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export function PositionsTable() {
  const { portfolio, loading } = usePortfolio();
  const { setActiveSymbol }    = useTradingStore();
  const router = useRouter();

  function goToTrade(symbol: string) {
    setActiveSymbol(symbol);
    router.push(`/trade/${symbol}`);
  }

  return (
    <Card className="p-0 overflow-hidden">
      <CardHeader className="px-4 pt-4 pb-3 mb-0">
        <CardTitle>Open Positions</CardTitle>
        {!loading && (
          <span className="text-xs text-[var(--muted)]">
            {portfolio?.positions.length ?? 0} positions
          </span>
        )}
      </CardHeader>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-xs text-[var(--muted)] uppercase tracking-wide">
              {["Symbol", "Qty", "Avg Entry", "Current", "Market Value", "Unrealized P&L"].map((h) => (
                <th key={h} className="text-left px-4 py-3 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(4)].map((_, i) => (
                <tr key={i} className="border-b border-[var(--border)]">
                  {[...Array(6)].map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-3 w-20 bg-[var(--surface-2)] rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : portfolio?.positions.length ? (
              portfolio.positions.map((p) => (
                <tr
                  key={p.symbol}
                  onClick={() => goToTrade(p.symbol)}
                  className="border-b border-[var(--border)] hover:bg-[var(--surface-2)] cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{p.symbol.replace("USDT", "")}</span>
                      <Badge variant={p.type === "crypto" ? "purple" : "default"}>
                        {p.type}
                      </Badge>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono">{p.qty}</td>
                  <td className="px-4 py-3 font-mono">{fmtCurrency(p.avgEntryPrice, 2)}</td>
                  <td className="px-4 py-3 font-mono">{fmtCurrency(p.currentPrice, 2)}</td>
                  <td className="px-4 py-3 font-mono">{fmtCurrency(p.marketValue, 2)}</td>
                  <td className={`px-4 py-3 font-mono font-semibold ${colorClass(p.unrealizedPnl)}`}>
                    {fmtCurrency(p.unrealizedPnl, 2)}{" "}
                    <span className="text-xs">({fmtPercent(p.unrealizedPnlPct)})</span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-[var(--muted)] text-sm">
                  No open positions
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
