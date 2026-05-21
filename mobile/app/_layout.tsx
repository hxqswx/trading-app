import "react-native-gesture-handler";
import React, { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useTradingStore } from "@/lib/store";

export default function RootLayout() {
  const theme  = useTradingStore((s) => s.theme);
  const [ready, setReady] = useState(
    () => useTradingStore.persist.hasHydrated()
  );

  useEffect(() => {
    if (ready) return;
    const unsub = useTradingStore.persist.onFinishHydration(() => setReady(true));
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
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
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
