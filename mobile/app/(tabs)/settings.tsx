/**
 * Settings screen — language, theme, account info, Alpaca linking, sign out.
 */
import React, { useCallback, useEffect, useState } from "react";
import {
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Switch,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LogOut, Moon, Sun, Link2, Link2Off, CheckCircle2, AlertCircle, ChevronDown, ChevronUp, ExternalLink } from "lucide-react-native";
import { useClerk, useUser } from "@clerk/clerk-expo";
import { useColors } from "@/lib/hooks/use-colors";
import { useT } from "@/lib/hooks/use-t";
import { useTradingStore } from "@/lib/store";
import { usePortfolio } from "@/lib/hooks/use-portfolio";
import { Card } from "@/components/ui/card";
import { fmtCurrency, fmtPercent, colorKey } from "@/lib/utils";
import type { Lang } from "@/lib/i18n";
import type { ColorScheme } from "@/lib/theme";

// ── Alpaca Connect ─────────────────────────────────────────────────────────

type AlpacaStatus =
  | { state: "loading" }
  | { state: "idle" }
  | { state: "form"; error?: string }
  | { state: "testing" }
  | { state: "connected"; maskedKeyId: string; equity: string; cash: string }
  | { state: "disconnecting" };

const ALPACA_GUIDE = [
  { step: "1", text: "Sign up at alpaca.markets", url: "https://app.alpaca.markets/signup" },
  { step: "2", text: "Switch to Paper Trading dashboard", url: "https://app.alpaca.markets/paper/dashboard/overview" },
  { step: "3", text: 'Go to API Keys → "Generate New Key"', url: "https://app.alpaca.markets/paper/dashboard/overview" },
  { step: "4", text: "Paste both Key ID and Secret Key below", url: null },
];

function AlpacaConnectSection() {
  const colors = useColors();
  const [status, setStatus] = useState<AlpacaStatus>({ state: "loading" });
  const [showGuide, setShowGuide] = useState(false);
  const [keyId, setKeyId]     = useState("");
  const [secret, setSecret]   = useState("");

  const load = useCallback(() => {
    fetch(`${process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000"}/api/alpaca/connect`)
      .then((r) => r.json())
      .then((d) => {
        if (d.connected) {
          setStatus({ state: "connected", maskedKeyId: d.maskedKeyId, equity: d.equity, cash: d.cash });
        } else {
          setStatus({ state: "idle" });
        }
      })
      .catch(() => setStatus({ state: "idle" }));
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleConnect() {
    if (!keyId.trim() || !secret.trim()) {
      setStatus({ state: "form", error: "Both Key ID and Secret Key are required." });
      return;
    }
    setStatus({ state: "testing" });
    try {
      const res  = await fetch(`${process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000"}/api/alpaca/connect`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ keyId: keyId.trim(), secretKey: secret.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.connected) {
        setStatus({ state: "form", error: data.error ?? "Failed to connect." });
        return;
      }
      setStatus({ state: "connected", maskedKeyId: data.maskedKeyId, equity: data.equity, cash: data.cash });
      setKeyId(""); setSecret("");
    } catch {
      setStatus({ state: "form", error: "Network error — please try again." });
    }
  }

  async function handleDisconnect() {
    Alert.alert("Disconnect Alpaca", "Remove your Alpaca API keys?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Disconnect", style: "destructive",
        onPress: async () => {
          setStatus({ state: "disconnecting" });
          await fetch(`${process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000"}/api/alpaca/connect`, { method: "DELETE" }).catch(() => {});
          setStatus({ state: "idle" });
        },
      },
    ]);
  }

  if (status.state === "loading") {
    return (
      <View style={{ paddingVertical: 12, alignItems: "center" }}>
        <ActivityIndicator size="small" color={colors.muted} />
      </View>
    );
  }

  if (status.state === "connected" || status.state === "disconnecting") {
    const acct = status.state === "connected" ? status : null;
    return (
      <View style={{ gap: 10 }}>
        {/* Connected badge */}
        <View style={[alpacaStyles.connectedBadge, { backgroundColor: colors.green + "18", borderColor: colors.green + "50" }]}>
          <CheckCircle2 size={14} color={colors.green} />
          <View style={{ flex: 1 }}>
            <Text style={[alpacaStyles.connectedTitle, { color: colors.green }]}>Alpaca Paper Account Connected</Text>
            {acct && <Text style={[alpacaStyles.maskedKey, { color: colors.muted }]}>Key: {acct.maskedKeyId}</Text>}
          </View>
        </View>
        {/* Stats */}
        {acct && (
          <View style={alpacaStyles.statsRow}>
            <View style={[alpacaStyles.statCard, { backgroundColor: colors.surface2, borderColor: colors.border }]}>
              <Text style={[alpacaStyles.statLabel, { color: colors.muted }]}>Equity</Text>
              <Text style={[alpacaStyles.statValue, { color: colors.foreground }]}>{fmtCurrency(parseFloat(acct.equity))}</Text>
            </View>
            <View style={[alpacaStyles.statCard, { backgroundColor: colors.surface2, borderColor: colors.border }]}>
              <Text style={[alpacaStyles.statLabel, { color: colors.muted }]}>Cash</Text>
              <Text style={[alpacaStyles.statValue, { color: colors.foreground }]}>{fmtCurrency(parseFloat(acct.cash))}</Text>
            </View>
          </View>
        )}
        {/* Buttons */}
        <View style={alpacaStyles.row}>
          <TouchableOpacity
            style={[alpacaStyles.outlineBtn, { flex: 1, borderColor: colors.border }]}
            onPress={() => Linking.openURL("https://app.alpaca.markets/paper/dashboard/overview")}
          >
            <ExternalLink size={12} color={colors.muted} />
            <Text style={[alpacaStyles.outlineBtnText, { color: colors.muted }]}>Open Alpaca</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[alpacaStyles.outlineBtn, { borderColor: colors.red + "50" }]}
            onPress={handleDisconnect}
            disabled={status.state === "disconnecting"}
          >
            <Link2Off size={12} color={colors.red} />
            <Text style={[alpacaStyles.outlineBtnText, { color: colors.red }]}>Disconnect</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const isForm    = status.state === "form" || status.state === "testing";
  const isTesting = status.state === "testing";

  return (
    <View style={{ gap: 10 }}>
      {/* Guide toggle */}
      <TouchableOpacity
        style={[alpacaStyles.guideToggle, { borderColor: colors.border }]}
        onPress={() => setShowGuide((v) => !v)}
      >
        <Link2 size={13} color={colors.accent} />
        <Text style={[alpacaStyles.guideToggleText, { color: colors.accent }]}>How to get API keys</Text>
        {showGuide
          ? <ChevronUp size={13} color={colors.accent} />
          : <ChevronDown size={13} color={colors.accent} />}
      </TouchableOpacity>

      {showGuide && (
        <View style={[alpacaStyles.guideBox, { borderColor: colors.border, backgroundColor: colors.surface2 }]}>
          {ALPACA_GUIDE.map((g) => (
            <TouchableOpacity
              key={g.step}
              style={[alpacaStyles.guideRow, { borderBottomColor: colors.border }]}
              onPress={() => g.url && Linking.openURL(g.url)}
              activeOpacity={g.url ? 0.6 : 1}
            >
              <View style={[alpacaStyles.stepBadge, { backgroundColor: colors.accent }]}>
                <Text style={alpacaStyles.stepNum}>{g.step}</Text>
              </View>
              <Text style={[alpacaStyles.guideText, { color: colors.foreground }]}>{g.text}</Text>
              {g.url && <ExternalLink size={11} color={colors.muted} />}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* CTA or form */}
      {status.state === "idle" ? (
        <TouchableOpacity
          style={[alpacaStyles.ctaBtn, { borderColor: colors.accent + "60" }]}
          onPress={() => { setShowGuide(true); setStatus({ state: "form" }); }}
        >
          <Link2 size={14} color={colors.accent} />
          <Text style={[alpacaStyles.ctaBtnText, { color: colors.accent }]}>Link your Alpaca paper account</Text>
        </TouchableOpacity>
      ) : isForm ? (
        <View style={{ gap: 8 }}>
          {status.state === "form" && status.error && (
            <View style={[alpacaStyles.errorBox, { backgroundColor: colors.red + "15", borderColor: colors.red + "40" }]}>
              <AlertCircle size={13} color={colors.red} />
              <Text style={[alpacaStyles.errorText, { color: colors.red }]}>{status.error}</Text>
            </View>
          )}
          <TextInput
            style={[alpacaStyles.input, { backgroundColor: colors.surface2, borderColor: colors.border, color: colors.foreground }]}
            placeholder="API Key ID (PKXXXXXXXX…)"
            placeholderTextColor={colors.muted}
            value={keyId}
            onChangeText={setKeyId}
            editable={!isTesting}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TextInput
            style={[alpacaStyles.input, { backgroundColor: colors.surface2, borderColor: colors.border, color: colors.foreground }]}
            placeholder="Secret Key"
            placeholderTextColor={colors.muted}
            value={secret}
            onChangeText={setSecret}
            editable={!isTesting}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />
          <View style={alpacaStyles.row}>
            <TouchableOpacity
              style={[alpacaStyles.connectBtn, { flex: 1, backgroundColor: colors.accent, opacity: isTesting ? 0.6 : 1 }]}
              onPress={handleConnect}
              disabled={isTesting}
            >
              {isTesting
                ? <ActivityIndicator size="small" color="#fff" />
                : <Link2 size={13} color="#fff" />}
              <Text style={alpacaStyles.connectBtnText}>{isTesting ? "Verifying…" : "Connect"}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[alpacaStyles.outlineBtn, { borderColor: colors.border }]}
              onPress={() => { setStatus({ state: "idle" }); setKeyId(""); setSecret(""); }}
              disabled={isTesting}
            >
              <Text style={[alpacaStyles.outlineBtnText, { color: colors.muted }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const alpacaStyles = StyleSheet.create({
  connectedBadge:   { flexDirection: "row", alignItems: "flex-start", gap: 10, padding: 12, borderRadius: 10, borderWidth: 1 },
  connectedTitle:   { fontSize: 13, fontWeight: "600" },
  maskedKey:        { fontSize: 12, marginTop: 2 },
  statsRow:         { flexDirection: "row", gap: 8 },
  statCard:         { flex: 1, borderRadius: 10, borderWidth: 1, padding: 10 },
  statLabel:        { fontSize: 11, marginBottom: 3 },
  statValue:        { fontSize: 14, fontWeight: "700", fontFamily: "monospace" },
  row:              { flexDirection: "row", gap: 8 },
  outlineBtn:       { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9 },
  outlineBtnText:   { fontSize: 13, fontWeight: "500" },
  guideToggle:      { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 8, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8 },
  guideToggleText:  { flex: 1, fontSize: 13, fontWeight: "500" },
  guideBox:         { borderRadius: 10, borderWidth: 1, overflow: "hidden" },
  guideRow:         { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  stepBadge:        { width: 20, height: 20, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  stepNum:          { color: "#fff", fontSize: 10, fontWeight: "700" },
  guideText:        { flex: 1, fontSize: 13 },
  ctaBtn:           { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderWidth: 1.5, borderStyle: "dashed", borderRadius: 12, paddingVertical: 14 },
  ctaBtnText:       { fontSize: 14, fontWeight: "600" },
  errorBox:         { flexDirection: "row", alignItems: "flex-start", gap: 8, padding: 10, borderRadius: 8, borderWidth: 1 },
  errorText:        { flex: 1, fontSize: 12 },
  input:            { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 11, fontSize: 14, fontFamily: "monospace" },
  connectBtn:       { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderRadius: 10, paddingVertical: 11 },
  connectBtnText:   { color: "#fff", fontSize: 14, fontWeight: "600" },
});

// ── Main screen ────────────────────────────────────────────────────────────

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
  const colors  = useColors();
  const t       = useT();
  const lang    = useTradingStore((s) => s.lang);
  const theme   = useTradingStore((s) => s.theme);
  const setLang = useTradingStore((s) => s.setLang);
  const setTheme = useTradingStore((s) => s.setTheme);
  const { signOut } = useClerk();
  const { user }    = useUser();
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
          onPress: async () => {
            await signOut();
            // AuthGuard in _layout.tsx will redirect to /(auth)/sign-in
          },
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
              <Text style={[styles.valueText, { color: colors.muted }]} numberOfLines={1}>
                {user.primaryEmailAddress?.emailAddress ?? ""}
              </Text>
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

        {/* Alpaca */}
        <SectionHeader label="Alpaca API" />
        <Card padding={16} style={styles.card}>
          <AlpacaConnectSection />
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
