/**
 * Cache layer with two backends:
 *  - Upstash Redis  when UPSTASH_REDIS_REST_URL + TOKEN are set (recommended for production)
 *  - Vercel KV      uses the same Upstash client via KV_REST_API_URL + KV_REST_API_TOKEN
 *  - In-memory Map  automatic fallback for local dev / when no Redis is configured
 *
 * The in-memory fallback only persists within a single serverless invocation, so
 * it won't share cache hits across requests — but it still prevents duplicate
 * fetches within a single request pipeline.
 */
import { Redis } from "@upstash/redis";

export interface Cache {
  get: <T>(key: string) => Promise<T | null>;
  set: (key: string, value: unknown, ttlSeconds: number) => Promise<void>;
  del: (key: string) => Promise<void>;
}

// ── In-memory fallback ───────────────────────────────────────────────────────

const _mem = new Map<string, { v: unknown; exp: number }>();

const memCache: Cache = {
  async get<T>(key: string): Promise<T | null> {
    const e = _mem.get(key);
    if (!e) return null;
    if (e.exp < Date.now()) { _mem.delete(key); return null; }
    return e.v as T;
  },
  async set(key, value, ttlSeconds) {
    _mem.set(key, { v: value, exp: Date.now() + ttlSeconds * 1_000 });
  },
  async del(key) { _mem.delete(key); },
};

// ── Redis (Upstash / Vercel KV) ──────────────────────────────────────────────

let _redis: Redis | null = null;

function buildRedis(): Redis | null {
  // Vercel KV uses slightly different env var names
  const url   = process.env.UPSTASH_REDIS_REST_URL   ?? process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

// ── Public factory ───────────────────────────────────────────────────────────

export function getCache(): Cache {
  if (!_redis) _redis = buildRedis();
  if (!_redis) return memCache;

  const redis = _redis;
  return {
    async get<T>(key: string): Promise<T | null> {
      try { return await redis.get<T>(key); }
      catch { return memCache.get<T>(key); }
    },
    async set(key, value, ttlSeconds) {
      try { await redis.set(key, value, { ex: ttlSeconds }); }
      catch { await memCache.set(key, value, ttlSeconds); }
    },
    async del(key) {
      try { await redis.del(key); }
      catch { await memCache.del(key); }
    },
  };
}
