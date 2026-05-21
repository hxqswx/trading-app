/**
 * Portfolio screen — equity chart, summary, and positions list.
 */
import React, { useState } from "react";
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColors } from "@/lib/hooks/use-colors";
import { useT } from "@/lib/hooks/use-t";
import { usePortfolio } from "@/lib/hooks/use-portfolio";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EquityChart } from "@/components/charts/equity-chart";
import { fmtCurrency, fmtPercent, colorKey } from "@/lib/utils";
import type { Position } from "@/lib/types";

const { width: SCREEN_W } = Dimensions.get("window");
const CHART_W = SCREEN_W - 32; // full width minus padding

function PositionRow({ pos }: { pos: Position }) {
  const colors = useColors();
  const router = useRouter();
  const ck     = colorKey(pos.unrealizedPnl);

  return (
    <TouchableOpacity onPress={() => router.push(`/trade/${pos.symbol}`)} activeOpacity={0.7}>
      <View style={[styles.row, { borderBottomColor: colors.border }]}>
        <View style={styles.rowLeft}>
          <View style={styles.rowTop}>
            <Text style={[styles.symbol, { color: colors.foreground }]}>{pos.symbol}</Text>
            <Badge type={pos.type} />
          </View>
          <Text style={[styles.qty, { color: colors.muted }]}>
            {pos.qty} @ {fmtCurrency(pos.avgEntryPrice, pos.currency ?? "USD")}
          </Text>
        </View>
        <View style={styles.rowRight}>
          <Text style={[styles.value, { color: colors.foreground }]}>
            {fmtCurrency(pos.marketValue, pos.currency ?? "USD")}
          </Text>
          <Text style={[styles.pnl, { color: colors[ck] }]}>
            {fmtCurrency(pos.unrealizedPnl, pos.currency ?? "USD")} ({fmtPercent(pos.unrealizedPnlPct)})
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function PortfolioScreen() {
  const colors   = useColors();
  const t        = useT();
  const { portfolio, loading, refresh } = usePortfolio();
  const [refreshing, setRefreshing] = useState(false);

  async function onRefresh() {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }

  const dayPnlColor   = portfolio ? colorKey(portfolio.dayPnl)   : "muted";
  const totalPnlColor = portfolio ? colorKey(portfolio.totalPnl)  : "muted";

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
        }
      >
        <Text style={[styles.title, { color: colors.foreground }]}>{t.portfolio.title}</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>{t.portfolio.subtitle}</Text>

        {/* Equity summary */}
        <Card style={styles.equityCard} padding={16}>
          {loading && !portfolio ? (
            <>
              <Skeleton height={14} width={100} />
              <Skeleton height={32} width={160} style={{ marginTop: 8 }} />
            </>
          ) : (
            <>
              <Text style={[styles.equityLabel, { color: colors.muted }]}>{t.portfolio.equity}</Text>
              <Text style={[styles.equityValue, { color: colors.foreground }]}>
                {portfolio ? fmtCurrency(portfolio.equity) : "—"}
              </Text>

              {/* Placeholder equity chart — real implementation needs history endpoint */}
              {portfolio && (
                <View style={styles.chartWrap}>
                  <EquityChart
                    data={[
                      { ts: Date.now() / 1000 - 3600, equity: portfolio.equity - portfolio.dayPnl },
                      { ts: Date.now() / 1000,         equity: portfolio.equity },
                    ]}
                    width={CHART_W - 32}
                    height={80}
                  />
                </View>
              )}
            </>
          )}
        </Card>

        {/* Summary row */}
        <View style={styles.statsRow}>
          {[
            { label: t.portfolio.cash,     value: portfolio?.cash,     color: "foreground" as const },
            { label: t.portfolio.dayPnl,   value: portfolio?.dayPnl,   color: dayPnlColor            },
            { label: t.portfolio.totalPnl, value: portfolio?.totalPnl, color: totalPnlColor           },
          ].map(({ label, value, color }) => (
            <Card key={label} style={styles.statCard} padding={12}>
              <Text style={[styles.statLabel, { color: colors.muted }]}>{label}</Text>
              {loading && !portfolio
                ? <Skeleton height={18} width={70} style={{ marginTop: 4 }} />
                : <Text style={[styles.statValue, { color: colors[color] }]}>
                    {value !== undefined ? fmtCurrency(value) : "—"}
                  </Text>
              }
            </Card>
          ))}
        </View>

        {/* Positions */}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{t.portfolio.openPositions}</Text>
        <Card padding={0}>
          {loading && !portfolio ? (
            [1, 2, 3].map((i) => (
              <View key={i} style={[styles.skeletonRow, { borderBottomColor: colors.border }]}>
                <Skeleton height={14} width={80} />
                <Skeleton height={14} width={60} />
              </View>
            ))
          ) : portfolio?.positions.length === 0 ? (
            <Text style={[styles.empty, { color: colors.muted }]}>{t.portfolio.noPositions}</Text>
          ) : (
            (portfolio?.positions ?? []).map((pos) => (
              <PositionRow key={pos.symbol} pos={pos} />
            ))
          )}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:        { flex: 1 },
  scroll:      { padding: 16, paddingBottom: 32 },
  title:       { fontSize: 24, fontWeight: "700", marginBottom: 2 },
  subtitle:    { fontSize: 13, marginBottom: 16 },
  equityCard:  { marginBottom: 12 },
  equityLabel: { fontSize: 12, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.4 },
  equityValue: { fontSize: 30, fontWeight: "700", marginTop: 4 },
  chartWrap:   { marginTop: 12, marginHorizontal: -4 },
  statsRow:    { flexDirection: "row", gap: 8, marginBottom: 20 },
  statCard:    { flex: 1 },
  statLabel:   { fontSize: 10, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.3 },
  statValue:   { fontSize: 14, fontWeight: "700", marginTop: 4 },
  sectionTitle:{ fontSize: 16, fontWeight: "700", marginBottom: 10 },
  row:         { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 13, borderBottomWidth: StyleSheet.hairlineWidth },
  rowLeft:     { flex: 1, marginRight: 12 },
  rowTop:      { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 2 },
  symbol:      { fontSize: 14, fontWeight: "700" },
  qty:         { fontSize: 12 },
  rowRight:    { alignItems: "flex-end" },
  value:       { fontSize: 14, fontWeight: "600" },
  pnl:         { fontSize: 12, marginTop: 1, fontWeight: "600" },
  skeletonRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: StyleSheet.hairlineWidth },
  empty:       { padding: 20, textAlign: "center" },
});
