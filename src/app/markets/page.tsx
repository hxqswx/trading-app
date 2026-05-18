"use client";

import { useTradingStore, DEFAULT_WATCHLIST } from "@/lib/store";
import { fmtCurrency, fmtPercent, fmtLarge, colorClass } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown } from "lucide-react";
import { useRouter } from "next/navigation";

export default function MarketsPage() {
  const { quotes, setActiveSymbol } = useTradingStore();
  const router = useRouter();

  function goToTrade(symbol: string) {
    setActiveSymbol(symbol);
    router.push(`/trade/${symbol}`);
  }

  const stocks  = DEFAULT_WATCHLIST.filter((w) => w.type === "stock");
  const cryptos = DEFAULT_WATCHLIST.filter((w) => w.type === "crypto");

  return (
    <div className="p-6 flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-bold">Markets</h1>
        <p className="text-sm text-[var(--muted)] mt-0.5">Live prices across all assets</p>
      </div>

      <AssetSection title="Equities" items={stocks}  quotes={quotes} onSelect={goToTrade} />
      <AssetSection title="Crypto"   items={cryptos} quotes={quotes} onSelect={goToTrade} />
    </div>
  );
}

function AssetSection({
  title,
  items,
  quotes,
  onSelect,
}: {
  title: string;
  items: typeof DEFAULT_WATCHLIST;
  quotes: Record<string, import("@/lib/types").Quote>;
  onSelect: (symbol: string) => void;
}) {
  return (
    <section>
      <h2 className="text-sm font-semibold text-[var(--muted)] uppercase tracking-wider mb-3">{title}</h2>
      <Card className="p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-xs text-[var(--muted)] uppercase tracking-wide">
              {["Asset", "Price", "24h Change", "High", "Low", "Volume"].map((h) => (
                <th key={h} className={`px-5 py-3 font-medium ${h === "Asset" ? "text-left" : "text-right"}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const q  = quotes[item.symbol];
              const up = (q?.changePct ?? 0) >= 0;
              return (
                <tr
                  key={item.symbol}
                  onClick={() => onSelect(item.symbol)}
                  className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface-2)] cursor-pointer transition-colors"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                        item.type === "crypto"
                          ? "bg-[rgba(188,140,255,0.15)] text-[var(--purple)]"
                          : "bg-[rgba(88,166,255,0.15)] text-[var(--accent)]"
                      }`}>
                        {item.symbol.slice(0, 2)}
                      </div>
                      <div>
                        <div className="font-semibold">{item.symbol.replace("USDT", "")}</div>
                        <div className="text-xs text-[var(--muted)]">{item.name}</div>
                      </div>
                      <Badge variant={item.type === "crypto" ? "purple" : "default"} className="ml-1">
                        {item.type}
                      </Badge>
                    </div>
                  </td>
                  {q ? (
                    <>
                      <td className="px-5 py-4 text-right font-mono font-semibold">
                        {fmtCurrency(q.price, q.price < 10 ? 4 : 2)}
                      </td>
                      <td className={`px-5 py-4 text-right font-mono ${colorClass(q.changePct)}`}>
                        <span className="flex items-center justify-end gap-1">
                          {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                          {fmtPercent(q.changePct)}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right font-mono text-[var(--muted)]">{fmtCurrency(q.high, 2)}</td>
                      <td className="px-5 py-4 text-right font-mono text-[var(--muted)]">{fmtCurrency(q.low, 2)}</td>
                      <td className="px-5 py-4 text-right font-mono text-[var(--muted)]">{fmtLarge(q.volume)}</td>
                    </>
                  ) : (
                    <td colSpan={5} className="px-5 py-4 text-right text-xs text-[var(--muted)] animate-pulse">
                      Loading…
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
