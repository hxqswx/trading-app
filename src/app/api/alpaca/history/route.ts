/**
 * GET /api/alpaca/history?period=1M
 *
 * Returns portfolio equity history from Alpaca for the equity chart.
 *
 * period → Alpaca period + timeframe mapping:
 *   1D   → period=1D,  timeframe=5Min
 *   1W   → period=1W,  timeframe=1H
 *   1M   → period=1M,  timeframe=1D
 *   1Y   → period=1A,  timeframe=1D
 *   All  → period=all, timeframe=1D
 *
 * Alpaca response shape:
 *   { timestamp: number[], equity: number[], profit_loss: number[], ... }
 */
import { NextRequest, NextResponse } from "next/server";
import { isAlpacaEnabled, alpacaGet, ALPACA_BASE_URL } from "@/lib/alpaca";

export const runtime = "nodejs";

type Period = "1D" | "1W" | "1M" | "1Y" | "All";

const ALPACA_PARAMS: Record<Period, { period: string; timeframe: string }> = {
  "1D":  { period: "1D",  timeframe: "5Min" },
  "1W":  { period: "1W",  timeframe: "1H"   },
  "1M":  { period: "1M",  timeframe: "1D"   },
  "1Y":  { period: "1A",  timeframe: "1D"   },
  "All": { period: "all", timeframe: "1D"   },
};

export async function GET(req: NextRequest) {
  if (!isAlpacaEnabled()) {
    return NextResponse.json({ error: "Alpaca not configured" }, { status: 503 });
  }

  const raw    = (req.nextUrl.searchParams.get("period") ?? "1M") as Period;
  const params = ALPACA_PARAMS[raw] ?? ALPACA_PARAMS["1M"];

  try {
    const data = await alpacaGet<unknown>(
      `/v2/account/portfolio/history?period=${params.period}&timeframe=${params.timeframe}&extended_hours=false`,
      ALPACA_BASE_URL,
    );
    return NextResponse.json(data, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
