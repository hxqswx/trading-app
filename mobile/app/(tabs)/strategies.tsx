/**
 * Strategies screen — signal consensus per asset.
 */
import React, { useState, useCallback } from "react";
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { RefreshCw } from "lucide-react-native";
import { useColors } from "@/lib/hooks/use-colors";
import { useT } from "@/lib/hooks/use-t";
import { useTradingStore } from "@/lib/store";
import { useAllQuotes } from "@/lib/hooks/use-quotes";
import { fetchStrategies, type StrategyResult } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { fmtCurrency, fmtPercent, colorKey } from "@/lib/utils";

type ConsensusKey = "strong_buy" | "buy" | "hold" | "sell" | "strong_sell";

function consensusColor(c: ConsensusKey, colors: ReturnType<typeof useColors>) {
  if (c === "strong_buy" || c === "buy")   return colors.green;
  if (c === "strong_sell" || c === "sell") return colors.red;
  return colors.yellow;
}

function consensusLabel(c: ConsensusKey, t: ReturnType<typeof useT>): string {
  const map: Record<ConsensusKey, string> = {
    strong_buy:  t.strategies.strongBuy,
    buy:         t.strategies.buy,
    hold:        t.strategies.hold,
    sell:        t.strategies.sell,
    strong_sell: t.strategies.strongSell,
  };
  return map[c];
}

export default function StrategiesScreen() {
  const colors     = useColors();
  const t          = useT();
  const allQuotes  = useAllQuotes();
  const watchlist  = useTradingStore((s) => s.watchlist);
  const lang       = useTradingStore((s) => s.lang);

  const [results,   setResults]   = useState<Record<string, StrategyResult>>({});
  const [loading,   setLoading]   = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadAll = useCallback(async () => {
    setLoading(true);
    const symbols = watchlist.map((w) => w.symbol).slice(0, 8);
    const settled = await Promise.allSettled(symbols.map((s) => fetchStrategies(s)));
    const next: Record<string, StrategyResult> = {};
    settled.forEach((r, i) => {
      if (r.status === "fulfilled") next[symbols[i]] = r.value;
    });
    setResults(next);
    setLoading(false);
  }, [watchlist]);

  async function onRefresh() {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
        }
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.title, { color: colors.foreground }]}>{t.strategies.title}</Text>
            <Text style={[styles.subtitle, { color: colors.muted }]}>{t.strategies.subtitle}</Text>
          </View>
          <TouchableOpacity
            onPress={loadAll}
            style={[styles.refreshBtn, { borderColor: colors.border, backgroundColor: colors.surface }]}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator size="small" color={colors.accent} />
              : <RefreshCw size={16} color={colors.accent} strokeWidth={2} />
            }
          </TouchableOpacity>
        </View>

        {watchlist.map((item) => {
          const q    = allQuotes.find((q) => q.symbol === item.symbol);
          const res  = results[item.symbol];
          const name = lang === "zh" && item.nameCN ? item.nameCN : item.name;

          return (
            <Card key={item.symbol} style={styles.card} padding={14}>
              <View style={styles.cardTop}>
                <View style={styles.cardLeft}>
                  <View style={styles.rowTop}>
                    <Text style={[styles.symbol, { color: colors.foreground }]}>{item.symbol}</Text>
                    <Badge type={item.type} />
                  </View>
                  <Text style={[styles.name, { color: colors.muted }]}>{name}</Text>
                </View>
                <View style={styles.cardRight}>
                  {q && (
                    <>
                      <Text style={[styles.price, { color: colors.foreground }]}>
                        {fmtCurrency(q.price, q.currency)}
                      </Text>
                      <Text style={[styles.change, { color: colors[colorKey(q.changePct)] }]}>
                        {fmtPercent(q.changePct)}
                      </Text>
                    </>
                  )}
                </View>
              </View>

              {res && (
                <>
                  <View style={[styles.divider, { backgroundColor: colors.border }]} />
                  <View style={styles.signalRow}>
                    {res.signals.map((sig) => (
                      <View key={sig.name} style={styles.signal}>
                        <Text style={[styles.sigName, { color: colors.muted }]}>{sig.name}</Text>
                        <Text style={[styles.sigVal, { color: consensusColor(sig.signal, colors) }]}>
                          {consensusLabel(sig.signal, t)}
                        </Text>
                      </View>
                    ))}
                  </View>
                  <View style={styles.consensusRow}>
                    <Text style={[styles.consensusLabel, { color: colors.muted }]}>
                      {t.strategies.consensus}
                    </Text>
                    <Text style={[styles.consensusVal, { color: consensusColor(res.consensus, colors) }]}>
                      {consensusLabel(res.consensus, t)}
                    </Text>
                  </View>
                </>
              )}
            </Card>
          );
        })}

        {Object.keys(results).length === 0 && !loading && (
          <Text style={[styles.hint, { color: colors.muted }]}>
            Pull down to refresh or tap the refresh button to load signals.
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:          { flex: 1 },
  scroll:        { padding: 16, paddingBottom: 32 },
  headerRow:     { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 },
  title:         { fontSize: 24, fontWeight: "700", marginBottom: 2 },
  subtitle:      { fontSize: 13 },
  refreshBtn:    { width: 38, height: 38, borderRadius: 10, borderWidth: 1, justifyContent: "center", alignItems: "center" },
  card:          { marginBottom: 12 },
  cardTop:       { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  cardLeft:      { flex: 1, marginRight: 12 },
  cardRight:     { alignItems: "flex-end" },
  rowTop:        { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 2 },
  symbol:        { fontSize: 14, fontWeight: "700" },
  name:          { fontSize: 12 },
  price:         { fontSize: 14, fontWeight: "600" },
  change:        { fontSize: 12, marginTop: 1, fontWeight: "600" },
  divider:       { height: 1, marginVertical: 10 },
  signalRow:     { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 8 },
  signal:        { gap: 2 },
  sigName:       { fontSize: 10, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.3 },
  sigVal:        { fontSize: 11, fontWeight: "700" },
  consensusRow:  { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  consensusLabel:{ fontSize: 12, fontWeight: "600" },
  consensusVal:  { fontSize: 13, fontWeight: "700" },
  hint:          { textAlign: "center", marginTop: 40, fontSize: 13, lineHeight: 20 },
});
