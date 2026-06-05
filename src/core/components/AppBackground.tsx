import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeColors } from '@/stores/theme.store';

interface Props {
  children: React.ReactNode;
}

export function AppBackground({ children }: Props) {
  const colors = useThemeColors();
  return (
    <View style={[s.root, { backgroundColor: colors.bg }]}>
      {/* Radial-like brand glow at top — simulated with LinearGradient */}
      <LinearGradient
        colors={[colors.bgGlow, colors.bgGlowFade]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.55 }}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      />
      {children}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
});
