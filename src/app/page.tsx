"use client";

import { usePortfolio } from "@/lib/hooks/use-portfolio";
import { useTradingStore } from "@/lib/store";
import { Watchlist } from "@/components/watchlist/watchlist";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { fmtCurrency, fmtPercent, colorClass } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { TrendingUp, TrendingDown, DollarSign, Wallet, BarChart2, ArrowRight } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="flex h-full min-h-0">
      <div className="flex-1 flex flex-col gap-5 p-5 overflow-y-auto min-w-0">
        <Greeting />
        <SummaryCards />
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          <div className="xl:col-span-2">
            <PositionsTable />
          </div>
          <div>
            <TopMovers />
          </div>
        </div>
      </div>
      <aside className="w-72 border-l border-[var(--border)] shrink-0 hidden lg:block">
        <Watchlist />
      </aside>
    </div>
  );
}

function Greeting() {
  const { portfolio } = usePortfolio();
  const up = (portfolio?.dayPnlPct ?? 0) >= 0;
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-lg font-bold">Good morning 👋</h1>
        <p className="text-sm text-[var(--muted)] mt-0.5">Your portfolio is looking great today.</p>
      </div>
      {portfolio && (
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
          up ? "bg-[rgba(63,185,80,0.1)] text-[var(--green)]" : "bg-[rgba(248,81,73,0.1)] text-[var(--red)]"
        }`}>
          {up ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          {fmtPercent(portfolio.dayPnlPct)} today
        </div>
      )}
    </div>
  );
}

function SummaryCards() {
  const { portfolio, loading } = usePortfolio();

  const stats = [
    { label: "Total Equity",  icon: DollarSign, value: portfolio?.equity,    color: "text-[var(--accent)]",  bg: "bg-[rgba(88,166,255,0.08)]" },
    { label: "Cash Available",icon: Wallet,      value: portfolio?.cash,      color: "text-[var(--muted)]",   bg: "bg-[var(--surface-2)]" },
    { label: "Day P&L",       icon: TrendingUp,  value: portfolio?.dayPnl,    color: colorClass(portfolio?.dayPnl ?? 0),  bg: "bg-[var(--surface-2)]", pct: portfolio?.dayPnlPct },
    { label: "Total P&L",     icon: BarChart2,   value: portfolio?.totalPnl,  color: colorClass(portfolio?.totalPnl ?? 0), bg: "bg-[var(--surface-2)]" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map(({ label, icon: Icon, value, color, bg, pct }) => (
        <Card key={label} className={`relative overflow-hidden ${bg}`}>
          <div className="flex items-center gap-2 mb-3">
            <Icon size={14} className={color} />
            <span className="text-xs text-[var(--muted)] font-medium">{label}</span>
          </div>
          {loading || value === undefined ? (
            <div className="h-6 w-28 bg-[var(--surface-2)] rounded animate-pulse" />
          ) : (
            <>
              <div className={`text-xl font-mono font-bold ${color}`}>{fmtCurrency(value)}</div>
              {pct !== undefined && (
                <div className={`text-xs font-mono mt-0.5 ${color}`}>{fmtPercent(pct)}</div>
              )}
            </>
          )}
        </Card>
      ))}
    </div>
  );
}

function PositionsTable() {
  const { portfolio, loading } = usePortfolio();
  const { setActiveSymbol, quotes } = useTradingStore();
  const router = useRouter();

  function goTo(symbol: string) {
    setActiveSymbol(symbol);
    router.push(`/trade/${symbol}`);
  }

  return (
    <Card className="p-0 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
        <h2 className="text-sm font-semibold">Open Positions</h2>
        <span className="text-xs text-[var(--muted)]">{portfolio?.positions.length ?? 0} positions</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[10px] uppercase tracking-wider text-[var(--muted)] border-b border-[var(--border)]">
              {["Asset","Qty","Avg Cost","Current","Value","P&L",""].map((h, i) => (
                <th key={i} className={`px-5 py-3 font-medium ${i === 0 ? "text-left" : "text-right"}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i} className="border-b border-[var(--border)]">
                  {[...Array(7)].map((_, j) => (
                    <td key={j} className="px-5 py-4"><div className="h-3 w-16 bg-[var(--surface-2)] rounded animate-pulse" /></td>
                  ))}
                </tr>
              ))
            ) : portfolio?.positions.map((p) => {
              const livePrice = quotes[p.symbol]?.price ?? p.currentPrice;
              const livePnl   = (livePrice - p.avgEntryPrice) * p.qty;
              const livePct   = ((livePrice - p.avgEntryPrice) / p.avgEntryPrice) * 100;
              return (
                <tr key={p.symbol} onClick={() => goTo(p.symbol)}
                  className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface-2)] cursor-pointer transition-colors group"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                        p.type === "crypto" ? "bg-[rgba(188,140,255,0.12)] text-[var(--purple)]" : "bg-[rgba(88,166,255,0.12)] text-[var(--accent)]"
                      }`}>
                        {p.symbol.replace("USDT","").slice(0,2)}
                      </div>
                      <div>
                        <div className="font-semibold">{p.symbol.replace("USDT","")}</div>
                        <Badge variant={p.type === "crypto" ? "purple" : "default"} className="mt-0.5">{p.type}</Badge>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-right font-mono text-[var(--muted)]">{p.qty}</td>
                  <td className="px-5 py-4 text-right font-mono text-[var(--muted)]">{fmtCurrency(p.avgEntryPrice)}</td>
                  <td className="px-5 py-4 text-right font-mono font-semibold">{fmtCurrency(livePrice)}</td>
                  <td className="px-5 py-4 text-right font-mono">{fmtCurrency(livePrice * p.qty)}</td>
                  <td className={`px-5 py-4 text-right font-mono font-semibold ${colorClass(livePnl)}`}>
                    <div>{fmtCurrency(livePnl)}</div>
                    <div className="text-xs">{fmtPercent(livePct)}</div>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <ArrowRight size={14} className="text-[var(--muted)] ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function TopMovers() {
  const { quotes } = useTradingStore();
  const { setActiveSymbol } = useTradingStore();
  const router = useRouter();

  const sorted = Object.values(quotes).sort((a, b) => Math.abs(b.changePct) - Math.abs(a.changePct)).slice(0, 5);

  function goTo(symbol: string) {
    setActiveSymbol(symbol);
    router.push(`/trade/${symbol}`);
  }

  return (
    <Card className="p-0 overflow-hidden h-full">
      <div className="px-5 py-4 border-b border-[var(--border)]">
        <h2 className="text-sm font-semibold">Top Movers</h2>
      </div>
      <div className="flex flex-col">
        {sorted.length === 0
          ? [...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-3.5 border-b border-[var(--border)] last:border-0">
                <div className="h-8 w-8 rounded-lg bg-[var(--surface-2)] animate-pulse" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-16 bg-[var(--surface-2)] rounded animate-pulse" />
                  <div className="h-2.5 w-24 bg-[var(--surface-2)] rounded animate-pulse" />
                </div>
              </div>
            ))
          : sorted.map((q) => {
              const up = q.changePct >= 0;
              return (
                <button key={q.symbol} onClick={() => goTo(q.symbol)}
                  className="flex items-center gap-3 px-5 py-3.5 border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface-2)] transition-colors text-left w-full"
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                    q.type === "crypto" ? "bg-[rgba(188,140,255,0.12)] text-[var(--purple)]" : "bg-[rgba(88,166,255,0.12)] text-[var(--accent)]"
                  }`}>
                    {q.symbol.replace("USDT","").slice(0,2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold">{q.symbol.replace("USDT","")}</div>
                    <div className="text-xs font-mono text-[var(--muted)]">{fmtCurrency(q.price, q.price < 10 ? 4 : 2)}</div>
                  </div>
                  <div className={`flex items-center gap-1 text-sm font-mono font-semibold ${colorClass(q.changePct)}`}>
                    {up ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                    {fmtPercent(q.changePct)}
                  </div>
                </button>
              );
            })}
      </div>
    </Card>
  );
}
