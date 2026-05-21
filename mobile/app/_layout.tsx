import "react-native-gesture-handler";
import React from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useTradingStore } from "@/lib/store";

export default function RootLayout() {
  const theme = useTradingStore((s) => s.theme);

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
