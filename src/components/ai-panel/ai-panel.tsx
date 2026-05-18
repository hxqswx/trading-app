"use client";

import { useState } from "react";
import { useTradingStore } from "@/lib/store";
import type { AIAnalysis, Candle, Quote } from "@/lib/types";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, TrendingUp, TrendingDown, Minus, ShieldAlert, RefreshCw } from "lucide-react";
import { fmtCurrency, fmtTime } from "@/lib/utils";

interface AIPanelProps {
  symbol: string;
}

export function AIPanel({ symbol }: AIPanelProps) {
  const { quotes, aiAnalysis, setAIAnalysis } = useTradingStore();
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const analysis = aiAnalysis[symbol];
  const quote    = quotes[symbol];

  async function runAnalysis() {
    if (!quote) return;
    setLoading(true);
    setError(null);

    try {
      // Fetch recent candles first
      const candleRes = await fetch(`/api/candles?symbol=${symbol}&interval=1h&limit=20`);
      const candles: Candle[] = await candleRes.json();

      const res = await fetch("/api/ai-analysis", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ symbol, quote, candles }),
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

  const sentimentVariant =
    analysis?.sentiment === "bullish" ? "green" :
    analysis?.sentiment === "bearish" ? "red"   : "yellow";

  const riskVariant =
    analysis?.riskLevel === "low"    ? "green"  :
    analysis?.riskLevel === "medium" ? "yellow" : "red";

  return (
    <Card className="flex flex-col gap-4 h-full">
      <CardHeader className="mb-0">
        <CardTitle className="flex items-center gap-1.5">
          <Sparkles size={13} className="text-[var(--purple)]" />
          AI Analysis
        </CardTitle>
        <Button
          size="sm"
          variant="outline"
          onClick={runAnalysis}
          disabled={loading || !quote}
          className="gap-1.5 text-xs"
        >
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
          {loading ? "Analyzing…" : "Analyse"}
        </Button>
      </CardHeader>

      {error && (
        <div className="text-xs text-[var(--red)] bg-[rgba(248,81,73,0.08)] rounded-lg p-3">
          {error}
        </div>
      )}

      {!analysis && !loading && !error && (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center py-8">
          <Sparkles size={28} className="text-[var(--purple)] opacity-50" />
          <p className="text-sm text-[var(--muted)]">
            Click <strong className="text-[var(--foreground)]">Analyse</strong> for AI-powered insights on {symbol.replace("USDT", "")}
          </p>
        </div>
      )}

      {loading && (
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <Sparkles size={24} className="text-[var(--purple)] animate-pulse" />
          <p className="text-xs text-[var(--muted)] animate-pulse">Crunching market data…</p>
        </div>
      )}

      {analysis && !loading && (
        <div className="flex flex-col gap-4 text-sm">
          {/* Sentiment + Risk row */}
          <div className="flex items-center gap-2">
            <Badge variant={sentimentVariant} className="gap-1">
              {sentimentIcon}
              {analysis.sentiment.toUpperCase()}
            </Badge>
            <Badge variant={riskVariant} className="gap-1">
              <ShieldAlert size={11} />
              {analysis.riskLevel.toUpperCase()} RISK
            </Badge>
          </div>

          {/* Summary */}
          <p className="text-sm text-[var(--foreground)] leading-relaxed">
            {analysis.summary}
          </p>

          {/* Key Levels */}
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg bg-[var(--surface-2)] p-3">
              <div className="text-xs text-[var(--muted)] mb-1">Support</div>
              <div className="font-mono font-semibold number-green text-sm">
                {fmtCurrency(analysis.keyLevels.support, 2)}
              </div>
            </div>
            <div className="rounded-lg bg-[var(--surface-2)] p-3">
              <div className="text-xs text-[var(--muted)] mb-1">Resistance</div>
              <div className="font-mono font-semibold number-red text-sm">
                {fmtCurrency(analysis.keyLevels.resistance, 2)}
              </div>
            </div>
          </div>

          {/* Signals */}
          <div>
            <div className="text-xs text-[var(--muted)] uppercase tracking-wide mb-2">Signals</div>
            <ul className="flex flex-col gap-1.5">
              {analysis.signals.map((sig, i) => (
                <li key={i} className="flex items-start gap-2 text-xs">
                  <span className="mt-1 w-1.5 h-1.5 rounded-full bg-[var(--accent)] shrink-0" />
                  {sig}
                </li>
              ))}
            </ul>
          </div>

          {/* Timestamp */}
          <div className="text-xs text-[var(--muted)] mt-auto pt-2 border-t border-[var(--border)]">
            Last updated: {fmtTime(analysis.timestamp)}
          </div>
        </div>
      )}
    </Card>
  );
}
