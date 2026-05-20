/**
 * llm.ts — OpenAI-compatible AI client
 *
 * Default provider: Google Gemini (free tier via OpenAI-compatible endpoint)
 *   Endpoint: https://generativelanguage.googleapis.com/v1beta/openai
 *   Free:     1,500 req/day · 15 req/min · no credit card required
 *   Key:      https://aistudio.google.com → API Keys
 *
 * Works with any OpenAI-compatible provider by changing env vars:
 *   Groq:     AI_BASE_URL=https://api.groq.com/openai/v1
 *   OpenAI:   AI_BASE_URL=https://api.openai.com/v1
 *   Ollama:   AI_BASE_URL=http://localhost:11434/v1
 *
 * Env vars (set in .env.local):
 *   AI_BASE_URL   — provider base URL (default: Gemini)
 *   AI_MODEL      — model name       (default: gemini-2.0-flash)
 *   AI_API_KEY    — API key          (required; leave blank for mock mode)
 */

export const LLM_BASE  = (process.env.AI_BASE_URL ?? "https://generativelanguage.googleapis.com/v1beta/openai").replace(/\/$/, "");
export const LLM_MODEL = process.env.AI_MODEL    ?? "gemini-2.0-flash";
export const LLM_KEY   = process.env.AI_API_KEY  ?? "";

/** True when an API key is configured */
export function isConfigured(): boolean {
  return LLM_KEY.trim().length > 0;
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LLMStatus {
  ok:        boolean;
  model:     string;
  latencyMs: number;
  provider:  string;
  error?:    string;
}

// ── System prompt ──────────────────────────────────────────────────────────
export const ANALYST_SYSTEM_PROMPT = `You are QuantAI, an elite quantitative analyst and algorithmic trader embedded in a professional trading dashboard.

Your role:
- Provide crisp, actionable market analysis in a geek/terminal aesthetic
- Cite specific price levels, percentages, and technical indicators
- Give clear directional bias: BULLISH / BEARISH / NEUTRAL
- Identify key support/resistance, momentum, and risk signals
- Format output for rapid scanning — use short lines, bullet points, and labels
- Keep responses concise and data-driven. Avoid fluff.

Output style:
- Use uppercase labels for sections: SENTIMENT, LEVELS, SIGNALS, RISK
- Use → for directional calls, ⬆ / ⬇ for price targets
- Use [H], [M], [L] for signal strength
- Numbers to 2 decimal places for prices, 1dp for percentages
- Max 300 words per analysis unless asked for more
`;

// ── Status check ──────────────────────────────────────────────────────────
/**
 * Checks AI connectivity without burning quota.
 *
 * For Gemini (and any cloud provider) we avoid the /models endpoint — it
 * counts against rate limits and is called every minute by the status bar.
 * Instead we just verify the key is present and the URL is reachable via a
 * lightweight HEAD request. A real connectivity test only fires for local
 * providers (localhost) where there is no per-request quota.
 */
export async function checkLLMStatus(): Promise<LLMStatus> {
  if (!isConfigured()) {
    return { ok: false, model: LLM_MODEL, latencyMs: 0, provider: detectProvider(), error: "No API key" };
  }

  const provider = detectProvider();

  // For cloud providers just confirm the key is set — no network call needed.
  // We'll know the real status the first time the user runs an analysis.
  if (!LLM_BASE.includes("localhost") && !LLM_BASE.includes("127.0.0.1")) {
    return { ok: true, model: LLM_MODEL, latencyMs: 0, provider };
  }

  // Local providers (Ollama, LM Studio) — safe to ping /models
  const t0 = Date.now();
  try {
    const res = await fetch(`${LLM_BASE}/models`, {
      headers: { Authorization: `Bearer ${LLM_KEY}` },
      signal:  AbortSignal.timeout(3000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data   = await res.json() as { data?: { id: string }[] };
    const models = data.data ?? [];
    const model  = models[0]?.id ?? LLM_MODEL;
    return { ok: true, model, latencyMs: Date.now() - t0, provider };
  } catch (err) {
    return { ok: false, model: "", latencyMs: Date.now() - t0, provider, error: String(err) };
  }
}

function detectProvider(): string {
  if (LLM_BASE.includes("googleapis"))    return "Google Gemini";
  if (LLM_BASE.includes("groq"))          return "Groq";
  if (LLM_BASE.includes("openai"))        return "OpenAI";
  if (LLM_BASE.includes("openrouter"))    return "OpenRouter";
  if (LLM_BASE.includes("anthropic"))     return "Anthropic";
  if (LLM_BASE.includes("localhost"))     return "Local LLM";
  return "Custom";
}

// ── Retry helper ──────────────────────────────────────────────────────────
/** Sleep for ms milliseconds */
function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

/**
 * Retry a fetch with exponential backoff on 429 / 503.
 * Retries: 1s → 2s → 4s (max 3 attempts total).
 */
async function fetchWithRetry(
  url: string,
  init: RequestInit,
  maxAttempts = 3
): Promise<Response> {
  let delay = 1000;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const res = await fetch(url, init);
    if (res.status !== 429 && res.status !== 503) return res;
    if (attempt === maxAttempts) return res; // return the 429 so caller can handle it
    // Check Retry-After header (Gemini sometimes sets it)
    const retryAfter = res.headers.get("Retry-After");
    const waitMs     = retryAfter ? parseInt(retryAfter) * 1000 : delay;
    await sleep(waitMs);
    delay *= 2;
  }
  // Unreachable, but TypeScript needs it
  throw new Error("fetchWithRetry exhausted");
}

// ── Streaming completion ──────────────────────────────────────────────────
/** Returns a raw fetch Response with SSE stream from the provider */
export async function streamChat(
  messages: ChatMessage[],
  opts?: { model?: string; temperature?: number; maxTokens?: number }
): Promise<Response> {
  return fetchWithRetry(
    `${LLM_BASE}/chat/completions`,
    {
      method:  "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization:  `Bearer ${LLM_KEY}`,
      },
      body: JSON.stringify({
        model:       opts?.model       ?? LLM_MODEL,
        messages,
        stream:      true,
        temperature: opts?.temperature ?? 0.3,
        max_tokens:  opts?.maxTokens   ?? 512,
      }),
      signal: AbortSignal.timeout(60_000),
    }
  );
}

// ── Non-streaming completion ──────────────────────────────────────────────
export async function complete(
  messages: ChatMessage[],
  opts?: { model?: string; temperature?: number; maxTokens?: number }
): Promise<string> {
  const res = await fetchWithRetry(
    `${LLM_BASE}/chat/completions`,
    {
      method:  "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization:  `Bearer ${LLM_KEY}`,
      },
      body: JSON.stringify({
        model:       opts?.model       ?? LLM_MODEL,
        messages,
        stream:      false,
        temperature: opts?.temperature ?? 0.3,
        max_tokens:  opts?.maxTokens   ?? 512,
      }),
      signal: AbortSignal.timeout(30_000),
    }
  );
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    if (res.status === 429) throw new Error(`Rate limited (429) — try again in a few seconds. ${body}`);
    throw new Error(`AI error: HTTP ${res.status} — ${body}`);
  }
  const data = await res.json() as {
    choices: { message: { content: string } }[];
  };
  return data.choices[0]?.message?.content ?? "";
}

// ── Analysis prompt builder ────────────────────────────────────────────────
export interface AnalysisPromptOpts {
  symbol:    string;
  name:      string;
  price:     number;
  changePct: number;
  high:      number;
  low:       number;
  volume:    number;
  currency:  string;
  strategies?: string;
  news?:       string;
  lang?:       "en" | "zh";
}

export function buildAnalysisPrompt(opts: AnalysisPromptOpts): string {
  const {
    symbol, name, price, changePct, high, low, volume, currency,
    strategies = "", news = "", lang = "en",
  } = opts;

  const langNote = lang === "zh"
    ? "Respond in Chinese (Simplified). Keep technical terms (RSI, MACD, etc.) in English.\n\n"
    : "";

  return `${langNote}Analyse ${name} (${symbol}) with the following data:

PRICE DATA:
  Current: ${currency} ${price.toFixed(2)}
  Change:  ${changePct >= 0 ? "+" : ""}${changePct.toFixed(2)}%
  High:    ${currency} ${high.toFixed(2)}
  Low:     ${currency} ${low.toFixed(2)}
  Volume:  ${volume.toLocaleString()}

STRATEGY SIGNALS:
${strategies || "  (no signals available)"}

RECENT NEWS:
${news || "  (no news available)"}

Provide a structured analysis covering:
1. SENTIMENT — directional bias and conviction
2. KEY LEVELS — support and resistance
3. SIGNALS — 3–5 specific trading signals with strength [H/M/L]
4. RISK — risk level (LOW/MEDIUM/HIGH) and key risk factors

Be specific with price levels. Be concise.`;
}

// ── Structured JSON analysis ───────────────────────────────────────────────
export interface StructuredAnalysis {
  sentiment:  "bullish" | "bearish" | "neutral";
  summary:    string;
  keyLevels:  { support: number; resistance: number };
  signals:    string[];
  riskLevel:  "low" | "medium" | "high";
}

/** Ask the AI for a JSON-structured analysis. Returns null on failure. */
export async function getStructuredAnalysis(
  opts: AnalysisPromptOpts
): Promise<StructuredAnalysis | null> {
  if (!isConfigured()) return null;

  const jsonPrompt = buildAnalysisPrompt(opts) + `

Respond ONLY with valid JSON matching this exact schema (no markdown, no explanation):
{
  "sentiment": "bullish" | "bearish" | "neutral",
  "summary": "2-3 sentence summary",
  "keyLevels": { "support": <number>, "resistance": <number> },
  "signals": ["signal1", "signal2", "signal3"],
  "riskLevel": "low" | "medium" | "high"
}`;

  try {
    const raw = await complete(
      [
        { role: "system", content: ANALYST_SYSTEM_PROMPT },
        { role: "user",   content: jsonPrompt },
      ],
      { temperature: 0.1, maxTokens: 400 }
    );

    // Extract JSON block (models sometimes wrap in ```json)
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in response");
    return JSON.parse(jsonMatch[0]) as StructuredAnalysis;
  } catch {
    return null;
  }
}
