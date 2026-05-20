"use client";

/**
 * AddAssetModal — search and add any stock/crypto to the watchlist.
 *
 * Tier 1: instant local catalog search (supports EN + ZH names)
 * Tier 2: Yahoo Finance live search for unlisted symbols (debounced 400ms)
 *
 * Keyboard: Escape to close, ↑↓ to navigate, Enter to add/remove.
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { Search, X, Plus, Check, Loader2, TrendingUp, Bitcoin, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTradingStore } from "@/lib/store";
import { searchAssets } from "@/lib/asset-registry";
import { useT } from "@/lib/hooks/use-t";
import type { AssetType } from "@/lib/types";

interface SearchResult {
  symbol:   string;
  yfTicker: string;
  name:     string;
  nameCN:   string;
  type:     string;
  market:   string;
  currency: string;
  source:   "catalog" | "yahoo";
}

// ── Type badge ────────────────────────────────────────────────────────────

function TypeBadge({ type, market }: { type: string; market: string }) {
  const label =
    type === "forex"             ? "FX"     :
    type === "crypto"            ? "CRYPTO" :
    market === "HK" || type === "hk" ? "港股"   :
    market === "CN" || type === "cn" ? "A股"    : "US";

  const color =
    type === "forex"             ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" :
    type === "crypto"            ? "bg-purple-500/15 text-purple-400 border-purple-500/30" :
    market === "HK" || type === "hk" ? "bg-amber-500/15 text-amber-400 border-amber-500/30" :
    market === "CN" || type === "cn" ? "bg-red-500/15 text-red-400 border-red-500/30" :
                                       "bg-blue-500/15 text-blue-400 border-blue-500/30";

  return (
    <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded border", color)}>
      {label}
    </span>
  );
}

// ── Asset icon ────────────────────────────────────────────────────────────

function AssetIcon({ type, symbol }: { type: string; symbol: string }) {
  const colors: Record<string, string> = {
    forex:  "bg-emerald-500/15 text-emerald-400",
    crypto: "bg-purple-500/15 text-purple-400",
    hk:     "bg-amber-500/15 text-amber-400",
    cn:     "bg-red-500/15 text-red-400",
    stock:  "bg-blue-500/15 text-blue-400",
  };
  // Forex: show 3-letter base currency (e.g. "USD" for USDCNY)
  const label = type === "forex"
    ? symbol.slice(0, 3)
    : symbol.replace("USDT","").replace(/^(HK|CN)/,"").slice(0,2);
  return (
    <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold shrink-0", colors[type] ?? colors.stock)}>
      {label}
    </div>
  );
}

// ── Result row ────────────────────────────────────────────────────────────

function ResultRow({
  result, inWatchlist, focused, onToggle,
}: {
  result: SearchResult;
  inWatchlist: boolean;
  focused: boolean;
  onToggle: () => void;
}) {
  const { lang } = useTradingStore();
  const displayName = lang === "zh" && result.nameCN ? result.nameCN : result.name;
  const ticker = result.type === "forex"
    ? result.symbol.slice(0, 3) + "/" + result.symbol.slice(3)
    : result.symbol.replace("USDT","").replace(/^(HK|CN)/,"");

  return (
    <button
      onClick={onToggle}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 transition-colors text-left",
        focused ? "bg-[var(--surface-2)]" : "hover:bg-[var(--surface-2)]"
      )}
    >
      <AssetIcon type={result.type} symbol={result.symbol} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-sm font-semibold text-[var(--foreground)] truncate">{ticker}</span>
          <TypeBadge type={result.type} market={result.market} />
          {result.source === "yahoo" && (
            <span className="text-[9px] text-[var(--muted)] border border-[var(--border)] rounded px-1">LIVE</span>
          )}
        </div>
        <div className="text-[11px] text-[var(--muted)] truncate">{displayName}</div>
      </div>

      <div className={cn(
        "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors",
        inWatchlist
          ? "bg-[var(--accent)]/15 text-[var(--accent)] border border-[var(--accent)]/30"
          : "border border-[var(--border)] text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
      )}>
        {inWatchlist ? <Check size={13} /> : <Plus size={13} />}
      </div>
    </button>
  );
}

// ── Main modal ────────────────────────────────────────────────────────────

export function AddAssetModal({ onClose }: { onClose: () => void }) {
  const t = useT();
  const { watchlist, addToWatchlist, removeFromWatchlist } = useTradingStore();
  const watchSet = new Set(watchlist.map((w) => w.symbol));

  const [query,     setQuery]     = useState("");
  const [results,   setResults]   = useState<SearchResult[]>([]);
  const [loading,   setLoading]   = useState(false);
  const [focusIdx,  setFocusIdx]  = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Focus input on mount
  useEffect(() => { inputRef.current?.focus(); }, []);

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Search: local catalog first (instant), then Yahoo Finance (debounced)
  const runSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return; }

    // Tier 1: instant local
    const local = searchAssets(q, 12).map((a) => ({
      symbol: a.symbol, yfTicker: a.yfTicker,
      name: a.name, nameCN: a.nameCN,
      type: a.type, market: a.market,
      currency: a.currency, source: "catalog" as const,
    }));
    setResults(local);
    setFocusIdx(0);

    // Tier 2: live Yahoo (debounced)
    setLoading(true);
    try {
      const res  = await fetch(`/api/search?q=${encodeURIComponent(q)}&limit=16`);
      const data = await res.json() as { results: SearchResult[] };
      setResults(data.results);
      setFocusIdx(0);
    } catch {
      // keep local results on failure
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!query.trim()) { setResults([]); return; }
    // Instant for local; API after 400ms
    const local = searchAssets(query, 8).map((a) => ({
      symbol: a.symbol, yfTicker: a.yfTicker,
      name: a.name, nameCN: a.nameCN,
      type: a.type, market: a.market,
      currency: a.currency, source: "catalog" as const,
    }));
    setResults(local);
    timerRef.current = setTimeout(() => runSearch(query), 400);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [query, runSearch]);

  // Keyboard navigation
  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") { e.preventDefault(); setFocusIdx((i) => Math.min(i + 1, results.length - 1)); }
    if (e.key === "ArrowUp")   { e.preventDefault(); setFocusIdx((i) => Math.max(i - 1, 0)); }
    if (e.key === "Enter" && results[focusIdx]) { e.preventDefault(); toggle(results[focusIdx]); }
  }

  function toggle(r: SearchResult) {
    if (watchSet.has(r.symbol)) {
      removeFromWatchlist(r.symbol);
    } else {
      addToWatchlist({
        symbol:   r.symbol,
        name:     r.name,
        nameCN:   r.nameCN || r.name,
        type:     r.type as AssetType,
        yfTicker: r.yfTicker !== r.symbol ? r.yfTicker : undefined,
        currency: r.currency as "USD" | "HKD" | "CNY",
      });
    }
  }

  // Popular suggestions when no query
  const SUGGESTIONS = [
    { group: t.watchlist.forex,     symbols: ["USDCNY","EURCNY","GBPCNY","JPYCNY"] },
    { group: t.watchlist.crypto,    symbols: ["BTCUSDT","ETHUSDT","SOLUSDT","BNBUSDT"] },
    { group: t.watchlist.equities,  symbols: ["AAPL","NVDA","META","AMZN"] },
    { group: t.watchlist.cnHk,      symbols: ["HK0700","HK3690","HK9988","HK1024"] },
    { group: t.watchlist.mainlandCN,symbols: ["CNMTAI","CNCATL","CNBYD","CNCMB"] },
  ];

  const { lang } = useTradingStore();
  function suggName(sym: string) {
    const found = searchAssets(sym, 1).find((a) => a.symbol === sym);
    if (!found) return sym;
    return lang === "zh" ? found.nameCN : found.name;
  }

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-lg mx-4 bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden">

        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[var(--border)]">
          <Search size={16} className="text-[var(--muted)] shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={t.watchlist.addSearchPlaceholder}
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--muted)]"
          />
          {loading && <Loader2 size={14} className="text-[var(--muted)] animate-spin shrink-0" />}
          <button onClick={onClose} className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Results or suggestions */}
        <div className="max-h-[60vh] overflow-y-auto">
          {query.trim() ? (
            results.length > 0 ? (
              results.map((r, i) => (
                <ResultRow
                  key={r.symbol}
                  result={r}
                  inWatchlist={watchSet.has(r.symbol)}
                  focused={i === focusIdx}
                  onToggle={() => toggle(r)}
                />
              ))
            ) : !loading ? (
              <div className="py-12 text-center text-[var(--muted)] text-sm">
                <Globe size={28} className="mx-auto mb-3 opacity-30" />
                <p>{t.watchlist.noResults}</p>
                <p className="text-xs mt-1 opacity-60">{t.watchlist.noResultsSub}</p>
              </div>
            ) : null
          ) : (
            /* Suggestions */
            <div className="p-3 space-y-4">
              <p className="text-[10px] font-semibold text-[var(--muted)] uppercase tracking-widest px-1">
                {t.watchlist.popular}
              </p>
              {SUGGESTIONS.map((s) => (
                <div key={s.group}>
                  <p className="text-[10px] text-[var(--muted)] uppercase tracking-widest px-1 mb-2">{s.group}</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {s.symbols.map((sym) => {
                      const inList = watchSet.has(sym);
                      return (
                        <button
                          key={sym}
                          onClick={() => {
                            const found = searchAssets(sym, 1).find((a) => a.symbol === sym);
                            if (!found) return;
                            if (inList) removeFromWatchlist(sym);
                            else addToWatchlist({ symbol: found.symbol, name: found.name, nameCN: found.nameCN, type: found.type as AssetType });
                          }}
                          className={cn(
                            "flex items-center gap-2 px-3 py-2 rounded-xl text-left transition-colors border",
                            inList
                              ? "bg-[var(--accent)]/10 border-[var(--accent)]/30 text-[var(--foreground)]"
                              : "bg-[var(--surface-2)] border-transparent hover:border-[var(--border)] text-[var(--foreground)]"
                          )}
                        >
                          <span className="text-xs font-bold truncate flex-1">
                            {(() => {
                              const entry = searchAssets(sym, 1).find((a) => a.symbol === sym);
                              if (entry?.type === "forex") return sym.slice(0,3) + "/" + sym.slice(3);
                              return sym.replace("USDT","").replace(/^(HK|CN)/,"");
                            })()}
                          </span>
                          <span className="text-[10px] text-[var(--muted)] truncate hidden sm:block">{suggName(sym)}</span>
                          {inList
                            ? <Check size={11} className="text-[var(--accent)] shrink-0" />
                            : <Plus  size={11} className="text-[var(--muted)] shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-[var(--border)] flex items-center justify-between">
          <span className="text-[10px] text-[var(--muted)]">
            {watchlist.length} {t.watchlist.watching}
          </span>
          <span className="text-[10px] text-[var(--muted)]">↑↓ {t.watchlist.navigate} · Enter {t.watchlist.addRemove} · Esc {t.watchlist.closeModal}</span>
        </div>
      </div>
    </div>
  );
}
