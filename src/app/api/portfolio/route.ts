import { NextResponse } from "next/server";
import { getPortfolio } from "@/lib/alpaca";

export async function GET() {
  try {
    const portfolio = await getPortfolio();
    return NextResponse.json(portfolio);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    // Return a demo portfolio if Alpaca keys are not configured
    if (message.includes("Alpaca") || message.includes("401") || message.includes("403")) {
      return NextResponse.json(getDemoPortfolio());
    }
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

function getDemoPortfolio() {
  return {
    equity: 125840.50,
    cash:   24200.00,
    dayPnl: 1243.80,
    dayPnlPct: 1.00,
    totalPnl: 25840.50,
    positions: [
      { symbol: "AAPL",    qty: 50,  avgEntryPrice: 172.10, currentPrice: 185.20, marketValue: 9260.00,  unrealizedPnl: 655.00,  unrealizedPnlPct: 7.62,  type: "stock"  },
      { symbol: "NVDA",    qty: 20,  avgEntryPrice: 420.00, currentPrice: 875.40, marketValue: 17508.00, unrealizedPnl: 9108.00, unrealizedPnlPct: 108.43, type: "stock"  },
      { symbol: "TSLA",    qty: 30,  avgEntryPrice: 240.00, currentPrice: 198.40, marketValue: 5952.00,  unrealizedPnl: -1248.00, unrealizedPnlPct: -17.33, type: "stock" },
      { symbol: "BTCUSDT", qty: 0.5, avgEntryPrice: 42000,  currentPrice: 67800,  marketValue: 33900.00, unrealizedPnl: 12900.00, unrealizedPnlPct: 61.43, type: "crypto" },
      { symbol: "ETHUSDT", qty: 5,   avgEntryPrice: 2200,   currentPrice: 3420,   marketValue: 17100.00, unrealizedPnl: 6100.00,  unrealizedPnlPct: 55.45, type: "crypto" },
    ],
  };
}
