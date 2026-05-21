import React, { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useTradingStore } from "@/lib/store";

/**
 * Root layout — handles auth routing.
 * Redirects unauthenticated users to the sign-in screen.
 */
export default function RootLayout() {
  const token    = useTradingStore((s) => s.token);
  const theme    = useTradingStore((s) => s.theme);
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

  return (
    <>
      <StatusBar style={theme === "dark" ? "light" : "dark"} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)"  options={{ animation: "fade" }} />
        <Stack.Screen name="(tabs)"  options={{ animation: "fade" }} />
        <Stack.Screen name="trade/[symbol]" options={{
          headerShown:   true,
          headerStyle:   { backgroundColor: theme === "dark" ? "#0d1117" : "#ffffff" },
          headerTintColor: theme === "dark" ? "#e6edf3" : "#1f2328",
          animation:     "slide_from_right",
        }} />
      </Stack>
    </>
  );
}
