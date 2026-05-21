import React from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import { useColors } from "@/lib/hooks/use-colors";

interface CardProps {
  children: React.ReactNode;
  style?:   ViewStyle | ViewStyle[];
  padding?: number;
}

export function Card({ children, style, padding = 16 }: CardProps) {
  const colors = useColors();
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor:     colors.border,
          padding,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth:  1,
  },
});
