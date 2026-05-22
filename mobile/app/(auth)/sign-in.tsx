/**
 * Sign-in screen — premium dark fintech design.
 *
 * Layout:
 *   Hero  : SVG icon mark + app name + tagline + feature badges
 *   Form  : email / password inputs with icons, gradient CTA
 *   Footer: paper-trading disclaimer
 *
 * Auth: Clerk via @clerk/clerk-expo useSignIn hook.
 */
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
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Path, Rect, Line, Defs, RadialGradient, Stop, Circle } from "react-native-svg";
import { useSignIn } from "@clerk/clerk-expo";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  TrendingUp,
  Zap,
  BarChart2,
  ShieldCheck,
} from "lucide-react-native";
import { useTradingStore } from "@/lib/store";

const { width: W, height: H } = Dimensions.get("window");

// ── Palette (always dark regardless of theme) ────────────────────────────────
const C = {
  bg:       "#080c14",
  surface:  "#0f1623",
  surface2: "#161e2e",
  border:   "#1e2d45",
  border2:  "#2a3f60",
  fg:       "#e8f0fe",
  muted:    "#6b82a8",
  accent:   "#4d9fff",
  accent2:  "#2563eb",
  green:    "#22c55e",
  red:      "#ef4444",
  yellow:   "#f59e0b",
  purple:   "#8b5cf6",
  gold:     "#f4b942",
};

// ── App icon SVG ─────────────────────────────────────────────────────────────
function AppIconMark({ size = 72 }: { size?: number }) {
  const r   = size * 0.22;
  const pad = size * 0.18;

  const innerW = size - pad * 2;
  const innerH = size - pad * 2;

  const candles = [
    { x: 0.05, bodyBot: 0.30, bodyTop: 0.70, wickBot: 0.18, wickTop: 0.82, up: false },
    { x: 0.28, bodyBot: 0.20, bodyTop: 0.60, wickBot: 0.10, wickTop: 0.72, up: true  },
    { x: 0.51, bodyBot: 0.35, bodyTop: 0.80, wickBot: 0.25, wickTop: 0.90, up: true  },
    { x: 0.74, bodyBot: 0.10, bodyTop: 0.55, wickBot: 0.02, wickTop: 0.65, up: true  },
  ];
  const cW = innerW * 0.18;

  const arrowTipX = size * 0.84;
  const arrowTipY = size * 0.20;
  const arrowLen  = size * 0.30;
  const arrowHW   = size * 0.06;

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Defs>
        <RadialGradient id="bgGlow" cx="50%" cy="40%" r="60%">
          <Stop offset="0%"   stopColor="#5b21b6" stopOpacity="1" />
          <Stop offset="100%" stopColor="#1e1b4b" stopOpacity="1" />
        </RadialGradient>
        <RadialGradient id="arrowGlow" cx="50%" cy="50%" r="50%">
          <Stop offset="0%"   stopColor="#fde68a" stopOpacity="1" />
          <Stop offset="100%" stopColor="#f59e0b" stopOpacity="1" />
        </RadialGradient>
      </Defs>

      <Rect x={0} y={0} width={size} height={size} rx={r} ry={r} fill="url(#bgGlow)" />

      {[0.35, 0.55, 0.75].map((yPct, i) => (
        <Line
          key={i}
          x1={pad * 0.6} y1={pad + innerH * (1 - yPct)}
          x2={size - pad * 0.6} y2={pad + innerH * (1 - yPct)}
          stroke="#ffffff" strokeWidth={0.4} strokeOpacity={0.08}
        />
      ))}

      {candles.map((c, i) => {
        const cx   = pad + c.x * innerW;
        const bBot = pad + innerH * (1 - c.bodyBot);
        const bTop = pad + innerH * (1 - c.bodyTop);
        const wBot = pad + innerH * (1 - c.wickBot);
        const wTop = pad + innerH * (1 - c.wickTop);
        const midX = cx + cW / 2;
        const col  = c.up ? C.green : C.red;
        return (
          <React.Fragment key={i}>
            <Line x1={midX} y1={wTop} x2={midX} y2={wBot} stroke={col} strokeWidth={1} />
            <Rect x={cx} y={bTop} width={cW} height={bBot - bTop} rx={1} fill={col} />
          </React.Fragment>
        );
      })}

      <Path
        d={`
          M${size * 0.28},${size * 0.72}
          L${arrowTipX - arrowLen},${arrowTipY + arrowLen}
          L${arrowTipX - arrowLen - arrowHW},${arrowTipY + arrowLen - arrowHW}
          L${arrowTipX - arrowHW * 1.2},${arrowTipY + arrowHW * 0.4}
          L${arrowTipX + arrowHW * 0.4},${arrowTipY - arrowHW * 1.2}
          L${arrowTipX - arrowHW + arrowLen},${arrowTipY + arrowHW - arrowLen}
          L${arrowTipX},${arrowTipY}
          Z
        `}
        fill="url(#arrowGlow)"
        opacity={0.92}
      />
    </Svg>
  );
}

// ── Decorative background chart ───────────────────────────────────────────────
function BgChart() {
  const pts  = [0.55, 0.48, 0.52, 0.42, 0.45, 0.38, 0.34, 0.40, 0.30, 0.22, 0.28, 0.18];
  const segW = W / (pts.length - 1);
  const chartH = H * 0.28;

  const polyline = pts.map((y, i) => `${i * segW},${chartH * y}`).join(" ");
  const fill = pts.map((y, i) => `${i * segW},${chartH * y}`).join(" ")
    + ` ${W},${chartH} 0,${chartH}`;

  return (
    <Svg
      width={W}
      height={chartH}
      style={{ position: "absolute", bottom: 0, left: 0, opacity: 0.07 }}
    >
      <Path d={`M${fill} Z`} fill={C.accent} />
      <Path d={`M${polyline}`} fill="none" stroke={C.accent} strokeWidth={1.5} />
    </Svg>
  );
}

// ── Feature badge ─────────────────────────────────────────────────────────────
function FeatureBadge({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <View style={badge.wrap}>
      {icon}
      <Text style={badge.text}>{label}</Text>
    </View>
  );
}

const badge = StyleSheet.create({
  wrap: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 20, borderWidth: 1,
    borderColor: C.border2, backgroundColor: C.surface2,
  },
  text: { fontSize: 11, fontWeight: "600", color: C.muted },
});

// ── Input row ─────────────────────────────────────────────────────────────────
function InputRow({
  icon, right, ...props
}: React.ComponentProps<typeof TextInput> & {
  icon: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <View style={inp.wrap}>
      <View style={inp.iconWrap}>{icon}</View>
      <TextInput style={inp.field} placeholderTextColor={C.muted} {...props} />
      {right ? <View style={inp.rightWrap}>{right}</View> : null}
    </View>
  );
}

const inp = StyleSheet.create({
  wrap:      { flexDirection: "row", alignItems: "center", backgroundColor: C.surface2, borderWidth: 1, borderColor: C.border, borderRadius: 14, marginBottom: 12, overflow: "hidden" },
  iconWrap:  { paddingHorizontal: 14, paddingVertical: 14 },
  field:     { flex: 1, fontSize: 15, color: C.fg, paddingVertical: 14, paddingRight: 4 },
  rightWrap: { paddingRight: 14 },
});

// ── Main screen ───────────────────────────────────────────────────────────────
export default function SignInScreen() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const lang = useTradingStore((s) => s.lang);

  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  const zh = lang === "zh";

  async function handleSignIn() {
    if (!isLoaded || loading) return;
    setError("");
    if (!email.trim() || !password.trim()) {
      setError(zh ? "请输入邮箱和密码" : "Please enter email and password.");
      return;
    }
    setLoading(true);
    try {
      const result = await signIn!.create({
        identifier: email.trim().toLowerCase(),
        password:   password.trim(),
      });
      if (result.status === "complete") {
        await setActive!({ session: result.createdSessionId });
        // AuthGuard in _layout.tsx will redirect to /(tabs)
      } else {
        setError(zh ? "登录无法完成，请重试" : "Sign-in could not be completed. Please try again.");
      }
    } catch (e: unknown) {
      const ce = (e as { errors?: Array<{ message?: string; longMessage?: string }> })?.errors?.[0];
      const msg = ce?.longMessage ?? ce?.message ?? (e instanceof Error ? e.message : "Sign in failed.");
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  const features = zh
    ? [
        { icon: <BarChart2   size={11} color={C.accent}  strokeWidth={2} />, label: "实时行情" },
        { icon: <Zap         size={11} color={C.yellow}  strokeWidth={2} />, label: "AI 分析"  },
        { icon: <ShieldCheck size={11} color={C.green}   strokeWidth={2} />, label: "模拟交易" },
      ]
    : [
        { icon: <BarChart2   size={11} color={C.accent}  strokeWidth={2} />, label: "Live Quotes"   },
        { icon: <Zap         size={11} color={C.yellow}  strokeWidth={2} />, label: "AI Analysis"   },
        { icon: <ShieldCheck size={11} color={C.green}   strokeWidth={2} />, label: "Paper Trading" },
      ];

  return (
    <View style={s.root}>
      {/* ── Background ─────────────────────────────────────────────── */}
      <LinearGradient
        colors={["#04060d", "#080c18", "#060912"]}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0.3, y: 0 }}
        end={{ x: 0.7, y: 1 }}
      />
      <View style={s.glowTop} />
      <BgChart />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Hero ───────────────────────────────────────────────── */}
          <View style={s.hero}>
            <View style={s.iconRing}>
              <View style={s.iconGlow} />
              <AppIconMark size={76} />
            </View>

            <Text style={s.appName}>
              Trade<Text style={{ color: C.accent }}>AI</Text>
            </Text>

            <Text style={s.tagline}>
              {zh ? "AI 驱动的智能交易平台" : "AI-Powered Trading Platform"}
            </Text>

            <View style={s.badges}>
              {features.map((f) => (
                <FeatureBadge key={f.label} icon={f.icon} label={f.label} />
              ))}
            </View>
          </View>

          {/* ── Form card ──────────────────────────────────────────── */}
          <View style={s.card}>
            <LinearGradient
              colors={[C.accent2, C.purple, "transparent"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={s.cardAccentLine}
            />

            <Text style={s.formTitle}>
              {zh ? "欢迎回来" : "Welcome Back"}
            </Text>
            <Text style={s.formSub}>
              {zh ? "登录以查看您的投资组合" : "Sign in to your portfolio"}
            </Text>

            {/* Email */}
            <Text style={s.label}>{zh ? "邮箱" : "Email"}</Text>
            <InputRow
              icon={<Mail size={16} color={C.muted} strokeWidth={1.8} />}
              value={email}
              onChangeText={setEmail}
              placeholder={zh ? "你的邮箱地址" : "your@email.com"}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
            />

            {/* Password */}
            <Text style={s.label}>{zh ? "密码" : "Password"}</Text>
            <InputRow
              icon={<Lock size={16} color={C.muted} strokeWidth={1.8} />}
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              secureTextEntry={!showPass}
              returnKeyType="done"
              onSubmitEditing={handleSignIn}
              right={
                <TouchableOpacity onPress={() => setShowPass(!showPass)} hitSlop={8}>
                  {showPass
                    ? <EyeOff size={17} color={C.muted} strokeWidth={1.8} />
                    : <Eye    size={17} color={C.muted} strokeWidth={1.8} />
                  }
                </TouchableOpacity>
              }
            />

            {/* Error */}
            {!!error && (
              <View style={s.errorBox}>
                <Text style={s.errorText}>{error}</Text>
              </View>
            )}

            {/* Sign in button */}
            <TouchableOpacity
              onPress={handleSignIn}
              disabled={loading || !isLoaded}
              activeOpacity={0.85}
              style={s.btnWrap}
            >
              <LinearGradient
                colors={[C.accent, C.accent2]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={s.btn}
              >
                {loading
                  ? <ActivityIndicator color="#fff" />
                  : <>
                      <TrendingUp size={16} color="#fff" strokeWidth={2.2} />
                      <Text style={s.btnText}>{zh ? "登 录" : "Sign In"}</Text>
                    </>
                }
              </LinearGradient>
            </TouchableOpacity>

            {/* Hint */}
            <View style={s.hintBox}>
              <View style={s.hintDot} />
              <View style={{ flex: 1 }}>
                <Text style={s.hintTitle}>{zh ? "新用户" : "New User"}</Text>
                <Text style={s.hintBody}>
                  {zh
                    ? "在 Clerk 注册账号后即可登录"
                    : "Create a free account at clerk.com to get started"}
                </Text>
              </View>
            </View>
          </View>

          {/* ── Footer ─────────────────────────────────────────────── */}
          <Text style={s.footer}>
            Paper Trading · 模拟交易 · 非真实资金
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root:  { flex: 1, backgroundColor: C.bg },

  glowTop: {
    position: "absolute", top: -80, alignSelf: "center",
    width: W * 0.8, height: W * 0.8, borderRadius: W * 0.4,
    backgroundColor: C.accent2, opacity: 0.07,
  },

  scroll: { flexGrow: 1, justifyContent: "center", paddingHorizontal: 24, paddingVertical: 48 },

  // Hero
  hero:     { alignItems: "center", marginBottom: 36 },
  iconRing: { position: "relative", marginBottom: 20 },
  iconGlow: {
    position: "absolute", top: -10, left: -10, right: -10, bottom: -10,
    borderRadius: 999, backgroundColor: C.purple, opacity: 0.18,
  },
  appName:  { fontSize: 40, fontWeight: "800", color: C.fg, letterSpacing: -1, marginBottom: 6 },
  tagline:  { fontSize: 14, color: C.muted, marginBottom: 18, letterSpacing: 0.2 },
  badges:   { flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "center" },

  // Card
  card: {
    backgroundColor: C.surface, borderRadius: 20,
    borderWidth: 1, borderColor: C.border,
    overflow: "hidden", padding: 24, paddingTop: 20,
  },
  cardAccentLine: { height: 2, marginBottom: 20, borderRadius: 1 },
  formTitle: { fontSize: 22, fontWeight: "700", color: C.fg, marginBottom: 4 },
  formSub:   { fontSize: 13, color: C.muted, marginBottom: 22 },

  label: {
    fontSize: 11, fontWeight: "700", color: C.muted,
    textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 6,
  },

  errorBox: {
    backgroundColor: "#ef444418", borderWidth: 1, borderColor: "#ef444440",
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 12,
  },
  errorText: { fontSize: 13, color: C.red },

  // Button
  btnWrap: { marginTop: 4, marginBottom: 4, borderRadius: 14, overflow: "hidden" },
  btn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 15, borderRadius: 14,
  },
  btnText: { fontSize: 16, fontWeight: "700", color: "#ffffff", letterSpacing: 0.4 },

  // Hint box (replaces old demo box)
  hintBox: {
    flexDirection: "row", alignItems: "center", gap: 10,
    marginTop: 16, backgroundColor: C.surface2,
    borderWidth: 1, borderColor: C.border,
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11,
  },
  hintDot:   { width: 7, height: 7, borderRadius: 4, backgroundColor: C.accent },
  hintTitle: { fontSize: 10, fontWeight: "700", color: C.muted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 },
  hintBody:  { fontSize: 12, color: C.fg, opacity: 0.7 },

  // Footer
  footer: { textAlign: "center", fontSize: 11, color: C.muted, marginTop: 28 },
});
