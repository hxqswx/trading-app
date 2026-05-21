import { Redirect, Stack } from "expo-router";
import { useTradingStore } from "@/lib/store";

export default function AuthLayout() {
  const token = useTradingStore((s) => s.token);

  // 已登录则直接跳到主界面
  if (token) return <Redirect href="/(tabs)" />;

  return <Stack screenOptions={{ headerShown: false }} />;
}
