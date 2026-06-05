/**
 * ThemeToggle — animated sun/moon toggle for dark/light mode.
 * Uses theme store + Ionicons.
 */
import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  useThemeMode,
  useToggleTheme,
  useThemeColors,
  useIsDark,
} from '@/stores/theme.store';
import { TOKENS } from '@/core/design-system/tokens';

const TRACK_W = 52;
const TRACK_H = 28;
const THUMB_S = 22;
const THUMB_P = (TRACK_H - THUMB_S) / 2; // 3px padding
const THUMB_L = TRACK_W - THUMB_S - THUMB_P; // translateX for "on"

export function ThemeToggle() {
  const isDark = useIsDark();
  const toggle = useToggleTheme();
  const colors = useThemeColors();
  const translateX = useRef(new Animated.Value(isDark ? THUMB_L : THUMB_P)).current;

  useEffect(() => {
    Animated.spring(translateX, {
      toValue: isDark ? THUMB_L : THUMB_P,
      useNativeDriver: true,
      friction: 8,
      tension: 100,
    }).start();
  }, [isDark]);

  const trackColor = isDark ? '#2D2A3A' : colors.primary;

  return (
    <Pressable
      onPress={toggle}
      accessibilityRole="switch"
      accessibilityState={{ checked: isDark }}
      hitSlop={10}
      style={styles.wrapper}
    >
      <View style={[styles.track, { backgroundColor: trackColor }]}>
        {/* Sun / moon icon inside track */}
        <View style={styles.iconWrap}>
          <Ionicons
            name={isDark ? 'moon' : 'sunny'}
            size={14}
            color={isDark ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.9)'}
          />
        </View>
        <Animated.View
          style={[
            styles.thumb,
            { transform: [{ translateX }] },
          ]}
        >
          <Ionicons
            name={isDark ? 'moon' : 'sunny'}
            size={14}
            color={isDark ? '#C084FC' : '#F59E0B'}
          />
        </Animated.View>
      </View>
    </Pressable>
  );
}

/**
 * ThemeToggleRow — ready-to-use Settings row with icon, label, and toggle.
 */
export function ThemeToggleRow({
  iconBg,
  iconColor,
}: {
  iconBg?: string;
  iconColor?: string;
}) {
  const isDark = useIsDark();
  const colors = useThemeColors();

  return {
    icon: isDark ? 'moon-outline' : 'sunny-outline' as 'moon-outline' | 'sunny-outline',
    iconBg: iconBg ?? (isDark ? 'rgba(192,132,252,0.12)' : 'rgba(245,158,11,0.12)'),
    iconColor: iconColor ?? (isDark ? '#C084FC' : '#F59E0B'),
    label: isDark ? 'Modo Oscuro' : 'Modo Claro',
    accessory: <ThemeToggle />,
    onPress: undefined as (() => void) | undefined,
  };
}

const styles = StyleSheet.create({
  wrapper: {
    padding: 4,
  },
  track: {
    width: TRACK_W,
    height: TRACK_H,
    borderRadius: TRACK_H / 2,
    justifyContent: 'center',
    paddingHorizontal: THUMB_P,
  },
  iconWrap: {
    position: 'absolute',
    right: THUMB_P + 2,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  thumb: {
    width: THUMB_S,
    height: THUMB_S,
    borderRadius: THUMB_S / 2,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
});
