import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useColors } from "@/lib/hooks/use-colors";
import { useT } from "@/lib/hooks/use-t";
import type { AssetType } from "@/lib/types";

interface BadgeProps {
  type: AssetType;
}

export function Badge({ type }: BadgeProps) {
  const colors = useColors();
  const t      = useT();

  const label: Record<AssetType, string> = {
    stock:  t.badge.stock,
    crypto: t.badge.crypto,
    hk:     t.badge.hk,
    cn:     t.badge.cn,
    forex:  t.badge.forex,
  };

  const bg: Record<AssetType, string> = {
    stock:  colors.accent + "22",
    crypto: colors.purple + "22",
    hk:     colors.yellow + "22",
    cn:     colors.red    + "22",
    forex:  colors.green  + "22",
  };

  const fg: Record<AssetType, string> = {
    stock:  colors.accent,
    crypto: colors.purple,
    hk:     colors.yellow,
    cn:     colors.red,
    forex:  colors.green,
  };

  return (
    <View style={[styles.badge, { backgroundColor: bg[type] }]}>
      <Text style={[styles.text, { color: fg[type] }]}>{label[type]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 6,
    paddingVertical:   2,
    borderRadius:      4,
    alignSelf:         "flex-start",
  },
  text: {
    fontSize:   10,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
});
