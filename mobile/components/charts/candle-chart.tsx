/**
 * Candlestick chart using react-native-svg.
 * Custom implementation — no external chart library.
 */
import React, { useMemo } from "react";
import { View } from "react-native";
import Svg, { Rect, Line } from "react-native-svg";
import { useColors } from "@/lib/hooks/use-colors";
import { clamp } from "@/lib/utils";
import type { Candle } from "@/lib/types";

interface CandleChartProps {
  candles: Candle[];
  width:   number;
  height?: number;
}

const PAD_X    = 4;
const PAD_Y    = 8;
const GAP      = 2;
const MAX_BARS = 60;

export function CandleChart({ candles, width, height = 240 }: CandleChartProps) {
  const colors = useColors();

  const bars = useMemo(() => {
    const data = candles.slice(-MAX_BARS);
    if (data.length < 2) return null;

    const highs  = data.map((c) => c.high);
    const lows   = data.map((c) => c.low);
    const minVal = Math.min(...lows);
    const maxVal = Math.max(...highs);
    const range  = maxVal - minVal || 1;

    const W         = width  - PAD_X * 2;
    const H         = height - PAD_Y * 2;
    const barW      = Math.max(2, (W / data.length) - GAP);

    const toY = (v: number) =>
      PAD_Y + H - clamp((v - minVal) / range, 0, 1) * H;

    return data.map((c, i) => {
      const x      = PAD_X + i * (barW + GAP);
      const isUp   = c.close >= c.open;
      const yOpen  = toY(c.open);
      const yClose = toY(c.close);
      const yHigh  = toY(c.high);
      const yLow   = toY(c.low);
      const bodyY  = Math.min(yOpen, yClose);
      const bodyH  = Math.max(1, Math.abs(yOpen - yClose));
      const midX   = x + barW / 2;

      return { x, midX, yHigh, yLow, bodyY, bodyH, barW, isUp };
    });
  }, [candles, width, height]);

  if (!bars) return <View style={{ width, height }} />;

  return (
    <Svg width={width} height={height}>
      {bars.map((b, i) => (
        <React.Fragment key={i}>
          {/* Wick */}
          <Line
            x1={b.midX} y1={b.yHigh}
            x2={b.midX} y2={b.yLow}
            stroke={b.isUp ? colors.green : colors.red}
            strokeWidth={1}
          />
          {/* Body */}
          <Rect
            x={b.x}
            y={b.bodyY}
            width={b.barW}
            height={b.bodyH}
            fill={b.isUp ? colors.green : colors.red}
            rx={1}
          />
        </React.Fragment>
      ))}
    </Svg>
  );
}
