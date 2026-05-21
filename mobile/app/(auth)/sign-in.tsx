import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Path, Circle, Line } from "react-native-svg";
import { useColors } from "@/lib/hooks/use-colors";
import { useT } from "@/lib/hooks/use-t";
import { useTradingStore } from "@/lib/store";
import type { Lang } from "@/lib/i18n";
import { signIn } from "@/lib/api";

const { width: W } = Dimensions.get("window");

/** 简易 K 线装饰图 */
function LogoDecoration() {
  const bars = [
    { x: 0,  h1: 28, h2: 52, up: true  },
    { x: 14, h1: 20, h2: 44, up: false },
    { x: 28, h1: 12, h2: 60, up: true  },
    { x: 42, h1: 32, h2: 48, up: true  },
    { x: 56, h1: 16, h2: 40, up: false },
    { x: 70, h1: 24, h2: 56, up: true  },
  ];
  const green = "#3fb950";
  const red   = "#f85149";
  const H     = 72;

  return (
    <Svg width={84} height={H} style={{ opacity: 0.9 }}>
      {bars.map((b, i) => {
        const color  = b.up ? green : red;
        const bodyY  = H - b.h2;
        const bodyH  = b.h2 - b.h1;
        const midX   = b.x + 4;
        return (
          <React.Fragment key={i}>
            <Line x1={midX} y1={H - b.h2 - 4} x2={midX} y2={H - b.h1 + 4}
                  stroke={color} strokeWidth={1.5} />
            <Path
              d={`M${b.x},${bodyY} h8 v${bodyH} h-8 Z`}
              fill={color}
              rx={1}
            />
          </React.Fragment>
        );
      })}
    </Svg>
  );
}

export default function SignInScreen() {
  const router  = useRouter();
  const colors  = useColors();
  const t       = useT();
  const lang    = useTradingStore((s) => s.lang);
  const setAuth = useTradingStore((s) => s.setAuth);

  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  async function handleSignIn() {
    setError("");
    if (!email.trim() || !password.trim()) {
      setError(lang === "zh" ? "请输入邮箱和密码" : "Please enter email and password.");
      return;
    }
    setLoading(true);
    try {
      const res = await signIn({ email: email.trim(), password });
      setAuth(res.token, { name: res.user.name, email: res.user.email });
      router.replace("/(tabs)");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Sign in failed.");
    } finally {
      setLoading(false);
    }
  }

  const isDark = colors.background === "#0d1117";

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* 背景渐变 */}
      <LinearGradient
        colors={isDark
          ? ["#0d1117", "#0d1f35", "#0d1117"]
          : ["#f0f7ff", "#ffffff", "#f0f7ff"]}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo 区域 */}
        <View style={styles.logoArea}>
          <LogoDecoration />

          <View style={styles.titleRow}>
            {/* 蓝色方块 logo */}
            <View style={[styles.logoBox, { backgroundColor: colors.accent }]}>
              <Text style={styles.logoBoxText}>T</Text>
            </View>
            <Text style={[styles.appName, { color: colors.foreground }]}>
              Trade<Text style={{ color: colors.accent }}>AI</Text>
            </Text>
          </View>

          <Text style={[styles.tagline, { color: colors.muted }]}>
            {lang === "zh" ? "AI 驱动的智能交易平台" : "AI-Powered Trading Platform"}
          </Text>

          {/* 三个特性标签 */}
          <View style={styles.badges}>
            {["实时行情", "AI 分析", "模拟交易"].map((label) => (
              <View key={label} style={[styles.featureBadge, { borderColor: colors.accent + "40", backgroundColor: colors.accent + "12" }]}>
                <Text style={[styles.featureBadgeText, { color: colors.accent }]}>{label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* 登录表单 */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.formTitle, { color: colors.foreground }]}>
            {t.auth.signIn}
          </Text>

          <Text style={[styles.label, { color: colors.muted }]}>邮箱</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface2, borderColor: colors.border, color: colors.foreground }]}
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor={colors.muted}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
          />

          <Text style={[styles.label, { color: colors.muted }]}>密码</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface2, borderColor: colors.border, color: colors.foreground }]}
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            placeholderTextColor={colors.muted}
            secureTextEntry
            returnKeyType="done"
            onSubmitEditing={handleSignIn}
          />

          {error ? (
            <View style={[styles.errorBox, { backgroundColor: colors.red + "15", borderColor: colors.red + "40" }]}>
              <Text style={[styles.errorText, { color: colors.red }]}>{error}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.accent }]}
            onPress={handleSignIn}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading
              ? <ActivityIndicator color="#ffffff" />
              : <Text style={styles.buttonText}>{t.auth.signIn}</Text>
            }
          </TouchableOpacity>

          {/* 演示提示 */}
          <View style={[styles.demoBox, { backgroundColor: colors.surface2, borderColor: colors.border }]}>
            <Text style={[styles.demoLabel, { color: colors.muted }]}>演示账号</Text>
            <Text style={[styles.demoText, { color: colors.foreground }]}>任意邮箱 · 密码: demo123</Text>
          </View>
        </View>

        <Text style={[styles.footer, { color: colors.muted }]}>
          Paper Trading · 模拟交易 · 非真实资金
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll:         { flexGrow: 1, justifyContent: "center", padding: 24, paddingBottom: 40 },
  logoArea:       { alignItems: "center", marginBottom: 32 },
  titleRow:       { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 12, marginBottom: 6 },
  logoBox:        { width: 38, height: 38, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  logoBoxText:    { fontSize: 22, fontWeight: "800", color: "#fff" },
  appName:        { fontSize: 34, fontWeight: "800", letterSpacing: -0.5 },
  tagline:        { fontSize: 13, marginBottom: 16 },
  badges:         { flexDirection: "row", gap: 8 },
  featureBadge:   { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  featureBadgeText:{ fontSize: 11, fontWeight: "600" },
  card:           { borderRadius: 16, borderWidth: 1, padding: 20, marginBottom: 16 },
  formTitle:      { fontSize: 18, fontWeight: "700", marginBottom: 18 },
  label:          { fontSize: 12, fontWeight: "600", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 },
  input:          { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, marginBottom: 14 },
  errorBox:       { borderRadius: 8, borderWidth: 1, padding: 10, marginBottom: 12 },
  errorText:      { fontSize: 13 },
  button:         { borderRadius: 10, paddingVertical: 14, alignItems: "center", marginTop: 4 },
  buttonText:     { fontSize: 16, fontWeight: "700", color: "#ffffff" },
  demoBox:        { marginTop: 16, borderRadius: 10, borderWidth: 1, padding: 12, alignItems: "center" },
  demoLabel:      { fontSize: 11, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 },
  demoText:       { fontSize: 13 },
  footer:         { textAlign: "center", fontSize: 11, marginTop: 8 },
});
