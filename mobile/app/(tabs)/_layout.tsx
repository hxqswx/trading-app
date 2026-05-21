import React from "react";
import { Tabs } from "expo-router";
import { Platform } from "react-native";
import { useTradingStore } from "@/lib/store";
import { useColors } from "@/lib/hooks/use-colors";
import { useT } from "@/lib/hooks/use-t";
import { useQuotePoller } from "@/lib/hooks/use-quotes";
import { usePortfolio } from "@/lib/hooks/use-portfolio";
import {
  LayoutDashboard,
  LineChart,
  Briefcase,
  TrendingUp,
  Settings,
} from "lucide-react-native";

/** Starts background data polling for the whole tab session. */
function DataBootstrap() {
  useQuotePoller();
  usePortfolio();
  return null;
}

export default function TabsLayout() {
  const colors = useColors();
  const t      = useT();
  const theme  = useTradingStore((s) => s.theme);

  return (
    <>
      <DataBootstrap />
      <Tabs
        screenOptions={{
          headerShown:        false,
          tabBarActiveTintColor:   colors.accent,
          tabBarInactiveTintColor: colors.muted,
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopColor:  colors.border,
            borderTopWidth:  1,
            height:          Platform.OS === "ios" ? 88 : 64,
            paddingBottom:   Platform.OS === "ios" ? 28 : 8,
            paddingTop:      8,
          },
          tabBarLabelStyle: {
            fontSize:   10,
            fontWeight: "600",
            marginTop:  2,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title:    t.nav.dashboard,
            tabBarIcon: ({ color, size }) => (
              <LayoutDashboard size={size} color={color} strokeWidth={1.8} />
            ),
          }}
        />
        <Tabs.Screen
          name="markets"
          options={{
            title:    t.nav.markets,
            tabBarIcon: ({ color, size }) => (
              <LineChart size={size} color={color} strokeWidth={1.8} />
            ),
          }}
        />
        <Tabs.Screen
          name="portfolio"
          options={{
            title:    t.nav.portfolio,
            tabBarIcon: ({ color, size }) => (
              <Briefcase size={size} color={color} strokeWidth={1.8} />
            ),
          }}
        />
        <Tabs.Screen
          name="strategies"
          options={{
            title:    t.nav.strategies,
            tabBarIcon: ({ color, size }) => (
              <TrendingUp size={size} color={color} strokeWidth={1.8} />
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title:    t.nav.settings,
            tabBarIcon: ({ color, size }) => (
              <Settings size={size} color={color} strokeWidth={1.8} />
            ),
          }}
        />
      </Tabs>
    </>
  );
}
