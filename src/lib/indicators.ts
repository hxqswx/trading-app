/**
 * Pure technical-indicator functions.
 * All inputs/outputs are plain numbers — no external dependencies.
 * Compatible with the Candle type from @/lib/types.
 */

// ── Simple Moving Average ──────────────────────────────────────────────────
export function sma(prices: number[], period: number): number[] {
  if (prices.length < period) return [];
  const result: number[] = [];
  for (let i = period - 1; i < prices.length; i++) {
    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) sum += prices[j];
    result.push(sum / period);
  }
  return result;
}

// ── Exponential Moving Average ─────────────────────────────────────────────
export function ema(prices: number[], period: number): number[] {
  if (prices.length < period) return [];
  const k = 2 / (period + 1);
  // Seed with SMA of first `period` bars
  let prev = 0;
  for (let i = 0; i < period; i++) prev += prices[i];
  prev /= period;
  const result: number[] = [prev];
  for (let i = period; i < prices.length; i++) {
    prev = prices[i] * k + prev * (1 - k);
    result.push(prev);
  }
  return result;
}

// ── RSI (Wilder's Smoothed RSI, period = 14) ──────────────────────────────
export function rsi(prices: number[], period = 14): number[] {
  if (prices.length < period + 1) return [];
  const gains: number[] = [];
  const losses: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    const diff = prices[i] - prices[i - 1];
    gains.push(Math.max(diff, 0));
    losses.push(Math.max(-diff, 0));
  }

  // Initial averages (simple)
  let avgGain = 0, avgLoss = 0;
  for (let i = 0; i < period; i++) {
    avgGain += gains[i];
    avgLoss += losses[i];
  }
  avgGain /= period;
  avgLoss /= period;

  const result: number[] = [];
  const pushRsi = (g: number, l: number) => {
    if (l === 0) { result.push(100); return; }
    result.push(100 - 100 / (1 + g / l));
  };
  pushRsi(avgGain, avgLoss);

  // Wilder smoothing
  for (let i = period; i < gains.length; i++) {
    avgGain = (avgGain * (period - 1) + gains[i]) / period;
    avgLoss = (avgLoss * (period - 1) + losses[i]) / period;
    pushRsi(avgGain, avgLoss);
  }
  return result;
}

// ── MACD (fast/slow EMA + signal line) ────────────────────────────────────
export interface MACDResult {
  macdLine:  number[];
  signalLine: number[];
  histogram:  number[];
}

export function macd(
  prices: number[],
  fast   = 12,
  slow   = 26,
  signal = 9,
): MACDResult {
  const emaFast = ema(prices, fast);
  const emaSlow = ema(prices, slow);

  // emaSlow is shorter; its first value aligns with prices[slow-1]
  // emaFast's value at the same bar is at index (slow - fast) in emaFast
  const offset   = slow - fast;
  const macdLine: number[] = [];
  for (let i = 0; i < emaSlow.length; i++) {
    macdLine.push(emaFast[i + offset] - emaSlow[i]);
  }

  const signalLine = ema(macdLine, signal);

  // Histogram aligns with signalLine (signalLine is shorter by signal-1)
  const histOffset = signal - 1;
  const histogram: number[] = [];
  for (let i = 0; i < signalLine.length; i++) {
    histogram.push(macdLine[i + histOffset] - signalLine[i]);
  }

  return { macdLine, signalLine, histogram };
}

// ── Bollinger Bands (20-period SMA ± k·σ) ────────────────────────────────
export interface BollingerResult {
  upper:     number[];
  middle:    number[];
  lower:     number[];
  bandwidth: number[]; // (upper-lower)/middle * 100
  pctB:      number[]; // (price-lower)/(upper-lower)
}

export function bollingerBands(
  prices:     number[],
  period   = 20,
  k        = 2,
): BollingerResult {
  const middle    = sma(prices, period);
  const upper:     number[] = [];
  const lower:     number[] = [];
  const bandwidth: number[] = [];
  const pctB:      number[] = [];

  for (let i = 0; i < middle.length; i++) {
    const slice = prices.slice(i, i + period);
    const mean  = middle[i];
    let variance = 0;
    for (const p of slice) variance += (p - mean) ** 2;
    const std = Math.sqrt(variance / period);
    const u = mean + k * std;
    const l = mean - k * std;
    upper.push(u);
    lower.push(l);
    bandwidth.push(mean > 0 ? ((u - l) / mean) * 100 : 0);
    pctB.push(u !== l ? (prices[i + period - 1] - l) / (u - l) : 0.5);
  }
  return { upper, middle, lower, bandwidth, pctB };
}

// ── ATR (Wilder, period = 14) ─────────────────────────────────────────────
export function atr(
  candles: Array<{ high: number; low: number; close: number }>,
  period = 14,
): number[] {
  if (candles.length < period + 1) return [];
  const trList: number[] = [];
  for (let i = 1; i < candles.length; i++) {
    const { high, low } = candles[i];
    const prevClose = candles[i - 1].close;
    trList.push(Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose)));
  }
  let avg = 0;
  for (let i = 0; i < period; i++) avg += trList[i];
  avg /= period;
  const result: number[] = [avg];
  for (let i = period; i < trList.length; i++) {
    avg = (avg * (period - 1) + trList[i]) / period;
    result.push(avg);
  }
  return result;
}

// ── Volume helpers ─────────────────────────────────────────────────────────
export function avgVolume(volumes: number[], lookback: number): number {
  const slice = volumes.slice(-lookback);
  return slice.reduce((a, b) => a + b, 0) / (slice.length || 1);
}
