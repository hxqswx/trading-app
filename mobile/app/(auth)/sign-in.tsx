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
} from "react-native";
import { useColors } from "@/lib/hooks/use-colors";
import { useT } from "@/lib/hooks/use-t";
import { useTradingStore } from "@/lib/store";
import { signIn } from "@/lib/api";

export default function SignInScreen() {
  const colors  = useColors();
  const t       = useT();
  const setAuth = useTradingStore((s) => s.setAuth);

  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  async function handleSignIn() {
    setError("");
    if (!email.trim() || !password.trim()) {
      setError("Please enter email and password.");
      return;
    }
    setLoading(true);
    try {
      const res = await signIn({ email: email.trim(), password });
      setAuth(res.token, { name: res.user.name, email: res.user.email });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Sign in failed.");
    } finally {
      setLoading(false);
    }
  }

  const s = StyleSheet.create({
    container:   { flex: 1, backgroundColor: colors.background },
    inner:       { flex: 1, justifyContent: "center", padding: 24 },
    logo:        { fontSize: 32, fontWeight: "800", color: colors.accent, marginBottom: 4 },
    subtitle:    { fontSize: 14, color: colors.muted, marginBottom: 40 },
    label:       { fontSize: 12, fontWeight: "600", color: colors.muted, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 },
    input:       { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: colors.foreground, marginBottom: 16 },
    button:      { backgroundColor: colors.accent, borderRadius: 10, paddingVertical: 14, alignItems: "center", marginTop: 8 },
    buttonText:  { fontSize: 16, fontWeight: "700", color: "#ffffff" },
    hint:        { marginTop: 20, padding: 12, backgroundColor: colors.surface, borderRadius: 10, borderWidth: 1, borderColor: colors.border },
    hintText:    { fontSize: 12, color: colors.muted, textAlign: "center", lineHeight: 18 },
    errorText:   { color: colors.red, fontSize: 13, marginBottom: 12, textAlign: "center" },
  });

  return (
    <KeyboardAvoidingView
      style={s.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={s.inner} keyboardShouldPersistTaps="handled">
        <Text style={s.logo}>TradeAI</Text>
        <Text style={s.subtitle}>AI-Powered Trading Platform</Text>

        <Text style={s.label}>Email</Text>
        <TextInput
          style={s.input}
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          placeholderTextColor={colors.muted}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="next"
        />

        <Text style={s.label}>Password</Text>
        <TextInput
          style={s.input}
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          placeholderTextColor={colors.muted}
          secureTextEntry
          returnKeyType="done"
          onSubmitEditing={handleSignIn}
        />

        {error ? <Text style={s.errorText}>{error}</Text> : null}

        <TouchableOpacity style={s.button} onPress={handleSignIn} disabled={loading} activeOpacity={0.8}>
          {loading
            ? <ActivityIndicator color="#ffffff" />
            : <Text style={s.buttonText}>{t.auth.signIn}</Text>
          }
        </TouchableOpacity>

        <View style={s.hint}>
          <Text style={s.hintText}>{t.auth.demoHint}</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
