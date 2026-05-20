"use client";

import { useEffect, useRef, useState } from "react";
import { useTradingStore } from "@/lib/store";
import { useT } from "@/lib/hooks/use-t";
import { PriceChart } from "@/components/chart/price-chart";
import { QuoteBar } from "@/components/chart/quote-bar";
import { OrderBook } from "@/components/orderbook/orderbook";
import { TradePanel } from "@/components/chart/trade-panel";
import { AIPanel } from "@/components/ai-panel/ai-panel";
import { Watchlist } from "@/components/watchlist/watchlist";
import { ForexPanel } from "@/components/watchlist/forex-panel";
import { Card } from "@/components/ui/card";
import { ASSET_META, currencySymbol } from "@/lib/mock";
import { BarChart2, BookOpen, ArrowUpDown, Sparkles, TrendingUp, Star, Globe } from "lucide-react";
import { cn, getDataSource } from "@/lib/utils";
import { StrategyPanel } from "@/components/strategies/strategy-panel";

interface TradeViewProps { symbol: string }

type MobileTab = "chart" | "book" | "trade" | "ai" | "strategy";
type LeftTab   = "watchlist" | "forex";

export function TradeView({ symbol }: TradeViewProps) {
  const { setActiveSymbol } = useTradingStore();
  const t = useT();
  const [tab,     setTab]     = useState<MobileTab>("chart");
  const [leftTab, setLeftTab] = useState<LeftTab>("watchlist");

  // ── Resizable panels ─────────────────────────────────────────────────────
  const [leftWidth,  setLeftWidth]  = useState(256); // px — matches w-64
  const [rightWidth, setRightWidth] = useState(288); // px — matches w-72
  const resizing = useRef<{ side: "left" | "right"; startX: number; startW: number } | null>(null);

  useEffect(() => {
    function onMove(e: MouseEvent) {
      if (!resizing.current) return;
      const { side, startX, startW } = resizing.current;
      const dx = e.clientX - startX;
      if (side === "left")  setLeftWidth (Math.max(180, Math.min(420, startW + dx)));
      else                  setRightWidth(Math.max(220, Math.min(520, startW - dx)));
    }
    function onUp() { resizing.current = null; document.body.style.cursor = ""; document.body.style.userSelect = ""; }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup",   onUp);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
  }, []);

  function startResize(side: "left" | "right", e: React.MouseEvent) {
    e.preventDefault();
    resizing.current = { side, startX: e.clientX, startW: side === "left" ? leftWidth : rightWidth };
    document.body.style.cursor     = "col-resize";
    document.body.style.userSelect = "none";
  }

  useEffect(() => { setActiveSymbol(symbol); }, [symbol, setActiveSymbol]);

  const TABS: { id: MobileTab; icon: React.ReactNode; label: string }[] = [
    { id: "chart",    icon: <BarChart2 size={15} />,   label: t.chart.title          },
    { id: "book",     icon: <BookOpen size={15} />,    label: t.orderbook.title      },
    { id: "trade",    icon: <ArrowUpDown size={15} />, label: t.trade.placeOrder     },
    { id: "ai",       icon: <Sparkles size={15} />,    label: t.ai.title             },
    { id: "strategy", icon: <TrendingUp size={15} />,  label: t.strategies.tabLabel  },
  ];

  return (
    <div className="flex h-full min-h-0">

      {/* ── Desktop: left sidebar with Watchlist / FX tabs ──────────────── */}
      <aside
        style={{ width: leftWidth }}
        className="border-r border-[var(--border)] shrink-0 hidden xl:flex flex-col overflow-hidden"
      >
        {/* Tab switcher */}
        <div className="flex border-b border-[var(--border)] shrink-0">
          {([
            { id: "watchlist" as LeftTab, icon: <Star    size={12} />, label: t.watchlist.title },
            { id: "forex"     as LeftTab, icon: <Globe   size={12} />, label: t.forexPanel.title },
          ]).map(({ id, icon, label }) => (
            <button
              key={id}
              onClick={() => setLeftTab(id)}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors relative",
                leftTab === id ? "text-[var(--accent)]" : "text-[var(--muted)] hover:text-[var(--foreground)]"
              )}
            >
              {icon}
              {label}
              {leftTab === id && (
                <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-[var(--accent)] rounded-full" />
              )}
            </button>
          ))}
        </div>
        {/* Panel */}
        <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
          {leftTab === "watchlist" ? <Watchlist /> : <ForexPanel />}
        </div>
      </aside>

      {/* ── Left resize handle ───────────────────────────────────────────── */}
      <div
        onMouseDown={(e) => startResize("left", e)}
        className="hidden xl:block w-1 shrink-0 cursor-col-resize bg-transparent hover:bg-[var(--accent)]/40 active:bg-[var(--accent)]/60 transition-colors"
        title="Drag to resize"
      />

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
          {tab === "strategy" && (
            <div className="p-3">
              <StrategyPanel symbol={symbol} />
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

      {/* ── Right resize handle ─────────────────────────────────────────── */}
      <div
        onMouseDown={(e) => startResize("right", e)}
        className="hidden md:block w-1 shrink-0 cursor-col-resize bg-transparent hover:bg-[var(--accent)]/40 active:bg-[var(--accent)]/60 transition-colors"
        title="Drag to resize"
      />

      {/* ── Right: trade + AI/Strategy — desktop only ───────────────────── */}
      <RightPanel symbol={symbol} t={t} width={rightWidth} />

    </div>
  );
}

// ── Desktop right panel — TradePanel (top, resizable) + AI/Strategy (bottom) ──
function RightPanel({ symbol, t, width }: { symbol: string; t: ReturnType<typeof useT>; width: number }) {
  const [rightTab,  setRightTab]  = useState<"ai" | "strategy">("ai");
  // Vertical: height of the TradePanel section (px). Default fits a filled form.
  const [tradeH, setTradeH] = useState(440);
  const vRef = useRef<{ startY: number; startH: number } | null>(null);

  useEffect(() => {
    function onMove(e: MouseEvent) {
      if (!vRef.current) return;
      const dy = e.clientY - vRef.current.startY;
      setTradeH(Math.max(240, Math.min(740, vRef.current.startH + dy)));
    }
    function onUp() {
      vRef.current = null;
      document.body.style.cursor     = "";
      document.body.style.userSelect = "";
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup",   onUp);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
  }, []);

  function startVResize(e: React.MouseEvent) {
    e.preventDefault();
    vRef.current = { startY: e.clientY, startH: tradeH };
    document.body.style.cursor     = "row-resize";
    document.body.style.userSelect = "none";
  }

  return (
    <aside
      style={{ width }}
      className="border-l border-[var(--border)] shrink-0 hidden md:flex flex-col overflow-hidden"
    >
      {/* ── AI / Strategy tab switcher (always on top) ── */}
      <div className="flex border-b border-[var(--border)] shrink-0">
        {[
          { id: "ai"       as const, icon: <Sparkles size={13} />,   label: t.ai.title           },
          { id: "strategy" as const, icon: <TrendingUp size={13} />, label: t.strategies.tabLabel },
        ].map(({ id, icon, label }) => (
          <button key={id} onClick={() => setRightTab(id)}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors relative",
              rightTab === id ? "text-[var(--accent)]" : "text-[var(--muted)]"
            )}>
            {icon}{label}
            {rightTab === id && (
              <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-[var(--accent)] rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* ── Trade panel — fixed height, scrolls internally ── */}
      <div style={{ height: tradeH }} className="shrink-0 overflow-y-auto p-4">
        <TradePanel symbol={symbol} />
      </div>

      {/* ── Vertical resize handle ── */}
      <div
        onMouseDown={startVResize}
        className="h-1.5 shrink-0 cursor-row-resize bg-[var(--border)] hover:bg-[var(--accent)]/50 active:bg-[var(--accent)]/70 transition-colors"
        title="Drag to resize"
      />

      {/* ── AI / Strategy — fills remaining height, scrollable ── */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4">
        {rightTab === "ai"       && <AIPanel symbol={symbol} />}
        {rightTab === "strategy" && <StrategyPanel symbol={symbol} />}
      </div>
    </aside>
  );
}

function RangeBar({ symbol }: { symbol: string }) {
  const { quotes } = useTradingStore();
  const t = useT();
  const q = quotes[symbol];
  if (!q) return null;

  const meta    = ASSET_META[symbol];
  const isForex = q.type === "forex";
  // Forex rates display without currency prefix; use more decimal places for small rates
  const sym     = isForex ? "" : currencySymbol(meta?.currency ?? "USD");
  const dec     = isForex
    ? (q.price < 0.01 ? 6 : 4)
    : (q.price < 10 ? 4 : 2);
  const range   = q.high - q.low;
  const pos     = range > 0 ? ((q.price - q.low) / range) * 100 : 50;
  const fmt     = (n: number) =>
    `${sym}${n.toLocaleString("en-US", { minimumFractionDigits: dec, maximumFractionDigits: dec })}`;

  const typeLabel =
    isForex          ? t.badge.forex  :
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
        {isForex ? (
          <span className="font-mono text-[var(--foreground)]/40">—</span>
        ) : (
          <span>{t.chart.vol}: <span className="font-mono text-[var(--foreground)]">
            {q.volume >= 1e9 ? `${(q.volume/1e9).toFixed(1)}B` : q.volume >= 1e6 ? `${(q.volume/1e6).toFixed(1)}M` : q.volume.toFixed(0)}
          </span></span>
        )}
        {/* Data source badge */}
        {(() => {
          const src = getDataSource(q.type);
          return (
            <span className={`flex items-center gap-1 ml-1 ${src.textClass}`}>
              <span className="relative flex h-1.5 w-1.5 shrink-0">
                {src.live && (
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-60 ${src.dotClass}`} />
                )}
                <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${src.dotClass}`} />
              </span>
              {src.name}
            </span>
          );
        })()}
      </div>
    </div>
  );
}

function AssetInfo({ symbol }: { symbol: string }) {
  const { lang } = useTradingStore();
  const t = useT();
  const meta = ASSET_META[symbol];
  if (!meta) return null;

  const isForex = meta.type === "forex";
  // Forex: "USD/CNY"; Crypto: "BTC"; HK: "0700"; CN: "MTAI"; US: "AAPL"
  const ticker  = isForex
    ? symbol.slice(0, 3) + "/" + symbol.slice(3)
    : symbol.replace("USDT","").replace(/^(HK|CN)/,"");
  // Icon label: forex shows base currency (3 chars), others show first 2 chars
  const iconLabel = isForex ? symbol.slice(0, 3) : ticker.slice(0, 2);

  const name   = lang === "zh" && meta.nameCN ? meta.nameCN : meta.name;
  const desc   = lang === "zh" && meta.descriptionCN ? meta.descriptionCN : meta.description;
  const sector = lang === "zh" && meta.sectorCN ? meta.sectorCN : meta.sector;

  const iconClass =
    isForex            ? "bg-emerald-500/15 text-emerald-400"
    : meta.type === "crypto" ? "bg-[rgba(188,140,255,0.12)] text-[var(--purple)]"
    : meta.type === "hk"    ? "bg-[rgba(255,160,0,0.12)] text-[var(--yellow)]"
    : meta.type === "cn"    ? "bg-[rgba(248,81,73,0.12)] text-[#ff6b6b]"
    : "bg-[rgba(88,166,255,0.12)] text-[var(--accent)]";

  return (
    <div className="mx-3 md:mx-4 mt-3 mb-4 px-3 md:px-4 py-3 bg-[var(--surface)] border border-[var(--border)] rounded-xl">
      <div className="flex items-start gap-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 ${iconClass}`}>
          {iconLabel}
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
