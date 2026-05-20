/**
 * GET /api/alpaca/account
 * Returns the full Alpaca paper-trading account object for the Balance panel.
 */
import { NextResponse } from "next/server";
import { isAlpacaEnabled, getAlpacaAccount } from "@/lib/alpaca";

export const runtime = "nodejs";

export async function GET() {
  if (!isAlpacaEnabled()) {
    return NextResponse.json({ error: "Alpaca not configured" }, { status: 503 });
  }
  try {
    const account = await getAlpacaAccount();
    return NextResponse.json(account);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
