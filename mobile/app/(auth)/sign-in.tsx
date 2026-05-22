/**
 * Sign-in screen — unified Sign In / Register with SSO.
 *
 * Tabs:
 *   Sign In  — email/password  +  Google / Apple SSO
 *   Register — name/email/password  →  email OTP verification
 *
 * Auth: Clerk via @clerk/clerk-expo
 *   useSignIn  — email/password sign-in
 *   useSignUp  — email/password registration + OTP
 *   useSSO     — Google / Apple OAuth
 */
import React, { useState, useEffect } from "react";
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
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Svg, {
  Path, Rect, Line, Defs, RadialGradient, Stop, Circle,
} from "react-native-svg";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { useSignIn, useSignUp, useSSO } from "@clerk/clerk-expo";
import {
  Mail, Lock, Eye, EyeOff, TrendingUp,
  Zap, BarChart2, ShieldCheck, User, KeyRound,
} from "lucide-react-native";
import { useTradingStore } from "@/lib/store";

// Required for OAuth redirect handling on Android
WebBrowser.maybeCompleteAuthSession();

const { width: W, height: H } = Dimensions.get("window");

// ── Palette ───────────────────────────────────────────────────────────────────
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
};

// ── App icon ──────────────────────────────────────────────────────────────────
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
  const arrowTipX = size * 0.84, arrowTipY = size * 0.20;
  const arrowLen = size * 0.30, arrowHW = size * 0.06;
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
        <Line key={i}
          x1={pad * 0.6} y1={pad + innerH * (1 - yPct)}
          x2={size - pad * 0.6} y2={pad + innerH * (1 - yPct)}
          stroke="#ffffff" strokeWidth={0.4} strokeOpacity={0.08} />
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
        d={`M${size*0.28},${size*0.72} L${arrowTipX-arrowLen},${arrowTipY+arrowLen}
            L${arrowTipX-arrowLen-arrowHW},${arrowTipY+arrowLen-arrowHW}
            L${arrowTipX-arrowHW*1.2},${arrowTipY+arrowHW*0.4}
            L${arrowTipX+arrowHW*0.4},${arrowTipY-arrowHW*1.2}
            L${arrowTipX-arrowHW+arrowLen},${arrowTipY+arrowHW-arrowLen}
            L${arrowTipX},${arrowTipY} Z`}
        fill="url(#arrowGlow)" opacity={0.92}
      />
    </Svg>
  );
}

function BgChart() {
  const pts  = [0.55,0.48,0.52,0.42,0.45,0.38,0.34,0.40,0.30,0.22,0.28,0.18];
  const segW = W / (pts.length - 1);
  const chartH = H * 0.22;
  const polyline = pts.map((y, i) => `${i * segW},${chartH * y}`).join(" ");
  const fill = pts.map((y, i) => `${i * segW},${chartH * y}`).join(" ") + ` ${W},${chartH} 0,${chartH}`;
  return (
    <Svg width={W} height={chartH} style={{ position: "absolute", bottom: 0, left: 0, opacity: 0.06 }}>
      <Path d={`M${fill} Z`} fill={C.accent} />
      <Path d={`M${polyline}`} fill="none" stroke={C.accent} strokeWidth={1.5} />
    </Svg>
  );
}

// ── Shared atoms ──────────────────────────────────────────────────────────────
function FeatureBadge({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <View style={badge.wrap}>
      {icon}
      <Text style={badge.text}>{label}</Text>
    </View>
  );
}
const badge = StyleSheet.create({
  wrap: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1, borderColor: C.border2, backgroundColor: C.surface2 },
  text: { fontSize: 11, fontWeight: "600", color: C.muted },
});

function InputRow({ icon, right, ...props }: React.ComponentProps<typeof TextInput> & { icon: React.ReactNode; right?: React.ReactNode }) {
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
  iconWrap:  { paddingHorizontal: 14, paddingVertical: 13 },
  field:     { flex: 1, fontSize: 15, color: C.fg, paddingVertical: 13, paddingRight: 4 },
  rightWrap: { paddingRight: 14 },
});

function ErrorBox({ msg }: { msg: string }) {
  if (!msg) return null;
  return (
    <View style={s.errorBox}>
      <Text style={s.errorText}>{msg}</Text>
    </View>
  );
}

function clerkMsg(e: unknown, fallback: string): string {
  if (!e || typeof e !== "object") return fallback;
  const obj = e as Record<string, unknown>;
  if (Array.isArray(obj.errors)) {
    const first = (obj.errors as Array<{ longMessage?: string; message?: string }>)[0];
    if (first) return first.longMessage ?? first.message ?? fallback;
  }
  if (typeof obj.message === "string" && obj.message) return obj.message;
  return fallback;
}

// ── SSO Buttons ───────────────────────────────────────────────────────────────
function SSOButtons({ zh, onError }: { zh: boolean; onError: (msg: string) => void }) {
  const { startSSOFlow } = useSSO();
  const [loading, setLoading] = useState<"google" | "apple" | null>(null);

  async function handleSSO(strategy: "oauth_google" | "oauth_apple") {
    setLoading(strategy === "oauth_google" ? "google" : "apple");
    onError("");
    try {
      const redirectUrl = Linking.createURL("/", { scheme: "tradeai" });
      const { createdSessionId, setActive } = await startSSOFlow({ strategy, redirectUrl });
      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
      }
    } catch (e: unknown) {
      onError(clerkMsg(e, zh ? "SSO 登录失败" : "SSO sign-in failed."));
    } finally {
      setLoading(null);
    }
  }

  return (
    <View style={sso.wrap}>
      <View style={sso.dividerRow}>
        <View style={sso.line} />
        <Text style={sso.divText}>{zh ? "或使用" : "or continue with"}</Text>
        <View style={sso.line} />
      </View>
      <View style={sso.btnRow}>
        {/* Google */}
        <TouchableOpacity
          style={sso.btn}
          onPress={() => handleSSO("oauth_google")}
          disabled={!!loading}
          activeOpacity={0.75}
        >
          {loading === "google"
            ? <ActivityIndicator size="small" color={C.fg} />
            : (
              <>
                <GoogleIcon size={18} />
                <Text style={sso.btnText}>Google</Text>
              </>
            )
          }
        </TouchableOpacity>
        {/* Apple */}
        <TouchableOpacity
          style={sso.btn}
          onPress={() => handleSSO("oauth_apple")}
          disabled={!!loading}
          activeOpacity={0.75}
        >
          {loading === "apple"
            ? <ActivityIndicator size="small" color={C.fg} />
            : (
              <>
                <AppleIcon size={18} color={C.fg} />
                <Text style={sso.btnText}>Apple</Text>
              </>
            )
          }
        </TouchableOpacity>
      </View>
    </View>
  );
}

const sso = StyleSheet.create({
  wrap:       { marginTop: 4 },
  dividerRow: { flexDirection: "row", alignItems: "center", gap: 10, marginVertical: 16 },
  line:       { flex: 1, height: 1, backgroundColor: C.border },
  divText:    { fontSize: 11, color: C.muted, fontWeight: "500" },
  btnRow:     { flexDirection: "row", gap: 10 },
  btn:        { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: C.border2, backgroundColor: C.surface2 },
  btnText:    { fontSize: 14, fontWeight: "600", color: C.fg },
});

// Simple inline SVG icons for Google / Apple
function GoogleIcon({ size = 18 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <Path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <Path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <Path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </Svg>
  );
}
function AppleIcon({ size = 18, color = "#fff" }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.7 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.56-1.31 3.1-2.54 4.08zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" fill={color}/>
    </Svg>
  );
}

// ── Sign In form ──────────────────────────────────────────────────────────────
function SignInForm({ zh }: { zh: boolean }) {
  const { signIn, setActive, isLoaded } = useSignIn();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

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
      } else {
        setError(zh ? "登录无法完成，请重试" : "Sign-in could not be completed.");
      }
    } catch (e: unknown) {
      setError(clerkMsg(e, zh ? "邮箱或密码错误" : "Incorrect email or password."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <View>
      <Text style={s.label}>{zh ? "邮箱" : "Email"}</Text>
      <InputRow
        icon={<Mail size={16} color={C.muted} strokeWidth={1.8} />}
        value={email} onChangeText={setEmail}
        placeholder={zh ? "你的邮箱地址" : "your@email.com"}
        keyboardType="email-address" autoCapitalize="none" autoCorrect={false}
        returnKeyType="next"
      />
      <Text style={s.label}>{zh ? "密码" : "Password"}</Text>
      <InputRow
        icon={<Lock size={16} color={C.muted} strokeWidth={1.8} />}
        value={password} onChangeText={setPassword}
        placeholder="••••••••" secureTextEntry={!showPass}
        returnKeyType="done" onSubmitEditing={handleSignIn}
        right={
          <TouchableOpacity onPress={() => setShowPass(!showPass)} hitSlop={8}>
            {showPass ? <EyeOff size={17} color={C.muted} strokeWidth={1.8} /> : <Eye size={17} color={C.muted} strokeWidth={1.8} />}
          </TouchableOpacity>
        }
      />
      <ErrorBox msg={error} />
      <TouchableOpacity onPress={handleSignIn} disabled={loading || !isLoaded} activeOpacity={0.85} style={s.btnWrap}>
        <LinearGradient colors={[C.accent, C.accent2]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.btn}>
          {loading
            ? <ActivityIndicator color="#fff" />
            : <><TrendingUp size={16} color="#fff" strokeWidth={2.2} /><Text style={s.btnText}>{zh ? "登 录" : "Sign In"}</Text></>
          }
        </LinearGradient>
      </TouchableOpacity>
      <SSOButtons zh={zh} onError={setError} />
    </View>
  );
}

// ── Register form ─────────────────────────────────────────────────────────────
function RegisterForm({ zh }: { zh: boolean }) {
  const { signUp, setActive, isLoaded } = useSignUp();
  const [name, setName]         = useState("");
  const [email, setEmail]       = useState("");
  const [pw, setPw]             = useState("");
  const [pw2, setPw2]           = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [verifying, setVerifying] = useState(false);
  const [code, setCode]           = useState("");
  const [resendCd, setResendCd]   = useState(0);
  const [done, setDone]           = useState(false);

  // Resend countdown
  useEffect(() => {
    if (resendCd <= 0) return;
    const id = setTimeout(() => setResendCd((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [resendCd]);

  // Auto-verify when 6 digits entered
  useEffect(() => {
    if (verifying && code.length === 6 && !loading && isLoaded && signUp && setActive) {
      doVerify(code);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, verifying]);

  async function doVerify(otp: string) {
    if (!signUp || !setActive) return;
    setError("");
    setLoading(true);
    try {
      const result = await signUp.attemptEmailAddressVerification({ code: otp });
      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        setDone(true);
      } else {
        setError(zh ? "验证未完成，请检查验证码" : "Verification incomplete — check the code.");
      }
    } catch (e: unknown) {
      setError(clerkMsg(e, zh ? "验证码无效或已过期" : "Invalid or expired code."));
      setCode("");
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister() {
    if (!isLoaded || !signUp || !setActive || loading) return;
    setError("");
    if (!name.trim()) { setError(zh ? "请输入姓名" : "Please enter your name."); return; }
    if (!email.trim()) { setError(zh ? "请输入邮箱" : "Please enter your email."); return; }
    if (pw.length < 6) { setError(zh ? "密码至少6位" : "Password must be at least 6 characters."); return; }
    if (pw !== pw2) { setError(zh ? "两次密码不一致" : "Passwords do not match."); return; }

    const parts = name.trim().split(/\s+/);
    const firstName = parts[0] ?? "";
    const lastName  = parts.slice(1).join(" ") || undefined;

    setLoading(true);
    try {
      const result = await signUp.create({ emailAddress: email.trim().toLowerCase(), password: pw, firstName, lastName });
      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        setDone(true);
      } else if (result.status === "missing_requirements") {
        await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
        setVerifying(true);
        setResendCd(60);
      } else {
        setError(zh ? "注册状态异常：" + result.status : "Unexpected status: " + result.status);
      }
    } catch (e: unknown) {
      setError(clerkMsg(e, zh ? "注册失败，请重试" : "Registration failed. Please try again."));
    } finally {
      setLoading(false);
    }
  }

  async function resend() {
    if (!signUp || resendCd > 0 || loading) return;
    setLoading(true);
    try {
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setCode("");
      setResendCd(60);
    } catch (e: unknown) {
      setError(clerkMsg(e, zh ? "发送失败" : "Failed to resend."));
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <View style={{ alignItems: "center", paddingVertical: 32 }}>
        <View style={s.doneCircle}>
          <TrendingUp size={28} color={C.green} strokeWidth={2} />
        </View>
        <Text style={s.doneTitle}>{zh ? "注册成功！" : "Account created!"}</Text>
        <Text style={s.doneSub}>{zh ? "正在跳转..." : "Redirecting to your dashboard…"}</Text>
      </View>
    );
  }

  if (verifying) {
    return (
      <View>
        <View style={s.verifyHint}>
          <Mail size={14} color={C.accent} strokeWidth={1.8} />
          <Text style={s.verifyHintText}>
            {zh ? `验证码已发送至 ${email}` : `Code sent to ${email}`}
          </Text>
        </View>
        <Text style={s.label}>{zh ? "6位验证码" : "6-digit code"}</Text>
        <TextInput
          style={s.otpInput}
          value={code}
          onChangeText={(t) => setCode(t.replace(/\D/g, "").slice(0, 6))}
          placeholder="000000"
          placeholderTextColor={C.muted}
          keyboardType="number-pad"
          maxLength={6}
          autoFocus
          textContentType="oneTimeCode"
        />
        <ErrorBox msg={error} />
        <TouchableOpacity
          onPress={() => { if (code.length === 6 && !loading) doVerify(code); }}
          disabled={loading || code.length < 6}
          activeOpacity={0.85}
          style={s.btnWrap}
        >
          <LinearGradient colors={[C.green, "#16a34a"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.btn}>
            {loading
              ? <ActivityIndicator color="#fff" />
              : <><KeyRound size={16} color="#fff" strokeWidth={2} /><Text style={s.btnText}>{zh ? "验 证" : "Verify Email"}</Text></>
            }
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity onPress={resend} disabled={resendCd > 0 || loading} style={{ marginTop: 12, alignItems: "center" }}>
          <Text style={{ fontSize: 12, color: resendCd > 0 ? C.muted : C.accent }}>
            {resendCd > 0
              ? (zh ? `${resendCd}秒后可重新发送` : `Resend in ${resendCd}s`)
              : (zh ? "没收到？重新发送" : "Didn't receive it? Resend")}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View>
      <Text style={s.label}>{zh ? "姓名" : "Full Name"}</Text>
      <InputRow
        icon={<User size={16} color={C.muted} strokeWidth={1.8} />}
        value={name} onChangeText={setName}
        placeholder={zh ? "你的姓名" : "Alex Smith"}
        autoCapitalize="words" returnKeyType="next"
      />
      <Text style={s.label}>{zh ? "邮箱" : "Email"}</Text>
      <InputRow
        icon={<Mail size={16} color={C.muted} strokeWidth={1.8} />}
        value={email} onChangeText={setEmail}
        placeholder={zh ? "你的邮箱地址" : "your@email.com"}
        keyboardType="email-address" autoCapitalize="none" autoCorrect={false}
        returnKeyType="next"
      />
      <Text style={s.label}>{zh ? "密码" : "Password"}</Text>
      <InputRow
        icon={<Lock size={16} color={C.muted} strokeWidth={1.8} />}
        value={pw} onChangeText={setPw}
        placeholder={zh ? "至少6位" : "At least 6 characters"}
        secureTextEntry={!showPw} returnKeyType="next"
        right={
          <TouchableOpacity onPress={() => setShowPw(!showPw)} hitSlop={8}>
            {showPw ? <EyeOff size={17} color={C.muted} strokeWidth={1.8} /> : <Eye size={17} color={C.muted} strokeWidth={1.8} />}
          </TouchableOpacity>
        }
      />
      <Text style={s.label}>{zh ? "确认密码" : "Confirm Password"}</Text>
      <InputRow
        icon={<Lock size={16} color={C.muted} strokeWidth={1.8} />}
        value={pw2} onChangeText={setPw2}
        placeholder={zh ? "再次输入密码" : "Repeat password"}
        secureTextEntry={!showPw} returnKeyType="done"
        onSubmitEditing={handleRegister}
      />
      <ErrorBox msg={error} />
      <TouchableOpacity onPress={handleRegister} disabled={loading || !isLoaded} activeOpacity={0.85} style={s.btnWrap}>
        <LinearGradient colors={[C.purple, "#6d28d9"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.btn}>
          {loading
            ? <ActivityIndicator color="#fff" />
            : <><User size={16} color="#fff" strokeWidth={2.2} /><Text style={s.btnText}>{zh ? "注 册" : "Create Account"}</Text></>
          }
        </LinearGradient>
      </TouchableOpacity>
      <SSOButtons zh={zh} onError={setError} />
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function SignInScreen() {
  const lang = useTradingStore((s) => s.lang);
  const zh   = lang === "zh";
  const [tab, setTab] = useState<"signin" | "register">("signin");

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
      <LinearGradient colors={["#04060d","#080c18","#060912"]} style={StyleSheet.absoluteFillObject} start={{ x: 0.3, y: 0 }} end={{ x: 0.7, y: 1 }} />
      <View style={s.glowTop} />
      <BgChart />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* Hero */}
          <View style={s.hero}>
            <View style={s.iconRing}>
              <View style={s.iconGlow} />
              <AppIconMark size={68} />
            </View>
            <Text style={s.appName}>Trade<Text style={{ color: C.accent }}>AI</Text></Text>
            <Text style={s.tagline}>{zh ? "AI 驱动的智能交易平台" : "AI-Powered Trading Platform"}</Text>
            <View style={s.badges}>
              {features.map((f) => <FeatureBadge key={f.label} icon={f.icon} label={f.label} />)}
            </View>
          </View>

          {/* Auth card */}
          <View style={s.card}>
            <LinearGradient colors={[C.accent2, C.purple, "transparent"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.cardAccentLine} />

            {/* Tab switcher */}
            <View style={s.tabRow}>
              {(["signin", "register"] as const).map((t) => (
                <TouchableOpacity key={t} onPress={() => setTab(t)} activeOpacity={0.8} style={[s.tabBtn, tab === t && s.tabBtnActive]}>
                  <Text style={[s.tabText, tab === t && s.tabTextActive]}>
                    {t === "signin"
                      ? (zh ? "登 录" : "Sign In")
                      : (zh ? "注 册" : "Register")}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Forms */}
            {tab === "signin"
              ? <SignInForm zh={zh} />
              : <RegisterForm zh={zh} />
            }
          </View>

          <Text style={s.footer}>Paper Trading · 模拟交易 · 非真实资金</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root:    { flex: 1, backgroundColor: C.bg },
  glowTop: { position: "absolute", top: -80, alignSelf: "center", width: W * 0.8, height: W * 0.8, borderRadius: W * 0.4, backgroundColor: C.accent2, opacity: 0.07 },
  scroll:  { flexGrow: 1, paddingHorizontal: 20, paddingVertical: 36 },

  // Hero
  hero:     { alignItems: "center", marginBottom: 28 },
  iconRing: { position: "relative", marginBottom: 16 },
  iconGlow: { position: "absolute", top: -10, left: -10, right: -10, bottom: -10, borderRadius: 999, backgroundColor: C.purple, opacity: 0.18 },
  appName:  { fontSize: 36, fontWeight: "800", color: C.fg, letterSpacing: -1, marginBottom: 4 },
  tagline:  { fontSize: 13, color: C.muted, marginBottom: 14, letterSpacing: 0.2 },
  badges:   { flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "center" },

  // Card
  card:          { backgroundColor: C.surface, borderRadius: 20, borderWidth: 1, borderColor: C.border, overflow: "hidden", padding: 20, paddingTop: 0 },
  cardAccentLine:{ height: 2, marginBottom: 16, borderRadius: 1 },

  // Tabs
  tabRow:       { flexDirection: "row", backgroundColor: C.surface2, borderRadius: 12, padding: 3, marginBottom: 20, gap: 3 },
  tabBtn:       { flex: 1, paddingVertical: 9, borderRadius: 9, alignItems: "center" },
  tabBtnActive: { backgroundColor: C.accent2 },
  tabText:      { fontSize: 13, fontWeight: "600", color: C.muted },
  tabTextActive:{ color: "#fff" },

  label: { fontSize: 11, fontWeight: "700", color: C.muted, textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 6 },

  errorBox: { backgroundColor: "#ef444418", borderWidth: 1, borderColor: "#ef444440", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 12 },
  errorText:{ fontSize: 13, color: C.red },

  btnWrap: { marginTop: 4, marginBottom: 4, borderRadius: 14, overflow: "hidden" },
  btn:     { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, borderRadius: 14 },
  btnText: { fontSize: 15, fontWeight: "700", color: "#ffffff", letterSpacing: 0.3 },

  // OTP
  otpInput: { height: 60, borderRadius: 14, borderWidth: 1, borderColor: C.border2, backgroundColor: C.surface2, color: C.fg, fontSize: 28, fontWeight: "700", textAlign: "center", letterSpacing: 10, marginBottom: 12 },

  // Verify hint
  verifyHint:     { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#4d9fff18", borderWidth: 1, borderColor: "#4d9fff30", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 16 },
  verifyHintText: { fontSize: 12, color: C.fg, opacity: 0.8, flex: 1 },

  // Done
  doneCircle: { width: 60, height: 60, borderRadius: 30, backgroundColor: "#22c55e15", borderWidth: 1, borderColor: "#22c55e30", alignItems: "center", justifyContent: "center", marginBottom: 12 },
  doneTitle:  { fontSize: 18, fontWeight: "700", color: C.fg, marginBottom: 4 },
  doneSub:    { fontSize: 13, color: C.muted },

  footer: { textAlign: "center", fontSize: 11, color: C.muted, marginTop: 24 },
});
