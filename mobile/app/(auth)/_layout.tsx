import { Stack } from "expo-router";

// 不做任何跳转逻辑，避免与 (tabs) layout 的 Redirect 互相触发无限循环
export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
