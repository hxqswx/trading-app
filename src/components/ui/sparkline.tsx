"use client";

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  positive?: boolean;
}

export function Sparkline({ data, width = 80, height = 28, positive }: SparklineProps) {
  if (!data || data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * height;
    return `${x},${y}`;
  });

  const firstLast = data[data.length - 1] >= data[0];
  const isUp = positive ?? firstLast;
  const color = isUp ? "#3fb950" : "#f85149";
  const fill  = isUp ? "rgba(63,185,80,0.08)" : "rgba(248,81,73,0.08)";

  // Close the area under the line
  const area = `M${pts[0]} L${pts.join(" L")} L${width},${height} L0,${height} Z`;
  const line = `M${pts[0]} L${pts.join(" L")}`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="shrink-0">
      <path d={area} fill={fill} stroke="none" />
      <path d={line} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
