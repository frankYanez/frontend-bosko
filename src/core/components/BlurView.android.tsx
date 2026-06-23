import React from 'react';
import { View, ViewStyle } from 'react-native';

interface BlurViewProps {
  intensity?: number;
  tint?: string;
  style?: ViewStyle | any;
  children?: React.ReactNode;
  [key: string]: any;
}

export function BlurView({ intensity = 20, tint = 'light', style, children, ...props }: BlurViewProps) {
  const bg = tint === 'dark'
    ? `rgba(0,0,0,${Math.min(intensity / 100, 0.6)})`
    : `rgba(255,255,255,${Math.min(intensity / 100, 0.85)})`;

  return (
    <View style={[style, { backgroundColor: bg }]} {...props}>
      {children}
    </View>
  );
}
