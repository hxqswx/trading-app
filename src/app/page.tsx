"use client";

import { usePortfolio } from "@/lib/hooks/use-portfolio";
import { useTradingStore } from "@/lib/store";
import { useT } from "@/lib/hooks/use-t";
import { Watchlist } from "@/components/watchlist/watchlist";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { fmtCurrency, fmtPercent, colorClass } from "@/lib/utils";
import { currencySymbol, ASSET_META } from "@/lib/mock";
import { useRouter } from "next/navigation";
import { TrendingUp, TrendingDown, DollarSign, Wallet, BarChart2, ArrowRight } from "lucide-react";
import { useState } from "react";

export default function DashboardPage() {
  return (
    <div className="flex h-full min-h-0">
      <div className="flex-1 flex flex-col gap-4 md:gap-5 p-4 md:p-5 overflow-y-auto min-w-0">
        <Greeting />
        <SummaryCards />
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 md:gap-5 items-start">
          <div className="xl:col-span-2"><PositionsTable /></div>
          <div><TopMovers /></div>
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
  const t = useT();
  const up = (portfolio?.dayPnlPct ?? 0) >= 0;
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-lg font-bold">{t.dashboard.greeting}</h1>
        <p className="text-sm text-[var(--muted)] mt-0.5">{t.dashboard.greetingSub}</p>
      </div>
      {portfolio && (
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
          up ? "bg-[rgba(63,185,80,0.1)] text-[var(--green)]" : "bg-[rgba(248,81,73,0.1)] text-[var(--red)]"
        }`}>
          {up ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          {fmtPercent(portfolio.dayPnlPct)} {t.dashboard.today}
        </div>
      )}
    </div>
  );
}

// ── Asset-type metadata for breakdown display ──────────────────────────────
const TYPE_META: Record<string, { zh: string; en: string; color: string }> = {
  stock:  { zh: "美股", en: "US",     color: "#58a6ff" },
  crypto: { zh: "加密", en: "Crypto", color: "#bc8cff" },
  hk:     { zh: "港股", en: "HK",     color: "#ffa000" },
  cn:     { zh: "A股",  en: "A股",    color: "#ff6b6b" },
  forex:  { zh: "外汇", en: "FX",     color: "#3fb950" },
};

function fmtK(v: number): string {
  const a = Math.abs(v);
  if (a >= 1_000_000) return (v / 1_000_000).toFixed(1) + "M";
  if (a >= 1_000)     return (v / 1_000).toFixed(1) + "K";
  return v.toFixed(0);
}

function BreakdownDots({
  data, lang, signed,
}: { data: Record<string, number>; lang: string; signed?: boolean }) {
  const entries = Object.entries(data).filter(([, v]) => Math.abs(v) >= 0.5);
  if (!entries.length) return null;
  return (
    <div className="mt-2 pt-2 border-t border-[var(--border)] flex flex-col gap-0.5">
      {entries.map(([type, v]) => {
        const m   = TYPE_META[type] ?? { zh: type, en: type, color: "#8b949e" };
        const neg = v < 0;
        const col = signed ? (neg ? "var(--red)" : "var(--green)") : "var(--muted)";
        return (
          <div key={type} className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1 min-w-0">
              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: m.color }} />
              <span className="text-[10px] text-[var(--muted)]">{lang === "zh" ? m.zh : m.en}</span>
            </div>
            <span className="text-[10px] font-mono tabular-nums shrink-0" style={{ color: col }}>
              {signed && !neg ? "+" : ""}{fmtK(v)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function SummaryCards() {
  const { portfolio, loading } = usePortfolio();
  const { lang, quotes } = useTradingStore();
  const t = useT();

  const positions = portfolio?.positions ?? [];

  // ── Equity breakdown: market value by type ────────────────────────────────
  const equityBreak = positions.reduce<Record<string, number>>((acc, p) => {
    acc[p.type] = (acc[p.type] ?? 0) + p.marketValue;
    return acc;
  }, {});

  // ── Day P&L breakdown: use live quotes changePct × qty ────────────────────
  const dayBreak = positions.reduce<Record<string, number>>((acc, p) => {
    const q = quotes[p.symbol];
    if (!q || q.changePct === 0) return acc;
    const prevClose = q.price / (1 + q.changePct / 100);
    acc[p.type] = (acc[p.type] ?? 0) + p.qty * (q.price - prevClose);
    return acc;
  }, {});

  // ── Total P&L breakdown: unrealizedPnl by type ────────────────────────────
  const totalBreak = positions.reduce<Record<string, number>>((acc, p) => {
    acc[p.type] = (acc[p.type] ?? 0) + p.unrealizedPnl;
    return acc;
  }, {});

  const cards = [
    {
      label: t.portfolio.equity,   icon: DollarSign, value: portfolio?.equity,
      color: "text-[var(--accent)]",                 bg: "bg-[rgba(88,166,255,0.08)]",
      pct: undefined, breakdown: equityBreak, signed: false,
    },
    {
      label: t.portfolio.cash,     icon: Wallet,     value: portfolio?.cash,
      color: "text-[var(--muted)]",                  bg: "bg-[var(--surface-2)]",
      pct: undefined, breakdown: null, signed: false,
    },
    {
      label: t.portfolio.dayPnl,   icon: TrendingUp, value: portfolio?.dayPnl,
      color: colorClass(portfolio?.dayPnl ?? 0),     bg: "bg-[var(--surface-2)]",
      pct: portfolio?.dayPnlPct, breakdown: dayBreak, signed: true,
    },
    {
      label: t.portfolio.totalPnl, icon: BarChart2,  value: portfolio?.totalPnl,
      color: colorClass(portfolio?.totalPnl ?? 0),   bg: "bg-[var(--surface-2)]",
      pct: undefined, breakdown: totalBreak, signed: true,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map(({ label, icon: Icon, value, color, bg, pct, breakdown, signed }) => (
        <Card key={label} className={`relative overflow-hidden ${bg}`}>
          <div className="flex items-center gap-2 mb-3">
            <Icon size={14} className={color} />
            <span className="text-xs text-[var(--muted)] font-medium">{label}</span>
          </div>
          {loading || value === undefined
            ? <>
                <div className="h-6 w-28 bg-[var(--surface-2)] rounded animate-pulse" />
                <div className="mt-2 pt-2 border-t border-[var(--border)] space-y-1">
                  {[...Array(2)].map((_, i) => (
                    <div key={i} className="h-3 w-full bg-[var(--surface-2)] rounded animate-pulse" />
                  ))}
                </div>
              </>
            : <>
                <div className={`text-xl font-mono font-bold ${color}`}>{fmtCurrency(value)}</div>
                {pct !== undefined && (
                  <div className={`text-xs font-mono mt-0.5 ${color}`}>{fmtPercent(pct)}</div>
                )}
                {breakdown && (
                  <BreakdownDots data={breakdown} lang={lang} signed={signed} />
                )}
              </>
          }
        </Card>
      ))}
    </div>
  );
}

function PositionsTable() {
  const { portfolio, loading } = usePortfolio();
  const { setActiveSymbol, quotes, lang } = useTradingStore();
  const t = useT();
  const router = useRouter();

  function goTo(symbol: string) { setActiveSymbol(symbol); router.push(`/trade/${symbol}`); }

  return (
    <Card className="p-0 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
        <h2 className="text-sm font-semibold">{t.dashboard.positions}</h2>
        <span className="text-xs text-[var(--muted)]">{portfolio?.positions.length ?? 0} {t.portfolio.positions}</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[10px] uppercase tracking-wider text-[var(--muted)] border-b border-[var(--border)]">
              {[t.table.asset, t.table.qty, t.table.avgCost, t.table.current, t.table.value, t.table.pnl, ""].map((h, i) => (
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
              const meta      = ASSET_META[p.symbol];
              const sym       = currencySymbol(p.currency ?? "USD");
              const ticker    = p.symbol.replace("USDT","").replace(/^(HK|CN)/,"");
              const name      = lang === "zh" && meta?.nameCN ? meta.nameCN : (meta?.name ?? p.symbol);
              const badgeV    = p.type === "crypto" ? "purple" : p.type === "hk" ? "yellow" : p.type === "cn" ? "cn" : "default";
              const badgeL    = p.type === "crypto" ? t.badge.crypto : p.type === "hk" ? t.badge.hk : p.type === "cn" ? t.badge.cn : t.badge.stock;
              return (
                <tr key={p.symbol} onClick={() => goTo(p.symbol)}
                  className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface-2)] cursor-pointer transition-colors group"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                        p.type === "crypto" ? "bg-[rgba(188,140,255,0.12)] text-[var(--purple)]"
                        : p.type === "hk"   ? "bg-[rgba(255,160,0,0.12)] text-[var(--yellow)]"
                        : p.type === "cn"   ? "bg-[rgba(248,81,73,0.10)] text-[#ff6b6b]"
                        : "bg-[rgba(88,166,255,0.12)] text-[var(--accent)]"
                      }`}>
                        {ticker.slice(0,2)}
                      </div>
                      <div>
                        <div className="font-semibold">{ticker}</div>
                        <Badge variant={badgeV} className="mt-0.5">{badgeL}</Badge>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-right font-mono text-[var(--muted)]">{p.qty}</td>
                  <td className="px-5 py-4 text-right font-mono text-[var(--muted)]">{sym}{p.avgEntryPrice.toLocaleString()}</td>
                  <td className="px-5 py-4 text-right font-mono font-semibold">{sym}{livePrice.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})}</td>
                  <td className="px-5 py-4 text-right font-mono">{sym}{(livePrice * p.qty).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})}</td>
                  <td className={`px-5 py-4 text-right font-mono font-semibold ${colorClass(livePnl)}`}>
                    <div>{livePnl >= 0 ? "+" : ""}{sym}{Math.abs(livePnl).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})}</div>
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
  const { quotes, setActiveSymbol, lang } = useTradingStore();
  const t = useT();
  const router = useRouter();
  const [tab, setTab] = useState<"gainers" | "losers">("gainers");

  const allQuotes = Object.values(quotes);
  const gainers = allQuotes.filter(q => q.changePct > 0).sort((a, b) => b.changePct - a.changePct).slice(0, 10);
  const losers  = allQuotes.filter(q => q.changePct < 0).sort((a, b) => a.changePct - b.changePct).slice(0, 10);
  const list    = tab === "gainers" ? gainers : losers;
  const loading = allQuotes.length === 0;

  function goTo(symbol: string) { setActiveSymbol(symbol); router.push(`/trade/${symbol}`); }

  return (
    <Card className="p-0 overflow-hidden flex flex-col">
      {/* Header with tabs */}
      <div className="px-5 pt-4 pb-0 border-b border-[var(--border)] shrink-0">
        <div className="flex gap-4">
          <button
            onClick={() => setTab("gainers")}
            className={`flex items-center gap-1.5 pb-3 text-sm font-semibold border-b-2 transition-colors ${
              tab === "gainers"
                ? "border-[var(--green)] text-[var(--green)]"
                : "border-transparent text-[var(--muted)] hover:text-[var(--foreground)]"
            }`}
          >
            <TrendingUp size={13} />
            {t.dashboard.gainers}
          </button>
          <button
            onClick={() => setTab("losers")}
            className={`flex items-center gap-1.5 pb-3 text-sm font-semibold border-b-2 transition-colors ${
              tab === "losers"
                ? "border-[var(--red)] text-[var(--red)]"
                : "border-transparent text-[var(--muted)] hover:text-[var(--foreground)]"
            }`}
          >
            <TrendingDown size={13} />
            {t.dashboard.losers}
          </button>
        </div>
      </div>

      {/* List */}
      <div className="flex flex-col">
        {loading
          ? [...Array(10)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-3.5 border-b border-[var(--border)] last:border-0">
                <div className="h-8 w-8 rounded-lg bg-[var(--surface-2)] animate-pulse" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-16 bg-[var(--surface-2)] rounded animate-pulse" />
                  <div className="h-2.5 w-20 bg-[var(--surface-2)] rounded animate-pulse" />
                </div>
              </div>
            ))
          : list.length === 0
          ? (
              <div className="flex flex-col items-center justify-center flex-1 py-10 text-sm text-[var(--muted)]">
                {tab === "gainers" ? <TrendingUp size={28} className="mb-2 opacity-30" /> : <TrendingDown size={28} className="mb-2 opacity-30" />}
                {tab === "gainers" ? (lang === "zh" ? "暂无上涨标的" : "No gainers yet") : (lang === "zh" ? "暂无下跌标的" : "No losers yet")}
              </div>
            )
          : list.map((q) => {
              const meta   = ASSET_META[q.symbol];
              const up     = q.changePct >= 0;
              const ticker = q.symbol.replace("USDT","").replace(/^(HK|CN)/,"");
              const name   = lang === "zh" && meta?.nameCN ? meta.nameCN : (meta?.name ?? q.symbol);
              return (
                <button key={q.symbol} onClick={() => goTo(q.symbol)}
                  className="flex items-center gap-3 px-5 py-3.5 border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface-2)] transition-colors text-left w-full"
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                    q.type === "crypto" ? "bg-[rgba(188,140,255,0.12)] text-[var(--purple)]"
                    : q.type === "hk"   ? "bg-[rgba(255,160,0,0.12)] text-[var(--yellow)]"
                    : q.type === "cn"   ? "bg-[rgba(248,81,73,0.10)] text-[#ff6b6b]"
                    : "bg-[rgba(88,166,255,0.12)] text-[var(--accent)]"
                  }`}>
                    {ticker.slice(0,2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold">{ticker}</div>
                    <div className="text-xs text-[var(--muted)] truncate">{name}</div>
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
