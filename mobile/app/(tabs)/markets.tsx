/**
 * Markets screen — grouped live quotes by asset type.
 */
import React, { useState } from "react";
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  TextInput,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Search } from "lucide-react-native";
import { useColors } from "@/lib/hooks/use-colors";
import { useT } from "@/lib/hooks/use-t";
import { useTradingStore } from "@/lib/store";
import { useAllQuotes } from "@/lib/hooks/use-quotes";
import { fetchQuotes } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { fmtCurrency, fmtPercent, colorKey } from "@/lib/utils";
import type { Quote, AssetType } from "@/lib/types";

type Tab = AssetType | "all";
const TABS: Tab[] = ["all", "stock", "crypto", "hk", "cn", "forex"];

function QuoteRow({ q }: { q: Quote }) {
  const colors = useColors();
  const lang   = useTradingStore((s) => s.lang);
  const wl     = useTradingStore((s) => s.watchlist);
  const item   = wl.find((w) => w.symbol === q.symbol);
  const name   = lang === "zh" && item?.nameCN ? item.nameCN : (item?.name ?? q.symbol);
  const router = useRouter();
  const ck     = colorKey(q.changePct);

  return (
    <TouchableOpacity onPress={() => router.push(`/trade/${q.symbol}`)} activeOpacity={0.7}>
      <View style={[styles.row, { borderBottomColor: colors.border }]}>
        <View style={styles.rowLeft}>
          <View style={styles.rowTop}>
            <Text style={[styles.symbol, { color: colors.foreground }]}>{q.symbol}</Text>
            <Badge type={q.type} />
          </View>
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

export default function MarketsScreen() {
  const colors      = useColors();
  const t           = useT();
  const allQuotes   = useAllQuotes();
  const [tab, setTab]       = useState<Tab>("all");
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const updateQuotes = useTradingStore((s) => s.updateQuotes);
  const watchlist    = useTradingStore((s) => s.watchlist);

  const filtered = allQuotes
    .filter((q) => tab === "all" || q.type === tab)
    .filter((q) => {
      if (!search) return true;
      const s = search.toLowerCase();
      return q.symbol.toLowerCase().includes(s);
    });

  async function onRefresh() {
    setRefreshing(true);
    try {
      const symbols = watchlist.map((w) => w.symbol);
      const quotes  = await fetchQuotes(symbols);
      updateQuotes(quotes);
    } catch {}
    setRefreshing(false);
  }

  const tabLabels: Record<Tab, string> = {
    all:    "All",
    stock:  t.badge.stock,
    crypto: t.badge.crypto,
    hk:     t.badge.hk,
    cn:     t.badge.cn,
    forex:  t.badge.forex,
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      {/* Fixed header */}
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>{t.markets.title}</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>{t.markets.subtitle}</Text>

        {/* Search */}
        <View style={[styles.searchBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Search size={15} color={colors.muted} strokeWidth={1.8} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            placeholder="Search…"
            placeholderTextColor={colors.muted}
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {/* Type filter tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll}>
          {TABS.map((type) => (
            <TouchableOpacity
              key={type}
              onPress={() => setTab(type)}
              style={[
                styles.typeTab,
                {
                  backgroundColor: tab === type ? colors.accent : colors.surface,
                  borderColor:     tab === type ? colors.accent : colors.border,
                },
              ]}
            >
              <Text style={[styles.typeTabText, { color: tab === type ? "#fff" : colors.muted }]}>
                {tabLabels[type]}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
        }
      >
        <Card padding={0}>
          {filtered.length === 0 ? (
            <Text style={[styles.empty, { color: colors.muted }]}>No results</Text>
          ) : (
            filtered.map((q) => <QuoteRow key={q.symbol} q={q} />)
          )}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:        { flex: 1 },
  header:      { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  title:       { fontSize: 24, fontWeight: "700", marginBottom: 2 },
  subtitle:    { fontSize: 13, marginBottom: 12 },
  searchBox:   { flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, marginBottom: 10 },
  searchInput: { flex: 1, fontSize: 14 },
  tabScroll:   { marginBottom: 4 },
  typeTab:     { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1, marginRight: 8 },
  typeTabText: { fontSize: 12, fontWeight: "600" },
  scroll:      { padding: 16, paddingBottom: 32 },
  row:         { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 13, borderBottomWidth: StyleSheet.hairlineWidth },
  rowLeft:     { flex: 1, marginRight: 12 },
  rowTop:      { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 2 },
  symbol:      { fontSize: 14, fontWeight: "700" },
  name:        { fontSize: 12 },
  rowRight:    { alignItems: "flex-end" },
  price:       { fontSize: 14, fontWeight: "600" },
  change:      { fontSize: 12, marginTop: 1, fontWeight: "600" },
  empty:       { padding: 20, textAlign: "center" },
});
