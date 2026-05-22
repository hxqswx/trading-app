/**
 * AI Terminal — Bloomberg-style command centre adapted for mobile.
 *
 * Layout (top → bottom):
 *   Status bar  (LLM online/offline + latency)
 *   Asset chips (horizontal scroll)
 *   Section tabs: Terminal | News | Chat
 *   Content area (scrollable)
 *   Bottom bar  (Run Analysis or Chat input)
 */
import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView,
  Platform, FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Brain, Wifi, WifiOff, Radio, RefreshCw,
  Send, Trash2, ChevronRight, Play,
} from "lucide-react-native";
import { useColors } from "@/lib/hooks/use-colors";
import { useT } from "@/lib/hooks/use-t";
import { useTradingStore } from "@/lib/store";
import { useAllQuotes } from "@/lib/hooks/use-quotes";
import {
  checkAIStatus, fetchAINews, streamAnalysis, chatWithAI,
  type LLMStatus, type NewsItem, type ChatMessage,
} from "@/lib/api";

// ── Terminal line colours ──────────────────────────────────────────────────

function lineColor(line: string): string {
  const l = line.toLowerCase();
  if (l.includes("bullish") || l.includes("buy") || l.includes("⬆")) return "#3fb950";
  if (l.includes("bearish") || l.includes("sell") || l.includes("⬇")) return "#f85149";
  if (l.startsWith("sentiment") || l.startsWith("signals") || l.startsWith("key") || l.startsWith("risk")) return "#79c0ff";
  if (l.includes("[error]") || l.includes("⚠")) return "#ffa657";
  if (l.startsWith("  [h]") || l.includes("[h]")) return "#d2a8ff";
  if (l.startsWith("─") || l.startsWith("╔") || l.startsWith("╚") || l.startsWith("║")) return "#30363d";
  if (l === "") return "#0d1117";
  return "#e6edf3";
}

function sentimentColor(s: "bullish" | "bearish" | "neutral"): string {
  return s === "bullish" ? "#3fb950" : s === "bearish" ? "#f85149" : "#8b949e";
}

// ── Main screen ────────────────────────────────────────────────────────────

type SectionTab = "terminal" | "news" | "chat";

export default function AIScreen() {
  const colors   = useColors();
  const t        = useT();
  const lang     = useTradingStore((s) => s.lang);
  const marketLists = useTradingStore((s) => s.marketLists);
  const allQuotes   = useAllQuotes();
  const quoteMap    = Object.fromEntries(allQuotes.map((q) => [q.symbol, q]));

  // All assets across all market lists (de-duplicated)
  const allAssets = React.useMemo(() => {
    const seen = new Set<string>();
    const result: { symbol: string; nameCN?: string; name: string }[] = [];
    for (const list of Object.values(marketLists)) {
      for (const item of list) {
        if (!seen.has(item.symbol)) {
          seen.add(item.symbol);
          result.push(item);
        }
      }
    }
    return result;
  }, [marketLists]);

  const [activeSymbol, setActiveSymbol] = useState<string>(allAssets[0]?.symbol ?? "AAPL");
  const [sectionTab,   setSectionTab]   = useState<SectionTab>("terminal");

  // LLM status
  const [llmStatus,    setLlmStatus]    = useState<LLMStatus | null>(null);

  // Terminal
  const [terminalText, setTerminalText] = useState("");
  const [analysing,    setAnalysing]    = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const terminalScrollRef = useRef<ScrollView>(null);

  // News
  const [news,       setNews]       = useState<NewsItem[]>([]);
  const [newsLoading,setNewsLoading] = useState(false);

  // Chat
  const [chatHistory,  setChatHistory]  = useState<ChatMessage[]>([]);
  const [chatInput,    setChatInput]    = useState("");
  const [chatStreaming,setChatStreaming] = useState(false);
  const chatScrollRef = useRef<ScrollView>(null);

  // ── Status poll ───────────────────────────────────────────────────────
  const refreshStatus = useCallback(async () => {
    try {
      const s = await checkAIStatus();
      setLlmStatus(s);
    } catch {
      setLlmStatus({ ok: false, model: "", latencyMs: 0, provider: "offline" });
    }
  }, []);

  useEffect(() => {
    refreshStatus();
    const id = setInterval(refreshStatus, 60_000);
    return () => clearInterval(id);
  }, [refreshStatus]);

  // ── Fetch news when symbol changes ────────────────────────────────────
  useEffect(() => {
    if (!activeSymbol) return;
    setNewsLoading(true);
    const asset = allAssets.find((a) => a.symbol === activeSymbol);
    const name  = lang === "zh" ? (asset?.nameCN ?? activeSymbol) : (asset?.name ?? activeSymbol);
    fetchAINews(activeSymbol, name)
      .then((data) => setNews(data.items ?? []))
      .catch(() => setNews([]))
      .finally(() => setNewsLoading(false));
  }, [activeSymbol, lang, allAssets]);

  // ── Run analysis ──────────────────────────────────────────────────────
  async function runAnalysis() {
    if (!activeSymbol || analysing) return;
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    const quote = quoteMap[activeSymbol];
    const asset = allAssets.find((a) => a.symbol === activeSymbol);
    const name  = lang === "zh" ? (asset?.nameCN ?? activeSymbol) : (asset?.name ?? activeSymbol);

    const header =
      `╔═══════════════════════════════════════════╗\n` +
      `║  QUANTAI  ·  ${activeSymbol.padEnd(8)}  ·  ${new Date().toLocaleTimeString()}  ║\n` +
      `╚═══════════════════════════════════════════╝\n\n`;

    setTerminalText(header);
    setAnalysing(true);
    setSectionTab("terminal");

    try {
      await streamAnalysis(
        {
          symbol:    activeSymbol,
          name,
          price:     quote?.price     ?? 0,
          changePct: quote?.changePct ?? 0,
          high:      quote?.high      ?? 0,
          low:       quote?.low       ?? 0,
          volume:    quote?.volume    ?? 0,
          currency:  quote?.currency  ?? "USD",
          lang,
        },
        (delta) => {
          setTerminalText((prev) => prev + delta);
          setTimeout(() => terminalScrollRef.current?.scrollToEnd({ animated: false }), 0);
        },
        abortRef.current.signal,
      );
    } catch (err: unknown) {
      if ((err as { name?: string }).name !== "AbortError") {
        setTerminalText((prev) => prev + `\n[ERROR] ${String(err)}\n`);
      }
    } finally {
      setAnalysing(false);
      setTerminalText((prev) => prev + "\n─────────────────────────────────────────────\n");
    }
  }

  // ── Chat send ──────────────────────────────────────────────────────────
  async function sendChat() {
    const msg = chatInput.trim();
    if (!msg || chatStreaming) return;
    setChatInput("");

    const userMsg: ChatMessage = { role: "user", content: msg };
    const newHistory = [...chatHistory, userMsg];
    setChatHistory(newHistory);
    setChatStreaming(true);

    let assistantText = "";
    const assistantMsg: ChatMessage = { role: "assistant", content: "" };
    setChatHistory([...newHistory, assistantMsg]);

    try {
      await chatWithAI(
        newHistory,
        activeSymbol,
        (delta) => {
          assistantText += delta;
          setChatHistory([...newHistory, { role: "assistant", content: assistantText }]);
          setTimeout(() => chatScrollRef.current?.scrollToEnd({ animated: false }), 0);
        },
      );
    } catch (err) {
      setChatHistory([...newHistory, { role: "assistant", content: `[Error] ${String(err)}` }]);
    } finally {
      setChatStreaming(false);
    }
  }

  // ── Derived ───────────────────────────────────────────────────────────
  const isOnline   = llmStatus?.ok ?? false;
  const isChecking = llmStatus === null;
  const statusColor = isChecking ? "#8b949e" : isOnline ? "#3fb950" : "#f85149";

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: "#0d1117" }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        {/* ── Top header ── */}
        <View style={styles.topHeader}>
          <View style={[styles.iconBox, { backgroundColor: "#1f3a5f" }]}>
            <Brain size={14} color="#58a6ff" strokeWidth={2} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>{t.aiTerminal.title}</Text>
            <Text style={styles.headerSub}>{t.aiTerminal.subtitle}</Text>
          </View>
          {/* Status */}
          <View style={styles.statusPill}>
            {isChecking
              ? <Radio size={10} color={statusColor} />
              : isOnline
              ? <Wifi size={10} color={statusColor} />
              : <WifiOff size={10} color={statusColor} />}
            <Text style={[styles.statusTxt, { color: statusColor }]}>
              {isChecking ? t.aiTerminal.statusChecking
                : isOnline ? t.aiTerminal.statusOnline
                : t.aiTerminal.statusOffline}
            </Text>
          </View>
        </View>

        {/* ── Asset chips ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ backgroundColor: "#0d1117", borderBottomWidth: 1, borderBottomColor: "#21262d" }}
          contentContainerStyle={styles.assetChips}
        >
          {allAssets.map((asset) => {
            const active = activeSymbol === asset.symbol;
            const q = quoteMap[asset.symbol];
            const up = (q?.changePct ?? 0) >= 0;
            return (
              <TouchableOpacity
                key={asset.symbol}
                onPress={() => setActiveSymbol(asset.symbol)}
                style={[
                  styles.assetChip,
                  active ? { backgroundColor: "#1f6feb30", borderColor: "#58a6ff" } : { backgroundColor: "#161b22", borderColor: "#30363d" }
                ]}
              >
                <Text style={[styles.chipSymbol, { color: active ? "#58a6ff" : "#e6edf3" }]}>
                  {asset.symbol.replace("USDT", "").replace(/^(HK|CN)/, "")}
                </Text>
                {q && (
                  <Text style={[styles.chipPct, { color: up ? "#3fb950" : "#f85149" }]}>
                    {up ? "+" : ""}{q.changePct.toFixed(2)}%
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ── Section tabs ── */}
        <View style={[styles.sectionTabs, { borderBottomColor: "#21262d" }]}>
          {([
            { id: "terminal" as SectionTab, label: lang === "zh" ? "终端" : "Terminal" },
            { id: "news"     as SectionTab, label: lang === "zh" ? "资讯" : "News" },
            { id: "chat"     as SectionTab, label: lang === "zh" ? "对话" : "Chat" },
          ]).map((tab) => {
            const active = sectionTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                onPress={() => setSectionTab(tab.id)}
                style={[styles.sectionTab, active && { borderBottomColor: "#58a6ff" }]}
              >
                <Text style={[styles.sectionTabTxt, { color: active ? "#58a6ff" : "#8b949e" }]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── Content ── */}
        <View style={{ flex: 1, minHeight: 0 }}>

          {/* Terminal */}
          {sectionTab === "terminal" && (
            <ScrollView
              ref={terminalScrollRef}
              style={styles.terminalScroll}
              contentContainerStyle={styles.terminalContent}
              showsVerticalScrollIndicator={false}
            >
              {terminalText ? (
                terminalText.split("\n").map((line, i) => (
                  <Text key={i} style={[styles.termLine, { color: lineColor(line) }]}>
                    {line || " "}
                  </Text>
                ))
              ) : (
                <View style={styles.emptyTerminal}>
                  <Brain size={28} color="#30363d" />
                  <Text style={styles.emptyTerminalTxt}>
                    {lang === "zh" ? "选择资产，点击「运行分析」" : "Select an asset, then run analysis"}
                  </Text>
                </View>
              )}
              {analysing && (
                <View style={[styles.cursor, { backgroundColor: "#58a6ff" }]} />
              )}
            </ScrollView>
          )}

          {/* News */}
          {sectionTab === "news" && (
            <ScrollView
              style={styles.newsScroll}
              contentContainerStyle={styles.newsContent}
              showsVerticalScrollIndicator={false}
            >
              {newsLoading ? (
                <ActivityIndicator color="#58a6ff" style={{ marginTop: 32 }} />
              ) : news.length === 0 ? (
                <View style={styles.emptyTerminal}>
                  <Text style={styles.emptyTerminalTxt}>{t.aiTerminal.noNews}</Text>
                </View>
              ) : (
                news.map((item, i) => {
                  const sc = sentimentColor(item.sentiment);
                  return (
                    <View key={i} style={[styles.newsItem, { borderColor: "#21262d", backgroundColor: "#161b22" }]}>
                      <View style={styles.newsItemTop}>
                        <View style={[styles.sentBadge, { backgroundColor: sc + "18", borderColor: sc + "40" }]}>
                          <Text style={[styles.sentBadgeTxt, { color: sc }]}>
                            {item.sentiment === "bullish" ? t.aiTerminal.bullish
                              : item.sentiment === "bearish" ? t.aiTerminal.bearish
                              : t.aiTerminal.neutral}
                          </Text>
                        </View>
                        <Text style={styles.newsSource}>{item.source}</Text>
                        <Text style={styles.newsTime}>
                          {new Date(item.pubDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </Text>
                      </View>
                      <Text style={styles.newsTitle}>{item.title}</Text>
                    </View>
                  );
                })
              )}
            </ScrollView>
          )}

          {/* Chat */}
          {sectionTab === "chat" && (
            <ScrollView
              ref={chatScrollRef}
              style={styles.chatScroll}
              contentContainerStyle={styles.chatContent}
              showsVerticalScrollIndicator={false}
            >
              {chatHistory.length === 0 ? (
                <View style={styles.emptyTerminal}>
                  <Brain size={28} color="#30363d" />
                  <Text style={styles.emptyTerminalTxt}>
                    {lang === "zh" ? "向 QuantAI 提问任何市场问题" : "Ask QuantAI anything about markets"}
                  </Text>
                </View>
              ) : (
                chatHistory.map((entry, i) => (
                  <View key={i} style={[styles.chatMsg, entry.role === "user" ? styles.chatMsgUser : styles.chatMsgAI]}>
                    {entry.role === "assistant" && (
                      <View style={styles.aiBubbleIcon}>
                        <Brain size={10} color="#fff" />
                      </View>
                    )}
                    <View style={[
                      styles.chatBubble,
                      entry.role === "user"
                        ? { backgroundColor: "#1f6feb20", borderColor: "#1f6feb40" }
                        : { backgroundColor: "#21262d", borderColor: "#30363d" }
                    ]}>
                      <Text style={[
                        styles.chatRole,
                        { color: entry.role === "user" ? "#58a6ff" : "#3fb950" }
                      ]}>
                        {entry.role === "user" ? t.aiTerminal.you : t.aiTerminal.quantai}
                      </Text>
                      <Text style={styles.chatMsgText}>{entry.content}</Text>
                    </View>
                  </View>
                ))
              )}
              {chatStreaming && chatHistory.length > 0 && chatHistory[chatHistory.length - 1].role === "user" && (
                <View style={[styles.chatMsg, styles.chatMsgAI]}>
                  <View style={styles.aiBubbleIcon}>
                    <Brain size={10} color="#fff" />
                  </View>
                  <View style={[styles.chatBubble, { backgroundColor: "#21262d", borderColor: "#30363d" }]}>
                    <ActivityIndicator size="small" color="#3fb950" />
                  </View>
                </View>
              )}
            </ScrollView>
          )}
        </View>

        {/* ── Bottom bar ── */}
        {sectionTab !== "chat" ? (
          /* Run Analysis button */
          <View style={[styles.bottomBar, { borderTopColor: "#21262d", backgroundColor: "#0d1117" }]}>
            {llmStatus && !llmStatus.ok && (
              <Text style={styles.offlineHint}>{t.aiTerminal.setupHint}</Text>
            )}
            <TouchableOpacity
              onPress={runAnalysis}
              disabled={analysing}
              style={[styles.runBtn, { backgroundColor: analysing ? "#30363d" : "#1f6feb", opacity: analysing ? 0.7 : 1 }]}
            >
              {analysing
                ? <ActivityIndicator size="small" color="#fff" />
                : <Play size={14} color="#fff" strokeWidth={2} />}
              <Text style={styles.runBtnTxt}>
                {analysing ? t.aiTerminal.analysing : t.aiTerminal.analyse}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* Chat input */
          <View style={[styles.chatInputBar, { borderTopColor: "#21262d", backgroundColor: "#0d1117" }]}>
            <View style={[styles.chatInputRow, { backgroundColor: "#161b22", borderColor: "#30363d" }]}>
              <ChevronRight size={12} color="#3fb950" />
              <TextInput
                style={[styles.chatInputField, { color: "#e6edf3" }]}
                value={chatInput}
                onChangeText={setChatInput}
                placeholder={t.aiTerminal.chatPlaceholder}
                placeholderTextColor="#30363d"
                onSubmitEditing={sendChat}
                returnKeyType="send"
                editable={!chatStreaming}
                multiline={false}
              />
              <TouchableOpacity
                onPress={sendChat}
                disabled={!chatInput.trim() || chatStreaming}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Send size={14} color={chatInput.trim() && !chatStreaming ? "#1f6feb" : "#30363d"} />
              </TouchableOpacity>
            </View>
            {chatHistory.length > 0 && (
              <TouchableOpacity
                onPress={() => setChatHistory([])}
                style={styles.clearBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Trash2 size={13} color="#8b949e" />
              </TouchableOpacity>
            )}
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1 },

  // Header
  topHeader:   { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#21262d" },
  iconBox:     { width: 28, height: 28, borderRadius: 6, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 13, fontWeight: "700", color: "#e6edf3", fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace" },
  headerSub:   { fontSize: 10, color: "#8b949e", fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace" },
  statusPill:  { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#161b22", borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: "#21262d" },
  statusTxt:   { fontSize: 9, fontWeight: "700", fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace" },

  // Asset chips
  assetChips:  { paddingHorizontal: 12, paddingVertical: 8, gap: 6 },
  assetChip:   { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, borderWidth: 1, alignItems: "center" },
  chipSymbol:  { fontSize: 11, fontWeight: "700", fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace" },
  chipPct:     { fontSize: 9, fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace", marginTop: 1 },

  // Section tabs
  sectionTabs: { flexDirection: "row", borderBottomWidth: 1 },
  sectionTab:  { flex: 1, alignItems: "center", paddingVertical: 10, borderBottomWidth: 2, borderBottomColor: "transparent" },
  sectionTabTxt:{ fontSize: 12, fontWeight: "600", fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace" },

  // Terminal
  terminalScroll:  { flex: 1, backgroundColor: "#0d1117" },
  terminalContent: { padding: 12, paddingBottom: 8 },
  termLine:        { fontSize: 11, lineHeight: 17, fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace" },
  emptyTerminal:   { alignItems: "center", paddingTop: 48, gap: 12 },
  emptyTerminalTxt:{ fontSize: 12, color: "#30363d", textAlign: "center", fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace" },
  cursor:          { width: 8, height: 12, marginTop: 2 },

  // News
  newsScroll:   { flex: 1, backgroundColor: "#0d1117" },
  newsContent:  { padding: 12, gap: 8, paddingBottom: 24 },
  newsItem:     { borderWidth: 1, borderRadius: 8, padding: 10 },
  newsItemTop:  { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 5 },
  sentBadge:    { borderWidth: 1, borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2 },
  sentBadgeTxt: { fontSize: 9, fontWeight: "700", fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace" },
  newsSource:   { fontSize: 9, color: "#30363d", fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace", flex: 1 },
  newsTime:     { fontSize: 9, color: "#30363d", fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace" },
  newsTitle:    { fontSize: 12, color: "#c9d1d9", lineHeight: 17 },

  // Chat
  chatScroll:    { flex: 1, backgroundColor: "#0d1117" },
  chatContent:   { padding: 12, gap: 12, paddingBottom: 8 },
  chatMsg:       { flexDirection: "row", gap: 8 },
  chatMsgUser:   { justifyContent: "flex-end" },
  chatMsgAI:     { justifyContent: "flex-start", alignItems: "flex-start" },
  aiBubbleIcon:  { width: 20, height: 20, borderRadius: 4, backgroundColor: "#1f6feb", alignItems: "center", justifyContent: "center", marginTop: 18, flexShrink: 0 },
  chatBubble:    { maxWidth: "80%", borderWidth: 1, borderRadius: 8, padding: 10 },
  chatRole:      { fontSize: 9, fontWeight: "700", fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace", marginBottom: 4 },
  chatMsgText:   { fontSize: 12, color: "#e6edf3", fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace", lineHeight: 17 },

  // Bottom bar (terminal/news)
  bottomBar:    { paddingHorizontal: 14, paddingVertical: 10, borderTopWidth: 1, gap: 8 },
  offlineHint:  { fontSize: 10, color: "#8b949e", textAlign: "center", fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace" },
  runBtn:       { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 10, paddingVertical: 13 },
  runBtnTxt:    { fontSize: 14, fontWeight: "700", color: "#fff", fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace" },

  // Bottom bar (chat)
  chatInputBar:  { paddingHorizontal: 12, paddingVertical: 8, borderTopWidth: 1, flexDirection: "row", alignItems: "center", gap: 8 },
  chatInputRow:  { flex: 1, flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9 },
  chatInputField:{ flex: 1, fontSize: 13, fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace" },
  clearBtn:      { padding: 4 },
});
