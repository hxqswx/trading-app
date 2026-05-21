/**
 * Dashboard screen — portfolio summary + top movers.
 */
import React, { useState } from "react";
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColors } from "@/lib/hooks/use-colors";
import { useT } from "@/lib/hooks/use-t";
import { useTradingStore } from "@/lib/store";
import { useAllQuotes } from "@/lib/hooks/use-quotes";
import { usePortfolio } from "@/lib/hooks/use-portfolio";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { fmtCurrency, fmtPercent, colorKey } from "@/lib/utils";
import type { Quote } from "@/lib/types";

const { width: SCREEN_W } = Dimensions.get("window");

function QuoteRow({ q }: { q: Quote }) {
  const colors = useColors();
  const lang   = useTradingStore((s) => s.lang);
  const wl     = useTradingStore((s) => s.watchlist);
  const item   = wl.find((w) => w.symbol === q.symbol);
  const name   = lang === "zh" && item?.nameCN ? item.nameCN : (item?.name ?? q.symbol);
  const router = useRouter();
  const ck     = colorKey(q.changePct);

  return (
    <TouchableOpacity
      onPress={() => router.push(`/trade/${q.symbol}`)}
      activeOpacity={0.7}
    >
      <View style={[styles.row, { borderBottomColor: colors.border }]}>
        <View style={styles.rowLeft}>
          <Text style={[styles.symbol, { color: colors.foreground }]}>{q.symbol}</Text>
          <Text style={[styles.name, { color: colors.muted }]} numberOfLines={1}>{name}</Text>
        </View>
        <View style={styles.rowRight}>
          <Text style={[styles.price, { color: colors.foreground }]}>
            {fmtCurrency(q.price, q.currency)}
          </Text>
          <Text style={[styles.change, { color: colors[ck] }]}>
            {fmtPercent(q.changePct)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function DashboardScreen() {
  const colors             = useColors();
  const t                  = useT();
  const allQuotes          = useAllQuotes();
  const { portfolio, loading, refresh } = usePortfolio();
  const [tab, setTab]      = useState<"gainers" | "losers">("gainers");
  const [refreshing, setRefreshing] = useState(false);

  const gainers = [...allQuotes]
    .filter((q) => q.changePct > 0)
    .sort((a, b) => b.changePct - a.changePct)
    .slice(0, 6);

  const losers = [...allQuotes]
    .filter((q) => q.changePct < 0)
    .sort((a, b) => a.changePct - b.changePct)
    .slice(0, 6);

  const movers = tab === "gainers" ? gainers : losers;

  async function onRefresh() {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }

  const dayPnlColor = portfolio ? colorKey(portfolio.dayPnl) : "muted";

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
        }
      >
        {/* Header */}
        <Text style={[styles.title, { color: colors.foreground }]}>{t.dashboard.title}</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>{t.dashboard.subtitle}</Text>

        {/* Portfolio summary cards */}
        <View style={styles.summaryRow}>
          <Card style={styles.summaryCard} padding={14}>
            <Text style={[styles.summaryLabel, { color: colors.muted }]}>{t.portfolio.equity}</Text>
            {loading && !portfolio
              ? <Skeleton height={22} width={100} style={{ marginTop: 4 }} />
              : <Text style={[styles.summaryValue, { color: colors.foreground }]}>
                  {portfolio ? fmtCurrency(portfolio.equity) : "—"}
                </Text>
            }
          </Card>
          <Card style={styles.summaryCard} padding={14}>
            <Text style={[styles.summaryLabel, { color: colors.muted }]}>{t.portfolio.dayPnl}</Text>
            {loading && !portfolio
              ? <Skeleton height={22} width={80} style={{ marginTop: 4 }} />
              : <Text style={[styles.summaryValue, { color: portfolio ? colors[dayPnlColor] : colors.muted }]}>
                  {portfolio ? fmtCurrency(portfolio.dayPnl) : "—"}
                </Text>
            }
          </Card>
        </View>

        {/* Top movers */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{t.dashboard.topMovers}</Text>
          <View style={[styles.tabs, { backgroundColor: colors.surface2, borderColor: colors.border }]}>
            <TouchableOpacity
              style={[styles.tabBtn, tab === "gainers" && { backgroundColor: colors.green + "30" }]}
              onPress={() => setTab("gainers")}
            >
              <Text style={[styles.tabText, { color: tab === "gainers" ? colors.green : colors.muted }]}>
                {t.dashboard.gainers}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabBtn, tab === "losers" && { backgroundColor: colors.red + "30" }]}
              onPress={() => setTab("losers")}
            >
              <Text style={[styles.tabText, { color: tab === "losers" ? colors.red : colors.muted }]}>
                {t.dashboard.losers}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <Card padding={0}>
          {movers.length === 0 ? (
            <Text style={[styles.empty, { color: colors.muted }]}>—</Text>
          ) : (
            movers.map((q) => <QuoteRow key={q.symbol} q={q} />)
          )}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:         { flex: 1 },
  scroll:       { padding: 16, paddingBottom: 32 },
  title:        { fontSize: 24, fontWeight: "700", marginBottom: 2 },
  subtitle:     { fontSize: 13, marginBottom: 20 },
  summaryRow:   { flexDirection: "row", gap: 12, marginBottom: 20 },
  summaryCard:  { flex: 1 },
  summaryLabel: { fontSize: 11, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.4 },
  summaryValue: { fontSize: 18, fontWeight: "700", marginTop: 4 },
  sectionHeader:{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: "700" },
  tabs:         { flexDirection: "row", borderRadius: 8, borderWidth: 1, overflow: "hidden" },
  tabBtn:       { paddingHorizontal: 12, paddingVertical: 5 },
  tabText:      { fontSize: 12, fontWeight: "600" },
  row:          { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 13, borderBottomWidth: StyleSheet.hairlineWidth },
  rowLeft:      { flex: 1, marginRight: 12 },
  symbol:       { fontSize: 14, fontWeight: "700" },
  name:         { fontSize: 12, marginTop: 1 },
  rowRight:     { alignItems: "flex-end" },
  price:        { fontSize: 14, fontWeight: "600" },
  change:       { fontSize: 12, marginTop: 1, fontWeight: "600" },
  empty:        { padding: 20, textAlign: "center" },
});
