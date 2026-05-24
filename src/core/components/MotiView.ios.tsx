import React, { useEffect, useRef } from 'react';
import { Animated, ViewStyle } from 'react-native';

interface MotiViewProps {
  from?: { opacity?: number; translateY?: number; translateX?: number; scale?: number };
  animate?: { opacity?: number; translateY?: number; translateX?: number; scale?: number };
  transition?: { type?: string; duration?: number; delay?: number };
  style?: ViewStyle | any;
  children?: React.ReactNode;
  [key: string]: any;
}

export function MotiView({ from, animate, transition, style, children, ...props }: MotiViewProps) {
  const opacity = useRef(new Animated.Value(from?.opacity ?? 0)).current;
  const translateY = useRef(new Animated.Value(from?.translateY ?? 0)).current;

  useEffect(() => {
    const duration = transition?.duration ?? 350;
    const delay = transition?.delay ?? 0;
    Animated.parallel([
      Animated.timing(opacity, { toValue: animate?.opacity ?? 1, duration, delay, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: animate?.translateY ?? 0, duration, delay, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[style, { opacity, transform: [{ translateY }] }]} {...props}>
      {children}
    </Animated.View>
  );
}
