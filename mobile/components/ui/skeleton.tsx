import React, { useEffect, useRef } from "react";
import { Animated, View, StyleSheet, ViewStyle } from "react-native";
import { useColors } from "@/lib/hooks/use-colors";

interface SkeletonProps {
  width?:  number;
  height?: number;
  style?:  ViewStyle;
  radius?: number;
}

export function Skeleton({ width, height = 16, style, radius = 6 }: SkeletonProps) {
  const colors  = useColors();
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1,   duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius:    radius,
          backgroundColor: colors.border,
          opacity,
        },
        style,
      ]}
    />
  );
}
