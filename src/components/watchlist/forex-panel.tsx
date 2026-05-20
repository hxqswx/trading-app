"use client";

/**
 * ForexPanel — dedicated left-sidebar tab for exchange rates.
 *
 * Two sections:
 *   人民币汇率 / CNY Rates  — 10 major CNY pairs
 *   主要货币对 / Major Pairs — EUR/USD, USD/JPY, GBP/USD
 *
 * Prices come from the Zustand store (seeded by Yahoo Finance =X tickers).
 * Each row shows: base-currency icon · pair · rate · % change · sparkline.
 */

import { useTradingStore } from "@/lib/store";
import { useT } from "@/lib/hooks/use-t";
import { fmtPercent, colorClass } from "@/lib/utils";
import { Sparkline } from "@/components/ui/sparkline";
import { useRouter } from "next/navigation";

// ── Hard-coded forex catalog for the panel ────────────────────────────────

interface FxEntry { symbol: string; base: string; quote: string; nameCN: string; name: string }

const CNY_PAIRS: FxEntry[] = [
  { symbol: "USDCNY", base: "USD", quote: "CNY", nameCN: "美元",      name: "US Dollar"        },
  { symbol: "EURCNY", base: "EUR", quote: "CNY", nameCN: "欧元",      name: "Euro"             },
  { symbol: "GBPCNY", base: "GBP", quote: "CNY", nameCN: "英镑",      name: "British Pound"    },
  { symbol: "JPYCNY", base: "JPY", quote: "CNY", nameCN: "日元",      name: "Japanese Yen"     },
  { symbol: "HKDCNY", base: "HKD", quote: "CNY", nameCN: "港元",      name: "HK Dollar"        },
  { symbol: "AUDCNY", base: "AUD", quote: "CNY", nameCN: "澳元",      name: "Aus Dollar"       },
  { symbol: "CADCNY", base: "CAD", quote: "CNY", nameCN: "加元",      name: "Can Dollar"       },
  { symbol: "CHFCNY", base: "CHF", quote: "CNY", nameCN: "瑞郎",      name: "Swiss Franc"      },
  { symbol: "SGDCNY", base: "SGD", quote: "CNY", nameCN: "新加坡元",  name: "Singapore Dollar" },
  { symbol: "KRWCNY", base: "KRW", quote: "CNY", nameCN: "韩元",      name: "Korean Won"       },
];

const MAJOR_PAIRS: FxEntry[] = [
  { symbol: "EURUSD", base: "EUR", quote: "USD", nameCN: "欧元/美元", name: "Euro / USD"    },
  { symbol: "USDJPY", base: "USD", quote: "JPY", nameCN: "美元/日元", name: "USD / Yen"     },
  { symbol: "GBPUSD", base: "GBP", quote: "USD", nameCN: "英镑/美元", name: "Pound / USD"  },
];

// ── Colour palette for each base currency ────────────────────────────────

const BASE_COLOR: Record<string, string> = {
  USD: "bg-blue-500/15 text-blue-400",
  EUR: "bg-indigo-500/15 text-indigo-400",
  GBP: "bg-violet-500/15 text-violet-400",
  JPY: "bg-rose-500/15 text-rose-400",
  HKD: "bg-amber-500/15 text-amber-400",
  AUD: "bg-cyan-500/15 text-cyan-400",
  CAD: "bg-orange-500/15 text-orange-400",
  CHF: "bg-red-500/15 text-red-400",
  SGD: "bg-teal-500/15 text-teal-400",
  KRW: "bg-pink-500/15 text-pink-400",
};

// ── Rate formatting ──────────────────────────────────────────────────────

function fmtRate(price: number): string {
  if (price < 0.01)  return price.toFixed(6);
  if (price < 1)     return price.toFixed(4);
  if (price < 10)    return price.toFixed(4);
  return price.toFixed(4);
}

// ── Section label ─────────────────────────────────────────────────────────

function SectionLabel({ label }: { label: string }) {
  return (
    <div className="px-4 py-2 text-[10px] font-semibold text-[var(--muted)] uppercase tracking-widest bg-[var(--surface)]">
      {label}
    </div>
  );
}

// ── Single rate row ───────────────────────────────────────────────────────

function FxRow({ entry }: { entry: FxEntry }) {
  const { quotes, priceHistory, lang, activeSymbol, setActiveSymbol } = useTradingStore();
  const router = useRouter();
  const quote   = quotes[entry.symbol];
  const history = priceHistory[entry.symbol] ?? [];

  const price   = quote?.price;
  const pct     = quote?.changePct ?? 0;
  const isUp    = pct >= 0;
  const active  = activeSymbol === entry.symbol;

  const iconCls = BASE_COLOR[entry.base] ?? "bg-emerald-500/15 text-emerald-400";
  const label   = lang === "zh" ? entry.nameCN : entry.name;

  function handleClick() {
    setActiveSymbol(entry.symbol);
    router.push(`/trade/${entry.symbol}`);
  }

  return (
    <button
      onClick={handleClick}
      className={`w-full flex items-center gap-3 px-4 py-2.5 transition-colors text-left border-l-2 ${
        active
          ? "bg-[var(--surface-2)] border-emerald-500"
          : "border-transparent hover:bg-[var(--surface-2)]"
      }`}
    >
      {/* Base currency icon */}
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0 ${iconCls}`}>
        {entry.base}
      </div>

      {/* Pair + name */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-1">
          <span className="text-sm font-semibold tabular-nums">{entry.base}/{entry.quote}</span>
          {price !== undefined
            ? <span className="text-xs font-mono font-semibold shrink-0 tabular-nums">{fmtRate(price)}</span>
            : <span className="text-xs text-[var(--muted)] animate-pulse">…</span>
          }
        </div>
        <div className="flex items-center justify-between mt-0.5">
          <span className="text-[11px] text-[var(--muted)] truncate">{label}</span>
          {quote && (
            <span className={`text-[11px] font-mono shrink-0 ${colorClass(pct)}`}>
              {fmtPercent(pct)}
            </span>
          )}
        </div>
      </div>

      {/* Sparkline */}
      {history.length > 4 && (
        <Sparkline data={history.slice(-24)} width={44} height={22} positive={isUp} />
      )}
    </button>
  );
}

// ── Main panel ────────────────────────────────────────────────────────────

export function ForexPanel() {
  const t = useT();

  return (
    <div className="flex flex-col h-full bg-[var(--surface)]">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-[var(--border)] shrink-0">
        <h2 className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">
          {t.forexPanel.title}
          <span className="ml-1.5 text-[var(--muted)]/60 normal-case tracking-normal font-normal">
            · {t.forexPanel.subtitle}
          </span>
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* CNY rates */}
        <SectionLabel label={t.forexPanel.cnyRates} />
        {CNY_PAIRS.map((e) => <FxRow key={e.symbol} entry={e} />)}

        {/* Major crosses */}
        <SectionLabel label={t.forexPanel.majorPairs} />
        {MAJOR_PAIRS.map((e) => <FxRow key={e.symbol} entry={e} />)}
      </div>
    </div>
  );
}
