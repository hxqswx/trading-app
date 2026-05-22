import "react-native-gesture-handler";
import React, { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ClerkProvider, ClerkLoaded, useAuth } from "@clerk/clerk-expo";
import { tokenCache } from "@/lib/clerk-token-cache";
import { useTradingStore } from "@/lib/store";

const PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "";

/**
 * Auth guard — watches Clerk's sign-in state and redirects accordingly.
 * Must be rendered inside <ClerkLoaded> so isLoaded is always true.
 */
function AuthGuard() {
  const { isSignedIn } = useAuth();
  const router         = useRouter();
  const segments       = useSegments();

  useEffect(() => {
    const inAuthGroup = segments[0] === "(auth)";
    if (!isSignedIn && !inAuthGroup) {
      router.replace("/(auth)/sign-in");
    } else if (isSignedIn && inAuthGroup) {
      router.replace("/(tabs)");
    }
  }, [isSignedIn, segments, router]);

  return null;
}

export default function RootLayout() {
  const theme = useTradingStore((s) => s.theme);

  return (
    <ClerkProvider publishableKey={PUBLISHABLE_KEY} tokenCache={tokenCache}>
      <ClerkLoaded>
        <AuthGuard />
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
      </ClerkLoaded>
    </ClerkProvider>
  );
}
