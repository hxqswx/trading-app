/**
 * Alpaca Markets REST client — server-only module.
 *
 * Paper Trading base: https://paper-api.alpaca.markets
 * Data API base:      https://data.alpaca.markets
 *
 * Credentials are read from environment variables at call time so they are
 * always fresh and never baked into a module-level constant.
 */

export const ALPACA_BASE_URL = process.env.APCA_BASE_URL ?? "https://paper-api.alpaca.markets";
export const ALPACA_DATA_URL = process.env.APCA_DATA_URL ?? "https://data.alpaca.markets";
export const ALPACA_STREAM_URL = "wss://stream.data.alpaca.markets/v2/iex";

export function isAlpacaEnabled(): boolean {
  return !!(process.env.APCA_API_KEY_ID && process.env.APCA_API_SECRET_KEY);
}

export function alpacaHeaders(): Record<string, string> {
  return {
    "APCA-API-KEY-ID":     process.env.APCA_API_KEY_ID     ?? "",
    "APCA-API-SECRET-KEY": process.env.APCA_API_SECRET_KEY ?? "",
    "Content-Type":        "application/json",
    "Accept":              "application/json",
  };
}

// ── Shared fetch wrapper ───────────────────────────────────────────────────

async function alpacaFetch<T>(url: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...opts,
    headers: {
      ...alpacaHeaders(),
      ...((opts?.headers as Record<string, string>) ?? {}),
    },
    cache:  "no-store",
    signal: opts?.signal ?? AbortSignal.timeout(10_000),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Alpaca ${res.status} ${url}: ${text}`);
  }
  return res.json() as Promise<T>;
}

export function alpacaGet<T>(path: string, base = ALPACA_BASE_URL): Promise<T> {
  return alpacaFetch<T>(`${base}${path}`);
}

export function alpacaPost<T>(path: string, body: unknown, base = ALPACA_BASE_URL): Promise<T> {
  return alpacaFetch<T>(`${base}${path}`, {
    method: "POST",
    body:   JSON.stringify(body),
  });
}

// ── Response types ─────────────────────────────────────────────────────────

export interface AlpacaOrder {
  id:               string;
  symbol:           string;
  side:             "buy" | "sell";
  type:             string;
  qty:              string;
  status:           string;
  filled_qty:       string;
  filled_avg_price: string | null;
  created_at:       string;
}

export interface AlpacaAccount {
  id:              string;
  cash:            string;
  buying_power:    string;
  equity:          string;
  portfolio_value: string;
  last_equity:     string;
  daytrading_buying_power: string;
}

export interface AlpacaPosition {
  symbol:          string;
  qty:             string;
  avg_entry_price: string;
  current_price:   string;
  market_value:    string;
  unrealized_pl:   string;
  unrealized_plpc: string;
  asset_class:     string;
  side:            "long" | "short";
  cost_basis:      string;
}

// ── Per-user key helpers ───────────────────────────────────────────────────

/** Build headers from explicit key/secret (for per-user linked accounts). */
export function alpacaHeadersForKeys(keyId: string, secretKey: string): Record<string, string> {
  return {
    "APCA-API-KEY-ID":     keyId,
    "APCA-API-SECRET-KEY": secretKey,
    "Content-Type":        "application/json",
    "Accept":              "application/json",
  };
}

async function alpacaFetchWithKeys<T>(
  url: string,
  keyId: string,
  secretKey: string,
  opts?: RequestInit,
): Promise<T> {
  const res = await fetch(url, {
    ...opts,
    headers: {
      ...alpacaHeadersForKeys(keyId, secretKey),
      ...((opts?.headers as Record<string, string>) ?? {}),
    },
    cache:  "no-store",
    signal: opts?.signal ?? AbortSignal.timeout(10_000),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Alpaca ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

export function getAlpacaAccountForUser(keyId: string, secretKey: string): Promise<AlpacaAccount> {
  return alpacaFetchWithKeys<AlpacaAccount>(`${ALPACA_BASE_URL}/v2/account`, keyId, secretKey);
}

export function getAlpacaPositionsForUser(keyId: string, secretKey: string): Promise<AlpacaPosition[]> {
  return alpacaFetchWithKeys<AlpacaPosition[]>(`${ALPACA_BASE_URL}/v2/positions`, keyId, secretKey);
}

export function submitAlpacaOrderForUser(
  keyId: string,
  secretKey: string,
  order: {
    symbol:       string;
    qty:          number;
    side:         "buy" | "sell";
    type:         "market" | "limit" | "stop" | "stop_limit";
    limit_price?: number;
    stop_price?:  number;
  },
): Promise<AlpacaOrder> {
  return alpacaFetchWithKeys<AlpacaOrder>(
    `${ALPACA_BASE_URL}/v2/orders`,
    keyId,
    secretKey,
    {
      method: "POST",
      body:   JSON.stringify({
        symbol:        order.symbol,
        qty:           String(order.qty),
        side:          order.side,
        type:          order.type,
        time_in_force: "day",
        ...(order.limit_price != null ? { limit_price: String(order.limit_price) } : {}),
        ...(order.stop_price  != null ? { stop_price:  String(order.stop_price)  } : {}),
      }),
    },
  );
}

// ── Broker / Trading endpoints ────────────────────────────────────────────

/**
 * Submit a paper-trading order to Alpaca.
 * Market orders fill immediately; limit orders queue until price is met.
 */
export function submitAlpacaOrder(order: {
  symbol:       string;
  qty:          number;
  side:         "buy" | "sell";
  type:         "market" | "limit" | "stop" | "stop_limit";
  limit_price?: number;
  stop_price?:  number;
}): Promise<AlpacaOrder> {
  return alpacaPost<AlpacaOrder>("/v2/orders", {
    symbol:        order.symbol,
    qty:           String(order.qty),
    side:          order.side,
    type:          order.type,
    time_in_force: "day",
    ...(order.limit_price != null ? { limit_price: String(order.limit_price) } : {}),
    ...(order.stop_price  != null ? { stop_price:  String(order.stop_price)  } : {}),
  });
}

/** Fetch Alpaca account details (cash, equity, buying power). */
export function getAlpacaAccount(): Promise<AlpacaAccount> {
  return alpacaGet<AlpacaAccount>("/v2/account");
}

/** Fetch all open positions in the Alpaca paper account. */
export function getAlpacaPositions(): Promise<AlpacaPosition[]> {
  return alpacaGet<AlpacaPosition[]>("/v2/positions");
}
