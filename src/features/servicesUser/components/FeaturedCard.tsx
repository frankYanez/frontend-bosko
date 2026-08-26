/**
 * FeaturedCard — card editorial de 2 columnas ("Señal Nocturna", vidrio apilado).
 * Panel superior con imagen real si hay thumbnail, si no gradiente de marca +
 * ícono como marca de agua. Usada tanto para "servicios populares" (Dashboard)
 * como para la grilla de categorías (ServicesScreen) — misma card, distinto dato.
 */
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { TOKENS, GRADIENTS, useThemeColors } from '@/core/design-system';

interface FeaturedCardProps {
  title: string;
  imageUri?: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  metaLabel: string;
  ctaLabel: string;
  verified?: boolean;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  onPress: () => void;
  delay?: number;
  style?: StyleProp<ViewStyle>;
}

export function FeaturedCard({
  title,
  imageUri,
  icon,
  metaLabel,
  ctaLabel,
  verified,
  isFavorite,
  onToggleFavorite,
  onPress,
  delay = 0,
  style,
}: FeaturedCardProps) {
  const tc = useThemeColors();
  const anim = useRef(new Animated.Value(0)).current;
  const scaleA = useRef(new Animated.Value(1)).current;
  const heartScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(anim, { toValue: 1, duration: 380, delay, useNativeDriver: true }).start();
  }, []);

  const pressIn = () => Animated.spring(scaleA, { toValue: 0.96, useNativeDriver: true }).start();
  const pressOut = () => Animated.spring(scaleA, { toValue: 1, useNativeDriver: true }).start();

  const handleFavorite = () => {
    Animated.sequence([
      Animated.spring(heartScale, { toValue: 1.4, useNativeDriver: true }),
      Animated.spring(heartScale, { toValue: 1, useNativeDriver: true }),
    ]).start();
    onToggleFavorite?.();
  };

  return (
    <Animated.View style={[{ opacity: anim, transform: [{ scale: scaleA }] }, style]}>
      <Pressable
        onPressIn={pressIn}
        onPressOut={pressOut}
        onPress={onPress}
        style={[s.card, { backgroundColor: tc.card, borderColor: tc.cardBorder }]}
      >
        <View style={s.panel}>
          {imageUri ? (
            <>
              <Image source={{ uri: imageUri }} style={StyleSheet.absoluteFill} contentFit="cover" />
              <LinearGradient colors={GRADIENTS.overlayFadeDown} style={StyleSheet.absoluteFill} />
            </>
          ) : (
            <LinearGradient colors={GRADIENTS.brandDeep} style={StyleSheet.absoluteFill}>
              <View style={s.panelBlob} />
            </LinearGradient>
          )}
          <Ionicons name={icon} size={34} color="rgba(255,255,255,0.9)" />

          {verified && (
            <View style={s.verifiedPill}>
              <Text style={s.verifiedText}>VERIFICADO</Text>
            </View>
          )}

          {onToggleFavorite && (
            <Pressable onPress={handleFavorite} hitSlop={8} style={s.heartBtn}>
              <Animated.View style={{ transform: [{ scale: heartScale }] }}>
                <Ionicons
                  name={isFavorite ? 'heart' : 'heart-outline'}
                  size={14}
                  color={isFavorite ? TOKENS.color.signal : 'rgba(255,255,255,0.9)'}
                />
              </Animated.View>
            </Pressable>
          )}
        </View>

        <View style={s.body}>
          <Text style={[s.title, { color: tc.text }]} numberOfLines={2}>{title}</Text>
          <Text style={s.meta}>{metaLabel}</Text>
          <View style={[s.divider, { backgroundColor: tc.border }]} />
          <View style={s.ctaRow}>
            <Text style={s.ctaLabel} numberOfLines={1}>{ctaLabel}</Text>
            <Ionicons name="arrow-forward" size={13} color={TOKENS.color.signal} />
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  card: {
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
  },
  panel: {
    height: 104,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  panelBlob: {
    position: 'absolute',
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#fff',
    opacity: 0.08,
    bottom: -34,
    left: -24,
  },
  verifiedPill: {
    position: 'absolute',
    top: 9,
    left: 9,
    backgroundColor: 'rgba(0,229,160,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(0,229,160,0.4)',
    borderRadius: 99,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  verifiedText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.6,
    color: TOKENS.color.mint,
    fontFamily: 'JetBrainsMono_500Medium',
  },
  heartBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { padding: 13, gap: 6 },
  title: { fontSize: 13, fontWeight: '600', lineHeight: 17 },
  meta: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: TOKENS.color.mint,
    fontFamily: 'JetBrainsMono_500Medium',
  },
  divider: { height: 1 },
  ctaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6 },
  ctaLabel: { flex: 1, fontSize: 12, fontWeight: '600', color: TOKENS.color.signal },
});
