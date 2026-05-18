"use client";

import { usePortfolio } from "@/lib/hooks/use-portfolio";
import { useT } from "@/lib/hooks/use-t";
import { PortfolioSummaryCards } from "@/components/portfolio/portfolio-summary";
import { PositionsTable } from "@/components/portfolio/positions-table";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { fmtCurrency, colorClass, fmtPercent } from "@/lib/utils";

export default function PortfolioPage() {
  const t = useT();
  return (
    <div className="p-6 flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold">{t.portfolio.title}</h1>
        <p className="text-sm text-[var(--muted)] mt-0.5">{t.portfolio.subtitle}</p>
      </div>

      <PortfolioSummaryCards />
      <AllocationChart />
      <PositionsTable />
    </div>
  );
}

function AllocationChart() {
  const { portfolio, loading } = usePortfolio();
  const t = useT();

  if (loading || !portfolio) {
    return <Card className="h-48 animate-pulse" />;
  }

  const total = portfolio.positions.reduce((s, p) => s + p.marketValue, 0) + portfolio.cash;
  const items = [
    ...portfolio.positions.map((p) => ({
      label:  p.symbol.replace("USDT","").replace(/^HK/,""),
      value:  p.marketValue,
      pct:    (p.marketValue / total) * 100,
      type:   p.type,
      pnl:    p.unrealizedPnlPct,
    })),
    { label: t.portfolio.cash, value: portfolio.cash, pct: (portfolio.cash / total) * 100, type: "cash" as const, pnl: 0 },
  ].sort((a, b) => b.value - a.value);

  const colors = [
    "var(--accent)", "var(--purple)", "var(--green)", "var(--yellow)",
    "var(--red)", "var(--muted)", "#e8912d", "#4fc3f7",
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.portfolio.allocation}</CardTitle>
        <span className="text-xs text-[var(--muted)]">{t.portfolio.total}: {fmtCurrency(total)}</span>
      </CardHeader>

      <div className="flex gap-6 items-center">
        <div className="flex-1 h-6 flex rounded-full overflow-hidden gap-px">
          {items.map((item, i) => (
            <div
              key={item.label}
              title={`${item.label}: ${item.pct.toFixed(1)}%`}
              style={{ width: `${item.pct}%`, backgroundColor: colors[i % colors.length] }}
            />
          ))}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {items.map((item, i) => (
          <div key={item.label} className="flex items-center gap-2 min-w-0">
            <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: colors[i % colors.length] }} />
            <div className="min-w-0">
              <div className="text-xs font-semibold truncate">{item.label}</div>
              <div className="text-xs text-[var(--muted)]">
                {item.pct.toFixed(1)}%
                {item.type !== "cash" && (
                  <span className={`ml-1 ${colorClass(item.pnl)}`}>{fmtPercent(item.pnl)}</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
