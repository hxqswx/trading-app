/**
 * Equity history line chart using react-native-svg.
 * Mirrors the web SVG equity chart approach.
 */
import React, { useMemo } from "react";
import { View, StyleSheet } from "react-native";
import Svg, { Path, Defs, LinearGradient, Stop, Line, Text as SvgText } from "react-native-svg";
import { useColors } from "@/lib/hooks/use-colors";
import { clamp } from "@/lib/utils";
import type { HistoryPoint } from "@/lib/types";

interface EquityChartProps {
  data:   HistoryPoint[];
  width:  number;
  height?: number;
}

const PAD_X  = 8;
const PAD_Y  = 8;
const LABELS = 4;

export function EquityChart({ data, width, height = 180 }: EquityChartProps) {
  const colors = useColors();

  const { path, fill, minVal, maxVal, isPositive } = useMemo(() => {
    if (data.length < 2) {
      return { path: "", fill: "", minVal: 0, maxVal: 0, isPositive: true };
    }

    const values  = data.map((d) => d.equity);
    const minVal  = Math.min(...values);
    const maxVal  = Math.max(...values);
    const range   = maxVal - minVal || 1;
    const W       = width  - PAD_X * 2;
    const H       = height - PAD_Y * 2;

    const toX = (i: number) => PAD_X + (i / (data.length - 1)) * W;
    const toY = (v: number) => PAD_Y + H - clamp((v - minVal) / range, 0, 1) * H;

    const pts    = data.map((d, i) => ({ x: toX(i), y: toY(d.equity) }));
    const linePts = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
    const fillPts = `${linePts} L${pts[pts.length - 1].x.toFixed(1)},${(PAD_Y + H).toFixed(1)} L${PAD_X},${(PAD_Y + H).toFixed(1)} Z`;

    const first = values[0];
    const last  = values[values.length - 1];

    return { path: linePts, fill: fillPts, minVal, maxVal, isPositive: last >= first };
  }, [data, width, height]);

  if (!path) {
    return <View style={[styles.empty, { width, height }]} />;
  }

  const lineColor = isPositive ? colors.green : colors.red;
  const stopColor = isPositive ? colors.green : colors.red;

  return (
    <Svg width={width} height={height}>
      <Defs>
        <LinearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0"   stopColor={stopColor} stopOpacity="0.25" />
          <Stop offset="1"   stopColor={stopColor} stopOpacity="0"    />
        </LinearGradient>
      </Defs>

      {/* Fill area */}
      <Path d={fill} fill="url(#equityGrad)" />

      {/* Line */}
      <Path
        d={path}
        stroke={lineColor}
        strokeWidth={2}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

const styles = StyleSheet.create({
  empty: {
    backgroundColor: "transparent",
  },
});
