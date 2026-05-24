import React, { useRef, useEffect, useCallback } from 'react';
import {
  Animated,
  FlatList,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useFavorites } from '../state/FavoritesContext';
import { EmptyState } from '@/core/components/EmptyState';
import type { ServiceSummary } from '@/types/services';

const C = {
  primary: '#850021',
  dark:    '#4A0F20',
  bg:      '#F7F7FA',
  card:    '#FFFFFF',
  text:    '#1A1A1A',
  sub:     '#6B7280',
  border:  '#EDEDF0',
  amber:   '#F59E0B',
  red:     '#EF4444',
};

function formatRate(rate?: ServiceSummary['rate']) {
  if (!rate?.amount) return null;
  return new Intl.NumberFormat('es-AR', {
    style: 'currency', currency: rate.currency ?? 'ARS', maximumFractionDigits: 0,
  }).format(rate.amount);
}

function FavoriteCard({ item, onRemove }: { item: ServiceSummary; onRemove: () => void }) {
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(14)).current;
  const heartScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 320, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, friction: 7, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleRemove = () => {
    Animated.sequence([
      Animated.spring(heartScale, { toValue: 1.3, useNativeDriver: true }),
      Animated.spring(heartScale, { toValue: 0,   useNativeDriver: true }),
    ]).start(() => onRemove());
  };

  const goToService = () => {
    router.push({
      pathname: '/(tabs)/services/category/[id]',
      params: { id: item.categoryId },
    });
  };

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <Pressable
        onPress={goToService}
        style={({ pressed }) => [s.card, pressed && s.cardPressed]}
      >
        {/* Thumbnail */}
        {item.thumbnail ? (
          <Image source={{ uri: item.thumbnail }} style={s.thumb} contentFit="cover" />
        ) : (
          <LinearGradient colors={[C.dark, C.primary]} style={s.thumbFallback}>
            <Ionicons name="construct" size={22} color="#fff" />
          </LinearGradient>
        )}

        {/* Info */}
        <View style={s.info}>
          <Text style={s.serviceTitle} numberOfLines={1}>{item.title}</Text>
          <Text style={s.providerName} numberOfLines={1}>{item.name}</Text>

          <View style={s.metaRow}>
            {item.averageRating > 0 && (
              <View style={s.ratingChip}>
                <Ionicons name="star" size={11} color={C.amber} />
                <Text style={s.ratingText}>{item.averageRating ? Number(item.averageRating).toFixed(1) : '—'}</Text>
              </View>
            )}
            {item.location ? (
              <Text style={s.location} numberOfLines={1}>{item.location}</Text>
            ) : null}
          </View>

          {formatRate(item.rate) && (
            <Text style={s.price}>Desde {formatRate(item.rate)}</Text>
          )}
        </View>

        {/* Actions */}
        <View style={s.actions}>
          <Animated.View style={{ transform: [{ scale: heartScale }] }}>
            <Pressable onPress={handleRemove} hitSlop={8} style={s.heartBtn}>
              <Ionicons name="heart" size={20} color={C.red} />
            </Pressable>
          </Animated.View>
          <Ionicons name="chevron-forward" size={16} color={C.border} />
        </View>
      </Pressable>
    </Animated.View>
  );
}

export function FavoritesScreen() {
  const insets = useSafeAreaInsets();
  const { favorites, toggle, count } = useFavorites();

  const handleRemove = useCallback(async (item: ServiceSummary) => {
    await toggle(item);
  }, [toggle]);

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

      {/* Header */}
      <View style={s.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color={C.text} />
        </Pressable>
        <View style={s.headerCenter}>
          <Text style={s.headerTitle}>Favoritos</Text>
          {count > 0 && (
            <View style={s.countBadge}>
              <Text style={s.countText}>{count}</Text>
            </View>
          )}
        </View>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={favorites}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <FavoriteCard item={item} onRemove={() => handleRemove(item)} />
        )}
        contentContainerStyle={[
          s.list,
          { paddingBottom: insets.bottom + 100 },
          favorites.length === 0 && s.listEmpty,
        ]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            icon="heart-outline"
            title="Sin favoritos todavía"
            subtitle="Guardá los servicios que te gusten tocando el corazón para encontrarlos rápido."
            cta={{ label: 'Explorar servicios', onPress: () => router.push('/(tabs)/services') }}
            iconColor={C.red}
            iconBg="#FEF2F2"
          />
        }
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: C.bg,
  },
  backBtn:      { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle:  { fontSize: 17, fontWeight: '700', color: C.text },
  countBadge: {
    backgroundColor: C.red,
    borderRadius: 99, minWidth: 20, height: 20,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 5,
  },
  countText: { fontSize: 11, fontWeight: '800', color: '#fff' },

  list:      { paddingHorizontal: 16, paddingTop: 8, gap: 10 },
  listEmpty: { flex: 1 },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 12,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardPressed: { opacity: 0.85 },

  thumb: { width: 60, height: 60, borderRadius: 12 },
  thumbFallback: {
    width: 60, height: 60, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },

  info:          { flex: 1, gap: 3 },
  serviceTitle:  { fontSize: 14, fontWeight: '700', color: C.text },
  providerName:  { fontSize: 12, color: C.sub },
  metaRow:       { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ratingChip:    { flexDirection: 'row', alignItems: 'center', gap: 3 },
  ratingText:    { fontSize: 12, fontWeight: '600', color: C.text },
  location:      { fontSize: 12, color: C.sub, flex: 1 },
  price:         { fontSize: 13, fontWeight: '700', color: C.primary, marginTop: 2 },

  actions: { alignItems: 'center', gap: 8 },
  heartBtn: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: '#FEF2F2',
    alignItems: 'center', justifyContent: 'center',
  },
});
