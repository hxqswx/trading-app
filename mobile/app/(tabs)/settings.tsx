/**
 * Settings screen — language, theme, account info, sign out.
 */
import React from "react";
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  Switch,
  StyleSheet,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LogOut, Globe, Moon, Sun } from "lucide-react-native";
import { useColors } from "@/lib/hooks/use-colors";
import { useT } from "@/lib/hooks/use-t";
import { useTradingStore } from "@/lib/store";
import { usePortfolio } from "@/lib/hooks/use-portfolio";
import { Card } from "@/components/ui/card";
import { fmtCurrency, fmtPercent, colorKey } from "@/lib/utils";
import type { Lang } from "@/lib/i18n";
import type { ColorScheme } from "@/lib/theme";

function SectionHeader({ label }: { label: string }) {
  const colors = useColors();
  return (
    <Text style={[styles.sectionHeader, { color: colors.muted }]}>{label.toUpperCase()}</Text>
  );
}

function SettingRow({
  label,
  children,
  last = false,
}: {
  label:    string;
  children: React.ReactNode;
  last?:    boolean;
}) {
  const colors = useColors();
  return (
    <View style={[styles.settingRow, !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}>
      <Text style={[styles.settingLabel, { color: colors.foreground }]}>{label}</Text>
      {children}
    </View>
  );
}

export default function SettingsScreen() {
  const colors     = useColors();
  const t          = useT();
  const lang       = useTradingStore((s) => s.lang);
  const theme      = useTradingStore((s) => s.theme);
  const user       = useTradingStore((s) => s.user);
  const setLang    = useTradingStore((s) => s.setLang);
  const setTheme   = useTradingStore((s) => s.setTheme);
  const clearAuth  = useTradingStore((s) => s.clearAuth);
  const { portfolio } = usePortfolio();

  function handleSignOut() {
    Alert.alert(
      t.auth.signOut,
      "Are you sure you want to sign out?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: t.auth.signOut,
          style: "destructive",
          onPress: clearAuth,
        },
      ]
    );
  }

  const isDark = theme === "dark";

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={[styles.title, { color: colors.foreground }]}>{t.settings.title}</Text>

        {/* Appearance */}
        <SectionHeader label={t.settings.sectionAppearance} />
        <Card padding={0} style={styles.card}>
          <SettingRow label={t.settings.language}>
            <View style={styles.langRow}>
              {(["en", "zh"] as Lang[]).map((l) => (
                <TouchableOpacity
                  key={l}
                  onPress={() => setLang(l)}
                  style={[
                    styles.langBtn,
                    {
                      backgroundColor: lang === l ? colors.accent : colors.surface2,
                      borderColor:     lang === l ? colors.accent : colors.border,
                    },
                  ]}
                >
                  <Text style={[styles.langText, { color: lang === l ? "#fff" : colors.muted }]}>
                    {l === "en" ? "EN" : "中"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </SettingRow>

          <SettingRow label={t.settings.theme} last>
            <View style={styles.themeRow}>
              {isDark
                ? <Moon size={16} color={colors.purple} strokeWidth={2} />
                : <Sun  size={16} color={colors.yellow}  strokeWidth={2} />
              }
              <Switch
                value={!isDark}
                onValueChange={(v) => setTheme(v ? "light" : "dark")}
                trackColor={{ false: colors.border, true: colors.accent + "80" }}
                thumbColor={colors.accent}
              />
            </View>
          </SettingRow>
        </Card>

        {/* Account */}
        <SectionHeader label={t.settings.sectionAccount} />
        <Card padding={0} style={styles.card}>
          {user && (
            <SettingRow label={t.auth.profile}>
              <Text style={[styles.valueText, { color: colors.muted }]}>{user.email}</Text>
            </SettingRow>
          )}
          <SettingRow label={t.settings.accountEquity}>
            <Text style={[styles.valueText, { color: colors.foreground }]}>
              {portfolio ? fmtCurrency(portfolio.equity) : "—"}
            </Text>
          </SettingRow>
          <SettingRow label={t.settings.accountCash}>
            <Text style={[styles.valueText, { color: colors.foreground }]}>
              {portfolio ? fmtCurrency(portfolio.cash) : "—"}
            </Text>
          </SettingRow>
          <SettingRow label={t.settings.accountDayPnl} last>
            <Text style={[styles.valueText, {
              color: portfolio ? colors[colorKey(portfolio.dayPnl)] : colors.muted
            }]}>
              {portfolio
                ? `${fmtCurrency(portfolio.dayPnl)} (${fmtPercent(portfolio.dayPnlPct)})`
                : "—"
              }
            </Text>
          </SettingRow>
        </Card>

        {/* About */}
        <SectionHeader label={t.settings.sectionAbout} />
        <Card padding={0} style={styles.card}>
          <SettingRow label={t.settings.aboutMarketUS}>
            <View style={styles.dotRow}>
              <View style={[styles.dot, { backgroundColor: colors.green }]} />
              <Text style={[styles.valueText, { color: colors.muted }]}>Alpaca IEX</Text>
            </View>
          </SettingRow>
          <SettingRow label={t.settings.aboutMarketCrypto}>
            <View style={styles.dotRow}>
              <View style={[styles.dot, { backgroundColor: colors.green }]} />
              <Text style={[styles.valueText, { color: colors.muted }]}>Binance WS</Text>
            </View>
          </SettingRow>
          <SettingRow label={t.settings.aboutMarketOther} last>
            <View style={styles.dotRow}>
              <View style={[styles.dot, { backgroundColor: colors.yellow }]} />
              <Text style={[styles.valueText, { color: colors.muted }]}>Yahoo Finance (15m)</Text>
            </View>
          </SettingRow>
        </Card>

        {/* Sign out */}
        <TouchableOpacity
          onPress={handleSignOut}
          style={[styles.signOutBtn, { borderColor: colors.red + "60", backgroundColor: colors.red + "15" }]}
          activeOpacity={0.7}
        >
          <LogOut size={16} color={colors.red} strokeWidth={2} />
          <Text style={[styles.signOutText, { color: colors.red }]}>{t.auth.signOut}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:         { flex: 1 },
  scroll:       { padding: 16, paddingBottom: 40 },
  title:        { fontSize: 24, fontWeight: "700", marginBottom: 20 },
  sectionHeader:{ fontSize: 11, fontWeight: "700", letterSpacing: 0.8, marginBottom: 8, marginTop: 20, marginLeft: 4 },
  card:         { marginBottom: 4 },
  settingRow:   { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14 },
  settingLabel: { fontSize: 15 },
  valueText:    { fontSize: 14 },
  langRow:      { flexDirection: "row", gap: 8 },
  langBtn:      { paddingHorizontal: 14, paddingVertical: 5, borderRadius: 8, borderWidth: 1 },
  langText:     { fontSize: 13, fontWeight: "700" },
  themeRow:     { flexDirection: "row", alignItems: "center", gap: 8 },
  dotRow:       { flexDirection: "row", alignItems: "center", gap: 6 },
  dot:          { width: 8, height: 8, borderRadius: 4 },
  signOutBtn:   { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 28, borderRadius: 12, borderWidth: 1, paddingVertical: 14 },
  signOutText:  { fontSize: 15, fontWeight: "600" },
});
