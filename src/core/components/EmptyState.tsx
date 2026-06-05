import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { TOKENS } from '@/core/design-system/tokens';

const C = {
  primary: TOKENS.color.primary,
  dark:    TOKENS.color.primaryDark,
  text:    '#1A1A1A',
  sub:     '#6B7280',
  accent:  '#FFF0F3',
  border:  '#EDEDF0',
};

interface EmptyStateProps {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  subtitle: string;
  cta?: {
    label: string;
    onPress: () => void;
  };
  secondaryCta?: {
    label: string;
    onPress: () => void;
  };
  iconColor?: string;
  iconBg?: string;
}

export function EmptyState({
  icon,
  title,
  subtitle,
  cta,
  secondaryCta,
  iconColor = C.primary,
  iconBg = C.accent,
}: EmptyStateProps) {
  const scale  = useRef(new Animated.Value(0.7)).current;
  const fade   = useRef(new Animated.Value(0)).current;
  const slideY = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, friction: 6, useNativeDriver: true }),
      Animated.timing(fade,   { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(slideY, { toValue: 0, friction: 7, useNativeDriver: true }),
    ]).start();
  }, []);

  const btnScale = useRef(new Animated.Value(1)).current;

  return (
    <Animated.View style={[s.root, { opacity: fade, transform: [{ translateY: slideY }] }]}>
      {/* Icon */}
      <Animated.View style={[s.iconWrap, { backgroundColor: iconBg, transform: [{ scale }] }]}>
        <Ionicons name={icon} size={36} color={iconColor} />
      </Animated.View>

      {/* Text */}
      <Text style={s.title}>{title}</Text>
      <Text style={s.subtitle}>{subtitle}</Text>

      {/* CTAs */}
      {cta && (
        <Pressable
          onPressIn={() => Animated.spring(btnScale, { toValue: 0.96, useNativeDriver: true }).start()}
          onPressOut={() => Animated.spring(btnScale, { toValue: 1, useNativeDriver: true }).start()}
          onPress={cta.onPress}
        >
          <View style={s.ctaShadow}>
            <Animated.View style={[s.ctaWrap, { transform: [{ scale: btnScale }] }]}>
              <LinearGradient
                colors={[C.dark, C.primary, '#c0002f']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={s.ctaBtn}
              >
                <Text style={s.ctaText}>{cta.label}</Text>
              </LinearGradient>
            </Animated.View>
          </View>
        </Pressable>
      )}

      {secondaryCta && (
        <Pressable onPress={secondaryCta.onPress} style={s.secondaryBtn}>
          <Text style={s.secondaryText}>{secondaryCta.label}</Text>
        </Pressable>
      )}
    </Animated.View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 36,
    paddingVertical: 48,
    gap: 12,
  },
  iconWrap: {
    width: 84,
    height: 84,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: C.text,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 14,
    color: C.sub,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },
  ctaShadow: {
    borderRadius: 13,
    marginTop: 4,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  ctaWrap: {
    borderRadius: 13,
    overflow: 'hidden',
  },
  ctaBtn: {
    paddingHorizontal: 28,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  secondaryBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  secondaryText: {
    fontSize: 14,
    color: C.sub,
    fontWeight: '500',
  },
});
