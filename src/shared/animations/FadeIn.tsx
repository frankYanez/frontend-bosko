import React, { useEffect, useRef } from "react";
import { Animated } from "react-native";

export default function FadeIn({ children }: { children: React.ReactNode }) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, []);

  return <Animated.View style={{ opacity }}>{children}</Animated.View>;
}
