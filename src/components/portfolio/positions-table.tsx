"use client";

import { useRouter } from "next/navigation";
import { usePortfolio } from "@/lib/hooks/use-portfolio";
import { useTradingStore } from "@/lib/store";
import { useT } from "@/lib/hooks/use-t";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { fmtPercent, colorClass } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { currencySymbol, ASSET_META } from "@/lib/mock";

export function PositionsTable() {
  const { portfolio, loading } = usePortfolio();
  const { setActiveSymbol, lang } = useTradingStore();
  const t = useT();
  const router = useRouter();

  function goToTrade(symbol: string) {
    setActiveSymbol(symbol);
    router.push(`/trade/${symbol}`);
  }

  return (
    <Card className="p-0 overflow-hidden">
      <CardHeader className="px-4 pt-4 pb-3 mb-0">
        <CardTitle>{t.portfolio.openPositions}</CardTitle>
        {!loading && (
          <span className="text-xs text-[var(--muted)]">
            {portfolio?.positions.length ?? 0} {t.portfolio.positions}
          </span>
        )}
      </CardHeader>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-xs text-[var(--muted)] uppercase tracking-wide">
              {[t.table.asset, t.table.qty, t.table.avgCost, t.table.current, t.table.value, t.table.pnl].map((h, i) => (
                <th key={i} className={`px-4 py-3 font-medium ${i === 0 ? "text-left" : "text-right"}`}>{h}</th>
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
              portfolio.positions.map((p) => {
                const meta      = ASSET_META[p.symbol];
                const sym       = currencySymbol(p.currency ?? "USD");
                const ticker    = p.symbol.replace("USDT","").replace(/^HK/,"");
                const name      = lang === "zh" && meta?.nameCN ? meta.nameCN : (meta?.name ?? p.symbol);
                const badgeV    = p.type === "crypto" ? "purple" : p.type === "hk" ? "yellow" : "default";
                const badgeL    = p.type === "crypto" ? t.badge.crypto : p.type === "hk" ? t.badge.hk : t.badge.stock;

                return (
                  <tr
                    key={p.symbol}
                    onClick={() => goToTrade(p.symbol)}
                    className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface-2)] cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                          p.type === "crypto" ? "bg-[rgba(188,140,255,0.12)] text-[var(--purple)]"
                          : p.type === "hk"   ? "bg-[rgba(255,160,0,0.12)] text-[var(--yellow)]"
                          : "bg-[rgba(88,166,255,0.12)] text-[var(--accent)]"
                        }`}>
                          {ticker.slice(0,2)}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold">{ticker}</span>
                            <Badge variant={badgeV}>{badgeL}</Badge>
                          </div>
                          <div className="text-xs text-[var(--muted)]">{name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-right">{p.qty}</td>
                    <td className="px-4 py-3 font-mono text-right">{sym}{p.avgEntryPrice.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})}</td>
                    <td className="px-4 py-3 font-mono text-right">{sym}{p.currentPrice.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})}</td>
                    <td className="px-4 py-3 font-mono text-right">{sym}{p.marketValue.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})}</td>
                    <td className={`px-4 py-3 font-mono font-semibold text-right ${colorClass(p.unrealizedPnl)}`}>
                      {p.unrealizedPnl >= 0 ? "+" : ""}{sym}{Math.abs(p.unrealizedPnl).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})}{" "}
                      <span className="text-xs">({fmtPercent(p.unrealizedPnlPct)})</span>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-[var(--muted)] text-sm">
                  {t.portfolio.noPositions}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
