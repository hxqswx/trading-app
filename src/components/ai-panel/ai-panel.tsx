"use client";

import { useState } from "react";
import { useTradingStore } from "@/lib/store";
import { useT } from "@/lib/hooks/use-t";
import type { AIAnalysis, Candle, Quote } from "@/lib/types";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, TrendingUp, TrendingDown, Minus, ShieldAlert, RefreshCw } from "lucide-react";
import { fmtTime } from "@/lib/utils";
import { currencySymbol } from "@/lib/mock";

interface AIPanelProps { symbol: string }

export function AIPanel({ symbol }: AIPanelProps) {
  const { quotes, aiAnalysis, setAIAnalysis, lang } = useTradingStore();
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const t = useT();

  const analysis = aiAnalysis[symbol];
  const quote    = quotes[symbol];

  async function runAnalysis() {
    if (!quote) return;
    setLoading(true);
    setError(null);
    try {
      const candleRes = await fetch(`/api/candles?symbol=${symbol}&interval=1h&limit=20`);
      const candles: Candle[] = await candleRes.json();

      const res = await fetch("/api/ai-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol, quote, candles, lang }),
      });
      const data = await res.json() as AIAnalysis | { error: string };
      if ("error" in data) { setError(data.error); return; }
      setAIAnalysis(data);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  const sentimentIcon =
    analysis?.sentiment === "bullish" ? <TrendingUp  size={14} /> :
    analysis?.sentiment === "bearish" ? <TrendingDown size={14} /> :
                                        <Minus size={14} />;
  const sentimentVariant = analysis?.sentiment === "bullish" ? "green" : analysis?.sentiment === "bearish" ? "red" : "yellow";
  const riskVariant      = analysis?.riskLevel === "low" ? "green" : analysis?.riskLevel === "medium" ? "yellow" : "red";

  const sentimentLabel =
    analysis?.sentiment === "bullish" ? t.ai.bullish :
    analysis?.sentiment === "bearish" ? t.ai.bearish : t.ai.neutral;

  const riskLabel =
    analysis?.riskLevel === "low"    ? t.ai.low :
    analysis?.riskLevel === "medium" ? t.ai.medium : t.ai.high;

  const sym = quote ? currencySymbol(quote.currency) : "$";

  return (
    <Card className="flex flex-col gap-4 h-full">
      <CardHeader className="mb-0">
        <CardTitle className="flex items-center gap-1.5">
          <Sparkles size={13} className="text-[var(--purple)]" />
          {t.ai.title}
        </CardTitle>
        <button onClick={runAnalysis} disabled={loading || !quote}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--surface-2)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
          {loading ? t.ai.analysing : t.ai.analyse}
        </button>
      </CardHeader>

      {error && (
        <div className="text-xs text-[var(--red)] bg-[rgba(248,81,73,0.08)] rounded-lg p-3">{error}</div>
      )}

      {!analysis && !loading && !error && (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center py-8">
          <Sparkles size={28} className="text-[var(--purple)] opacity-40" />
          <p className="text-sm text-[var(--muted)] leading-relaxed">
            {t.ai.clickHint} <strong className="text-[var(--foreground)]">{t.ai.clickHintBtn}</strong> {lang === "zh" ? `获取 ${symbol.replace("USDT","").replace(/^(HK|CN)/,"")} 的AI洞察` : `for AI insights on ${symbol.replace("USDT","").replace(/^(HK|CN)/,"")}`}
          </p>
        </div>
      )}

      {loading && (
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <Sparkles size={24} className="text-[var(--purple)] animate-pulse" />
          <p className="text-xs text-[var(--muted)] animate-pulse">{t.ai.crunching}</p>
        </div>
      )}

      {analysis && !loading && (
        <div className="flex flex-col gap-4 text-sm">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={sentimentVariant} className="gap-1">
              {sentimentIcon} {sentimentLabel}
            </Badge>
            <Badge variant={riskVariant} className="gap-1">
              <ShieldAlert size={11} /> {riskLabel} {t.ai.risk}
            </Badge>
          </div>

          <p className="text-sm text-[var(--foreground)] leading-relaxed">{analysis.summary}</p>

          <div>
            <div className="text-xs text-[var(--muted)] uppercase tracking-wide mb-2">{t.ai.keyLevels}</div>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg bg-[var(--surface-2)] p-3">
                <div className="text-xs text-[var(--muted)] mb-1">{t.ai.support}</div>
                <div className="font-mono font-semibold number-green text-sm">{sym}{analysis.keyLevels.support.toLocaleString()}</div>
              </div>
              <div className="rounded-lg bg-[var(--surface-2)] p-3">
                <div className="text-xs text-[var(--muted)] mb-1">{t.ai.resistance}</div>
                <div className="font-mono font-semibold number-red text-sm">{sym}{analysis.keyLevels.resistance.toLocaleString()}</div>
              </div>
            </div>
          </div>

          <div>
            <div className="text-xs text-[var(--muted)] uppercase tracking-wide mb-2">{t.ai.signals}</div>
            <ul className="flex flex-col gap-1.5">
              {analysis.signals.map((sig, i) => (
                <li key={i} className="flex items-start gap-2 text-xs">
                  <span className="mt-1 w-1.5 h-1.5 rounded-full bg-[var(--accent)] shrink-0" />
                  {sig}
                </li>
              ))}
            </ul>
          </div>

          <div className="text-xs text-[var(--muted)] pt-2 border-t border-[var(--border)]">
            {t.ai.updated}: {fmtTime(analysis.timestamp)}
          </div>
        </div>
      )}
    </Card>
  );
}
