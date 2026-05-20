/**
 * GET /api/market-status
 * Quick health check — verifies Binance and Yahoo Finance are reachable.
 */
import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";

async function ping(name: string, url: string): Promise<{ name: string; ok: boolean; latencyMs: number; error?: string }> {
  const t0 = Date.now();
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0", Accept: "application/json" },
      signal: AbortSignal.timeout(5000),
    });
    return { name, ok: res.ok, latencyMs: Date.now() - t0 };
  } catch (err) {
    return { name, ok: false, latencyMs: Date.now() - t0, error: String(err) };
  }
}

export async function GET() {
  const [binance, yahoo] = await Promise.all([
    ping("Binance",       "https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT"),
    ping("Yahoo Finance", "https://query1.finance.yahoo.com/v8/finance/chart/AAPL?interval=1d&range=2d"),
  ]);
  return NextResponse.json({ binance, yahoo, timestamp: Date.now() });
}
