/**
 * Root routing guard.
 *
 * Reads the persisted token directly from AsyncStorage — zero Zustand hooks.
 * This avoids any useSyncExternalStore / React-19 snapshot-consistency issue
 * that would cause "Maximum update depth exceeded" during initial hydration.
 */
import React, { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { Redirect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Zustand persist stores data under this key (must match store.ts name option)
const STORAGE_KEY = "tradeai-mobile-v1";

export default function Index() {
  const [ready,    setReady]    = useState(false);
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        try {
          const persisted = raw ? JSON.parse(raw) : null;
          // Zustand persist format: { state: { token, ... }, version: 0 }
          const token = persisted?.state?.token ?? null;
          setHasToken(!!token);
        } catch {
          setHasToken(false);
        }
      })
      .catch(() => setHasToken(false))
      .finally(() => setReady(true));
  }, []);

  if (!ready) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0d1117", justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator color="#58a6ff" size="large" />
      </View>
    );
  }

  return hasToken
    ? <Redirect href="/(tabs)" />
    : <Redirect href="/(auth)/sign-in" />;
}
