"use client";

import { useEffect, useRef, useState } from "react";
import {
  createChart,
  CandlestickSeries,
  HistogramSeries,
  IChartApi,
  ISeriesApi,
  CandlestickData,
  HistogramData,
  UTCTimestamp,
  ColorType,
} from "lightweight-charts";
import type { Candle, CandleInterval } from "@/lib/types";
import { Button } from "@/components/ui/button";

const INTERVALS: CandleInterval[] = ["1m", "5m", "15m", "1h", "4h", "1d"];

interface PriceChartProps {
  symbol: string;
}

export function PriceChart({ symbol }: PriceChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef     = useRef<IChartApi | null>(null);
  const candleRef    = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeRef    = useRef<ISeriesApi<"Histogram"> | null>(null);

  const [interval, setInterval] = useState<CandleInterval>("1h");
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);

  // Init chart
  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "#161b22" },
        textColor:  "#8b949e",
      },
      grid: {
        vertLines: { color: "#21262d" },
        horzLines: { color: "#21262d" },
      },
      crosshair: { mode: 1 },
      rightPriceScale: { borderColor: "#30363d" },
      timeScale: { borderColor: "#30363d", timeVisible: true, secondsVisible: false },
      width:  containerRef.current.clientWidth,
      height: 380,
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor:          "#3fb950",
      downColor:        "#f85149",
      borderUpColor:    "#3fb950",
      borderDownColor:  "#f85149",
      wickUpColor:      "#3fb950",
      wickDownColor:    "#f85149",
    });

    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: "volume" },
      priceScaleId: "volume",
    });
    chart.priceScale("volume").applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } });

    chartRef.current   = chart;
    candleRef.current  = candleSeries;
    volumeRef.current  = volumeSeries;

    const ro = new ResizeObserver(() => {
      if (containerRef.current) chart.resize(containerRef.current.clientWidth, 380);
    });
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      chart.remove();
    };
  }, []);

  // Fetch data when symbol or interval changes
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`/api/candles?symbol=${symbol}&interval=${interval}&limit=200`)
      .then((r) => r.json())
      .then((data: Candle[] | { error: string }) => {
        if (cancelled) return;
        if ("error" in data) { setError(data.error); return; }

        const candles: CandlestickData[] = data.map((c) => ({
          time:  c.time as UTCTimestamp,
          open:  c.open,
          high:  c.high,
          low:   c.low,
          close: c.close,
        }));
        const volumes: HistogramData[] = data.map((c) => ({
          time:  c.time as UTCTimestamp,
          value: c.volume,
          color: c.close >= c.open ? "rgba(63,185,80,0.4)" : "rgba(248,81,73,0.4)",
        }));

        candleRef.current?.setData(candles);
        volumeRef.current?.setData(volumes);
        chartRef.current?.timeScale().fitContent();
        setLoading(false);
      })
      .catch((e) => {
        if (!cancelled) { setError(String(e)); setLoading(false); }
      });

    return () => { cancelled = true; };
  }, [symbol, interval]);

  return (
    <div className="flex flex-col gap-0">
      {/* Interval selector */}
      <div className="flex items-center gap-1 px-1 pb-2">
        {INTERVALS.map((iv) => (
          <Button
            key={iv}
            size="sm"
            variant={interval === iv ? "default" : "ghost"}
            onClick={() => setInterval(iv)}
            className="px-2.5 py-1 text-xs"
          >
            {iv.toUpperCase()}
          </Button>
        ))}
      </div>

      {/* Chart container */}
      <div className="relative">
        <div ref={containerRef} className="w-full" />
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-[var(--surface)] bg-opacity-80">
            <div className="text-xs text-[var(--muted)] animate-pulse">Loading chart…</div>
          </div>
        )}
        {error && !loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-xs text-[var(--red)]">{error}</div>
          </div>
        )}
      </div>
    </div>
  );
}
