"use client";

/**
 * AITerminal — Bloomberg-terminal aesthetic AI Command Center.
 *
 * Left panel:  Status bar + News feed
 * Right panel: Analysis terminal (streaming SSE) + Chat
 * Bottom:      Chat input
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { Brain, Send, Trash2, Radio, Wifi, WifiOff, RefreshCw, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTradingStore } from "@/lib/store";
import { useT } from "@/lib/hooks/use-t";
import type { ChatMessage } from "@/lib/llm";

// ── Types ──────────────────────────────────────────────────────────────────
interface LLMStatus {
  ok:        boolean;
  model:     string;
  latencyMs: number;
  provider:  string;
}

interface NewsItem {
  title:     string;
  url:       string;
  source:    string;
  pubDate:   string;
  sentiment: "bullish" | "bearish" | "neutral";
}

interface ChatEntry {
  role:    "user" | "assistant";
  content: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────
function sentimentColor(s: "bullish" | "bearish" | "neutral") {
  return s === "bullish" ? "#3fb950" : s === "bearish" ? "#f85149" : "#8b949e";
}

function terminalLineColor(line: string): string {
  const l = line.toLowerCase();
  if (l.includes("bullish") || l.includes("⬆") || l.startsWith("bull") || l.includes("→ bull") || l.includes("buy")) return "#3fb950";
  if (l.includes("bearish") || l.includes("⬇") || l.startsWith("bear") || l.includes("→ bear") || l.includes("sell")) return "#f85149";
  if (l.startsWith("sentiment") || l.startsWith("signals") || l.startsWith("key levels") || l.startsWith("risk") || l.startsWith("tip")) return "#79c0ff";
  if (l.includes("[error]") || l.includes("⚠")) return "#ffa657";
  if (l.startsWith("  [h]") || l.includes("[h]")) return "#d2a8ff";
  if (l.startsWith("─") || l === "") return "#30363d";
  return "#e6edf3";
}

function formatTime(dateStr: string) {
  try {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

// ── Status bar ─────────────────────────────────────────────────────────────
function StatusBar({ status }: { status: LLMStatus | null }) {
  const t = useT();
  const checking = status === null;

  return (
    <div className="flex items-center gap-3 px-4 py-2 border-b border-[#30363d] bg-[#0d1117] font-mono text-[11px]">
      {/* Indicator */}
      <div className={cn(
        "flex items-center gap-1.5",
        checking ? "text-[#8b949e]" : status?.ok ? "text-[#3fb950]" : "text-[#f85149]"
      )}>
        {checking ? <Radio size={10} className="animate-pulse" /> :
          status?.ok ? <Wifi size={10} /> : <WifiOff size={10} />}
        <span className="font-bold tracking-widest">
          {checking ? t.aiTerminal.statusChecking
            : status?.ok ? t.aiTerminal.statusOnline
            : t.aiTerminal.statusOffline}
        </span>
      </div>

      <div className="h-3 w-px bg-[#30363d]" />

      {status?.ok && (
        <>
          <span className="text-[#8b949e]">
            {t.aiTerminal.model}: <span className="text-[#79c0ff]">{status.model || "local"}</span>
          </span>
          <div className="h-3 w-px bg-[#30363d]" />
          <span className="text-[#8b949e]">
            {t.aiTerminal.provider}: <span className="text-[#d2a8ff]">{status.provider}</span>
          </span>
          <div className="h-3 w-px bg-[#30363d]" />
          <span className="text-[#8b949e]">
            {t.aiTerminal.latency}: <span className="text-[#ffa657]">{status.latencyMs}ms</span>
          </span>
        </>
      )}

      {!status?.ok && !checking && (
        <span className="text-[#8b949e] text-[10px]">{t.aiTerminal.setupHint}</span>
      )}

      <div className="ml-auto text-[#30363d]">{new Date().toLocaleTimeString()}</div>
    </div>
  );
}

// ── News feed ──────────────────────────────────────────────────────────────
function NewsFeed({
  symbol, name, news, loading,
}: {
  symbol: string; name: string; news: NewsItem[]; loading: boolean;
}) {
  const t = useT();

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-2 border-b border-[#30363d] flex items-center justify-between">
        <span className="font-mono text-[10px] text-[#8b949e] tracking-widest uppercase">
          {t.aiTerminal.newsFeed}
          {symbol && <span className="ml-2 text-[#79c0ff]">/ {symbol}</span>}
        </span>
        {loading && <RefreshCw size={10} className="text-[#8b949e] animate-spin" />}
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {news.length === 0 ? (
          <p className="text-[#30363d] font-mono text-[10px] mt-4 text-center">{t.aiTerminal.noNews}</p>
        ) : (
          news.map((item, i) => (
            <div key={i} className="border border-[#21262d] rounded p-2 hover:border-[#30363d] transition-colors group">
              <div className="flex items-start gap-1.5 mb-1">
                <span
                  className="shrink-0 font-mono text-[9px] font-bold px-1 py-0.5 rounded"
                  style={{
                    color: sentimentColor(item.sentiment),
                    background: `${sentimentColor(item.sentiment)}18`,
                    border:     `1px solid ${sentimentColor(item.sentiment)}40`,
                  }}
                >
                  {item.sentiment === "bullish" ? t.aiTerminal.bullish
                    : item.sentiment === "bearish" ? t.aiTerminal.bearish
                    : t.aiTerminal.neutral}
                </span>
                <p className="text-[11px] text-[#c9d1d9] leading-tight line-clamp-2 group-hover:text-white transition-colors">
                  {item.title}
                </p>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[9px] text-[#30363d] font-mono">{item.source}</span>
                <span className="text-[9px] text-[#30363d]">·</span>
                <span className="text-[9px] text-[#30363d] font-mono">{formatTime(item.pubDate)}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ── Terminal output ────────────────────────────────────────────────────────
function TerminalOutput({ text, streaming }: { text: string; streaming: boolean }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [text]);

  const lines = text.split("\n");

  return (
    <div ref={ref} className="flex-1 overflow-y-auto p-4 font-mono text-[12px] leading-relaxed">
      {lines.map((line, i) => (
        <div key={i} style={{ color: terminalLineColor(line) }}>
          {line || " "}
        </div>
      ))}
      {streaming && (
        <span className="inline-block w-2 h-3 bg-[#58a6ff] animate-pulse ml-0.5" />
      )}
    </div>
  );
}

// ── Chat panel ─────────────────────────────────────────────────────────────
function ChatPanel({
  history, streaming, onSend, onClear,
}: {
  history: ChatEntry[];
  streaming: boolean;
  onSend: (msg: string) => void;
  onClear: () => void;
}) {
  const t = useT();
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history]);

  function handleSend() {
    const msg = input.trim();
    if (!msg || streaming) return;
    setInput("");
    onSend(msg);
  }

  return (
    <div className="flex flex-col border-t border-[#30363d]" style={{ height: "280px" }}>
      {/* Header */}
      <div className="px-3 py-2 border-b border-[#30363d] flex items-center justify-between shrink-0">
        <span className="font-mono text-[10px] text-[#8b949e] tracking-widest uppercase">
          {t.aiTerminal.chat}
        </span>
        <button
          onClick={onClear}
          className="flex items-center gap-1 text-[10px] font-mono text-[#30363d] hover:text-[#8b949e] transition-colors"
        >
          <Trash2 size={10} />
          {t.aiTerminal.clearChat}
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
        {history.map((entry, i) => (
          <div key={i} className={cn("flex gap-2", entry.role === "user" ? "justify-end" : "justify-start")}>
            {entry.role === "assistant" && (
              <div className="shrink-0 w-5 h-5 rounded bg-[#1f6feb] flex items-center justify-center">
                <Brain size={10} className="text-white" />
              </div>
            )}
            <div className={cn(
              "max-w-[80%] rounded px-2.5 py-1.5 font-mono text-[11px] leading-relaxed whitespace-pre-wrap",
              entry.role === "user"
                ? "bg-[#1f6feb20] border border-[#1f6feb40] text-[#58a6ff]"
                : "bg-[#21262d] border border-[#30363d] text-[#e6edf3]"
            )}>
              <div className={cn(
                "text-[9px] font-bold mb-1 tracking-widest",
                entry.role === "user" ? "text-[#58a6ff]" : "text-[#3fb950]"
              )}>
                {entry.role === "user" ? t.aiTerminal.you : t.aiTerminal.quantai}
              </div>
              {entry.content}
            </div>
          </div>
        ))}
        {streaming && history.length > 0 && history[history.length - 1].role === "user" && (
          <div className="flex gap-2">
            <div className="shrink-0 w-5 h-5 rounded bg-[#1f6feb] flex items-center justify-center">
              <Brain size={10} className="text-white animate-pulse" />
            </div>
            <div className="bg-[#21262d] border border-[#30363d] rounded px-2.5 py-1.5">
              <span className="inline-block w-2 h-3 bg-[#3fb950] animate-pulse" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 flex items-center gap-2 px-3 py-2 border-t border-[#30363d]">
        <ChevronRight size={12} className="text-[#3fb950] shrink-0" />
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          placeholder={t.aiTerminal.chatPlaceholder}
          disabled={streaming}
          className="flex-1 bg-transparent font-mono text-[12px] text-[#e6edf3] placeholder-[#30363d] outline-none min-w-0"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || streaming}
          className="shrink-0 p-1 rounded hover:bg-[#1f6feb20] text-[#1f6feb] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <Send size={12} />
        </button>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
export function AITerminal() {
  const t                                  = useT();
  const { activeSymbol, quotes, lang }     = useTradingStore();
  const quote                              = quotes[activeSymbol];

  // LLM status
  const [llmStatus,    setLlmStatus]    = useState<LLMStatus | null>(null);
  // News
  const [news,         setNews]         = useState<NewsItem[]>([]);
  const [newsLoading,  setNewsLoading]  = useState(false);
  // Terminal analysis
  const [terminalText, setTerminalText] = useState("");
  const [analysing,    setAnalysing]    = useState(false);
  // Chat
  const [chatHistory,  setChatHistory]  = useState<ChatEntry[]>([]);
  const [chatStreaming, setChatStreaming] = useState(false);

  // ── Poll LLM status every 10s ────────────────────────────────────────
  const checkStatus = useCallback(async () => {
    try {
      const res  = await fetch("/api/ai/status");
      const data = await res.json() as LLMStatus;
      setLlmStatus(data);
    } catch {
      setLlmStatus({ ok: false, model: "", latencyMs: 0, provider: "offline" });
    }
  }, []);

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 10_000);
    return () => clearInterval(interval);
  }, [checkStatus]);

  // ── Fetch news when symbol changes ───────────────────────────────────
  useEffect(() => {
    if (!activeSymbol) return;
    const name = quote ? (activeSymbol) : activeSymbol;
    setNewsLoading(true);
    fetch(`/api/ai/news?symbol=${encodeURIComponent(activeSymbol)}&name=${encodeURIComponent(name)}`)
      .then((r) => r.json())
      .then((data: { items: NewsItem[] }) => setNews(data.items ?? []))
      .catch(() => setNews([]))
      .finally(() => setNewsLoading(false));
  }, [activeSymbol, quote]);

  // ── Run streaming analysis ────────────────────────────────────────────
  async function runAnalysis() {
    if (!activeSymbol || analysing) return;

    const header =
      `╔═══════════════════════════════════════════════════╗\n` +
      `║  QUANTAI ANALYSIS  ·  ${activeSymbol.padEnd(8)}  ·  ${new Date().toLocaleTimeString()}  ║\n` +
      `╚═══════════════════════════════════════════════════╝\n\n`;

    setTerminalText(header);
    setAnalysing(true);

    try {
      const res = await fetch("/api/ai/stream", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol:    activeSymbol,
          name:      activeSymbol,
          price:     quote?.price     ?? 0,
          changePct: quote?.changePct ?? 0,
          high:      quote?.high      ?? 0,
          low:       quote?.low       ?? 0,
          volume:    quote?.volume    ?? 0,
          currency:  quote?.currency  ?? "USD",
          lang,
        }),
      });

      if (!res.ok || !res.body) throw new Error("Stream failed");

      const reader  = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const raw   = decoder.decode(value, { stream: true });
        const lines = raw.split("\n").filter((l) => l.startsWith("data: "));

        for (const line of lines) {
          const payload = line.slice(6).trim();
          if (payload === "[DONE]") break;
          try {
            const parsed = JSON.parse(payload) as { delta: string };
            if (parsed.delta) setTerminalText((prev) => prev + parsed.delta);
          } catch {
            // Skip
          }
        }
      }
    } catch (err) {
      setTerminalText((prev) => prev + `\n[ERROR] ${String(err)}\n`);
    } finally {
      setAnalysing(false);
      setTerminalText((prev) => prev + "\n\n─────────────────────────────────────────────────────\n");
    }
  }

  // ── Chat ──────────────────────────────────────────────────────────────
  async function sendChat(userMsg: string) {
    const newEntry: ChatEntry = { role: "user", content: userMsg };
    const updatedHistory      = [...chatHistory, newEntry];
    setChatHistory(updatedHistory);
    setChatStreaming(true);

    // Placeholder assistant entry
    const assistantEntry: ChatEntry = { role: "assistant", content: "" };
    setChatHistory([...updatedHistory, assistantEntry]);

    try {
      const msgs: ChatMessage[] = updatedHistory.map((e) => ({
        role:    e.role,
        content: e.content,
      }));

      const res = await fetch("/api/ai/chat", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: msgs, lang }),
      });

      if (!res.ok || !res.body) throw new Error("Chat stream failed");

      const reader  = res.body.getReader();
      const decoder = new TextDecoder();
      let   full    = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const raw   = decoder.decode(value, { stream: true });
        const lines = raw.split("\n").filter((l) => l.startsWith("data: "));

        for (const line of lines) {
          const payload = line.slice(6).trim();
          if (payload === "[DONE]") break;
          try {
            const parsed = JSON.parse(payload) as { delta: string };
            if (parsed.delta) {
              full += parsed.delta;
              setChatHistory([...updatedHistory, { role: "assistant", content: full }]);
            }
          } catch {
            // Skip
          }
        }
      }
    } catch (err) {
      setChatHistory([...updatedHistory, { role: "assistant", content: `[ERROR] ${String(err)}` }]);
    } finally {
      setChatStreaming(false);
    }
  }

  const symbolName = activeSymbol || "";

  return (
    <div className="flex flex-col h-full bg-[#0d1117] text-[#e6edf3]">

      {/* Status bar */}
      <StatusBar status={llmStatus} />

      {/* Main content */}
      <div className="flex-1 flex min-h-0 overflow-hidden">

        {/* ── Left: News feed ───────────────────────────────────────── */}
        <div className="w-72 border-r border-[#30363d] flex flex-col min-h-0 shrink-0 hidden lg:flex">
          <NewsFeed
            symbol={symbolName}
            name={symbolName}
            news={news}
            loading={newsLoading}
          />
        </div>

        {/* ── Right: Terminal + Chat ─────────────────────────────────── */}
        <div className="flex-1 flex flex-col min-h-0">

          {/* Terminal header */}
          <div className="px-4 py-2 border-b border-[#30363d] flex items-center justify-between shrink-0 bg-[#161b22]">
            <span className="font-mono text-[10px] text-[#8b949e] tracking-widest uppercase">
              {t.aiTerminal.analysisTerminal}
              {activeSymbol && <span className="ml-2 text-[#79c0ff]">/ {activeSymbol}</span>}
            </span>
            <button
              onClick={runAnalysis}
              disabled={!activeSymbol || analysing}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1 rounded font-mono text-[10px] font-bold tracking-widest",
                "transition-all",
                activeSymbol && !analysing
                  ? "bg-[#238636] text-white hover:bg-[#2ea043] active:scale-95"
                  : "bg-[#21262d] text-[#30363d] cursor-not-allowed"
              )}
            >
              {analysing ? (
                <><RefreshCw size={10} className="animate-spin" />{t.aiTerminal.analysing}</>
              ) : (
                <><Brain size={10} />{t.aiTerminal.analyse}</>
              )}
            </button>
          </div>

          {/* Terminal output */}
          <div className="flex-1 min-h-0 bg-[#0d1117]">
            {terminalText ? (
              <TerminalOutput text={terminalText} streaming={analysing} />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-[#30363d] font-mono text-[12px] gap-3">
                <Brain size={32} className="opacity-20" />
                {activeSymbol ? (
                  <p>{t.aiTerminal.analyse} ↑</p>
                ) : (
                  <p>{t.aiTerminal.selectAsset}</p>
                )}
                {!llmStatus?.ok && llmStatus !== null && (
                  <div className="mt-4 space-y-1 text-[10px] text-[#30363d] text-left border border-[#21262d] rounded p-3">
                    <p className="text-[#8b949e] mb-2">{t.aiTerminal.setupHint}</p>
                    <p>{t.aiTerminal.setupStep1}</p>
                    <p>{t.aiTerminal.setupStep2}</p>
                    <p>{t.aiTerminal.setupStep3}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Chat */}
          <ChatPanel
            history={chatHistory}
            streaming={chatStreaming}
            onSend={sendChat}
            onClear={() => setChatHistory([])}
          />
        </div>
      </div>
    </div>
  );
}
