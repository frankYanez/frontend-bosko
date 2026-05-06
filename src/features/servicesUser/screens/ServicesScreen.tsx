import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { useServices } from '../state/ServicesContext';
import type { Category } from '@/types/services';

const { width: W } = Dimensions.get('window');
const CARD_GAP   = 12;
const H_PAD      = 16;
const HALF_W     = (W - H_PAD * 2 - CARD_GAP) / 2;

// ── Curated gradients per category index ─────────────────────────────────────
const GRADIENTS: [string, string, string][] = [
  ['#0f0c29', '#302b63', '#24243e'],   // 0  deep violet
  ['#134e5e', '#71b280', '#134e5e'],   // 1  teal forest
  ['#4a0f20', '#850021', '#c0002f'],   // 2  bosko red
  ['#0d0d0d', '#2c3e50', '#4ca1af'],   // 3  midnight steel
  ['#1a1a2e', '#16213e', '#0f3460'],   // 4  deep navy
  ['#2d1b69', '#553c9a', '#6d28d9'],   // 5  purple
  ['#065f46', '#047857', '#059669'],   // 6  emerald
  ['#7c2d12', '#c2410c', '#ea580c'],   // 7  burnt orange
  ['#831843', '#9d174d', '#be185d'],   // 8  pink
  ['#78350f', '#b45309', '#d97706'],   // 9  amber
];

function getGradient(index: number, accent?: string): [string, string, string] {
  return GRADIENTS[index % GRADIENTS.length];
}

// ── Shimmer skeleton ──────────────────────────────────────────────────────────
function Shimmer({ width, height, radius = 12, style }: {
  width: number | string; height: number; radius?: number; style?: object;
}) {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(shimmer, { toValue: 1, duration: 1100, useNativeDriver: true })
    ).start();
  }, []);

  const translateX = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [-300, 300],
  });

  return (
    <View style={[{ width, height, borderRadius: radius, backgroundColor: '#E2E6EC', overflow: 'hidden' }, style]}>
      <Animated.View
        style={{
          ...StyleSheet.absoluteFillObject,
          transform: [{ translateX }],
        }}
      >
        <LinearGradient
          colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.55)', 'rgba(255,255,255,0)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ flex: 1 }}
        />
      </Animated.View>
    </View>
  );
}

function SkeletonScreen() {
  return (
    <View style={sk.wrap}>
      {/* Featured skeleton */}
      <Shimmer width={W - H_PAD * 2} height={220} radius={24} style={{ marginBottom: 12 }} />
      {/* 2-col grid */}
      {[0, 1, 2].map(row => (
        <View key={row} style={sk.row}>
          <Shimmer width={HALF_W} height={160} radius={20} />
          <Shimmer width={HALF_W} height={160} radius={20} />
        </View>
      ))}
    </View>
  );
}
const sk = StyleSheet.create({
  wrap: { paddingHorizontal: H_PAD, gap: 12 },
  row:  { flexDirection: 'row', gap: CARD_GAP },
});

// ── Category card (featured = full-width) ────────────────────────────────────
function CategoryCard({
  category,
  index,
  featured,
  delay,
}: {
  category: Category;
  index: number;
  featured?: boolean;
  delay: number;
}) {
  const gradient = getGradient(index, category.accent);

  // Entrance: perspective flip-in (rotateY 40° → 0°) + scale
  const flipAnim  = useRef(new Animated.Value(0)).current;
  // Press depth: rotateX + scale
  const pressDepth = useRef(new Animated.Value(0)).current;
  const pressScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(flipAnim, {
      toValue: 1,
      delay,
      tension: 55,
      friction: 8,
      useNativeDriver: true,
    }).start();
  }, []);

  const pressIn = () => {
    Animated.parallel([
      Animated.spring(pressDepth, { toValue: 1, useNativeDriver: true, tension: 200, friction: 10 }),
      Animated.spring(pressScale, { toValue: 0.96, useNativeDriver: true, tension: 200, friction: 10 }),
    ]).start();
  };

  const pressOut = () => {
    Animated.parallel([
      Animated.spring(pressDepth, { toValue: 0, useNativeDriver: true, tension: 200, friction: 10 }),
      Animated.spring(pressScale, { toValue: 1, useNativeDriver: true, tension: 200, friction: 10 }),
    ]).start();
  };

  const cardW   = featured ? W - H_PAD * 2 : HALF_W;
  const cardH   = featured ? 220 : 165;

  return (
    <Animated.View
      style={{
        width: cardW,
        height: cardH,
        opacity: flipAnim,
        transform: [
          { perspective: 1000 },
          {
            rotateY: flipAnim.interpolate({
              inputRange: [0, 1],
              outputRange: ['40deg', '0deg'],
            }),
          },
          {
            scale: flipAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0.88, 1],
            }),
          },
        ],
      }}
    >
      <Pressable
        onPressIn={pressIn}
        onPressOut={pressOut}
        onPress={() =>
          router.push({
            pathname: '/(tabs)/services/category/[id]',
            params: { id: category.id },
          })
        }
        style={{ flex: 1 }}
      >
        <Animated.View
          style={[
            s.card,
            {
              flex: 1,
              transform: [
                { perspective: 800 },
                {
                  rotateX: pressDepth.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '6deg'],
                  }),
                },
                { scale: pressScale },
              ],
            },
          ]}
        >
          <LinearGradient
            colors={gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[StyleSheet.absoluteFill, { borderRadius: featured ? 24 : 20 }]}
          />

          {/* Decorative blobs */}
          <View style={[s.blob, { width: cardW * 0.8, height: cardW * 0.8, top: -cardW * 0.3, right: -cardW * 0.2, opacity: 0.12 }]} />
          <View style={[s.blob, { width: cardW * 0.4, height: cardW * 0.4, bottom: -20, right: cardW * 0.3, opacity: 0.08 }]} />

          {/* Service count badge */}
          {(category.servicesCount ?? 0) > 0 && (
            <View style={s.countBadge}>
              <Text style={s.countText}>{category.servicesCount} servicios</Text>
            </View>
          )}

          {/* Icon */}
          <View style={[s.iconBg, featured && { width: 68, height: 68, borderRadius: 20 }]}>
            <Text style={[s.icon, featured && { fontSize: 34 }]}>{category.icon ?? '🔧'}</Text>
          </View>

          {/* Text */}
          <View style={s.cardText}>
            <Text style={[s.cardName, featured && { fontSize: 22 }]} numberOfLines={1}>
              {category.name}
            </Text>
            {category.description ? (
              <Text style={[s.cardDesc, featured && { fontSize: 13 }]} numberOfLines={featured ? 2 : 1}>
                {category.description}
              </Text>
            ) : null}
          </View>

          {/* Arrow */}
          <View style={s.arrowWrap}>
            <Ionicons name="arrow-forward" size={16} color="rgba(255,255,255,0.8)" />
          </View>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

// ── Header ────────────────────────────────────────────────────────────────────
function Header({ titleAnim }: { titleAnim: Animated.Value }) {
  return (
    <Animated.View style={[s.header, { opacity: titleAnim, transform: [{ translateY: titleAnim.interpolate({ inputRange: [0, 1], outputRange: [-12, 0] }) }] }]}>
      <View>
        <Text style={s.headerTitle}>Explorar</Text>
        <Text style={s.headerSub}>Descubrí profesionales cerca tuyo</Text>
      </View>
      <Pressable style={s.searchIcon} onPress={() => router.push('/search')}>
        <Ionicons name="search" size={20} color="#1A1A1A" />
      </Pressable>
    </Animated.View>
  );
}

// ── Search bar ────────────────────────────────────────────────────────────────
function SearchBar({ anim }: { anim: Animated.Value }) {
  return (
    <Animated.View style={[s.searchWrap, { opacity: anim, transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }] }]}>
      <Pressable style={s.searchBar} onPress={() => router.push('/search')}>
        <Ionicons name="search-outline" size={16} color="#9CA3AF" />
        <Text style={s.searchPlaceholder}>Buscar servicios o profesionales…</Text>
        <View style={s.searchFilter}>
          <Ionicons name="options-outline" size={15} color="#850021" />
        </View>
      </Pressable>
    </Animated.View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function ServicesScreen() {
  const insets = useSafeAreaInsets();
  const { categories, categoriesStatus, fetchCategories } = useServices();

  const loading = categoriesStatus.loading && categories.length === 0;

  useEffect(() => {
    fetchCategories().catch(() => {});
  }, []);

  // Header animations
  const headerAnim = useRef(new Animated.Value(0)).current;
  const searchAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(80, [
      Animated.timing(headerAnim, { toValue: 1, duration: 360, useNativeDriver: true }),
      Animated.timing(searchAnim, { toValue: 1, duration: 360, useNativeDriver: true }),
    ]).start();
  }, []);

  const [featured, ...rest] = categories;

  // 2-column rows from remaining categories
  const rows: Category[][] = [];
  for (let i = 0; i < rest.length; i += 2) {
    rows.push(rest.slice(i, i + 2));
  }

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#F7F7FA" />

      <Header titleAnim={headerAnim} />
      <SearchBar anim={searchAnim} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 100 }]}
      >
        {loading ? (
          <SkeletonScreen />
        ) : categories.length === 0 ? (
          <View style={s.empty}>
            <Text style={s.emptyIcon}>🔍</Text>
            <Text style={s.emptyTitle}>Próximamente</Text>
            <Text style={s.emptySub}>Las categorías estarán disponibles en breve.</Text>
          </View>
        ) : (
          <View style={s.grid}>
            {/* Featured card (first category, full width) */}
            {featured && (
              <CategoryCard
                category={featured}
                index={0}
                featured
                delay={0}
              />
            )}

            {/* 2-column grid for the rest */}
            {rows.map((row, rowIdx) => (
              <View key={rowIdx} style={s.row}>
                {row.map((cat, colIdx) => {
                  const globalIdx = 1 + rowIdx * 2 + colIdx;
                  return (
                    <CategoryCard
                      key={cat.id}
                      category={cat}
                      index={globalIdx}
                      delay={globalIdx * 55}
                    />
                  );
                })}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F7F7FA',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: H_PAD,
    paddingTop: 10,
    paddingBottom: 4,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1A1A1A',
    letterSpacing: -0.5,
  },
  headerSub: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  searchIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },

  // Search bar
  searchWrap: {
    paddingHorizontal: H_PAD,
    paddingBottom: 14,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 14,
    color: '#9CA3AF',
  },
  searchFilter: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#FFF0F3',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Grid
  scroll: { paddingTop: 2 },
  grid: {
    paddingHorizontal: H_PAD,
    gap: CARD_GAP,
  },
  row: {
    flexDirection: 'row',
    gap: CARD_GAP,
  },

  // Card base
  card: {
    borderRadius: 20,
    padding: 18,
    overflow: 'hidden',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 16,
    elevation: 10,
  },
  blob: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
  },
  countBadge: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  countText: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
  },
  iconBg: {
    width: 54,
    height: 54,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.20)',
  },
  icon: {
    fontSize: 26,
  },
  cardText: {
    gap: 4,
  },
  cardName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  cardDesc: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.65)',
    lineHeight: 17,
  },
  arrowWrap: {
    position: 'absolute',
    bottom: 18,
    right: 18,
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Empty
  empty: {
    paddingTop: 80,
    alignItems: 'center',
    gap: 10,
  },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#1A1A1A' },
  emptySub: { fontSize: 14, color: '#6B7280', textAlign: 'center', paddingHorizontal: 40 },
});
