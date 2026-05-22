/**
 * Trade screen — candlestick chart, AI analysis, and order form.
 */
import React, { useState, useEffect, useCallback } from "react";
import {
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Dimensions,
} from "react-native";
import { useLocalSearchParams, useNavigation } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColors } from "@/lib/hooks/use-colors";
import { useT } from "@/lib/hooks/use-t";
import { useTradingStore } from "@/lib/store";
import { useQuote } from "@/lib/hooks/use-quotes";
import { fetchCandles, fetchAiAnalysis, placeOrder, type AiAnalysis } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CandleChart } from "@/components/charts/candle-chart";
import { fmtCurrency, fmtPercent, colorKey } from "@/lib/utils";
import type { Candle, CandleInterval } from "@/lib/types";
import { Brain, TrendingUp, TrendingDown, Minus } from "lucide-react-native";

const { width: SCREEN_W } = Dimensions.get("window");
const CHART_W = SCREEN_W - 32;

const INTERVALS: CandleInterval[] = ["5m", "15m", "1h", "4h", "1d"];

type Side = "buy" | "sell";

export default function TradeScreen() {
  const { symbol }   = useLocalSearchParams<{ symbol: string }>();
  const navigation   = useNavigation();
  const colors       = useColors();
  const t            = useT();
  const lang         = useTradingStore((s) => s.lang);
  const watchlist    = useTradingStore((s) => s.watchlist);
  const portfolio    = useTradingStore((s) => s.portfolio);
  const setPortfolio = useTradingStore((s) => s.setPortfolio);

  const quote    = useQuote(symbol);
  const wlItem   = watchlist.find((w) => w.symbol === symbol);
  const name     = lang === "zh" && wlItem?.nameCN ? wlItem.nameCN : (wlItem?.name ?? symbol);

  // Chart
  const [candles,   setCandles]   = useState<Candle[]>([]);
  const [interval,  setInterval]  = useState<CandleInterval>("1h");
  const [chartLoad, setChartLoad] = useState(false);

  // AI
  const [aiData,  setAiData]  = useState<AiAnalysis | null>(null);
  const [aiLoad,  setAiLoad]  = useState(false);
  const [aiShown, setAiShown] = useState(false);

  // Order
  const [side,      setSide]      = useState<Side>("buy");
  const [qty,       setQty]       = useState("");
  const [placing,   setPlacing]   = useState(false);

  // Set header title
  useEffect(() => {
    navigation.setOptions({ title: symbol });
  }, [symbol]);

  // Load candles
  const loadCandles = useCallback(async () => {
    if (!symbol) return;
    setChartLoad(true);
    try {
      const data = await fetchCandles(symbol, interval);
      setCandles(data);
    } catch (e) {
      console.warn("candles error:", e);
    } finally {
      setChartLoad(false);
    }
  }, [symbol, interval]);

  useEffect(() => { loadCandles(); }, [loadCandles]);

  // AI analysis
  async function handleAnalyse() {
    if (!quote) {
      Alert.alert("Error", "Quote data not available yet.");
      return;
    }
    setAiShown(true);
    setAiLoad(true);
    try {
      const data = await fetchAiAnalysis(symbol, quote, lang);
      setAiData(data);
    } catch (e) {
      Alert.alert("Error", "AI analysis failed.");
    } finally {
      setAiLoad(false);
    }
  }

  // Order
  async function handleOrder() {
    const qtyNum = parseFloat(qty);
    if (!qtyNum || qtyNum <= 0) {
      Alert.alert("Error", "Please enter a valid quantity.");
      return;
    }
    setPlacing(true);
    try {
      const res = await placeOrder({ symbol, side, qty: qtyNum, orderType: "market" });
      Alert.alert(
        side === "buy" ? t.trade.bought : t.trade.sold,
        `${qtyNum} ${symbol} @ ${quote ? fmtCurrency(quote.price, quote.currency) : "market"}`
      );
      setQty("");
    } catch (e: unknown) {
      Alert.alert("Error", e instanceof Error ? e.message : "Order failed.");
    } finally {
      setPlacing(false);
    }
  }

  const ck = quote ? colorKey(quote.changePct) : "muted";

  const sentimentIcon = (s?: AiAnalysis["sentiment"]) => {
    if (s === "bullish") return <TrendingUp  size={16} color={colors.green}  strokeWidth={2} />;
    if (s === "bearish") return <TrendingDown size={16} color={colors.red}   strokeWidth={2} />;
    return                      <Minus        size={16} color={colors.yellow} strokeWidth={2} />;
  };

  // Position for this symbol
  const position = portfolio?.positions.find((p) => p.symbol === symbol);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={["bottom"]}>
      <ScrollView contentContainerStyle={styles.scroll}>

        {/* Price header */}
        <Card style={styles.priceCard} padding={14}>
          <View style={styles.priceTop}>
            <View>
              <View style={styles.nameRow}>
                <Text style={[styles.symbolText, { color: colors.foreground }]}>{symbol}</Text>
                {wlItem && <Badge type={wlItem.type} />}
              </View>
              <Text style={[styles.nameText, { color: colors.muted }]}>{name}</Text>
            </View>
            <View style={styles.priceRight}>
              <Text style={[styles.priceText, { color: colors.foreground }]}>
                {quote ? fmtCurrency(quote.price, quote.currency) : "—"}
              </Text>
              <Text style={[styles.changeText, { color: quote ? colors[ck] : colors.muted }]}>
                {quote ? fmtPercent(quote.changePct) : "—"}
              </Text>
            </View>
          </View>
          {quote && (
            <View style={styles.statsRow}>
              {[
                { label: "H", value: fmtCurrency(quote.high, quote.currency) },
                { label: "L", value: fmtCurrency(quote.low,  quote.currency) },
                { label: "O", value: fmtCurrency(quote.open, quote.currency) },
              ].map(({ label, value }) => (
                <View key={label} style={styles.stat}>
                  <Text style={[styles.statLabel, { color: colors.muted }]}>{label}</Text>
                  <Text style={[styles.statValue, { color: colors.foreground }]}>{value}</Text>
                </View>
              ))}
            </View>
          )}
        </Card>

        {/* Candlestick chart */}
        <Card style={styles.chartCard} padding={12}>
          {/* Interval selector */}
          <View style={styles.intervalRow}>
            {INTERVALS.map((iv) => (
              <TouchableOpacity
                key={iv}
                onPress={() => setInterval(iv)}
                style={[
                  styles.ivBtn,
                  {
                    backgroundColor: interval === iv ? colors.accent + "25" : "transparent",
                    borderColor:     interval === iv ? colors.accent         : "transparent",
                  },
                ]}
              >
                <Text style={[styles.ivText, { color: interval === iv ? colors.accent : colors.muted }]}>
                  {iv.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {chartLoad ? (
            <View style={[styles.chartPlaceholder, { height: 200 }]}>
              <ActivityIndicator color={colors.accent} />
            </View>
          ) : candles.length > 1 ? (
            <CandleChart candles={candles} width={CHART_W - 24} height={200} />
          ) : (
            <View style={[styles.chartPlaceholder, { height: 200 }]}>
              <Text style={[styles.chartEmpty, { color: colors.muted }]}>{t.chart.loading}</Text>
            </View>
          )}
        </Card>

        {/* AI Analysis */}
        <Card style={styles.aiCard} padding={14}>
          <View style={styles.aiHeader}>
            <View style={styles.aiTitle}>
              <Brain size={16} color={colors.accent} strokeWidth={2} />
              <Text style={[styles.aiTitleText, { color: colors.foreground }]}>{t.ai.title}</Text>
            </View>
            {!aiShown && (
              <TouchableOpacity
                onPress={handleAnalyse}
                style={[styles.analyseBtn, { backgroundColor: colors.accent }]}
              >
                <Text style={styles.analyseBtnText}>{t.ai.analyse}</Text>
              </TouchableOpacity>
            )}
          </View>

          {aiLoad && (
            <View style={styles.aiLoading}>
              <ActivityIndicator color={colors.accent} size="small" />
              <Text style={[styles.aiLoadingText, { color: colors.muted }]}>{t.ai.crunching}</Text>
            </View>
          )}

          {aiData && !aiLoad && (
            <View style={styles.aiContent}>
              <View style={styles.aiRow}>
                <Text style={[styles.aiLabel, { color: colors.muted }]}>{t.ai.sentiment}</Text>
                <View style={styles.aiValue}>
                  {sentimentIcon(aiData.sentiment)}
                  <Text style={[styles.aiValueText, {
                    color: aiData.sentiment === "bullish" ? colors.green
                         : aiData.sentiment === "bearish" ? colors.red
                         : colors.yellow
                  }]}>
                    {aiData.sentiment === "bullish" ? t.ai.bullish
                   : aiData.sentiment === "bearish" ? t.ai.bearish
                   : t.ai.neutral}
                  </Text>
                </View>
              </View>
              <View style={styles.aiRow}>
                <Text style={[styles.aiLabel, { color: colors.muted }]}>{t.ai.riskLevel}</Text>
                <Text style={[styles.aiValueText, {
                  color: aiData.riskLevel === "low"    ? colors.green
                       : aiData.riskLevel === "medium" ? colors.yellow
                       : colors.red
                }]}>
                  {aiData.riskLevel === "low"    ? t.ai.low
                 : aiData.riskLevel === "medium" ? t.ai.medium
                 : t.ai.high}
                </Text>
              </View>
              <View style={styles.aiRow}>
                <Text style={[styles.aiLabel, { color: colors.muted }]}>{t.ai.support}</Text>
                <Text style={[styles.aiValueText, { color: colors.green }]}>
                  {fmtCurrency(aiData.keyLevels.support, quote?.currency)}
                </Text>
              </View>
              <View style={styles.aiRow}>
                <Text style={[styles.aiLabel, { color: colors.muted }]}>{t.ai.resistance}</Text>
                <Text style={[styles.aiValueText, { color: colors.red }]}>
                  {fmtCurrency(aiData.keyLevels.resistance, quote?.currency)}
                </Text>
              </View>
              {aiData.signals.length > 0 && (
                <View style={styles.signalsList}>
                  {aiData.signals.map((sig, i) => (
                    <Text key={i} style={[styles.signalItem, { color: colors.muted }]}>• {sig}</Text>
                  ))}
                </View>
              )}
            </View>
          )}
        </Card>

        {/* Order form */}
        <Card style={styles.orderCard} padding={14}>
          <Text style={[styles.orderTitle, { color: colors.foreground }]}>{t.trade.placeOrder}</Text>

          {/* Position info */}
          {position && (
            <View style={[styles.posInfo, { backgroundColor: colors.surface2, borderColor: colors.border }]}>
              <Text style={[styles.posText, { color: colors.muted }]}>
                {t.trade.position}: {position.qty} @ {fmtCurrency(position.avgEntryPrice, position.currency ?? "USD")}
              </Text>
            </View>
          )}

          <Text style={[styles.paperNote, { color: colors.muted }]}>{t.trade.paperTrading}</Text>

          {/* Buy / Sell toggle */}
          <View style={[styles.sideRow, { backgroundColor: colors.surface2, borderColor: colors.border }]}>
            {(["buy", "sell"] as Side[]).map((s) => (
              <TouchableOpacity
                key={s}
                style={[
                  styles.sideBtn,
                  side === s && { backgroundColor: s === "buy" ? colors.green : colors.red },
                ]}
                onPress={() => setSide(s)}
              >
                <Text style={[
                  styles.sideBtnText,
                  { color: side === s ? "#fff" : colors.muted },
                ]}>
                  {s === "buy" ? t.trade.buy : t.trade.sell}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Qty input */}
          <Text style={[styles.inputLabel, { color: colors.muted }]}>{t.trade.qty}</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface2, borderColor: colors.border, color: colors.foreground }]}
            value={qty}
            onChangeText={setQty}
            placeholder="0"
            placeholderTextColor={colors.muted}
            keyboardType="decimal-pad"
          />

          {/* Estimated total */}
          {quote && qty && parseFloat(qty) > 0 && (
            <Text style={[styles.estTotal, { color: colors.muted }]}>
              {t.trade.estTotal}: {fmtCurrency(quote.price * parseFloat(qty), quote.currency)}
            </Text>
          )}

          <TouchableOpacity
            style={[
              styles.orderBtn,
              { backgroundColor: side === "buy" ? colors.green : colors.red },
            ]}
            onPress={handleOrder}
            disabled={placing}
            activeOpacity={0.8}
          >
            {placing
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.orderBtnText}>
                  {side === "buy" ? t.trade.buy : t.trade.sell} {symbol}
                </Text>
            }
          </TouchableOpacity>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:         { flex: 1 },
  scroll:       { padding: 16, paddingBottom: 32 },
  priceCard:    { marginBottom: 12 },
  priceTop:     { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 },
  nameRow:      { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 2 },
  symbolText:   { fontSize: 18, fontWeight: "700" },
  nameText:     { fontSize: 13 },
  priceRight:   { alignItems: "flex-end" },
  priceText:    { fontSize: 20, fontWeight: "700" },
  changeText:   { fontSize: 14, fontWeight: "600", marginTop: 2 },
  statsRow:     { flexDirection: "row", gap: 20 },
  stat:         { gap: 2 },
  statLabel:    { fontSize: 10, fontWeight: "600", textTransform: "uppercase" },
  statValue:    { fontSize: 13, fontWeight: "600" },
  chartCard:    { marginBottom: 12 },
  intervalRow:  { flexDirection: "row", gap: 4, marginBottom: 8 },
  ivBtn:        { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, borderWidth: 1 },
  ivText:       { fontSize: 11, fontWeight: "700" },
  chartPlaceholder: { justifyContent: "center", alignItems: "center" },
  chartEmpty:   { fontSize: 13 },
  aiCard:       { marginBottom: 12 },
  aiHeader:     { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  aiTitle:      { flexDirection: "row", alignItems: "center", gap: 6 },
  aiTitleText:  { fontSize: 15, fontWeight: "700" },
  analyseBtn:   { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8 },
  analyseBtnText:{ fontSize: 13, fontWeight: "600", color: "#fff" },
  aiLoading:    { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 8 },
  aiLoadingText:{ fontSize: 13 },
  aiContent:    { gap: 8 },
  aiRow:        { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  aiLabel:      { fontSize: 13 },
  aiValue:      { flexDirection: "row", alignItems: "center", gap: 4 },
  aiValueText:  { fontSize: 13, fontWeight: "700" },
  signalsList:  { marginTop: 4 },
  signalItem:   { fontSize: 12, lineHeight: 20 },
  orderCard:    { marginBottom: 12 },
  orderTitle:   { fontSize: 16, fontWeight: "700", marginBottom: 10 },
  posInfo:      { borderRadius: 8, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 8 },
  posText:      { fontSize: 13 },
  paperNote:    { fontSize: 11, marginBottom: 12 },
  sideRow:      { flexDirection: "row", borderRadius: 10, borderWidth: 1, overflow: "hidden", marginBottom: 14 },
  sideBtn:      { flex: 1, paddingVertical: 10, alignItems: "center" },
  sideBtnText:  { fontSize: 15, fontWeight: "700" },
  inputLabel:   { fontSize: 12, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 6 },
  input:        { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11, fontSize: 16, marginBottom: 8 },
  estTotal:     { fontSize: 12, marginBottom: 12 },
  orderBtn:     { borderRadius: 10, paddingVertical: 14, alignItems: "center" },
  orderBtnText: { fontSize: 16, fontWeight: "700", color: "#fff" },
});
