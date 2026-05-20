/**
 * GET /api/search?q=apple&limit=12
 *
 * Two-tier search:
 *   1. Local asset catalog (instant, no network) — primary results
 *   2. Yahoo Finance symbol search (async) — extra results for symbols
 *      not in our catalog (e.g. small-caps, ETFs)
 *
 * Both tiers return the same shape so the client can merge them.
 */

import { NextRequest, NextResponse } from "next/server";
import { searchAssets } from "@/lib/asset-registry";

export const dynamic = "force-dynamic";

interface SearchResult {
  symbol:    string;
  yfTicker:  string;
  name:      string;
  nameCN:    string;
  type:      string;
  market:    string;
  currency:  string;
  basePrice: number;
  source:    "catalog" | "yahoo";
}

interface YFSearchHit {
  symbol:      string;
  shortname?:  string;
  longname?:   string;
  exchDisp?:   string;
  typeDisp?:   string;
  quoteType?:  string;
}

export async function GET(req: NextRequest) {
  const q     = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  const limit = Math.min(parseInt(req.nextUrl.searchParams.get("limit") ?? "12"), 30);

  if (!q) return NextResponse.json({ results: [] });

  // ── Tier 1: local catalog ─────────────────────────────────────────────
  const catalogHits = searchAssets(q, limit);
  const catalogSymbols = new Set(catalogHits.map((h) => h.symbol));

  const results: SearchResult[] = catalogHits.map((a) => ({
    symbol:    a.symbol,
    yfTicker:  a.yfTicker,
    name:      a.name,
    nameCN:    a.nameCN,
    type:      a.type,
    market:    a.market,
    currency:  a.currency,
    basePrice: a.basePrice,
    source:    "catalog",
  }));

  // ── Tier 2: Yahoo Finance search for additional results ───────────────
  if (results.length < limit) {
    try {
      const yfUrl = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(q)}&quotesCount=${limit - results.length}&newsCount=0&enableFuzzyQuery=true`;
      const res = await fetch(yfUrl, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; TradeAI/1.0)" },
        signal:  AbortSignal.timeout(4000),
        cache:   "no-store",
      });

      if (res.ok) {
        const data = await res.json() as { quotes?: YFSearchHit[] };
        for (const hit of data.quotes ?? []) {
          // Skip if already in catalog or not a tradeable security
          if (catalogSymbols.has(hit.symbol)) continue;
          if (!hit.symbol) continue;
          const qt = (hit.quoteType ?? "").toUpperCase();
          if (!["EQUITY", "CRYPTOCURRENCY", "ETF", "MUTUALFUND"].includes(qt)) continue;

          const type: string =
            qt === "CRYPTOCURRENCY" ? "crypto" :
            hit.symbol.endsWith(".HK") ? "hk" :
            hit.symbol.endsWith(".SS") || hit.symbol.endsWith(".SZ") ? "cn" : "stock";

          results.push({
            symbol:    hit.symbol,          // use Yahoo ticker as symbol for custom assets
            yfTicker:  hit.symbol,
            name:      hit.longname ?? hit.shortname ?? hit.symbol,
            nameCN:    hit.shortname ?? hit.symbol,  // no CN name for unknown assets
            type,
            market:    hit.exchDisp ?? "US",
            currency:  hit.symbol.endsWith(".HK") ? "HKD" : hit.symbol.endsWith(".SS") || hit.symbol.endsWith(".SZ") ? "CNY" : "USD",
            basePrice: 0,
            source:    "yahoo",
          });
        }
      }
    } catch {
      // Yahoo search failure is non-fatal — catalog results are still returned
    }
  }

  return NextResponse.json({ results: results.slice(0, limit) });
}
