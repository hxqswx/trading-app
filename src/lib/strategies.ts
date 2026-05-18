/**
 * Six institutional-grade trading strategies.
 *
 * Each strategy ingests a Candle array and returns a StrategyResult containing
 * a Signal, 1-5 strength, bilingual reason, and raw indicator values.
 *
 * runAllStrategies() runs all six and getConsensus() combines their votes.
 */
import type { Candle } from "@/lib/types";
import { ema, rsi, macd, bollingerBands, sma, avgVolume } from "@/lib/indicators";

// ── Types ──────────────────────────────────────────────────────────────────
export type Signal = "STRONG_BUY" | "BUY" | "HOLD" | "SELL" | "STRONG_SELL";
type Strength = 1 | 2 | 3 | 4 | 5;

export interface StrategyResult {
  id:            string;
  name:          string;
  nameZh:        string;
  signal:        Signal;
  strength:      Strength;
  reason:        string;
  reasonZh:      string;
  description:   string;
  descriptionZh: string;
  values:        Record<string, number | string>;
}

export interface ConsensusResult {
  signal:  Signal;
  score:   number;   // raw weighted score
  bullish: number;   // count of BUY / STRONG_BUY
  bearish: number;   // count of SELL / STRONG_SELL
  neutral: number;
}

// ── Helpers ────────────────────────────────────────────────────────────────
function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}
function strength(n: number): Strength {
  return clamp(Math.round(n), 1, 5) as Strength;
}
function last<T>(arr: T[]): T { return arr[arr.length - 1]; }
function prev<T>(arr: T[]): T { return arr[arr.length - 2]; }

// ── Strategy 1 — EMA Crossover (Trend Following) ───────────────────────────
function emaCrossover(candles: Candle[]): StrategyResult {
  const closes = candles.map((c) => c.close);
  const e20    = ema(closes, 20);
  const e50    = ema(closes, 50);

  const base: StrategyResult = {
    id:            "ema_crossover",
    name:          "EMA Crossover",
    nameZh:        "均线交叉",
    signal:        "HOLD",
    strength:      2,
    reason:        "",
    reasonZh:      "",
    description:   "Golden / death cross using 20 & 50-period EMAs to confirm trend direction.",
    descriptionZh: "利用20与50周期指数均线的金叉/死叉判断趋势方向。",
    values:        {},
  };

  if (e20.length < 2 || e50.length < 2) return base;

  const cur20  = last(e20),  cur50  = last(e50);
  const prv20  = prev(e20),  prv50  = prev(e50);
  const gapPct = ((cur20 - cur50) / cur50) * 100;

  base.values = {
    ema20:  +cur20.toFixed(4),
    ema50:  +cur50.toFixed(4),
    gapPct: +gapPct.toFixed(2),
  };

  if (prv20 <= prv50 && cur20 > cur50) {
    base.signal   = "STRONG_BUY";
    base.strength = 5;
    base.reason   = "Golden cross — EMA20 just crossed above EMA50";
    base.reasonZh = "金叉：EMA20刚上穿EMA50，趋势转强";
  } else if (prv20 >= prv50 && cur20 < cur50) {
    base.signal   = "STRONG_SELL";
    base.strength = 5;
    base.reason   = "Death cross — EMA20 just crossed below EMA50";
    base.reasonZh = "死叉：EMA20刚下穿EMA50，趋势转弱";
  } else if (gapPct > 3) {
    base.signal   = "BUY";
    base.strength = strength(2 + gapPct / 3);
    base.reason   = `EMA20 is ${gapPct.toFixed(1)}% above EMA50 — sustained uptrend`;
    base.reasonZh = `EMA20高于EMA50 ${gapPct.toFixed(1)}%，维持上涨趋势`;
  } else if (gapPct < -3) {
    base.signal   = "SELL";
    base.strength = strength(2 + Math.abs(gapPct) / 3);
    base.reason   = `EMA20 is ${Math.abs(gapPct).toFixed(1)}% below EMA50 — sustained downtrend`;
    base.reasonZh = `EMA20低于EMA50 ${Math.abs(gapPct).toFixed(1)}%，维持下跌趋势`;
  } else {
    base.reason   = `EMAs within ${Math.abs(gapPct).toFixed(1)}% of each other — no clear trend`;
    base.reasonZh = `均线偏差${Math.abs(gapPct).toFixed(1)}%，方向不明`;
  }
  return base;
}

// ── Strategy 2 — RSI Oscillator (Mean Reversion) ──────────────────────────
function rsiStrategy(candles: Candle[]): StrategyResult {
  const closes   = candles.map((c) => c.close);
  const rsiVals  = rsi(closes, 14);

  const base: StrategyResult = {
    id:            "rsi",
    name:          "RSI Oscillator",
    nameZh:        "RSI震荡指标",
    signal:        "HOLD",
    strength:      2,
    reason:        "",
    reasonZh:      "",
    description:   "RSI(14) detects overbought (>70) and oversold (<30) conditions for mean-reversion entries.",
    descriptionZh: "RSI(14)识别超买(>70)与超卖(<30)区域，寻找均值回归机会。",
    values:        {},
  };

  if (rsiVals.length < 2) return base;

  const curr = last(rsiVals);
  const prv  = prev(rsiVals);
  base.values = { rsi: +curr.toFixed(1) };

  if (curr < 20) {
    base.signal   = "STRONG_BUY";
    base.strength = 5;
    base.reason   = `RSI ${curr.toFixed(0)} — extreme oversold, high-probability reversal`;
    base.reasonZh = `RSI ${curr.toFixed(0)}，极度超卖，高概率反弹`;
  } else if (curr < 30) {
    base.signal   = "BUY";
    base.strength = strength(4 - (curr - 20) / 5);
    base.reason   = `RSI ${curr.toFixed(0)} — oversold; watch for reversal candle`;
    base.reasonZh = `RSI ${curr.toFixed(0)}，超卖区，关注反转K线`;
  } else if (curr > 80) {
    base.signal   = "STRONG_SELL";
    base.strength = 5;
    base.reason   = `RSI ${curr.toFixed(0)} — extreme overbought, pullback likely`;
    base.reasonZh = `RSI ${curr.toFixed(0)}，极度超买，大概率回调`;
  } else if (curr > 70) {
    base.signal   = "SELL";
    base.strength = strength(4 - (80 - curr) / 5);
    base.reason   = `RSI ${curr.toFixed(0)} — overbought; reduce exposure`;
    base.reasonZh = `RSI ${curr.toFixed(0)}，超买区，建议减仓`;
  } else if (curr > 50 && curr > prv) {
    base.signal   = "HOLD";
    base.strength = 3;
    base.reason   = `RSI ${curr.toFixed(0)} — bullish momentum, not yet overbought`;
    base.reasonZh = `RSI ${curr.toFixed(0)}，多头动能，尚未超买`;
  } else if (curr < 50 && curr < prv) {
    base.signal   = "HOLD";
    base.strength = 2;
    base.reason   = `RSI ${curr.toFixed(0)} — bearish momentum, not yet oversold`;
    base.reasonZh = `RSI ${curr.toFixed(0)}，空头动能，尚未超卖`;
  } else {
    base.reason   = `RSI ${curr.toFixed(0)} — neutral zone`;
    base.reasonZh = `RSI ${curr.toFixed(0)}，中性区域`;
  }
  return base;
}

// ── Strategy 3 — MACD Momentum ─────────────────────────────────────────────
function macdStrategy(candles: Candle[]): StrategyResult {
  const closes = candles.map((c) => c.close);
  const { macdLine, signalLine, histogram } = macd(closes, 12, 26, 9);

  const base: StrategyResult = {
    id:            "macd",
    name:          "MACD Momentum",
    nameZh:        "MACD动量指标",
    signal:        "HOLD",
    strength:      2,
    reason:        "",
    reasonZh:      "",
    description:   "MACD(12,26,9) signal-line crossovers confirm trend reversals and momentum shifts.",
    descriptionZh: "MACD(12,26,9)信号线交叉确认趋势反转与动量变化。",
    values:        {},
  };

  if (histogram.length < 2) return base;

  const currH = last(histogram), prvH = prev(histogram);
  const currM = last(macdLine),  currS = last(signalLine);

  base.values = {
    macd:      +currM.toFixed(4),
    signal:    +currS.toFixed(4),
    histogram: +currH.toFixed(4),
  };

  const mag = Math.abs(currH);

  if (prvH <= 0 && currH > 0) {
    base.signal   = "STRONG_BUY";
    base.strength = 5;
    base.reason   = "MACD crossed above signal — bullish momentum confirmed";
    base.reasonZh = "MACD上穿信号线，多头动能确认";
  } else if (prvH >= 0 && currH < 0) {
    base.signal   = "STRONG_SELL";
    base.strength = 5;
    base.reason   = "MACD crossed below signal — bearish momentum confirmed";
    base.reasonZh = "MACD下穿信号线，空头动能确认";
  } else if (currH > 0 && currH > prvH) {
    base.signal   = "BUY";
    base.strength = strength(2 + mag * 8);
    base.reason   = "Histogram expanding above zero — bullish acceleration";
    base.reasonZh = "柱状图在零轴上扩大，多头加速";
  } else if (currH < 0 && currH < prvH) {
    base.signal   = "SELL";
    base.strength = strength(2 + mag * 8);
    base.reason   = "Histogram expanding below zero — bearish acceleration";
    base.reasonZh = "柱状图在零轴下扩大，空头加速";
  } else if (currH > 0) {
    base.signal   = "HOLD";
    base.strength = 3;
    base.reason   = "Histogram positive but shrinking — momentum fading";
    base.reasonZh = "柱状图为正但收窄，动能减弱";
  } else {
    base.signal   = "HOLD";
    base.strength = 2;
    base.reason   = "Histogram negative but shrinking — potential bottom";
    base.reasonZh = "柱状图为负但收窄，可能触底";
  }
  return base;
}

// ── Strategy 4 — Bollinger Band Mean Reversion ────────────────────────────
function bollingerStrategy(candles: Candle[]): StrategyResult {
  const closes = candles.map((c) => c.close);
  const { upper, middle, lower, bandwidth, pctB } = bollingerBands(closes, 20, 2);

  const base: StrategyResult = {
    id:            "bollinger",
    name:          "Bollinger Bands",
    nameZh:        "布林带",
    signal:        "HOLD",
    strength:      2,
    reason:        "",
    reasonZh:      "",
    description:   "±2σ bands around 20-SMA. Price extremes at the bands suggest mean reversion; band breaks signal breakouts.",
    descriptionZh: "20日均线±2σ波动带。价格触及边缘暗示均值回归；突破则表明新趋势。",
    values:        {},
  };

  if (!upper.length) return base;

  const b      = last(pctB);
  const bw     = last(bandwidth);
  const price  = last(closes);
  const squeeze = bw < 5; // Low bandwidth = volatility squeeze

  base.values = {
    upper:     +last(upper).toFixed(4),
    middle:    +last(middle).toFixed(4),
    lower:     +last(lower).toFixed(4),
    pctB:      +(b * 100).toFixed(1),
    bandwidth: +bw.toFixed(2),
    squeeze:   squeeze ? 1 : 0,
  };

  const pctBLabel = (b * 100).toFixed(0);

  if (b < 0.02) {
    base.signal   = "STRONG_BUY";
    base.strength = 5;
    base.reason   = `Price touching lower band (${pctBLabel}%B)${squeeze ? " + volatility squeeze" : ""} — high-probability bounce`;
    base.reasonZh = `价格触及下轨(${pctBLabel}%B)${squeeze ? "，波动率压缩" : ""}，高概率反弹`;
  } else if (b < 0.2) {
    base.signal   = "BUY";
    base.strength = strength(5 - b * 10);
    base.reason   = `Price near lower band (${pctBLabel}%B) — potential mean-reversion bounce`;
    base.reasonZh = `价格接近下轨(${pctBLabel}%B)，可能向均值反弹`;
  } else if (b > 0.98) {
    base.signal   = "STRONG_SELL";
    base.strength = 5;
    base.reason   = `Price touching upper band (${pctBLabel}%B)${squeeze ? " + volatility squeeze" : ""} — high-probability pullback`;
    base.reasonZh = `价格触及上轨(${pctBLabel}%B)${squeeze ? "，波动率压缩" : ""}，高概率回调`;
  } else if (b > 0.8) {
    base.signal   = "SELL";
    base.strength = strength(5 - (1 - b) * 10);
    base.reason   = `Price near upper band (${pctBLabel}%B) — potential reversal`;
    base.reasonZh = `价格接近上轨(${pctBLabel}%B)，可能反转回落`;
  } else {
    const direction = price > last(middle) ? "above" : "below";
    base.reason   = `Price at ${pctBLabel}%B (${direction} midline) — inside bands`;
    base.reasonZh = `价格在${pctBLabel}%B（${direction === "above" ? "均线上方" : "均线下方"}），处于带内`;
    base.strength = direction === "above" ? 3 : 2;
  }
  return base;
}

// ── Strategy 5 — Volume Surge Breakout ────────────────────────────────────
function volumeSurge(candles: Candle[]): StrategyResult {
  const base: StrategyResult = {
    id:            "volume_surge",
    name:          "Volume Surge",
    nameZh:        "量价突破",
    signal:        "HOLD",
    strength:      2,
    reason:        "",
    reasonZh:      "",
    description:   "Identifies price moves confirmed by high volume, signalling genuine institutional participation.",
    descriptionZh: "识别量能配合的价格突破，反映机构资金真实参与。",
    values:        {},
  };

  if (candles.length < 21) return base;

  const curr       = last(candles);
  const prv        = prev(candles);
  const volumes    = candles.map((c) => c.volume);
  const avgVol     = avgVolume(volumes.slice(0, -1), 20);
  const volRatio   = avgVol > 0 ? curr.volume / avgVol : 1;
  const chgPct     = prv.close > 0 ? ((curr.close - prv.close) / prv.close) * 100 : 0;

  base.values = {
    volume:      Math.round(curr.volume),
    avgVolume:   Math.round(avgVol),
    volRatio:    +volRatio.toFixed(2),
    changePct:   +chgPct.toFixed(2),
  };

  if (volRatio >= 2 && chgPct > 1.5) {
    base.signal   = "STRONG_BUY";
    base.strength = strength(3 + volRatio);
    base.reason   = `${volRatio.toFixed(1)}× avg volume + +${chgPct.toFixed(1)}% — bullish breakout`;
    base.reasonZh = `量能${volRatio.toFixed(1)}倍，涨幅+${chgPct.toFixed(1)}%，量价齐升突破`;
  } else if (volRatio >= 1.5 && chgPct > 0.5) {
    base.signal   = "BUY";
    base.strength = strength(2 + volRatio);
    base.reason   = `${volRatio.toFixed(1)}× avg volume with +${chgPct.toFixed(1)}% — bullish momentum`;
    base.reasonZh = `量能${volRatio.toFixed(1)}倍，多头动能良好`;
  } else if (volRatio >= 2 && chgPct < -1.5) {
    base.signal   = "STRONG_SELL";
    base.strength = strength(3 + volRatio);
    base.reason   = `${volRatio.toFixed(1)}× avg volume + ${chgPct.toFixed(1)}% — bearish breakdown`;
    base.reasonZh = `量能${volRatio.toFixed(1)}倍，跌幅${chgPct.toFixed(1)}%，放量下跌突破`;
  } else if (volRatio >= 1.5 && chgPct < -0.5) {
    base.signal   = "SELL";
    base.strength = strength(2 + volRatio);
    base.reason   = `${volRatio.toFixed(1)}× avg volume with ${chgPct.toFixed(1)}% — bearish momentum`;
    base.reasonZh = `量能${volRatio.toFixed(1)}倍，空头动能较强`;
  } else if (volRatio < 0.5) {
    base.signal   = "HOLD";
    base.strength = 1;
    base.reason   = `Volume only ${volRatio.toFixed(1)}× avg — low conviction, avoid chasing`;
    base.reasonZh = `成交${volRatio.toFixed(1)}倍均量，市场参与度低，谨慎追涨`;
  } else {
    base.reason   = `Volume ${volRatio.toFixed(1)}× avg — normal; no surge signal`;
    base.reasonZh = `成交${volRatio.toFixed(1)}倍均量，正常水平，无突破信号`;
  }
  return base;
}

// ── Strategy 6 — DCA Score (Dollar Cost Averaging) ───────────────────────
function dcaScore(candles: Candle[]): StrategyResult {
  const base: StrategyResult = {
    id:            "dca",
    name:          "DCA Score",
    nameZh:        "定投评分",
    signal:        "HOLD",
    strength:      2,
    reason:        "",
    reasonZh:      "",
    description:   "Rates how attractive the current price is for systematic DCA relative to its 30-day moving average.",
    descriptionZh: "基于30日均线评估当前价格对定期定额投资的吸引力。",
    values:        {},
  };

  if (candles.length < 30) return base;

  const closes    = candles.map((c) => c.close);
  const ma30      = sma(closes, 30);
  const price     = last(closes);
  const ma        = last(ma30);
  const dipPct    = ((price - ma) / ma) * 100;
  const weekClose = closes[closes.length - 8] ?? closes[0];
  const weekChg   = ((price - weekClose) / weekClose) * 100;

  base.values = {
    ma30:     +ma.toFixed(4),
    price:    +price.toFixed(4),
    dipPct:   +dipPct.toFixed(2),
    weekChg:  +weekChg.toFixed(2),
  };

  if (dipPct < -12) {
    base.signal   = "STRONG_BUY";
    base.strength = 5;
    base.reason   = `Price is ${Math.abs(dipPct).toFixed(1)}% below 30-day MA — excellent DCA entry`;
    base.reasonZh = `价格低于30日均线${Math.abs(dipPct).toFixed(1)}%，绝佳定投时机`;
  } else if (dipPct < -6) {
    base.signal   = "BUY";
    base.strength = 4;
    base.reason   = `Price is ${Math.abs(dipPct).toFixed(1)}% below 30-day MA — good DCA entry`;
    base.reasonZh = `价格低于30日均线${Math.abs(dipPct).toFixed(1)}%，较好定投时机`;
  } else if (dipPct < -2) {
    base.signal   = "BUY";
    base.strength = 3;
    base.reason   = `Mild dip of ${Math.abs(dipPct).toFixed(1)}% from MA — acceptable DCA`;
    base.reasonZh = `价格小幅低于均线${Math.abs(dipPct).toFixed(1)}%，可接受的定投时机`;
  } else if (dipPct > 12) {
    base.signal   = "HOLD";
    base.strength = 1;
    base.reason   = `Price is ${dipPct.toFixed(1)}% above MA — wait for pullback to DCA`;
    base.reasonZh = `价格高于均线${dipPct.toFixed(1)}%，建议等待回调后定投`;
  } else {
    const sign = dipPct >= 0 ? "+" : "";
    base.reason   = `Price at ${sign}${dipPct.toFixed(1)}% from 30-day MA — neutral DCA`;
    base.reasonZh = `价格与30日均线偏差${sign}${dipPct.toFixed(1)}%，中性定投`;
    base.strength = dipPct < 0 ? 3 : 2;
  }
  return base;
}

// ── Public API ─────────────────────────────────────────────────────────────
export function runAllStrategies(candles: Candle[]): StrategyResult[] {
  return [
    emaCrossover(candles),
    rsiStrategy(candles),
    macdStrategy(candles),
    bollingerStrategy(candles),
    volumeSurge(candles),
    dcaScore(candles),
  ];
}

const SIGNAL_SCORE: Record<Signal, number> = {
  STRONG_BUY: 2, BUY: 1, HOLD: 0, SELL: -1, STRONG_SELL: -2,
};

export function getConsensus(results: StrategyResult[]): ConsensusResult {
  let weightedSum = 0;
  let bullish = 0, bearish = 0, neutral = 0;

  for (const r of results) {
    weightedSum += SIGNAL_SCORE[r.signal] * r.strength;
    if (r.signal === "BUY" || r.signal === "STRONG_BUY")   bullish++;
    else if (r.signal === "SELL" || r.signal === "STRONG_SELL") bearish++;
    else neutral++;
  }

  const score = results.length > 0 ? weightedSum / results.length : 0;

  let signal: Signal = "HOLD";
  if (score >= 4)       signal = "STRONG_BUY";
  else if (score >= 1.5) signal = "BUY";
  else if (score <= -4)  signal = "STRONG_SELL";
  else if (score <= -1.5) signal = "SELL";

  return { signal, score, bullish, bearish, neutral };
}
