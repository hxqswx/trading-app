"use client";

import { usePortfolio } from "@/lib/hooks/use-portfolio";
import { Card } from "@/components/ui/card";
import { fmtCurrency, fmtPercent, colorClass } from "@/lib/utils";
import { TrendingUp, TrendingDown, DollarSign, Wallet } from "lucide-react";

export function PortfolioSummaryCards() {
  const { portfolio, loading } = usePortfolio();

  if (loading || !portfolio) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse h-24" />
        ))}
      </div>
    );
  }

  const stats = [
    {
      label: "Total Equity",
      value: fmtCurrency(portfolio.equity),
      sub:   null,
      icon:  <DollarSign size={16} />,
      color: "text-[var(--accent)]",
    },
    {
      label: "Cash",
      value: fmtCurrency(portfolio.cash),
      sub:   null,
      icon:  <Wallet size={16} />,
      color: "text-[var(--muted)]",
    },
    {
      label: "Day P&L",
      value: fmtCurrency(portfolio.dayPnl),
      sub:   fmtPercent(portfolio.dayPnlPct),
      icon:  portfolio.dayPnl >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />,
      color: colorClass(portfolio.dayPnl),
    },
    {
      label: "Total P&L",
      value: fmtCurrency(portfolio.totalPnl),
      sub:   null,
      icon:  portfolio.totalPnl >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />,
      color: colorClass(portfolio.totalPnl),
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map(({ label, value, sub, icon, color }) => (
        <Card key={label}>
          <div className={`flex items-center gap-2 mb-2 ${color}`}>
            {icon}
            <span className="text-xs text-[var(--muted)] uppercase tracking-wide">{label}</span>
          </div>
          <div className={`text-xl font-mono font-bold ${color}`}>{value}</div>
          {sub && <div className={`text-xs font-mono mt-0.5 ${color}`}>{sub}</div>}
        </Card>
      ))}
    </div>
  );
}
