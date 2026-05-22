"use client";

/**
 * Markets page — per-market tabs, customisable symbol lists.
 * Desktop: full table with High / Low / Volume.
 * Mobile / tablet (< md): compact cards, 2-column grid on sm.
 */

import { useState } from "react";
import { useTradingStore } from "@/lib/store";
import { useT } from "@/lib/hooks/use-t";
import { fmtPercent, colorClass, fmtLarge } from "@/lib/utils";
import { currencySymbol, ASSET_META } from "@/lib/mock";
import { getAsset } from "@/lib/asset-registry";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AddAssetModal } from "@/components/watchlist/add-asset-modal";
import {
  TrendingUp, TrendingDown, Minus,
  Pencil, Check, Plus, X, RotateCcw,
} from "lucide-react";
import { useRouter } from "next/navigation";
import type { Quote, AssetType, WatchlistItem } from "@/lib/types";

// ── Tab config ─────────────────────────────────────────────────────────────

type MarketTab = AssetType;
const TABS: MarketTab[] = ["stock", "crypto", "hk", "cn", "forex"];

const MARKET_META: Record<MarketTab, { labelZh: string; labelEn: string; color: string; textColor: string; badgeColor: string }> = {
  stock:  { labelZh: "美股",   labelEn: "US Stocks",   color: "#6366f1", textColor: "text-indigo-400",  badgeColor: "bg-indigo-500/15 border-indigo-500/30 text-indigo-400"  },
  crypto: { labelZh: "加密",   labelEn: "Crypto",      color: "#a855f7", textColor: "text-purple-400",  badgeColor: "bg-purple-500/15 border-purple-500/30 text-purple-400"  },
  hk:     { labelZh: "港股",   labelEn: "HK Stocks",   color: "#f59e0b", textColor: "text-amber-400",   badgeColor: "bg-amber-500/15 border-amber-500/30 text-amber-400"    },
  cn:     { labelZh: "A股",    labelEn: "A-Shares",    color: "#ef4444", textColor: "text-red-400",     badgeColor: "bg-red-500/15 border-red-500/30 text-red-400"          },
  forex:  { labelZh: "外汇",   labelEn: "Forex",       color: "#10b981", textColor: "text-emerald-400", badgeColor: "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"},
};

// ── Helpers ────────────────────────────────────────────────────────────────

function fmtPrice(price: number, isForex: boolean): string {
  if (isForex) return price < 0.01 ? price.toFixed(6) : price.toFixed(4);
  return price.toLocaleString("en-US", {
    minimumFractionDigits:  price < 10 ? 4 : 2,
    maximumFractionDigits:  price < 10 ? 4 : 2,
  });
}

function tickerLabel(symbol: string, type: AssetType): string {
  if (type === "forex") return symbol.slice(0, 3) + "/" + symbol.slice(3);
  return symbol.replace("USDT", "").replace(/^(HK|CN)/, "");
}

function iconBgClass(type: AssetType): string {
  if (type === "crypto") return "bg-purple-500/15 text-purple-400";
  if (type === "hk")     return "bg-amber-500/15 text-amber-400";
  if (type === "cn")     return "bg-red-500/15 text-red-400";
  if (type === "forex")  return "bg-emerald-500/15 text-emerald-400";
  return "bg-blue-500/15 text-blue-400";
}

// ── Desktop table row ──────────────────────────────────────────────────────

function TableRow({
  item, quote, editMode, onRemove, onNavigate, lang,
}: {
  item: WatchlistItem; quote: Quote | undefined;
  editMode: boolean; lang: string;
  onRemove: () => void; onNavigate: () => void;
}) {
  const isForex = item.type === "forex";
  const meta    = ASSET_META[item.symbol] ?? getAsset(item.symbol);
  const name    = lang === "zh" && (meta?.nameCN ?? item.nameCN) ? (meta?.nameCN ?? item.nameCN) : (meta?.name ?? item.name);
  const ticker  = tickerLabel(item.symbol, item.type);
  const sym     = isForex ? "" : currencySymbol(meta?.currency ?? "USD");
  const up      = (quote?.changePct ?? 0) > 0;
  const down    = (quote?.changePct ?? 0) < 0;
  const m       = MARKET_META[item.type];

  return (
    <tr
      onClick={editMode ? undefined : onNavigate}
      className={`border-b border-[var(--border)] last:border-0 transition-colors ${editMode ? "" : "hover:bg-[var(--surface-2)] cursor-pointer"}`}
    >
      {/* Asset */}
      <td className="px-4 md:px-5 py-3.5 md:py-4">
        <div className="flex items-center gap-3">
          {/* Delete button */}
          {editMode && (
            <button
              onClick={(e) => { e.stopPropagation(); onRemove(); }}
              className="w-5 h-5 flex items-center justify-center rounded-full bg-red-500/15 text-red-400 hover:bg-red-500/25 shrink-0 transition-colors"
            >
              <X size={10} strokeWidth={2.5} />
            </button>
          )}
          {/* Icon */}
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0 ${iconBgClass(item.type)}`}>
            {isForex ? item.symbol.slice(0, 3) : ticker.slice(0, 2)}
          </div>
          {/* Name */}
          <div className="min-w-0">
            <div className="font-semibold text-sm leading-tight">{ticker}</div>
            <div className="text-xs text-[var(--muted)] truncate max-w-[140px]">{name}</div>
          </div>
          <span className={`hidden sm:inline text-[9px] font-bold px-1.5 py-0.5 rounded border ${m.badgeColor}`}>
            {lang === "zh" ? m.labelZh : m.labelEn}
          </span>
        </div>
      </td>

      {quote ? (
        <>
          {/* Price */}
          <td className="px-4 md:px-5 py-3.5 md:py-4 text-right font-mono font-semibold text-sm whitespace-nowrap">
            {sym}{fmtPrice(quote.price, isForex)}
          </td>
          {/* Change */}
          <td className={`px-4 md:px-5 py-3.5 md:py-4 text-right font-mono text-sm ${colorClass(quote.changePct)}`}>
            <span className="flex items-center justify-end gap-1">
              {up   && <TrendingUp   size={12} strokeWidth={2} />}
              {down && <TrendingDown size={12} strokeWidth={2} />}
              {!up && !down && <Minus size={12} strokeWidth={2} />}
              {fmtPercent(quote.changePct)}
            </span>
          </td>
          {/* High */}
          <td className="hidden md:table-cell px-5 py-4 text-right font-mono text-sm text-[var(--muted)]">
            {sym}{fmtPrice(quote.high, isForex)}
          </td>
          {/* Low */}
          <td className="hidden md:table-cell px-5 py-4 text-right font-mono text-sm text-[var(--muted)]">
            {sym}{fmtPrice(quote.low, isForex)}
          </td>
          {/* Volume */}
          <td className="hidden lg:table-cell px-5 py-4 text-right font-mono text-sm text-[var(--muted)]">
            {isForex ? "—" : fmtLarge(quote.volume)}
          </td>
        </>
      ) : (
        <td colSpan={5} className="px-5 py-4 text-right text-xs text-[var(--muted)] animate-pulse">
          加载中…
        </td>
      )}
    </tr>
  );
}

// ── Mobile card ────────────────────────────────────────────────────────────

function MobileCard({
  item, quote, editMode, onRemove, onNavigate, lang,
}: {
  item: WatchlistItem; quote: Quote | undefined;
  editMode: boolean; lang: string;
  onRemove: () => void; onNavigate: () => void;
}) {
  const isForex = item.type === "forex";
  const meta    = ASSET_META[item.symbol] ?? getAsset(item.symbol);
  const name    = lang === "zh" && (meta?.nameCN ?? item.nameCN) ? (meta?.nameCN ?? item.nameCN) : (meta?.name ?? item.name);
  const ticker  = tickerLabel(item.symbol, item.type);
  const sym     = isForex ? "" : currencySymbol(meta?.currency ?? "USD");
  const up      = (quote?.changePct ?? 0) > 0;
  const down    = (quote?.changePct ?? 0) < 0;

  return (
    <div
      onClick={editMode ? undefined : onNavigate}
      className={`flex items-center gap-3 p-3.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] transition-colors ${editMode ? "" : "hover:bg-[var(--surface-2)] cursor-pointer active:scale-[0.99]"}`}
    >
      {/* Delete */}
      {editMode && (
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="w-5 h-5 flex items-center justify-center rounded-full bg-red-500/15 text-red-400 hover:bg-red-500/25 shrink-0"
        >
          <X size={10} strokeWidth={2.5} />
        </button>
      )}

      {/* Icon */}
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-[11px] font-bold shrink-0 ${iconBgClass(item.type)}`}>
        {isForex ? item.symbol.slice(0, 3) : ticker.slice(0, 2)}
      </div>

      {/* Name */}
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm leading-tight truncate">{ticker}</div>
        <div className="text-[11px] text-[var(--muted)] truncate">{name}</div>
      </div>

      {/* Price + change */}
      <div className="text-right shrink-0">
        {quote ? (
          <>
            <div className="font-mono font-semibold text-sm">
              {sym}{fmtPrice(quote.price, isForex)}
            </div>
            <div className={`font-mono text-xs ${colorClass(quote.changePct)}`}>
              <span className="inline-flex items-center gap-0.5">
                {up   && <TrendingUp   size={10} strokeWidth={2} />}
                {down && <TrendingDown size={10} strokeWidth={2} />}
                {!up && !down && <Minus size={10} strokeWidth={2} />}
                {fmtPercent(quote.changePct)}
              </span>
            </div>
          </>
        ) : (
          <span className="text-xs text-[var(--muted)] animate-pulse">…</span>
        )}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────

export default function MarketsPage() {
  const { quotes, lang, setActiveSymbol, marketLists, addToMarketList, removeFromMarketList, resetMarketList } = useTradingStore();
  const t = useT();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<MarketTab>("stock");
  const [editMode,  setEditMode]  = useState(false);
  const [showAdd,   setShowAdd]   = useState(false);

  const list = marketLists[activeTab] ?? [];
  const m    = MARKET_META[activeTab];

  function goToTrade(symbol: string) {
    setActiveSymbol(symbol);
    router.push(`/trade/${symbol}`);
  }

  function switchTab(tab: MarketTab) {
    setActiveTab(tab);
    setEditMode(false);
  }

  function handleReset() {
    if (confirm(`将${m.labelZh}列表恢复为默认？`)) resetMarketList(activeTab);
  }

  // Overrides for AddAssetModal — adds to this market's list, not global watchlist
  const listSet = new Set(list.map((w) => w.symbol));
  function handleAdd(item: WatchlistItem) {
    addToMarketList(activeTab, { ...item, type: activeTab });
  }
  function handleRemoveViaModal(symbol: string) {
    removeFromMarketList(activeTab, symbol);
  }

  const TABLE_HEADERS = [
    { label: t.table.asset,        cls: "text-left" },
    { label: lang === "zh" ? "价格" : "Price",    cls: "text-right" },
    { label: t.markets.change24h,  cls: "text-right" },
    { label: t.table.high,         cls: "text-right hidden md:table-cell" },
    { label: t.table.low,          cls: "text-right hidden md:table-cell" },
    { label: t.markets.volume,     cls: "text-right hidden lg:table-cell" },
  ];

  return (
    <div className="flex flex-col min-h-0 h-full">
      {/* ── Header ── */}
      <div className="px-4 md:px-6 pt-4 md:pt-6 pb-0 shrink-0">
        <div className="flex items-start justify-between mb-4 gap-3">
          <div>
            <h1 className="text-xl md:text-2xl font-bold">{t.markets.title}</h1>
            <p className="text-xs md:text-sm text-[var(--muted)] mt-0.5">{t.markets.subtitle}</p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {editMode && (
              <button
                onClick={handleReset}
                title={lang === "zh" ? "重置默认" : "Reset defaults"}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-2)] border border-[var(--border)] text-xs font-medium transition-colors"
              >
                <RotateCcw size={12} />
                <span className="hidden sm:inline">{lang === "zh" ? "重置" : "Reset"}</span>
              </button>
            )}
            <button
              onClick={() => setEditMode((v) => !v)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
                editMode
                  ? "border-transparent text-white"
                  : "border-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-2)]"
              }`}
              style={editMode ? { backgroundColor: m.color } : {}}
            >
              {editMode ? <Check size={12} /> : <Pencil size={12} />}
              {editMode ? (lang === "zh" ? "完成" : "Done") : (lang === "zh" ? "编辑" : "Edit")}
            </button>
            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors hover:opacity-90"
              style={{ backgroundColor: `${m.color}20`, borderColor: `${m.color}50`, color: m.color }}
            >
              <Plus size={12} strokeWidth={2.5} />
              {lang === "zh" ? "添加" : "Add"}
            </button>
          </div>
        </div>

        {/* ── Market tabs ── */}
        <div className="flex gap-1.5 overflow-x-auto pb-3 scrollbar-hide">
          {TABS.map((tab) => {
            const tm     = MARKET_META[tab];
            const active = activeTab === tab;
            const count  = (marketLists[tab] ?? []).length;
            return (
              <button
                key={tab}
                onClick={() => switchTab(tab)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-semibold whitespace-nowrap transition-all shrink-0"
                style={
                  active
                    ? { backgroundColor: tm.color, borderColor: tm.color, color: "#fff" }
                    : { backgroundColor: "var(--surface)", borderColor: "var(--border)", color: "var(--muted)" }
                }
              >
                {lang === "zh" ? tm.labelZh : tm.labelEn}
                <span
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center"
                  style={
                    active
                      ? { backgroundColor: "rgba(255,255,255,0.25)", color: "#fff" }
                      : { backgroundColor: "var(--border)", color: "var(--muted)" }
                  }
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 overflow-y-auto px-4 md:px-6 pb-6">
        {/* Section label */}
        <div className="flex items-center gap-2 mb-3 pt-1">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: m.color }} />
          <span className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">
            {lang === "zh" ? m.labelZh : m.labelEn}
          </span>
          <span className="text-xs text-[var(--muted)]/50">· {list.length} {lang === "zh" ? "支" : "symbols"}</span>
        </div>

        {/* ── Desktop / tablet: table ── */}
        <div className="hidden sm:block">
          <Card className="p-0 overflow-hidden">
            {list.length === 0 ? (
              <div className="py-16 text-center text-[var(--muted)] text-sm">
                <p className="opacity-50 mb-3">
                  {lang === "zh" ? "暂无股票，点击「添加」开始" : "No symbols. Click Add to start."}
                </p>
                <button
                  onClick={() => setShowAdd(true)}
                  className="text-xs font-semibold px-4 py-2 rounded-lg border transition-colors hover:opacity-80"
                  style={{ borderColor: `${m.color}50`, color: m.color, backgroundColor: `${m.color}10` }}
                >
                  + {lang === "zh" ? "添加" : "Add symbol"}
                </button>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] text-[10px] text-[var(--muted)] uppercase tracking-wide">
                    {TABLE_HEADERS.map((h, i) => (
                      <th key={i} className={`px-4 md:px-5 py-3 font-medium ${h.cls}`}>{h.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {list.map((item) => (
                    <TableRow
                      key={item.symbol}
                      item={item}
                      quote={quotes[item.symbol]}
                      editMode={editMode}
                      lang={lang}
                      onRemove={() => removeFromMarketList(activeTab, item.symbol)}
                      onNavigate={() => goToTrade(item.symbol)}
                    />
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        </div>

        {/* ── Mobile: cards ── */}
        <div className="sm:hidden space-y-2">
          {list.length === 0 ? (
            <div className="py-16 text-center text-[var(--muted)] text-sm">
              <p className="opacity-50 mb-3">
                {lang === "zh" ? "暂无股票，点击「添加」开始" : "No symbols. Tap Add to start."}
              </p>
              <button
                onClick={() => setShowAdd(true)}
                className="text-xs font-semibold px-4 py-2 rounded-lg border"
                style={{ borderColor: `${m.color}50`, color: m.color, backgroundColor: `${m.color}10` }}
              >
                + {lang === "zh" ? "添加" : "Add"}
              </button>
            </div>
          ) : (
            list.map((item) => (
              <MobileCard
                key={item.symbol}
                item={item}
                quote={quotes[item.symbol]}
                editMode={editMode}
                lang={lang}
                onRemove={() => removeFromMarketList(activeTab, item.symbol)}
                onNavigate={() => goToTrade(item.symbol)}
              />
            ))
          )}
        </div>

        {/* ── Add row (always visible) ── */}
        {list.length > 0 && (
          <button
            onClick={() => setShowAdd(true)}
            className="w-full mt-3 flex items-center justify-center gap-2 py-3.5 rounded-xl border border-dashed text-sm font-semibold transition-colors hover:opacity-80"
            style={{ borderColor: `${m.color}50`, color: m.color, backgroundColor: `${m.color}08` }}
          >
            <Plus size={14} strokeWidth={2.5} />
            {lang === "zh" ? `添加${m.labelZh}股票` : `Add ${m.labelEn} symbol`}
          </button>
        )}
      </div>

      {/* ── AddAssetModal ── */}
      {showAdd && (
        <AddAssetModal
          onClose={() => setShowAdd(false)}
          overrideSymbols={listSet}
          onAddOverride={handleAdd}
          onRemoveOverride={handleRemoveViaModal}
        />
      )}
    </div>
  );
}
