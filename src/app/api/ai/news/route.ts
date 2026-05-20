/**
 * GET /api/ai/news?symbol=AAPL&name=Apple
 *
 * Fetches Google News RSS — free, no API key required.
 * Parses XML, extracts headlines, and applies simple keyword-based sentiment.
 * Falls back to an empty array on network failure so the AI panel still renders.
 */

import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface NewsItem {
  title:     string;
  url:       string;
  source:    string;
  pubDate:   string;
  sentiment: "bullish" | "bearish" | "neutral";
}

const BULL_KEYWORDS = [
  "surge", "soar", "rally", "beat", "record", "profit", "gain", "upgrade",
  "bullish", "buy", "strong", "positive", "growth", "revenue", "breakout",
  "上涨", "涨", "买入", "利好", "强势", "突破", "增长",
];
const BEAR_KEYWORDS = [
  "fall", "drop", "decline", "miss", "loss", "cut", "downgrade", "bearish",
  "sell", "weak", "negative", "warning", "layoff", "lawsuit", "crash",
  "下跌", "跌", "卖出", "利空", "亏损", "裁员", "诉讼",
];

function classifySentiment(text: string): "bullish" | "bearish" | "neutral" {
  const lower = text.toLowerCase();
  const bull  = BULL_KEYWORDS.filter((k) => lower.includes(k)).length;
  const bear  = BEAR_KEYWORDS.filter((k) => lower.includes(k)).length;
  if (bull > bear) return "bullish";
  if (bear > bull) return "bearish";
  return "neutral";
}

function extractText(xml: string, tag: string): string {
  const match = xml.match(new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?(.*?)(?:\\]\\]>)?<\\/${tag}>`, "s"));
  return (match?.[1] ?? "").trim();
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const symbol = searchParams.get("symbol") ?? "";
  const name   = searchParams.get("name")   ?? symbol;

  const query   = encodeURIComponent(`${name} ${symbol} stock`);
  const rssUrl  = `https://news.google.com/rss/search?q=${query}&hl=en-US&gl=US&ceid=US:en`;

  try {
    const res = await fetch(rssUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; TradeAI/1.0)" },
      signal:  AbortSignal.timeout(6000),
      next:    { revalidate: 180 },   // cache 3 min
    });

    if (!res.ok) throw new Error(`RSS fetch failed: HTTP ${res.status}`);
    const xml = await res.text();

    // Split on <item> boundaries
    const items: NewsItem[] = [];
    const itemChunks = xml.split("<item>").slice(1).slice(0, 10);

    for (const chunk of itemChunks) {
      const title   = extractText(chunk, "title").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
      const link    = extractText(chunk, "link");
      const pubDate = extractText(chunk, "pubDate");
      const source  = extractText(chunk, "source");

      if (!title || title.toLowerCase() === "title") continue;

      items.push({
        title,
        url:       link,
        source:    source || "Google News",
        pubDate:   pubDate || new Date().toUTCString(),
        sentiment: classifySentiment(title),
      });
    }

    return NextResponse.json({ symbol, items, fetchedAt: Date.now() });
  } catch (err) {
    // Non-fatal — return empty list so caller can still run analysis
    return NextResponse.json(
      { symbol, items: [] as NewsItem[], error: String(err), fetchedAt: Date.now() },
      { status: 200 }
    );
  }
}
