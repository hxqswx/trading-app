"use client";

/**
 * StrategyPanel — renders all six strategy signals for the active symbol.
 * Used in the trade view (right panel on desktop, tab on mobile).
 */
import { useEffect, useState, useCallback } from "react";
import { useTradingStore } from "@/lib/store";
import { useT } from "@/lib/hooks/use-t";
import type { StrategiesResponse, Signal } from "@/lib/types";
import { RefreshCw, TrendingUp, TrendingDown, Minus, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

// ── Signal helpers ─────────────────────────────────────────────────────────
function signalColor(s: Signal): string {
  if (s === "STRONG_BUY")  return "text-[var(--green)]";
  if (s === "BUY")         return "text-[var(--green)] opacity-80";
  if (s === "STRONG_SELL") return "text-[var(--red)]";
  if (s === "SELL")        return "text-[var(--red)] opacity-80";
  return "text-[var(--muted)]";
}
function signalBg(s: Signal): string {
  if (s === "STRONG_BUY")  return "bg-[rgba(63,185,80,0.15)] border-[rgba(63,185,80,0.3)] text-[var(--green)]";
  if (s === "BUY")         return "bg-[rgba(63,185,80,0.08)] border-[rgba(63,185,80,0.2)] text-[var(--green)]";
  if (s === "STRONG_SELL") return "bg-[rgba(248,81,73,0.15)] border-[rgba(248,81,73,0.3)] text-[var(--red)]";
  if (s === "SELL")        return "bg-[rgba(248,81,73,0.08)] border-[rgba(248,81,73,0.2)] text-[var(--red)]";
  return "bg-[var(--surface-2)] border-[var(--border)] text-[var(--muted)]";
}
function signalLabel(s: Signal, t: ReturnType<typeof useT>): string {
  const m: Record<Signal, string> = {
    STRONG_BUY:  t.strategies.strongBuy,
    BUY:         t.strategies.buy,
    HOLD:        t.strategies.hold,
    SELL:        t.strategies.sell,
    STRONG_SELL: t.strategies.strongSell,
  };
  return m[s];
}
function SignalIcon({ s }: { s: Signal }) {
  if (s === "STRONG_BUY" || s === "BUY")   return <TrendingUp  size={12} />;
  if (s === "STRONG_SELL" || s === "SELL") return <TrendingDown size={12} />;
  return <Minus size={12} />;
}

// ── Strength bar ────────────────────────────────────────────────────────────
function StrengthBar({ value, signal }: { value: number; signal: Signal }) {
  const isGreen = signal === "BUY" || signal === "STRONG_BUY";
  const isRed   = signal === "SELL" || signal === "STRONG_SELL";
  const color   = isGreen ? "bg-[var(--green)]" : isRed ? "bg-[var(--red)]" : "bg-[var(--muted)]";
  return (
    <div className="flex gap-0.5 items-center">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className={cn("w-1.5 h-3 rounded-full transition-all",
          i <= value ? color : "bg-[var(--surface-2)]")} />
      ))}
    </div>
  );
}

// ── Consensus bar ────────────────────────────────────────────────────────────
function ConsensusBar({ bullish, bearish, neutral }: { bullish: number; bearish: number; neutral: number }) {
  const total = bullish + bearish + neutral || 1;
  return (
    <div className="flex rounded-full overflow-hidden h-2 gap-px">
      <div className="bg-[var(--green)] transition-all" style={{ width: `${(bullish / total) * 100}%` }} />
      <div className="bg-[var(--surface-2)] transition-all" style={{ width: `${(neutral / total) * 100}%` }} />
      <div className="bg-[var(--red)] transition-all" style={{ width: `${(bearish / total) * 100}%` }} />
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
interface Props { symbol: string; compact?: boolean }

export function StrategyPanel({ symbol, compact = false }: Props) {
  const { lang } = useTradingStore();
  const t = useT();
  const [data, setData]     = useState<StrategiesResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/strategies?symbol=${symbol}&interval=1d&limit=120`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setData(await res.json() as StrategiesResponse);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, [symbol]);

  useEffect(() => { load(); }, [load]);

  if (loading && !data) {
    return (
      <div className="space-y-2 p-1">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-14 rounded-xl bg-[var(--surface-2)] animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-2 py-6 text-center">
        <AlertCircle size={20} className="text-[var(--red)]" />
        <p className="text-xs text-[var(--muted)]">{t.error}</p>
        <button onClick={load}
          className="text-xs text-[var(--accent)] hover:underline">{t.strategies.refresh}</button>
      </div>
    );
  }

  if (!data) return null;

  const { consensus, strategies } = data;

  return (
    <div className="space-y-3">
      {/* ── Consensus header ── */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className={cn("text-sm font-semibold", signalColor(consensus.signal))}>
              <SignalIcon s={consensus.signal} />
            </span>
            <span className={cn(
              "px-2 py-0.5 rounded-full border text-xs font-bold",
              signalBg(consensus.signal)
            )}>
              {signalLabel(consensus.signal, t)}
            </span>
          </div>
          <p className="text-[11px] text-[var(--muted)] mt-1">
            {consensus.bullish}↑ · {consensus.neutral}– · {consensus.bearish}↓
          </p>
        </div>
        <button onClick={load} disabled={loading}
          className="p-1.5 rounded-lg hover:bg-[var(--surface-2)] text-[var(--muted)] transition-colors shrink-0">
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Consensus color bar */}
      <ConsensusBar bullish={consensus.bullish} bearish={consensus.bearish} neutral={consensus.neutral} />

      {/* ── Strategy cards ── */}
      <div className="space-y-2">
        {strategies.map((s) => (
          <div key={s.id}
            className="p-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] space-y-2 hover:border-[var(--accent)] transition-colors cursor-default">

            {/* Header row */}
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold truncate">
                {lang === "zh" ? s.nameZh : s.name}
              </span>
              <div className="flex items-center gap-2 shrink-0">
                <StrengthBar value={s.strength} signal={s.signal} />
                <span className={cn(
                  "px-1.5 py-0.5 rounded border text-[10px] font-bold flex items-center gap-0.5",
                  signalBg(s.signal)
                )}>
                  <SignalIcon s={s.signal} />
                  {signalLabel(s.signal, t)}
                </span>
              </div>
            </div>

            {/* Reason */}
            {!compact && (
              <p className="text-[11px] text-[var(--muted)] leading-relaxed">
                {lang === "zh" ? s.reasonZh : s.reason}
              </p>
            )}

            {/* Key values */}
            {!compact && Object.keys(s.values).length > 0 && (
              <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                {Object.entries(s.values).map(([k, v]) => (
                  <span key={k} className="text-[10px] text-[var(--muted)]">
                    <span className="font-mono text-[var(--foreground)]">{v}</span> {k}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer timestamp */}
      <p className="text-[10px] text-[var(--muted)] text-right">
        {new Date(data.timestamp).toLocaleTimeString()} · {data.candleCount} candles
      </p>
    </div>
  );
}
