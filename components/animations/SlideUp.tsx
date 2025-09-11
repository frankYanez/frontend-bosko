// animations/SlideUp.tsx
import React, { useEffect } from "react";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";

export default function SlideUp({ children }: { children: React.ReactNode }) {
  const translateY = useSharedValue(40);
  const opacity = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  useEffect(() => {
    translateY.value = withTiming(0, { duration: 500 });
    opacity.value = withTiming(1, { duration: 500 });
  }, []);

  return <Animated.View style={animatedStyle}>{children}</Animated.View>;
}
