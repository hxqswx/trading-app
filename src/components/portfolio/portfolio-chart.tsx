"use client";

/**
 * PortfolioChart — equity history line chart.
 *
 * Fetches /api/alpaca/history and renders a responsive SVG line chart with
 * gradient fill. Supports 1D / 1W / 1M / 1Y / All timeframes.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { Card } from "@/components/ui/card";
import { useTradingStore } from "@/lib/store";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

type Period = "1D" | "1W" | "1M" | "1Y" | "All";

interface HistoryPoint {
  ts:     number; // ms
  equity: number;
}

interface AlpacaHistoryResponse {
  timestamp?:   number[];
  equity?:      number[];
  profit_loss?: number[];
  base_value?:  number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtMoney(v: number) {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1_000)     return `$${(v / 1_000).toFixed(2)}k`;
  return `$${v.toFixed(2)}`;
}

function fmtDate(ms: number, period: Period): string {
  const d = new Date(ms);
  if (period === "1D") {
    return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ── SVG line chart ────────────────────────────────────────────────────────────

interface ChartProps {
  data:   HistoryPoint[];
  period: Period;
  color:  string;
}

function SvgChart({ data, period, color }: ChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hover, setHover] = useState<{ x: number; y: number; point: HistoryPoint } | null>(null);

  if (!data.length) return (
    <div className="flex items-center justify-center h-48 text-sm text-[var(--muted)]">
      No data for this period
    </div>
  );

  const W = 800, H = 200, PAD_L = 60, PAD_R = 16, PAD_T = 16, PAD_B = 32;
  const innerW = W - PAD_L - PAD_R;
  const innerH = H - PAD_T - PAD_B;

  const minE = Math.min(...data.map((d) => d.equity));
  const maxE = Math.max(...data.map((d) => d.equity));
  const minT = data[0].ts;
  const maxT = data[data.length - 1].ts;
  const rangeE = maxE - minE || maxE * 0.02 || 1;
  const rangeT = maxT - minT || 1;

  const toX = (ts: number) => PAD_L + ((ts - minT) / rangeT) * innerW;
  const toY = (e: number)  => PAD_T + innerH - ((e - minE) / rangeE) * innerH;

  const pts = data.map((d) => `${toX(d.ts).toFixed(1)},${toY(d.equity).toFixed(1)}`).join(" ");
  const linePath = `M ${pts.replace(/ /g, " L ")}`;
  const lastX    = toX(data[data.length - 1].ts);
  const lastY    = toY(data[data.length - 1].equity);
  const areaPath = `${linePath} L ${lastX},${PAD_T + innerH} L ${toX(data[0].ts)},${PAD_T + innerH} Z`;

  // Y-axis gridlines (4 ticks)
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => ({
    value: minE + f * rangeE,
    y:     PAD_T + innerH - f * innerH,
  }));

  // X-axis labels (up to 5 evenly spaced)
  const step    = Math.max(1, Math.floor(data.length / 4));
  const xLabels = data.filter((_, i) => i % step === 0 || i === data.length - 1);

  function onMouseMove(e: React.MouseEvent<SVGSVGElement>) {
    const svg  = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const mx   = ((e.clientX - rect.left) / rect.width) * W;
    // Find nearest data point
    let best = data[0], bestDx = Infinity;
    for (const p of data) {
      const dx = Math.abs(toX(p.ts) - mx);
      if (dx < bestDx) { bestDx = dx; best = p; }
    }
    setHover({ x: toX(best.ts), y: toY(best.equity), point: best });
  }

  return (
    <div className="relative">
      {hover && (
        <div
          className="absolute z-10 bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-2.5 py-1.5 text-xs pointer-events-none shadow-lg"
          style={{
            left: `${(hover.x / W) * 100}%`,
            top:  `${(hover.y / H) * 100}%`,
            transform: "translate(-50%, -110%)",
          }}
        >
          <div className="font-mono font-semibold">{fmtMoney(hover.point.equity)}</div>
          <div className="text-[var(--muted)]">{fmtDate(hover.point.ts, period)}</div>
        </div>
      )}
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        style={{ height: 220 }}
        onMouseMove={onMouseMove}
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id="pgGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={color} stopOpacity="0.25" />
            <stop offset="100%" stopColor={color} stopOpacity="0"    />
          </linearGradient>
        </defs>

        {/* Gridlines */}
        {yTicks.map(({ y, value }) => (
          <g key={y}>
            <line x1={PAD_L} y1={y} x2={W - PAD_R} y2={y}
              stroke="var(--border)" strokeWidth="1" strokeDasharray="4 4" />
            <text x={PAD_L - 6} y={y + 4} textAnchor="end"
              className="fill-[var(--muted)]" fontSize={10}>
              {fmtMoney(value)}
            </text>
          </g>
        ))}

        {/* X-axis labels */}
        {xLabels.map((p) => (
          <text key={p.ts} x={toX(p.ts)} y={H - 6} textAnchor="middle"
            className="fill-[var(--muted)]" fontSize={10}>
            {fmtDate(p.ts, period)}
          </text>
        ))}

        {/* Area fill */}
        <path d={areaPath} fill="url(#pgGrad)" />

        {/* Line */}
        <path d={linePath} fill="none" stroke={color} strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round" />

        {/* Hover crosshair */}
        {hover && (
          <>
            <line x1={hover.x} y1={PAD_T} x2={hover.x} y2={PAD_T + innerH}
              stroke="var(--border)" strokeWidth="1" strokeDasharray="3 3" />
            <circle cx={hover.x} cy={hover.y} r="4" fill={color} stroke="var(--background)" strokeWidth="2" />
          </>
        )}
      </svg>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

const PERIODS: Period[] = ["1D", "1W", "1M", "1Y", "All"];

export function PortfolioChart() {
  const portfolio = useTradingStore((s) => s.portfolio);
  const lang      = useTradingStore((s) => s.lang);

  const [period,  setPeriod]  = useState<Period>("1M");
  const [data,    setData]    = useState<HistoryPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastTs,  setLastTs]  = useState<number | null>(null);

  const load = useCallback(async (p: Period) => {
    setLoading(true);
    try {
      const res  = await fetch(`/api/alpaca/history?period=${p}`, { cache: "no-store" });
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json() as AlpacaHistoryResponse;

      const points: HistoryPoint[] = (json.timestamp ?? [])
        .map((ts: number, i: number) => ({
          ts:     ts * 1000,
          equity: json.equity?.[i] ?? 0,
        }))
        .filter((pt) => pt.equity > 0);

      setData(points);
      setLastTs(points.at(-1)?.ts ?? null);
    } catch {
      setData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(period); }, [load, period]);

  const equity     = portfolio?.equity ?? data.at(-1)?.equity ?? 0;
  const first      = data[0]?.equity ?? equity;
  const change     = equity - first;
  const changePct  = first > 0 ? (change / first) * 100 : 0;
  const up         = change >= 0;
  const color      = up ? "var(--green)" : "var(--red)";
  const colorCls   = up ? "text-[var(--green)]" : "text-[var(--red)]";

  return (
    <Card className="p-5">
      {/* Header row */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="text-xs text-[var(--muted)] font-medium mb-1">
            {lang === "zh" ? "您的投资组合" : "Your portfolio"}
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-mono font-bold">
              ${equity.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            {data.length > 1 && (
              <span className={`text-sm font-mono font-semibold ${colorCls}`}>
                {up ? "+" : ""}{change.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                {" "}({up ? "+" : ""}{changePct.toFixed(2)}%)
              </span>
            )}
          </div>
          {lastTs && (
            <div className="text-xs text-[var(--muted)] mt-0.5">
              {new Date(lastTs).toLocaleString(lang === "zh" ? "zh-CN" : "en-US", {
                month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", timeZoneName: "short",
              })}
            </div>
          )}
        </div>

        {/* Period selector + refresh */}
        <div className="flex items-center gap-1">
          {PERIODS.map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={cn(
                "px-2.5 py-1 text-xs font-semibold rounded-md transition-colors",
                period === p
                  ? "bg-[var(--surface-2)] text-[var(--foreground)]"
                  : "text-[var(--muted)] hover:text-[var(--foreground)]"
              )}
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => load(period)}
            disabled={loading}
            className="ml-1 p-1.5 rounded-md text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-2)] transition-colors"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Chart */}
      {loading ? (
        <div className="h-[220px] animate-pulse bg-[var(--surface-2)] rounded-xl" />
      ) : (
        <SvgChart data={data} period={period} color={color} />
      )}
    </Card>
  );
}
