/**
 * Dashboard screen — portfolio summary (4 cards) + positions + top movers.
 * Matches web dashboard feature parity.
 */
import React, { useState } from "react";
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  TrendingUp, TrendingDown, DollarSign, Wallet,
  BarChart2, ArrowRight,
} from "lucide-react-native";
import { useColors } from "@/lib/hooks/use-colors";
import { useT } from "@/lib/hooks/use-t";
import { useTradingStore } from "@/lib/store";
import { useAllQuotes } from "@/lib/hooks/use-quotes";
import { usePortfolio } from "@/lib/hooks/use-portfolio";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { fmtCurrency, fmtPercent, colorKey } from "@/lib/utils";
import type { Quote } from "@/lib/types";

// ── Asset-type metadata ────────────────────────────────────────────────────
const TYPE_META: Record<string, { zh: string; en: string; color: string }> = {
  stock:  { zh: "美股", en: "US",     color: "#58a6ff" },
  crypto: { zh: "加密", en: "Crypto", color: "#bc8cff" },
  hk:     { zh: "港股", en: "HK",     color: "#ffa000" },
  cn:     { zh: "A股",  en: "A股",    color: "#ff6b6b" },
  forex:  { zh: "外汇", en: "FX",     color: "#3fb950" },
};

function fmtK(v: number): string {
  const a = Math.abs(v);
  if (a >= 1_000_000) return (v / 1_000_000).toFixed(1) + "M";
  if (a >= 1_000)     return (v / 1_000).toFixed(1) + "K";
  return v.toFixed(0);
}

function BreakdownRows({
  data, lang, signed, borderColor,
}: { data: Record<string, number>; lang: string; signed?: boolean; borderColor: string }) {
  const entries = Object.entries(data).filter(([, v]) => Math.abs(v) >= 0.5);
  if (!entries.length) return null;
  return (
    <View style={[breakdownStyles.container, { borderTopColor: borderColor + "40" }]}>
      {entries.map(([type, v]) => {
        const m   = TYPE_META[type] ?? { zh: type, en: type, color: "#8b949e" };
        const neg = v < 0;
        const col = signed ? (neg ? "#f85149" : "#3fb950") : "#8b949e";
        return (
          <View key={type} style={breakdownStyles.row}>
            <View style={breakdownStyles.labelRow}>
              <View style={[breakdownStyles.dot, { backgroundColor: m.color }]} />
              <Text style={breakdownStyles.label}>{lang === "zh" ? m.zh : m.en}</Text>
            </View>
            <Text style={[breakdownStyles.value, { color: col }]}>
              {signed && !neg ? "+" : ""}{fmtK(v)}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const breakdownStyles = StyleSheet.create({
  container: { marginTop: 6, paddingTop: 6, borderTopWidth: StyleSheet.hairlineWidth, gap: 3 },
  row:       { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  labelRow:  { flexDirection: "row", alignItems: "center", gap: 4 },
  dot:       { width: 6, height: 6, borderRadius: 3 },
  label:     { fontSize: 10, color: "#8b949e" },
  value:     { fontSize: 10, fontFamily: "monospace", fontVariant: ["tabular-nums"] },
});

// ── Quote row (movers) ────────────────────────────────────────────────────

function QuoteRow({ q }: { q: Quote }) {
  const colors = useColors();
  const lang   = useTradingStore((s) => s.lang);
  const wl     = useTradingStore((s) => s.watchlist);
  const item   = wl.find((w) => w.symbol === q.symbol);
  const name   = lang === "zh" && item?.nameCN ? item.nameCN : (item?.name ?? q.symbol);
  const router = useRouter();
  const ck     = colorKey(q.changePct);
  const ticker = q.symbol.replace("USDT","").replace(/^(HK|CN)/,"");

  return (
    <TouchableOpacity onPress={() => router.push(`/trade/${q.symbol}`)} activeOpacity={0.7}>
      <View style={[styles.quoteRow, { borderBottomColor: colors.border }]}>
        <View style={styles.quoteLeft}>
          <Text style={[styles.quoteSymbol, { color: colors.foreground }]}>{ticker}</Text>
          <Text style={[styles.quoteName, { color: colors.muted }]} numberOfLines={1}>{name}</Text>
        </View>
        <View style={styles.quoteRight}>
          <Text style={[styles.quotePrice, { color: colors.foreground }]}>
            {fmtCurrency(q.price, q.currency)}
          </Text>
          <Text style={[styles.quotePct, { color: colors[ck] }]}>
            {fmtPercent(q.changePct)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ── Position row ──────────────────────────────────────────────────────────

function PositionRow({ pos }: {
  pos: {
    symbol: string; qty: number;
    avgEntryPrice: number; currentPrice: number;
    marketValue: number; unrealizedPnl: number; unrealizedPnlPct: number;
    type: string; currency?: string;
  }
}) {
  const colors  = useColors();
  const lang    = useTradingStore((s) => s.lang);
  const quotes  = useTradingStore((s) => s.quotes);
  const watchlist = useTradingStore((s) => s.watchlist);
  const marketLists = useTradingStore((s) => s.marketLists);
  const router  = useRouter();

  // Look up name from watchlist or marketLists
  const wlItem = watchlist.find((w) => w.symbol === pos.symbol)
    ?? Object.values(marketLists).flat().find((w) => w.symbol === pos.symbol);

  const livePrice = quotes[pos.symbol]?.price ?? pos.currentPrice;
  const livePnl   = (livePrice - pos.avgEntryPrice) * pos.qty;
  const livePct   = pos.avgEntryPrice > 0 ? ((livePrice - pos.avgEntryPrice) / pos.avgEntryPrice) * 100 : 0;
  const name      = lang === "zh" && wlItem?.nameCN ? wlItem.nameCN : (wlItem?.name ?? pos.symbol);
  const ticker    = pos.symbol.replace("USDT","").replace(/^(HK|CN)/,"");
  const pnlKey    = colorKey(livePnl);
  const iconColor = pos.type === "crypto"
    ? "#bc8cff" : pos.type === "hk"
    ? "#ffa000" : pos.type === "cn"
    ? "#ff6b6b" : "#58a6ff";

  return (
    <TouchableOpacity
      onPress={() => router.push(`/trade/${pos.symbol}`)}
      activeOpacity={0.7}
    >
      <View style={[styles.posRow, { borderBottomColor: colors.border }]}>
        {/* Icon */}
        <View style={[styles.posIcon, { backgroundColor: iconColor + "20" }]}>
          <Text style={[styles.posIconTxt, { color: iconColor }]}>{ticker.slice(0,2)}</Text>
        </View>
        {/* Name + qty */}
        <View style={styles.posLeft}>
          <Text style={[styles.posSymbol, { color: colors.foreground }]}>{ticker}</Text>
          <Text style={[styles.posName, { color: colors.muted }]} numberOfLines={1}>{name}</Text>
        </View>
        {/* P&L */}
        <View style={styles.posRight}>
          <Text style={[styles.posPnl, { color: colors[pnlKey] }]}>
            {livePnl >= 0 ? "+" : ""}{fmtCurrency(Math.abs(livePnl))}
          </Text>
          <Text style={[styles.posPct, { color: colors[pnlKey] }]}>
            {fmtPercent(livePct)}
          </Text>
        </View>
        <ArrowRight size={12} color={colors.muted} />
      </View>
    </TouchableOpacity>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────

export default function DashboardScreen() {
  const colors    = useColors();
  const t         = useT();
  const lang      = useTradingStore((s) => s.lang);
  const storeQuotes = useTradingStore((s) => s.quotes);
  const allQuotes = useAllQuotes();
  const { portfolio, loading, refresh } = usePortfolio();

  // ── Breakdowns ─────────────────────────────────────────────────────────────
  const positions = portfolio?.positions ?? [];

  const equityBreak = positions.reduce<Record<string, number>>((acc, p) => {
    acc[p.type] = (acc[p.type] ?? 0) + p.marketValue;
    return acc;
  }, {});

  const dayBreak = positions.reduce<Record<string, number>>((acc, p) => {
    const q = storeQuotes[p.symbol];
    if (!q || q.changePct === 0) return acc;
    const prev = q.price / (1 + q.changePct / 100);
    acc[p.type] = (acc[p.type] ?? 0) + p.qty * (q.price - prev);
    return acc;
  }, {});

  const totalBreak = positions.reduce<Record<string, number>>((acc, p) => {
    acc[p.type] = (acc[p.type] ?? 0) + p.unrealizedPnl;
    return acc;
  }, {});
  const [tab, setTab]      = useState<"gainers" | "losers">("gainers");
  const [refreshing, setRefreshing] = useState(false);

  const gainers = [...allQuotes]
    .filter((q) => q.changePct > 0)
    .sort((a, b) => b.changePct - a.changePct)
    .slice(0, 10);

  const losers = [...allQuotes]
    .filter((q) => q.changePct < 0)
    .sort((a, b) => a.changePct - b.changePct)
    .slice(0, 10);

  const movers = tab === "gainers" ? gainers : losers;

  async function onRefresh() {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }

  const dayPnlKey  = portfolio ? colorKey(portfolio.dayPnl)  : "muted";
  const totPnlKey  = portfolio ? colorKey(portfolio.totalPnl) : "muted";
  const dayUpDown  = (portfolio?.dayPnlPct ?? 0) >= 0;

  const CARDS: Array<{
    label: string; icon: typeof DollarSign;
    value: number | undefined; color: string; bg: string; pct?: number;
    breakdown?: Record<string, number>; signed?: boolean;
  }> = [
    { label: t.portfolio.equity,   icon: DollarSign, value: portfolio?.equity,    color: colors.accent,     bg: colors.accent + "12",          breakdown: equityBreak, signed: false },
    { label: t.portfolio.cash,     icon: Wallet,      value: portfolio?.cash,      color: colors.muted,      bg: colors.surface2 },
    { label: t.portfolio.dayPnl,   icon: TrendingUp,  value: portfolio?.dayPnl,    color: colors[dayPnlKey], bg: colors[dayPnlKey] + "12", pct: portfolio?.dayPnlPct, breakdown: dayBreak,   signed: true },
    { label: t.portfolio.totalPnl, icon: BarChart2,   value: portfolio?.totalPnl,  color: colors[totPnlKey], bg: colors[totPnlKey] + "12",      breakdown: totalBreak,  signed: true },
  ];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.title, { color: colors.foreground }]}>{t.dashboard.title}</Text>
            <Text style={[styles.subtitle, { color: colors.muted }]}>{t.dashboard.subtitle}</Text>
          </View>
          {portfolio && (
            <View style={[styles.dayBadge, {
              backgroundColor: dayUpDown ? colors.green + "18" : colors.red + "18",
            }]}>
              {dayUpDown
                ? <TrendingUp size={12} color={colors.green} strokeWidth={2} />
                : <TrendingDown size={12} color={colors.red} strokeWidth={2} />}
              <Text style={[styles.dayBadgeTxt, { color: dayUpDown ? colors.green : colors.red }]}>
                {fmtPercent(portfolio.dayPnlPct)} {t.dashboard.today}
              </Text>
            </View>
          )}
        </View>

        {/* ── 4 Summary cards (2×2 grid) ── */}
        <View style={styles.cardGrid}>
          {CARDS.map(({ label, icon: Icon, value, color, bg, pct, breakdown, signed }) => (
            <View
              key={label}
              style={[styles.summaryCard, { backgroundColor: bg, borderColor: colors.border }]}
            >
              <View style={styles.cardTop}>
                <Icon size={13} color={color} strokeWidth={2} />
                <Text style={[styles.cardLabel, { color: colors.muted }]}>{label}</Text>
              </View>
              {loading && !portfolio ? (
                <>
                  <Skeleton height={20} width={80} style={{ marginTop: 6 }} />
                  <Skeleton height={10} width={60} style={{ marginTop: 8 }} />
                  <Skeleton height={10} width={50} style={{ marginTop: 3 }} />
                </>
              ) : (
                <>
                  <Text style={[styles.cardValue, { color }]}>
                    {value !== undefined ? fmtCurrency(value) : "—"}
                  </Text>
                  {pct !== undefined && value !== undefined && (
                    <Text style={[styles.cardPct, { color }]}>{fmtPercent(pct)}</Text>
                  )}
                  {breakdown && (
                    <BreakdownRows
                      data={breakdown}
                      lang={lang}
                      signed={signed}
                      borderColor={colors.border}
                    />
                  )}
                </>
              )}
            </View>
          ))}
        </View>

        {/* ── Open positions ── */}
        {(portfolio?.positions?.length ?? 0) > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                {t.dashboard.positions}
              </Text>
              <Text style={[styles.sectionCount, { color: colors.muted }]}>
                {portfolio!.positions.length} {t.portfolio.positions}
              </Text>
            </View>
            <Card padding={0}>
              {portfolio!.positions.map((p) => (
                <PositionRow key={p.symbol} pos={p} />
              ))}
            </Card>
          </>
        )}

        {/* ── Top movers ── */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{t.dashboard.topMovers}</Text>
          <View style={[styles.moversTabRow, { backgroundColor: colors.surface2, borderColor: colors.border }]}>
            <TouchableOpacity
              style={[styles.moversTabBtn, tab === "gainers" && { backgroundColor: colors.green + "30" }]}
              onPress={() => setTab("gainers")}
            >
              <Text style={[styles.moversTabTxt, { color: tab === "gainers" ? colors.green : colors.muted }]}>
                {t.dashboard.gainers}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.moversTabBtn, tab === "losers" && { backgroundColor: colors.red + "30" }]}
              onPress={() => setTab("losers")}
            >
              <Text style={[styles.moversTabTxt, { color: tab === "losers" ? colors.red : colors.muted }]}>
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

// ── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe:       { flex: 1 },
  scroll:     { padding: 16, paddingBottom: 32 },

  // Header
  headerRow:  { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 },
  title:      { fontSize: 24, fontWeight: "700" },
  subtitle:   { fontSize: 12, marginTop: 2 },
  dayBadge:   { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, marginTop: 4 },
  dayBadgeTxt:{ fontSize: 12, fontWeight: "600" },

  // 2×2 card grid
  cardGrid:    { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 20 },
  summaryCard: { width: "48%", borderRadius: 12, borderWidth: 1, padding: 12 },
  cardTop:     { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 },
  cardLabel:   { fontSize: 10, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.3, flex: 1 },
  cardValue:   { fontSize: 18, fontWeight: "700" },
  cardPct:     { fontSize: 11, fontWeight: "600", marginTop: 1 },

  // Section header
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10, marginTop: 4 },
  sectionTitle:  { fontSize: 16, fontWeight: "700" },
  sectionCount:  { fontSize: 12 },

  // Position row
  posRow:    { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  posIcon:   { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  posIconTxt:{ fontSize: 12, fontWeight: "700" },
  posLeft:   { flex: 1, minWidth: 0 },
  posSymbol: { fontSize: 14, fontWeight: "700" },
  posName:   { fontSize: 11, marginTop: 1 },
  posRight:  { alignItems: "flex-end", marginRight: 8 },
  posPnl:    { fontSize: 13, fontWeight: "700" },
  posPct:    { fontSize: 11, fontWeight: "600", marginTop: 1 },

  // Movers tab
  moversTabRow: { flexDirection: "row", borderRadius: 8, borderWidth: 1, overflow: "hidden" },
  moversTabBtn: { paddingHorizontal: 12, paddingVertical: 4 },
  moversTabTxt: { fontSize: 12, fontWeight: "600" },

  // Quote row
  quoteRow:   { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  quoteLeft:  { flex: 1, marginRight: 12 },
  quoteSymbol:{ fontSize: 14, fontWeight: "700" },
  quoteName:  { fontSize: 11, marginTop: 1 },
  quoteRight: { alignItems: "flex-end" },
  quotePrice: { fontSize: 14, fontWeight: "600" },
  quotePct:   { fontSize: 12, fontWeight: "600", marginTop: 1 },

  empty:      { padding: 20, textAlign: "center" },
});
