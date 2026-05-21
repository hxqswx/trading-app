/**
 * Utility helpers — adapted from web src/lib/utils.ts.
 * No browser/DOM dependencies.
 */

/** Format a number as currency (USD default) */
export function fmtCurrency(
  value: number,
  currency = "USD",
  compact = false
): string {
  if (!isFinite(value)) return "—";
  const opts: Intl.NumberFormatOptions = {
    style:    "currency",
    currency,
    notation: compact ? "compact" : "standard",
  };
  // For non-USD currencies use fewer decimal places when compact
  if (compact) opts.maximumFractionDigits = 2;
  return new Intl.NumberFormat("en-US", opts).format(value);
}

/** Format a number as a percentage string, e.g. "+1.23%" */
export function fmtPercent(value: number, decimals = 2): string {
  if (!isFinite(value)) return "—";
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(decimals)}%`;
}

/** Format a large number compactly, e.g. 1_234_567 → "1.23M" */
export function fmtCompact(value: number): string {
  if (!isFinite(value)) return "—";
  return new Intl.NumberFormat("en-US", {
    notation:               "compact",
    maximumFractionDigits:  2,
  }).format(value);
}

/** Format a number with commas */
export function fmtNumber(value: number, decimals = 2): string {
  if (!isFinite(value)) return "—";
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Returns the theme color key for a P&L value.
 * Use with the Colors object: colors[colorKey(pnl)]
 */
export function colorKey(value: number): "green" | "red" | "muted" {
  if (value > 0) return "green";
  if (value < 0) return "red";
  return "muted";
}

/** Clamp a number between min and max */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Debounce a function */
export function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/** Sleep for ms milliseconds */
export const sleep = (ms: number) =>
  new Promise<void>((r) => setTimeout(r, ms));

/** Format Unix timestamp (seconds) as HH:MM */
export function fmtTime(ts: number): string {
  return new Date(ts * 1000).toLocaleTimeString("en-US", {
    hour:   "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

/** Format Unix timestamp (seconds) as MMM D */
export function fmtDate(ts: number): string {
  return new Date(ts * 1000).toLocaleDateString("en-US", {
    month: "short",
    day:   "numeric",
  });
}
