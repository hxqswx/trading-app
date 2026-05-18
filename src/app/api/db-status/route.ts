/**
 * GET /api/db-status
 * Returns current connection status for the UI status indicator.
 */
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getCache } from "@/lib/cache";

export const runtime = "nodejs";

export async function GET() {
  const sql = getDb();
  const hasRedis = !!(
    process.env.UPSTASH_REDIS_REST_URL ||
    process.env.KV_REST_API_URL
  );

  let dbOk = false;
  if (sql) {
    try { await sql`SELECT 1`; dbOk = true; }
    catch { dbOk = false; }
  }

  // Quick cache test
  let cacheOk = false;
  try {
    const cache = getCache();
    await cache.set("__ping", 1, 5);
    const v = await cache.get<number>("__ping");
    cacheOk = v === 1;
    await cache.del("__ping");
  } catch { cacheOk = false; }

  return NextResponse.json({
    db:      { connected: dbOk,    provider: dbOk ? "postgres" : "none" },
    cache:   { connected: cacheOk, provider: hasRedis ? "redis" : "memory" },
    market:  { provider: "yahoo-finance", realtime: true },
  });
}
