/**
 * llm.ts — OpenAI-compatible local LLM client
 *
 * Works with LM Studio (default port 1234) and Ollama (port 11434).
 * Both expose /v1/chat/completions and /v1/models.
 *
 * Env vars (optional — falls back to LM Studio defaults):
 *   LOCAL_LLM_URL   e.g. http://localhost:1234/v1
 *   LOCAL_LLM_MODEL e.g. local-model  (or a specific model name)
 *   LOCAL_LLM_API_KEY e.g. lm-studio (ignored by most local servers)
 */

export const LLM_BASE    = (process.env.LOCAL_LLM_URL    ?? "http://localhost:1234/v1").replace(/\/$/, "");
export const LLM_MODEL   = process.env.LOCAL_LLM_MODEL   ?? "local-model";
export const LLM_API_KEY = process.env.LOCAL_LLM_API_KEY ?? "lm-studio";

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
export async function checkLLMStatus(): Promise<LLMStatus> {
  const t0 = Date.now();
  try {
    const res = await fetch(`${LLM_BASE}/models`, {
      headers: { Authorization: `Bearer ${LLM_API_KEY}` },
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json() as { data?: { id: string }[] };
    const models = data.data ?? [];
    const model  = models[0]?.id ?? LLM_MODEL;
    const provider = LLM_BASE.includes("11434") ? "Ollama" : "LM Studio";
    return { ok: true, model, latencyMs: Date.now() - t0, provider };
  } catch (err) {
    return { ok: false, model: "", latencyMs: Date.now() - t0, provider: "offline", error: String(err) };
  }
}

// ── Streaming completion ──────────────────────────────────────────────────
/** Returns a raw fetch Response with SSE stream from the LLM */
export async function streamChat(
  messages: ChatMessage[],
  opts?: { model?: string; temperature?: number; maxTokens?: number }
): Promise<Response> {
  return fetch(`${LLM_BASE}/chat/completions`, {
    method:  "POST",
    headers: {
      "Content-Type":  "application/json",
      Authorization:   `Bearer ${LLM_API_KEY}`,
    },
    body: JSON.stringify({
      model:       opts?.model       ?? LLM_MODEL,
      messages,
      stream:      true,
      temperature: opts?.temperature ?? 0.3,
      max_tokens:  opts?.maxTokens   ?? 512,
    }),
    signal: AbortSignal.timeout(60_000),
  });
}

// ── Non-streaming completion ──────────────────────────────────────────────
export async function complete(
  messages: ChatMessage[],
  opts?: { model?: string; temperature?: number; maxTokens?: number }
): Promise<string> {
  const res = await fetch(`${LLM_BASE}/chat/completions`, {
    method:  "POST",
    headers: {
      "Content-Type":  "application/json",
      Authorization:   `Bearer ${LLM_API_KEY}`,
    },
    body: JSON.stringify({
      model:       opts?.model       ?? LLM_MODEL,
      messages,
      stream:      false,
      temperature: opts?.temperature ?? 0.3,
      max_tokens:  opts?.maxTokens   ?? 512,
    }),
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) throw new Error(`LLM error: HTTP ${res.status}`);
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
  strategies?: string;   // e.g. "RSI: BULLISH, MACD: HOLD, BB: BEARISH"
  news?:       string;   // recent headlines, one per line
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

// ── JSON analysis via LLM ──────────────────────────────────────────────────
export interface StructuredAnalysis {
  sentiment:  "bullish" | "bearish" | "neutral";
  summary:    string;
  keyLevels:  { support: number; resistance: number };
  signals:    string[];
  riskLevel:  "low" | "medium" | "high";
}

/** Ask the LLM for a JSON-structured analysis. Falls back to null on failure. */
export async function getStructuredAnalysis(
  opts: AnalysisPromptOpts
): Promise<StructuredAnalysis | null> {
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

    // Extract JSON block (LLMs sometimes wrap in ```json)
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in response");
    return JSON.parse(jsonMatch[0]) as StructuredAnalysis;
  } catch {
    return null;
  }
}
