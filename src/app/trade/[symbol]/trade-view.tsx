"use client";

import { useEffect, useState } from "react";
import { useTradingStore } from "@/lib/store";
import { useT } from "@/lib/hooks/use-t";
import { PriceChart } from "@/components/chart/price-chart";
import { QuoteBar } from "@/components/chart/quote-bar";
import { OrderBook } from "@/components/orderbook/orderbook";
import { TradePanel } from "@/components/chart/trade-panel";
import { AIPanel } from "@/components/ai-panel/ai-panel";
import { Watchlist } from "@/components/watchlist/watchlist";
import { Card } from "@/components/ui/card";
import { ASSET_META, currencySymbol } from "@/lib/mock";
import { BarChart2, BookOpen, ArrowUpDown, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface TradeViewProps { symbol: string }

type MobileTab = "chart" | "book" | "trade" | "ai";

export function TradeView({ symbol }: TradeViewProps) {
  const { setActiveSymbol } = useTradingStore();
  const t = useT();
  const [tab, setTab] = useState<MobileTab>("chart");

  useEffect(() => { setActiveSymbol(symbol); }, [symbol, setActiveSymbol]);

  const TABS: { id: MobileTab; icon: React.ReactNode; label: string }[] = [
    { id: "chart", icon: <BarChart2 size={16} />,    label: t.chart.title                },
    { id: "book",  icon: <BookOpen size={16} />,     label: t.orderbook.title            },
    { id: "trade", icon: <ArrowUpDown size={16} />,  label: t.trade.placeOrder           },
    { id: "ai",    icon: <Sparkles size={16} />,     label: t.ai.title                   },
  ];

  return (
    <div className="flex h-full min-h-0">

      {/* ── Desktop: left watchlist sidebar ──────────────────────────────── */}
      <aside className="w-64 border-r border-[var(--border)] shrink-0 hidden xl:flex flex-col overflow-hidden">
        <Watchlist />
      </aside>

      {/* ── Center column ──────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <QuoteBar symbol={symbol} />

        {/* ── Mobile tab bar ── */}
        <div className="md:hidden flex border-b border-[var(--border)] bg-[var(--surface)] shrink-0">
          {TABS.map(({ id, icon, label }) => (
            <button key={id} onClick={() => setTab(id)}
              className={cn(
                "flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors relative",
                tab === id ? "text-[var(--accent)]" : "text-[var(--muted)]"
              )}
            >
              {icon}
              <span>{label}</span>
              {tab === id && (
                <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-[var(--accent)] rounded-full" />
              )}
            </button>
          ))}
        </div>

        {/* ── Mobile content panels ── */}
        <div className="md:hidden flex-1 overflow-y-auto">
          {tab === "chart" && (
            <div className="flex flex-col gap-3 p-3">
              <Card className="overflow-hidden p-3">
                <PriceChart symbol={symbol} />
              </Card>
              <RangeBar symbol={symbol} />
              <AssetInfo symbol={symbol} />
            </div>
          )}
          {tab === "book"  && (
            <div className="p-3 h-full flex flex-col">
              <OrderBook symbol={symbol} />
            </div>
          )}
          {tab === "trade" && (
            <div className="p-3">
              <TradePanel symbol={symbol} />
            </div>
          )}
          {tab === "ai"    && (
            <div className="p-3 flex flex-col gap-3">
              <AIPanel symbol={symbol} />
            </div>
          )}
        </div>

        {/* ── md+ layout ─────────────────────────────────────────────────── */}
        <div className="hidden md:flex flex-1 min-h-0 overflow-hidden">
          {/* Chart + info */}
          <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
            <div className="p-4 pb-0">
              <Card className="overflow-hidden p-4">
                <PriceChart symbol={symbol} />
              </Card>
            </div>
            <RangeBar symbol={symbol} />
            <AssetInfo symbol={symbol} />
          </div>

          {/* Orderbook — lg+ */}
          <aside className="w-56 border-l border-[var(--border)] shrink-0 hidden lg:flex flex-col overflow-hidden">
            <div className="flex-1 p-3 overflow-hidden flex flex-col">
              <OrderBook symbol={symbol} />
            </div>
          </aside>
        </div>
      </div>

      {/* ── Right: trade + AI — desktop only ────────────────────────────── */}
      <aside className="w-72 border-l border-[var(--border)] shrink-0 hidden md:flex flex-col overflow-hidden">
        <div className="flex-1 flex flex-col gap-4 p-4 overflow-y-auto">
          <TradePanel symbol={symbol} />
          <AIPanel symbol={symbol} />
        </div>
      </aside>

    </div>
  );
}

function RangeBar({ symbol }: { symbol: string }) {
  const { quotes } = useTradingStore();
  const t = useT();
  const q = quotes[symbol];
  if (!q) return null;

  const meta  = ASSET_META[symbol];
  const sym   = currencySymbol(meta?.currency ?? "USD");
  const range = q.high - q.low;
  const pos   = range > 0 ? ((q.price - q.low) / range) * 100 : 50;
  const dec   = q.price < 10 ? 4 : 2;
  const fmt   = (n: number) =>
    `${sym}${n.toLocaleString("en-US", { minimumFractionDigits: dec, maximumFractionDigits: dec })}`;

  const typeLabel =
    q.type === "crypto" ? t.badge.crypto :
    q.type === "hk"     ? t.badge.hk     :
    q.type === "cn"     ? t.badge.cn      : t.badge.stock;

  return (
    <div className="mx-3 md:mx-4 mt-3 px-3 md:px-4 py-3 bg-[var(--surface)] border border-[var(--border)] rounded-xl flex items-center gap-4 flex-wrap">
      <div className="flex items-center gap-2 flex-1 min-w-44">
        <span className="text-xs font-mono text-[var(--red)]">{fmt(q.low)}</span>
        <div className="flex-1 h-1.5 bg-[var(--surface-2)] rounded-full relative">
          <div className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[var(--red)] to-[var(--green)]" style={{ width: "100%" }} />
          <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white border-2 border-[var(--accent)] shadow-sm"
            style={{ left: `calc(${pos}% - 6px)` }} />
        </div>
        <span className="text-xs font-mono text-[var(--green)]">{fmt(q.high)}</span>
      </div>
      <div className="flex items-center gap-4 text-xs text-[var(--muted)]">
        <span>{t.chart.range24h}</span>
        <span className="text-[var(--foreground)]">{typeLabel}</span>
        <span>{t.chart.vol}: <span className="font-mono text-[var(--foreground)]">
          {q.volume >= 1e9 ? `${(q.volume/1e9).toFixed(1)}B` : q.volume >= 1e6 ? `${(q.volume/1e6).toFixed(1)}M` : q.volume.toFixed(0)}
        </span></span>
      </div>
    </div>
  );
}

function AssetInfo({ symbol }: { symbol: string }) {
  const { lang } = useTradingStore();
  const t = useT();
  const meta = ASSET_META[symbol];
  if (!meta) return null;

  const ticker = symbol.replace("USDT","").replace(/^(HK|CN)/,"");
  const name   = lang === "zh" && meta.nameCN ? meta.nameCN : meta.name;
  const desc   = lang === "zh" && meta.descriptionCN ? meta.descriptionCN : meta.description;
  const sector = lang === "zh" && meta.sectorCN ? meta.sectorCN : meta.sector;

  const iconClass =
    meta.type === "crypto" ? "bg-[rgba(188,140,255,0.12)] text-[var(--purple)]"
    : meta.type === "hk"  ? "bg-[rgba(255,160,0,0.12)] text-[var(--yellow)]"
    : meta.type === "cn"  ? "bg-[rgba(248,81,73,0.12)] text-[#ff6b6b]"
    : "bg-[rgba(88,166,255,0.12)] text-[var(--accent)]";

  return (
    <div className="mx-3 md:mx-4 mt-3 mb-4 px-3 md:px-4 py-3 bg-[var(--surface)] border border-[var(--border)] rounded-xl">
      <div className="flex items-start gap-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 mt-0.5 ${iconClass}`}>
          {ticker.slice(0,2)}
        </div>
        <div className="min-w-0">
          <div className="font-semibold text-sm">
            {name}
            <span className="text-[var(--muted)] font-normal ml-1.5">({ticker})</span>
          </div>
          <div className="text-xs text-[var(--muted)] mt-0.5 leading-relaxed">{desc}</div>
          {sector && (
            <div className="text-[10px] mt-1.5 px-2 py-0.5 rounded-full bg-[var(--surface-2)] text-[var(--muted)] inline-block">
              {sector}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
