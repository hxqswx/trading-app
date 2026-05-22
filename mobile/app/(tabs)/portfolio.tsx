/**
 * Portfolio screen.
 *
 * Layout:
 *   1. 总净值 (Total equity) — big number + mini chart
 *   2. 净值 · 按市场 — equity rows per AssetType with data-source badge, then subtotal
 *   3. 可用资金 — cash row with source
 *   4. 盈亏汇总 — day P&L + total P&L totals
 *   5. 当前持仓 — position list (tap → trade screen)
 */
import React, { useMemo, useState } from "react";
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
import { useTradingStore } from "@/lib/store";
import { usePortfolio } from "@/lib/hooks/use-portfolio";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EquityChart } from "@/components/charts/equity-chart";
import { fmtCurrency, fmtPercent, colorKey } from "@/lib/utils";
import type { Position, AssetType } from "@/lib/types";
import type { Colors } from "@/lib/theme";

const { width: SCREEN_W } = Dimensions.get("window");
const CHART_W = SCREEN_W - 32;

// ── Config ────────────────────────────────────────────────────────────────────

/** Data-source label shown next to each market row */
const SOURCE_LABEL: Record<AssetType, string> = {
  stock:  "Alpaca IEX",
  crypto: "Binance WS",
  hk:     "Yahoo (15m)",
  cn:     "Yahoo (15m)",
  forex:  "Yahoo FX",
};

/** Native display currency per market type */
const TYPE_CURRENCY: Record<AssetType, string> = {
  stock:  "USD",
  crypto: "USD",
  hk:     "HKD",
  cn:     "CNY",
  forex:  "USD",
};

/** Accent dot color key (must be a key of Colors) */
const TYPE_COLOR_KEY: Record<AssetType, keyof Colors> = {
  stock:  "accent",
  crypto: "yellow",
  hk:     "green",
  cn:     "purple",
  forex:  "muted",
};

const MARKET_ORDER: AssetType[] = ["stock", "crypto", "hk", "cn", "forex"];

// ── Data helpers ──────────────────────────────────────────────────────────────

interface MarketGroup {
  type:      AssetType;
  equity:    number;
  currency:  string;
  pnl:       number;   // sum of unrealizedPnl for all positions in group
  positions: Position[];
}

function groupPositions(positions: Position[]): MarketGroup[] {
  const map = new Map<AssetType, MarketGroup>();
  for (const p of positions) {
    if (!map.has(p.type)) {
      map.set(p.type, {
        type:      p.type,
        equity:    0,
        pnl:       0,
        currency:  p.currency ?? TYPE_CURRENCY[p.type],
        positions: [],
      });
    }
    const g = map.get(p.type)!;
    g.equity += p.marketValue;
    g.pnl    += p.unrealizedPnl;
    g.positions.push(p);
  }
  return MARKET_ORDER.filter((t) => map.has(t)).map((t) => map.get(t)!);
}

// ── Section header ────────────────────────────────────────────────────────────

function SectionHeader({ label, sub }: { label: string; sub?: string }) {
  const colors = useColors();
  return (
    <View style={styles.sectionHeaderRow}>
      <Text style={[styles.sectionHeaderText, { color: colors.muted }]}>
        {label.toUpperCase()}
      </Text>
      {sub ? (
        <Text style={[styles.sectionHeaderSub, { color: colors.muted }]}>· {sub}</Text>
      ) : null}
    </View>
  );
}

// ── Market equity row ─────────────────────────────────────────────────────────

function MarketRow({
  group,
  name,
  last = false,
}: {
  group: MarketGroup;
  name:  string;
  last?: boolean;
}) {
  const colors   = useColors();
  const dotColor = colors[TYPE_COLOR_KEY[group.type]];

  return (
    <View
      style={[
        styles.marketRow,
        !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
      ]}
    >
      {/* Left: dot + name + source */}
      <View style={styles.marketLeft}>
        <View style={[styles.dot, { backgroundColor: dotColor }]} />
        <View>
          <Text style={[styles.marketName, { color: colors.foreground }]}>{name}</Text>
          <Text style={[styles.sourceTag, { color: colors.muted }]}>{SOURCE_LABEL[group.type]}</Text>
        </View>
      </View>

      {/* Right: equity value */}
      <Text style={[styles.marketValue, { color: colors.foreground }]}>
        {fmtCurrency(group.equity, group.currency)}
      </Text>
    </View>
  );
}

// ── Divider total row ─────────────────────────────────────────────────────────

function SubtotalRow({ label, value }: { label: string; value: number }) {
  const colors = useColors();
  return (
    <View
      style={[styles.subtotalRow, { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }]}
    >
      <Text style={[styles.subtotalLabel, { color: colors.foreground }]}>{label}</Text>
      <Text style={[styles.subtotalValue, { color: colors.foreground }]}>
        {fmtCurrency(value)}
      </Text>
    </View>
  );
}

// ── Cash row ──────────────────────────────────────────────────────────────────

function CashRow({ label, source, value }: { label: string; source: string; value?: number }) {
  const colors = useColors();
  return (
    <View style={styles.cashRow}>
      <View style={styles.marketLeft}>
        <View style={[styles.dot, { backgroundColor: colors.accent }]} />
        <View>
          <Text style={[styles.marketName, { color: colors.foreground }]}>{label}</Text>
          <Text style={[styles.sourceTag, { color: colors.muted }]}>{source}</Text>
        </View>
      </View>
      <Text style={[styles.marketValue, { color: colors.foreground }]}>
        {value !== undefined ? fmtCurrency(value) : "—"}
      </Text>
    </View>
  );
}

// ── P&L row ───────────────────────────────────────────────────────────────────

function PnlRow({
  label,
  value,
  pct,
  last = false,
}: {
  label: string;
  value?: number;
  pct?:   number;
  last?:  boolean;
}) {
  const colors = useColors();
  const ck = value !== undefined ? colorKey(value) : "muted";

  return (
    <View
      style={[
        styles.pnlRow,
        !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
      ]}
    >
      <Text style={[styles.pnlLabel, { color: colors.muted }]}>{label}</Text>
      <View style={styles.pnlRight}>
        <Text style={[styles.pnlValue, { color: value !== undefined ? colors[ck] : colors.muted }]}>
          {value !== undefined ? fmtCurrency(value) : "—"}
        </Text>
        {pct !== undefined && value !== undefined && (
          <Text style={[styles.pnlPct, { color: colors[ck] }]}>
            {"  "}{fmtPercent(pct)}
          </Text>
        )}
      </View>
    </View>
  );
}

// ── Position row ──────────────────────────────────────────────────────────────

function PositionRow({ pos, last = false }: { pos: Position; last?: boolean }) {
  const colors = useColors();
  const router = useRouter();
  const ck     = colorKey(pos.unrealizedPnl);

  return (
    <TouchableOpacity onPress={() => router.push(`/trade/${pos.symbol}`)} activeOpacity={0.7}>
      <View
        style={[
          styles.posRow,
          !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
        ]}
      >
        <View style={styles.posLeft}>
          <View style={styles.posTopRow}>
            <Text style={[styles.posSymbol, { color: colors.foreground }]}>{pos.symbol}</Text>
            <Badge type={pos.type} />
          </View>
          <Text style={[styles.posQty, { color: colors.muted }]}>
            {pos.qty} @ {fmtCurrency(pos.avgEntryPrice, pos.currency ?? "USD")}
          </Text>
        </View>
        <View style={styles.posRight}>
          <Text style={[styles.posValue, { color: colors.foreground }]}>
            {fmtCurrency(pos.marketValue, pos.currency ?? "USD")}
          </Text>
          <Text style={[styles.posPnl, { color: colors[ck] }]}>
            {fmtCurrency(pos.unrealizedPnl, pos.currency ?? "USD")}{" "}
            ({fmtPercent(pos.unrealizedPnlPct)})
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function PortfolioScreen() {
  const colors   = useColors();
  const t        = useT();
  const lang     = useTradingStore((s) => s.lang);
  const { portfolio, loading, refresh } = usePortfolio();
  const [refreshing, setRefreshing] = useState(false);

  async function onRefresh() {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }

  // Group positions by market type
  const groups = useMemo(
    () => groupPositions(portfolio?.positions ?? []),
    [portfolio?.positions],
  );

  // Sum of all position market values (positions equity only, excluding cash)
  const positionsEquity = useMemo(
    () => groups.reduce((s, g) => s + g.equity, 0),
    [groups],
  );

  const isLoading = loading && !portfolio;

  // Market name map (using i18n so language switches work)
  const marketNames: Record<AssetType, string> = {
    stock:  t.markets.usEquities,
    crypto: t.markets.crypto,
    hk:     t.markets.chinaHK,
    cn:     t.markets.mainlandCN,
    forex:  t.markets.forex,
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
          />
        }
      >
        {/* Page title */}
        <Text style={[styles.title, { color: colors.foreground }]}>{t.portfolio.title}</Text>

        {/* ── 总净值 banner ─────────────────────────────────────────────── */}
        <Card style={styles.equityCard} padding={16}>
          {isLoading ? (
            <>
              <Skeleton height={11} width={70} />
              <Skeleton height={36} width={180} style={{ marginTop: 8 }} />
            </>
          ) : (
            <>
              <Text style={[styles.equityLabel, { color: colors.muted }]}>
                {t.portfolio.equity}
              </Text>
              <Text style={[styles.equityValue, { color: colors.foreground }]}>
                {portfolio ? fmtCurrency(portfolio.equity) : "—"}
              </Text>
              {portfolio && (
                <View style={styles.chartWrap}>
                  <EquityChart
                    data={[
                      { ts: Date.now() / 1000 - 3600, equity: portfolio.equity - portfolio.dayPnl },
                      { ts: Date.now() / 1000,         equity: portfolio.equity },
                    ]}
                    width={CHART_W - 32}
                    height={72}
                  />
                </View>
              )}
            </>
          )}
        </Card>

        {/* ── 净值 · 按市场 ─────────────────────────────────────────────── */}
        <SectionHeader label={t.portfolio.equity} sub={t.portfolio.byMarket} />
        <Card padding={0} style={styles.sectionCard}>
          {isLoading ? (
            [1, 2, 3].map((i) => (
              <View key={i} style={[styles.skRow, { borderBottomColor: colors.border }]}>
                <Skeleton height={13} width={100} />
                <Skeleton height={13} width={75} />
              </View>
            ))
          ) : groups.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.muted }]}>
              {t.portfolio.noPositions}
            </Text>
          ) : (
            <>
              {groups.map((g) => (
                <MarketRow
                  key={g.type}
                  group={g}
                  name={marketNames[g.type]}
                />
              ))}
              <SubtotalRow label={t.portfolio.total} value={positionsEquity} />
            </>
          )}
        </Card>

        {/* ── 可用资金 ─────────────────────────────────────────────────── */}
        <SectionHeader label={t.portfolio.cash} />
        <Card padding={0} style={styles.sectionCard}>
          {isLoading ? (
            <View style={styles.skRow}>
              <Skeleton height={13} width={100} />
              <Skeleton height={13} width={75} />
            </View>
          ) : (
            <CashRow
              label={t.portfolio.cashUSD}
              source="Alpaca Paper (USD)"
              value={portfolio?.cash}
            />
          )}
        </Card>

        {/* ── 盈亏汇总 ─────────────────────────────────────────────────── */}
        <SectionHeader label={t.portfolio.pnlSummary} />
        <Card padding={0} style={styles.sectionCard}>
          {isLoading ? (
            [1, 2].map((i) => (
              <View key={i} style={[styles.skRow, { borderBottomColor: colors.border }]}>
                <Skeleton height={13} width={80} />
                <Skeleton height={13} width={100} />
              </View>
            ))
          ) : (
            <>
              <PnlRow
                label={t.portfolio.dayPnl}
                value={portfolio?.dayPnl}
                pct={portfolio?.dayPnlPct}
              />
              <PnlRow
                label={t.portfolio.totalPnl}
                value={portfolio?.totalPnl}
                last
              />
            </>
          )}
        </Card>

        {/* ── 当前持仓 ─────────────────────────────────────────────────── */}
        <SectionHeader label={t.portfolio.openPositions} />
        <Card padding={0} style={styles.lastCard}>
          {isLoading ? (
            [1, 2, 3].map((i) => (
              <View key={i} style={[styles.skRow, { borderBottomColor: colors.border }]}>
                <Skeleton height={14} width={80} />
                <Skeleton height={14} width={60} />
              </View>
            ))
          ) : !portfolio?.positions.length ? (
            <Text style={[styles.emptyText, { color: colors.muted }]}>
              {t.portfolio.noPositions}
            </Text>
          ) : (
            portfolio.positions.map((pos, i) => (
              <PositionRow
                key={pos.symbol}
                pos={pos}
                last={i === portfolio.positions.length - 1}
              />
            ))
          )}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe:   { flex: 1 },
  scroll: { padding: 16, paddingBottom: 40 },

  title: { fontSize: 24, fontWeight: "700", marginBottom: 16 },

  // Equity banner
  equityCard:  { marginBottom: 4 },
  equityLabel: { fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.6 },
  equityValue: { fontSize: 34, fontWeight: "700", marginTop: 4, letterSpacing: -0.5 },
  chartWrap:   { marginTop: 10, marginHorizontal: -4 },

  // Section header
  sectionHeaderRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 20, marginBottom: 8, marginLeft: 2 },
  sectionHeaderText:{ fontSize: 11, fontWeight: "700", letterSpacing: 0.7 },
  sectionHeaderSub: { fontSize: 11, fontWeight: "600", letterSpacing: 0.3 },

  // Card containers
  sectionCard: { marginBottom: 4 },
  lastCard:    { marginBottom: 4 },

  // Market equity rows
  marketRow: {
    flexDirection:  "row",
    justifyContent: "space-between",
    alignItems:     "center",
    paddingHorizontal: 16,
    paddingVertical:   13,
  },
  marketLeft:  { flexDirection: "row", alignItems: "center", gap: 10 },
  dot:         { width: 8, height: 8, borderRadius: 4 },
  marketName:  { fontSize: 14, fontWeight: "600" },
  sourceTag:   { fontSize: 11, marginTop: 1 },
  marketValue: { fontSize: 14, fontWeight: "700" },

  // Subtotal row
  subtotalRow: {
    flexDirection:  "row",
    justifyContent: "space-between",
    alignItems:     "center",
    paddingHorizontal: 16,
    paddingVertical:   12,
  },
  subtotalLabel: { fontSize: 13, fontWeight: "700" },
  subtotalValue: { fontSize: 15, fontWeight: "700" },

  // Cash row
  cashRow: {
    flexDirection:  "row",
    justifyContent: "space-between",
    alignItems:     "center",
    paddingHorizontal: 16,
    paddingVertical:   13,
  },

  // P&L rows
  pnlRow: {
    flexDirection:  "row",
    justifyContent: "space-between",
    alignItems:     "center",
    paddingHorizontal: 16,
    paddingVertical:   13,
  },
  pnlLabel: { fontSize: 14 },
  pnlRight:  { flexDirection: "row", alignItems: "baseline" },
  pnlValue:  { fontSize: 15, fontWeight: "700" },
  pnlPct:    { fontSize: 12, fontWeight: "600" },

  // Position rows
  posRow: {
    flexDirection:  "row",
    justifyContent: "space-between",
    alignItems:     "center",
    paddingHorizontal: 16,
    paddingVertical:   13,
  },
  posLeft:   { flex: 1, marginRight: 12 },
  posTopRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 2 },
  posSymbol: { fontSize: 14, fontWeight: "700" },
  posQty:    { fontSize: 12 },
  posRight:  { alignItems: "flex-end" },
  posValue:  { fontSize: 14, fontWeight: "600" },
  posPnl:    { fontSize: 12, marginTop: 1, fontWeight: "600" },

  // Skeleton / empty
  skRow: {
    flexDirection:  "row",
    justifyContent: "space-between",
    alignItems:     "center",
    paddingHorizontal: 16,
    paddingVertical:   16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  emptyText: { padding: 20, textAlign: "center", fontSize: 13 },
});
