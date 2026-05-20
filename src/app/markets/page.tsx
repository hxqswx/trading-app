"use client";

import { useTradingStore, DEFAULT_WATCHLIST } from "@/lib/store";
import { useT } from "@/lib/hooks/use-t";
import { fmtPercent, colorClass, fmtLarge } from "@/lib/utils";
import { currencySymbol, ASSET_META } from "@/lib/mock";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown } from "lucide-react";
import { useRouter } from "next/navigation";
import type { Quote } from "@/lib/types";

// ── Forex catalog (same order as ForexPanel) ───────────────────────────────

interface FxEntry {
  symbol: string; base: string; quote: string;
  nameCN: string; name: string;
}

const CNY_PAIRS: FxEntry[] = [
  { symbol: "USDCNY", base: "USD", quote: "CNY", nameCN: "美元兑人民币",     name: "US Dollar / CNY"          },
  { symbol: "EURCNY", base: "EUR", quote: "CNY", nameCN: "欧元兑人民币",     name: "Euro / CNY"               },
  { symbol: "GBPCNY", base: "GBP", quote: "CNY", nameCN: "英镑兑人民币",     name: "British Pound / CNY"      },
  { symbol: "JPYCNY", base: "JPY", quote: "CNY", nameCN: "日元兑人民币",     name: "Japanese Yen / CNY"       },
  { symbol: "HKDCNY", base: "HKD", quote: "CNY", nameCN: "港元兑人民币",     name: "HK Dollar / CNY"          },
  { symbol: "AUDCNY", base: "AUD", quote: "CNY", nameCN: "澳元兑人民币",     name: "Australian Dollar / CNY"  },
  { symbol: "CADCNY", base: "CAD", quote: "CNY", nameCN: "加元兑人民币",     name: "Canadian Dollar / CNY"    },
  { symbol: "CHFCNY", base: "CHF", quote: "CNY", nameCN: "瑞郎兑人民币",     name: "Swiss Franc / CNY"        },
  { symbol: "SGDCNY", base: "SGD", quote: "CNY", nameCN: "新加坡元兑人民币", name: "Singapore Dollar / CNY"   },
  { symbol: "KRWCNY", base: "KRW", quote: "CNY", nameCN: "韩元兑人民币",     name: "Korean Won / CNY"         },
];

const MAJOR_PAIRS: FxEntry[] = [
  { symbol: "EURUSD", base: "EUR", quote: "USD", nameCN: "欧元兑美元", name: "Euro / US Dollar"       },
  { symbol: "USDJPY", base: "USD", quote: "JPY", nameCN: "美元兑日元", name: "US Dollar / Japanese Yen"},
  { symbol: "GBPUSD", base: "GBP", quote: "USD", nameCN: "英镑兑美元", name: "British Pound / USD"     },
];

/** Per-base-currency icon colours */
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

function fmtRate(price: number): string {
  if (price < 0.01) return price.toFixed(6);
  return price.toFixed(4);
}

// ── Page ──────────────────────────────────────────────────────────────────

export default function MarketsPage() {
  const { quotes, setActiveSymbol, lang } = useTradingStore();
  const t = useT();
  const router = useRouter();

  function goToTrade(symbol: string) {
    setActiveSymbol(symbol);
    router.push(`/trade/${symbol}`);
  }

  const stocks  = DEFAULT_WATCHLIST.filter((w) => w.type === "stock");
  const cryptos = DEFAULT_WATCHLIST.filter((w) => w.type === "crypto");
  const hk      = DEFAULT_WATCHLIST.filter((w) => w.type === "hk");
  const cn      = DEFAULT_WATCHLIST.filter((w) => w.type === "cn");

  return (
    <div className="p-4 md:p-6 flex flex-col gap-6 md:gap-8">
      <div>
        <h1 className="text-xl font-bold">{t.markets.title}</h1>
        <p className="text-sm text-[var(--muted)] mt-0.5">{t.markets.subtitle}</p>
      </div>

      {/* ── Forex — pinned at top ─────────────────────────────────────── */}
      <ForexSection quotes={quotes} onSelect={goToTrade} lang={lang} />

      {/* ── Traditional markets ──────────────────────────────────────── */}
      <AssetSection title={t.markets.usEquities}  items={stocks}  quotes={quotes} onSelect={goToTrade} lang={lang} />
      <AssetSection title={t.markets.mainlandCN}  items={cn}      quotes={quotes} onSelect={goToTrade} lang={lang} />
      <AssetSection title={t.markets.chinaHK}     items={hk}      quotes={quotes} onSelect={goToTrade} lang={lang} />
      <AssetSection title={t.markets.crypto}      items={cryptos} quotes={quotes} onSelect={goToTrade} lang={lang} />
    </div>
  );
}

// ── ForexSection ──────────────────────────────────────────────────────────

function ForexSection({
  quotes, onSelect, lang,
}: {
  quotes: Record<string, Quote>;
  onSelect: (symbol: string) => void;
  lang: string;
}) {
  const t = useT();

  function FxRow({ entry, isLast }: { entry: FxEntry; isLast: boolean }) {
    const q   = quotes[entry.symbol];
    const up  = (q?.changePct ?? 0) >= 0;
    const iconCls = BASE_COLOR[entry.base] ?? "bg-emerald-500/15 text-emerald-400";
    const name    = lang === "zh" ? entry.nameCN : entry.name;

    return (
      <tr
        onClick={() => onSelect(entry.symbol)}
        className={`${isLast ? "" : "border-b border-[var(--border)]"} hover:bg-[var(--surface-2)] cursor-pointer transition-colors`}
      >
        {/* Pair cell */}
        <td className="px-5 py-3.5">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0 ${iconCls}`}>
              {entry.base}
            </div>
            <div>
              <div className="font-semibold">{entry.base}/{entry.quote}</div>
              <div className="text-xs text-[var(--muted)]">{name}</div>
            </div>
            <Badge variant="emerald" className="ml-1">FX</Badge>
          </div>
        </td>

        {q ? (
          <>
            {/* Rate */}
            <td className="px-5 py-3.5 text-right font-mono font-semibold">
              {fmtRate(q.price)}
            </td>
            {/* Change */}
            <td className={`px-5 py-3.5 text-right font-mono ${colorClass(q.changePct)}`}>
              <span className="flex items-center justify-end gap-1">
                {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {fmtPercent(q.changePct)}
              </span>
            </td>
            {/* High */}
            <td className="px-5 py-3.5 text-right font-mono text-[var(--muted)]">
              {fmtRate(q.high)}
            </td>
            {/* Low */}
            <td className="px-5 py-3.5 text-right font-mono text-[var(--muted)]">
              {fmtRate(q.low)}
            </td>
            {/* Volume — not meaningful for FX */}
            <td className="px-5 py-3.5 text-right font-mono text-[var(--muted)]/40">—</td>
          </>
        ) : (
          <td colSpan={5} className="px-5 py-3.5 text-right text-xs text-[var(--muted)] animate-pulse">
            {t.forexPanel.loading}
          </td>
        )}
      </tr>
    );
  }

  const allPairs = [...CNY_PAIRS, ...MAJOR_PAIRS];

  return (
    <section>
      {/* Section header with emerald accent */}
      <div className="flex items-center gap-3 mb-3">
        <h2 className="text-sm font-semibold text-[var(--muted)] uppercase tracking-wider">
          {t.markets.forex}
        </h2>
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
          {lang === "zh" ? "人民币汇率 · 主要货币对" : "CNY Rates · Major Pairs"}
        </span>
      </div>

      <Card className="p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-xs text-[var(--muted)] uppercase tracking-wide">
              {[t.markets.pair, t.markets.rate, t.markets.change24h, t.table.high, t.table.low, t.markets.volume].map((h, i) => (
                <th key={i} className={`px-5 py-3 font-medium ${i === 0 ? "text-left" : "text-right"}`}>{h}</th>
              ))}
            </tr>
          </thead>

          {/* CNY Rates sub-group */}
          <tbody>
            <tr>
              <td colSpan={6} className="px-5 pt-3 pb-1">
                <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-widest">
                  {t.forexPanel.cnyRates}
                </span>
              </td>
            </tr>
            {CNY_PAIRS.map((e, i) => (
              <FxRow key={e.symbol} entry={e} isLast={i === CNY_PAIRS.length - 1} />
            ))}
          </tbody>

          {/* Major crosses sub-group */}
          <tbody>
            <tr className="border-t border-[var(--border)]">
              <td colSpan={6} className="px-5 pt-3 pb-1">
                <span className="text-[10px] font-semibold text-[var(--muted)] uppercase tracking-widest">
                  {t.forexPanel.majorPairs}
                </span>
              </td>
            </tr>
            {MAJOR_PAIRS.map((e, i) => (
              <FxRow key={e.symbol} entry={e} isLast={i === MAJOR_PAIRS.length - 1} />
            ))}
          </tbody>
        </table>
      </Card>
    </section>
  );
}

// ── AssetSection (unchanged) ──────────────────────────────────────────────

function AssetSection({
  title, items, quotes, onSelect, lang,
}: {
  title: string;
  items: typeof DEFAULT_WATCHLIST;
  quotes: Record<string, Quote>;
  onSelect: (symbol: string) => void;
  lang: string;
}) {
  const t = useT();

  if (items.length === 0) return null;

  return (
    <section>
      <h2 className="text-sm font-semibold text-[var(--muted)] uppercase tracking-wider mb-3">{title}</h2>
      <Card className="p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-xs text-[var(--muted)] uppercase tracking-wide">
              {[t.table.asset, t.table.current, t.markets.change24h, t.table.high, t.table.low, t.markets.volume].map((h, i) => (
                <th key={i} className={`px-5 py-3 font-medium ${i === 0 ? "text-left" : "text-right"}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const q    = quotes[item.symbol];
              const meta = ASSET_META[item.symbol];
              const up   = (q?.changePct ?? 0) >= 0;
              const sym  = currencySymbol(meta?.currency ?? "USD");
              const ticker = item.symbol.replace("USDT","").replace(/^HK/,"");
              const name   = lang === "zh" && meta?.nameCN ? meta.nameCN : (meta?.name ?? item.name);
              const badgeVariant = item.type === "crypto" ? "purple" : item.type === "hk" ? "yellow" : item.type === "cn" ? "cn" : "default";
              const badgeLabel   = item.type === "crypto" ? t.badge.crypto : item.type === "hk" ? t.badge.hk : item.type === "cn" ? t.badge.cn : t.badge.stock;
              const iconBg = item.type === "crypto"
                ? "bg-[rgba(188,140,255,0.15)] text-[var(--purple)]"
                : item.type === "hk"
                ? "bg-[rgba(255,160,0,0.15)] text-[var(--yellow)]"
                : item.type === "cn"
                ? "bg-[rgba(248,81,73,0.10)] text-[#ff6b6b]"
                : "bg-[rgba(88,166,255,0.15)] text-[var(--accent)]";

              return (
                <tr
                  key={item.symbol}
                  onClick={() => onSelect(item.symbol)}
                  className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface-2)] cursor-pointer transition-colors"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${iconBg}`}>
                        {ticker.slice(0, 2)}
                      </div>
                      <div>
                        <div className="font-semibold">{ticker}</div>
                        <div className="text-xs text-[var(--muted)]">{name}</div>
                      </div>
                      <Badge variant={badgeVariant} className="ml-1">{badgeLabel}</Badge>
                    </div>
                  </td>
                  {q ? (
                    <>
                      <td className="px-5 py-4 text-right font-mono font-semibold">
                        {sym}{q.price.toLocaleString("en-US", { minimumFractionDigits: q.price < 10 ? 4 : 2, maximumFractionDigits: q.price < 10 ? 4 : 2 })}
                      </td>
                      <td className={`px-5 py-4 text-right font-mono ${colorClass(q.changePct)}`}>
                        <span className="flex items-center justify-end gap-1">
                          {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                          {fmtPercent(q.changePct)}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right font-mono text-[var(--muted)]">
                        {sym}{q.high.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-5 py-4 text-right font-mono text-[var(--muted)]">
                        {sym}{q.low.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-5 py-4 text-right font-mono text-[var(--muted)]">{fmtLarge(q.volume)}</td>
                    </>
                  ) : (
                    <td colSpan={5} className="px-5 py-4 text-right text-xs text-[var(--muted)] animate-pulse">
                      {t.forexPanel.loading}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </section>
  );
}
