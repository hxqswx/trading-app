import "react-native-gesture-handler";
import React, { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useTradingStore } from "@/lib/store";

function AuthGuard() {
  const token    = useTradingStore((s) => s.token);
  const router   = useRouter();
  const segments = useSegments();

  useEffect(() => {
    const inAuthGroup = segments[0] === "(auth)";
    if (!token && !inAuthGroup) {
      router.replace("/(auth)/sign-in");
    } else if (token && inAuthGroup) {
      router.replace("/(tabs)");
    }
  }, [token, segments]);

  return null;
}

export default function RootLayout() {
  const theme   = useTradingStore((s) => s.theme);
  const [ready, setReady] = useState(false);

  // 等待 Zustand AsyncStorage 水合完成再渲染
  useEffect(() => {
    const unsub = useTradingStore.persist.onFinishHydration(() => {
      setReady(true);
    });
    // 如果已经水合完成（同步存储或已完成）
    if (useTradingStore.persist.hasHydrated()) {
      setReady(true);
    }
    return () => unsub();
  }, []);

  if (!ready) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0d1117", justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator color="#58a6ff" size="large" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style={theme === "dark" ? "light" : "dark"} />
      <AuthGuard />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)"  />
        <Stack.Screen name="(tabs)"  />
        <Stack.Screen
          name="trade/[symbol]"
          options={{
            headerShown:     true,
            headerStyle:     { backgroundColor: theme === "dark" ? "#0d1117" : "#ffffff" },
            headerTintColor: theme === "dark" ? "#e6edf3" : "#1f2328",
            headerBackTitle: "",
          }}
        />
      </Stack>
    </>
  );
}
