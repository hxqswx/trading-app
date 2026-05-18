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

      <AssetSection title={t.markets.usEquities}  items={stocks}  quotes={quotes} onSelect={goToTrade} lang={lang} />
      <AssetSection title={t.markets.mainlandCN}  items={cn}      quotes={quotes} onSelect={goToTrade} lang={lang} />
      <AssetSection title={t.markets.chinaHK}     items={hk}      quotes={quotes} onSelect={goToTrade} lang={lang} />
      <AssetSection title={t.markets.crypto}      items={cryptos} quotes={quotes} onSelect={goToTrade} lang={lang} />
    </div>
  );
}

function AssetSection({
  title,
  items,
  quotes,
  onSelect,
  lang,
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
                      {t.loading}
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
