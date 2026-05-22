/**
 * Markets screen — one tab per market, fully customisable symbol lists.
 */
import React, { useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
  Animated,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  Pencil,
  Check,
  Plus,
  X,
  RotateCcw,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react-native";
import { useColors } from "@/lib/hooks/use-colors";
import { useTradingStore } from "@/lib/store";
import { useAllQuotes } from "@/lib/hooks/use-quotes";
import { fetchQuotes } from "@/lib/api";
import { fmtCurrency, fmtPercent, colorKey } from "@/lib/utils";
import type { AssetType, WatchlistItem, Quote } from "@/lib/types";

// ---------------------------------------------------------------------------
// Market tab config
// ---------------------------------------------------------------------------
type MarketTab = AssetType;
const TABS: MarketTab[] = ["stock", "crypto", "hk", "cn", "forex"];

const MARKET_META: Record<
  MarketTab,
  { labelZh: string; labelEn: string; color: string; hint: string }
> = {
  stock:  { labelZh: "美股",   labelEn: "US",     color: "#6366f1", hint: "e.g. AAPL, NVDA" },
  crypto: { labelZh: "加密",   labelEn: "Crypto",  color: "#f59e0b", hint: "e.g. BTCUSDT" },
  hk:     { labelZh: "港股",   labelEn: "HK",     color: "#10b981", hint: "e.g. HK0700" },
  cn:     { labelZh: "A股",    labelEn: "CN",     color: "#ef4444", hint: "e.g. CN600519" },
  forex:  { labelZh: "外汇",   labelEn: "FX",     color: "#8b5cf6", hint: "e.g. EURUSD=X" },
};

// ---------------------------------------------------------------------------
// Quote row
// ---------------------------------------------------------------------------
function QuoteRow({
  item,
  quote,
  editMode,
  onRemove,
  onPress,
}: {
  item: WatchlistItem;
  quote: Quote | null;
  editMode: boolean;
  onRemove: () => void;
  onPress: () => void;
}) {
  const colors = useColors();
  const lang   = useTradingStore((s) => s.lang);
  const name   = lang === "zh" && item.nameCN ? item.nameCN : item.name;
  const ck     = quote ? colorKey(quote.changePct) : "muted";

  const price   = quote ? fmtCurrency(quote.price, quote.currency) : "—";
  const pct     = quote ? fmtPercent(quote.changePct) : "—";
  const isUp    = quote && quote.changePct > 0;
  const isDown  = quote && quote.changePct < 0;

  return (
    <TouchableOpacity
      onPress={editMode ? undefined : onPress}
      activeOpacity={editMode ? 1 : 0.65}
    >
      <View style={[styles.row, { borderBottomColor: colors.border }]}>
        {/* Delete button (edit mode) */}
        {editMode && (
          <TouchableOpacity
            onPress={onRemove}
            style={[styles.deleteBtn, { backgroundColor: "#ef444422" }]}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <X size={13} color="#ef4444" strokeWidth={2.5} />
          </TouchableOpacity>
        )}

        {/* Symbol + name */}
        <View style={styles.rowLeft}>
          <Text style={[styles.symbol, { color: colors.foreground }]} numberOfLines={1}>
            {item.symbol}
          </Text>
          <Text style={[styles.name, { color: colors.muted }]} numberOfLines={1}>
            {name}
          </Text>
        </View>

        {/* Price + change */}
        <View style={styles.rowRight}>
          <Text style={[styles.price, { color: colors.foreground }]}>{price}</Text>
          <View style={[styles.changePill, { backgroundColor: `${colors[ck]}18` }]}>
            {isUp   && <TrendingUp  size={10} color={colors[ck]} strokeWidth={2} />}
            {isDown && <TrendingDown size={10} color={colors[ck]} strokeWidth={2} />}
            {!isUp && !isDown && <Minus size={10} color={colors[ck]} strokeWidth={2} />}
            <Text style={[styles.changeTxt, { color: colors[ck] }]}>{pct}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ---------------------------------------------------------------------------
// Add symbol modal
// ---------------------------------------------------------------------------
function AddModal({
  visible,
  market,
  onAdd,
  onClose,
}: {
  visible: boolean;
  market: MarketTab;
  onAdd: (item: WatchlistItem) => void;
  onClose: () => void;
}) {
  const colors  = useColors();
  const meta    = MARKET_META[market];
  const [input, setInput]     = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const inputRef = useRef<TextInput>(null);

  function reset() {
    setInput("");
    setError(null);
    setLoading(false);
  }

  async function handleAdd() {
    const sym = input.trim().toUpperCase();
    if (!sym) return;
    setLoading(true);
    setError(null);
    try {
      const quotes = await fetchQuotes([sym]);
      if (!quotes || quotes.length === 0) throw new Error("not found");
      const q = quotes[0];
      onAdd({ symbol: q.symbol, name: q.symbol, type: market });
      reset();
      onClose();
    } catch {
      setError("找不到该代码，请确认格式正确");
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    reset();
    onClose();
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={handleClose} />
        <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={[styles.marketDot, { backgroundColor: meta.color }]} />
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>
              添加{meta.labelZh}股票
            </Text>
            <TouchableOpacity onPress={handleClose}>
              <X size={18} color={colors.muted} />
            </TouchableOpacity>
          </View>

          {/* Input */}
          <View style={[styles.modalInputRow, { borderColor: error ? "#ef4444" : colors.border, backgroundColor: colors.background }]}>
            <TextInput
              ref={inputRef}
              style={[styles.modalInput, { color: colors.foreground }]}
              placeholder={meta.hint}
              placeholderTextColor={colors.muted}
              value={input}
              onChangeText={(t) => { setInput(t); setError(null); }}
              autoCapitalize="characters"
              autoCorrect={false}
              autoFocus
              onSubmitEditing={handleAdd}
              returnKeyType="done"
            />
          </View>
          {error && (
            <Text style={styles.errorTxt}>{error}</Text>
          )}

          {/* Confirm */}
          <TouchableOpacity
            style={[styles.confirmBtn, { backgroundColor: meta.color, opacity: loading ? 0.7 : 1 }]}
            onPress={handleAdd}
            disabled={loading || !input.trim()}
          >
            {loading
              ? <ActivityIndicator size="small" color="#fff" />
              : <Text style={styles.confirmTxt}>确认添加</Text>
            }
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------
export default function MarketsScreen() {
  const colors  = useColors();
  const router  = useRouter();
  const lang    = useTradingStore((s) => s.lang);
  const allQ    = useAllQuotes();

  const marketLists         = useTradingStore((s) => s.marketLists);
  const addToMarketList     = useTradingStore((s) => s.addToMarketList);
  const removeFromMarketList = useTradingStore((s) => s.removeFromMarketList);
  const resetMarketList     = useTradingStore((s) => s.resetMarketList);

  const [activeTab, setActiveTab] = useState<MarketTab>("stock");
  const [editMode, setEditMode]   = useState(false);
  const [addVisible, setAddVisible] = useState(false);

  const quoteMap = Object.fromEntries(allQ.map((q) => [q.symbol, q]));
  const list     = marketLists[activeTab] ?? [];
  const meta     = MARKET_META[activeTab];

  function handleTabChange(tab: MarketTab) {
    setActiveTab(tab);
    setEditMode(false);
  }

  function handleRemove(symbol: string) {
    removeFromMarketList(activeTab, symbol);
  }

  function handleAdd(item: WatchlistItem) {
    addToMarketList(activeTab, item);
  }

  function handleReset() {
    Alert.alert(
      "重置列表",
      `将${meta.labelZh}列表恢复为默认？`,
      [
        { text: "取消", style: "cancel" },
        { text: "重置", style: "destructive", onPress: () => resetMarketList(activeTab) },
      ]
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      {/* ── Header ── */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerTop}>
          <View>
            <Text style={[styles.title, { color: colors.foreground }]}>
              {lang === "zh" ? "市场" : "Markets"}
            </Text>
            <Text style={[styles.subtitle, { color: colors.muted }]}>
              {lang === "zh" ? "实时行情" : "Live prices"}
            </Text>
          </View>
          <View style={styles.headerActions}>
            {editMode && (
              <TouchableOpacity onPress={handleReset} style={styles.headerBtn} hitSlop={{top:8,bottom:8,left:8,right:8}}>
                <RotateCcw size={16} color={colors.muted} strokeWidth={2} />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={() => setEditMode((v) => !v)}
              style={[
                styles.editBtn,
                { backgroundColor: editMode ? meta.color : colors.surface, borderColor: editMode ? meta.color : colors.border },
              ]}
            >
              {editMode
                ? <Check size={14} color="#fff" strokeWidth={2.5} />
                : <Pencil size={14} color={colors.muted} strokeWidth={2} />
              }
              <Text style={[styles.editBtnTxt, { color: editMode ? "#fff" : colors.muted }]}>
                {editMode ? (lang === "zh" ? "完成" : "Done") : (lang === "zh" ? "编辑" : "Edit")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Market tabs ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabScroll}
          contentContainerStyle={styles.tabContent}
        >
          {TABS.map((tab) => {
            const m       = MARKET_META[tab];
            const active  = activeTab === tab;
            const tabList = marketLists[tab] ?? [];
            return (
              <TouchableOpacity
                key={tab}
                onPress={() => handleTabChange(tab)}
                style={[
                  styles.tab,
                  {
                    backgroundColor: active ? m.color : colors.surface,
                    borderColor:     active ? m.color : colors.border,
                  },
                ]}
              >
                <Text style={[styles.tabLabel, { color: active ? "#fff" : colors.muted }]}>
                  {lang === "zh" ? m.labelZh : m.labelEn}
                </Text>
                <View style={[styles.tabCount, { backgroundColor: active ? "rgba(255,255,255,0.25)" : colors.border }]}>
                  <Text style={[styles.tabCountTxt, { color: active ? "#fff" : colors.muted }]}>
                    {tabList.length}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ── List ── */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Active market label */}
        <View style={styles.sectionRow}>
          <View style={[styles.sectionDot, { backgroundColor: meta.color }]} />
          <Text style={[styles.sectionLabel, { color: colors.muted }]}>
            {lang === "zh" ? meta.labelZh : meta.labelEn}
            {"  "}
            <Text style={{ fontSize: 11 }}>{list.length} 支</Text>
          </Text>
        </View>

        {/* Quote rows */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {list.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyTxt, { color: colors.muted }]}>
                {lang === "zh" ? "暂无股票，点击 + 添加" : "No symbols. Tap + to add."}
              </Text>
            </View>
          ) : (
            list.map((item) => (
              <QuoteRow
                key={item.symbol}
                item={item}
                quote={quoteMap[item.symbol] ?? null}
                editMode={editMode}
                onRemove={() => handleRemove(item.symbol)}
                onPress={() => router.push(`/trade/${item.symbol}`)}
              />
            ))
          )}
        </View>

        {/* Add button */}
        <TouchableOpacity
          style={[styles.addRow, { borderColor: meta.color + "55", backgroundColor: meta.color + "0e" }]}
          onPress={() => setAddVisible(true)}
        >
          <Plus size={15} color={meta.color} strokeWidth={2.5} />
          <Text style={[styles.addTxt, { color: meta.color }]}>
            {lang === "zh" ? `添加${meta.labelZh}股票` : `Add ${meta.labelEn} symbol`}
          </Text>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* ── Add symbol modal ── */}
      <AddModal
        visible={addVisible}
        market={activeTab}
        onAdd={handleAdd}
        onClose={() => setAddVisible(false)}
      />
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  safe:           { flex: 1 },

  // Header
  header:         { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 0, borderBottomWidth: StyleSheet.hairlineWidth },
  headerTop:      { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 },
  title:          { fontSize: 24, fontWeight: "700" },
  subtitle:       { fontSize: 12, marginTop: 1 },
  headerActions:  { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 },
  headerBtn:      { padding: 6 },
  editBtn:        { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  editBtnTxt:     { fontSize: 13, fontWeight: "600" },

  // Tabs
  tabScroll:      { marginBottom: 0 },
  tabContent:     { paddingBottom: 12, gap: 8 },
  tab:            { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  tabLabel:       { fontSize: 13, fontWeight: "700" },
  tabCount:       { paddingHorizontal: 6, paddingVertical: 1, borderRadius: 10 },
  tabCountTxt:    { fontSize: 10, fontWeight: "600" },

  // List
  listContent:    { padding: 16 },
  sectionRow:     { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10 },
  sectionDot:     { width: 8, height: 8, borderRadius: 4 },
  sectionLabel:   { fontSize: 12, fontWeight: "600", letterSpacing: 0.4 },
  card:           { borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, overflow: "hidden", marginBottom: 12 },

  // Row
  row:            { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 13, borderBottomWidth: StyleSheet.hairlineWidth, gap: 10 },
  deleteBtn:      { width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  rowLeft:        { flex: 1, minWidth: 0 },
  symbol:         { fontSize: 14, fontWeight: "700" },
  name:           { fontSize: 11, marginTop: 2 },
  rowRight:       { alignItems: "flex-end", gap: 4 },
  price:          { fontSize: 14, fontWeight: "600" },
  changePill:     { flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8 },
  changeTxt:      { fontSize: 11, fontWeight: "700" },

  // Add row
  addRow:         { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, paddingVertical: 13, borderRadius: 14, borderWidth: 1, borderStyle: "dashed" },
  addTxt:         { fontSize: 14, fontWeight: "600" },

  // Empty
  emptyState:     { paddingVertical: 32, alignItems: "center" },
  emptyTxt:       { fontSize: 13 },

  // Modal
  modalOverlay:   { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.55)" },
  modalCard:      { marginHorizontal: 12, marginBottom: 24, borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, padding: 20, paddingBottom: 28 },
  modalHeader:    { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 18 },
  marketDot:      { width: 10, height: 10, borderRadius: 5 },
  modalTitle:     { flex: 1, fontSize: 16, fontWeight: "700" },
  modalInputRow:  { flexDirection: "row", alignItems: "center", borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, marginBottom: 6 },
  modalInput:     { flex: 1, fontSize: 16, fontWeight: "600", letterSpacing: 0.5 },
  errorTxt:       { fontSize: 12, color: "#ef4444", marginBottom: 12, marginLeft: 4 },
  confirmBtn:     { borderRadius: 12, paddingVertical: 14, alignItems: "center", marginTop: 10 },
  confirmTxt:     { fontSize: 15, fontWeight: "700", color: "#fff" },
});
