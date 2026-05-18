"use client";

import { useTradingStore } from "@/lib/store";
import { useT } from "@/lib/hooks/use-t";
import { fmtPercent, colorClass } from "@/lib/utils";
import { Activity, TrendingUp, TrendingDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Quote } from "@/lib/types";
import { currencySymbol } from "@/lib/mock";

export function Topbar() {
  const { activeSymbol, quotes, lang, setLang } = useTradingStore();
  const t     = useT();
  const quote = quotes[activeSymbol];

  return (
    <header className="h-14 border-b border-[var(--border)] bg-[var(--surface)] flex items-center px-4 gap-4 sticky top-0 z-10 shrink-0">
      {/* Logo — hidden when desktop sidebar shows it */}
      <div className="flex items-center gap-2 shrink-0 md:hidden">
        <div className="w-7 h-7 rounded-lg bg-[var(--accent)] flex items-center justify-center">
          <Activity size={14} className="text-white" />
        </div>
        <span className="font-bold text-sm tracking-tight">TradeAI</span>
      </div>

      {/* Desktop brand (sidebar shows logo, topbar shows text on md+) */}
      <div className="hidden md:flex items-center gap-2 shrink-0">
        <span className="font-bold text-sm tracking-tight text-[var(--muted)]">TradeAI</span>
      </div>

      <div className="h-5 w-px bg-[var(--border)] shrink-0" />

      {/* Active ticker */}
      {quote
        ? <ActiveTicker quote={quote} />
        : <div className="h-4 w-32 rounded bg-[var(--surface-2)] animate-pulse" />}

      {/* Ticker tape — only on lg+ */}
      <div className="flex-1 overflow-hidden hidden lg:block">
        <TickerTape />
      </div>

      <div className="flex-1 hidden lg:block" />

      {/* Live indicator */}
      <div className="flex items-center gap-1.5 text-xs text-[var(--muted)] shrink-0">
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--green)] animate-pulse" />
        <span className="hidden sm:block">{t.topbar.live}</span>
      </div>

      {/* Lang toggle — mobile only (desktop uses sidebar) */}
      <button
        onClick={() => setLang(lang === "en" ? "zh" : "en")}
        className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold bg-[var(--surface-2)] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white transition-colors shrink-0"
      >
        {lang === "en" ? "中" : "EN"}
      </button>
    </header>
  );
}

function ActiveTicker({ quote }: { quote: Quote }) {
  const prevRef = useRef(quote.price);
  const [flash, setFlash] = useState<"up" | "down" | null>(null);

  useEffect(() => {
    if (quote.price !== prevRef.current) {
      setFlash(quote.price > prevRef.current ? "up" : "down");
      prevRef.current = quote.price;
      const t = setTimeout(() => setFlash(null), 600);
      return () => clearTimeout(t);
    }
  }, [quote.price]);

  const up  = quote.changePct >= 0;
  const sym = currencySymbol(quote.currency);
  const dec = quote.price < 10 ? 4 : 2;

  return (
    <div className="flex items-center gap-2 shrink-0">
      <span className="text-xs font-semibold text-[var(--muted)]">
        {quote.symbol.replace("USDT","").replace(/^(HK|CN)/,"")}
      </span>
      <span className={`text-sm font-mono font-bold transition-colors duration-300 ${
        flash === "up" ? "text-[var(--green)]" : flash === "down" ? "text-[var(--red)]" : ""
      }`}>
        {sym}{quote.price.toLocaleString("en-US", { minimumFractionDigits: dec, maximumFractionDigits: dec })}
      </span>
      <span className={`hidden sm:flex items-center gap-0.5 text-xs font-mono ${colorClass(quote.changePct)}`}>
        {up ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
        {fmtPercent(quote.changePct)}
      </span>
    </div>
  );
}

function TickerTape() {
  const { quotes } = useTradingStore();
  const items = Object.values(quotes);
  if (!items.length) return null;
  const combined = [...items, ...items];

  return (
    <div className="relative overflow-hidden">
      <div className="flex gap-6 animate-ticker whitespace-nowrap">
        {combined.map((q, i) => {
          const sym = currencySymbol(q.currency);
          const dec = q.price < 10 ? 4 : 2;
          return (
            <span key={`${q.symbol}-${i}`} className="inline-flex items-center gap-1.5 text-xs shrink-0">
              <span className="text-[var(--muted)]">{q.symbol.replace("USDT","").replace(/^(HK|CN)/,"")}</span>
              <span className="font-mono">{sym}{q.price.toLocaleString("en-US",{minimumFractionDigits:dec,maximumFractionDigits:dec})}</span>
              <span className={`font-mono ${colorClass(q.changePct)}`}>{fmtPercent(q.changePct)}</span>
            </span>
          );
        })}
      </div>
      <style>{`
        @keyframes ticker { 0% { transform:translateX(0) } 100% { transform:translateX(-50%) } }
        .animate-ticker { animation: ticker 60s linear infinite; }
      `}</style>
    </div>
  );
}
