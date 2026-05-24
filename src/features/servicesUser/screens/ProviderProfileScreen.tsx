import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';

import api from '@/core/api/axiosinstance';
import { ServiceDetailModal } from '../components/ServiceDetailModal';
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
  green:   '#22C55E',
};

interface PublicProvider {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  isVerified: boolean;
  kycApproved: boolean;
  rating: number | null;
  reviewsCount: number;
  location?: string;
  bio?: string;
}

function formatRate(rate?: ServiceSummary['rate']) {
  if (!rate || !rate.amount) return 'Consultar';
  const sym = rate.currency === 'ARS' ? '$' : rate.currency === 'USD' ? 'US$' : rate.currency;
  const price = `${sym}${Number(rate.amount).toLocaleString('es-AR')}`;
  return rate.unit ? `${price} / ${rate.unit}` : price;
}

function ServiceRow({ item, onPress }: { item: ServiceSummary; onPress: () => void }) {
  const scaleA = useRef(new Animated.Value(1)).current;
  return (
    <Pressable
      onPressIn={() => Animated.spring(scaleA, { toValue: 0.97, useNativeDriver: true }).start()}
      onPressOut={() => Animated.spring(scaleA, { toValue: 1, useNativeDriver: true }).start()}
      onPress={onPress}
    >
      <Animated.View style={[s.serviceRow, { transform: [{ scale: scaleA }] }]}>
        {item.thumbnail ? (
          <Image source={{ uri: item.thumbnail }} style={s.serviceThumb} contentFit="cover" />
        ) : (
          <LinearGradient colors={['#f0f0f4', '#e4e4ea']} style={s.serviceThumb}>
            <Ionicons name="construct-outline" size={20} color={C.sub} />
          </LinearGradient>
        )}
        <View style={{ flex: 1 }}>
          <Text style={s.serviceTitle} numberOfLines={1}>{item.title}</Text>
          <Text style={s.serviceSummary} numberOfLines={2}>{item.summary}</Text>
          <Text style={s.servicePrice}>Cotizar por chat</Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={C.border} />
      </Animated.View>
    </Pressable>
  );
}

export default function ProviderProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [provider, setProvider] = useState<PublicProvider | null>(null);
  const [services, setServices] = useState<ServiceSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState<ServiceSummary | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!id) return;
    let mounted = true;

    const load = async () => {
      setLoading(true);
      try {
        const [profileRes, servicesRes] = await Promise.all([
          api.get<PublicProvider>(`/users/${id}/public`),
          api.get<any>(`/services`, { params: { providerId: id, limit: 20 } }),
        ]);

        if (!mounted) return;

        const providerData = profileRes.data as any;
        setProvider({
          id: providerData.id,
          firstName: providerData.firstName ?? '',
          lastName: providerData.lastName ?? '',
          avatarUrl: providerData.avatarUrl ?? null,
          isVerified: providerData.isVerified ?? false,
          kycApproved: providerData.kycApproved ?? providerData.isVerified ?? false,
          rating: providerData.rating != null ? Number(providerData.rating) : null,
          reviewsCount: providerData.reviewsCount ?? 0,
          location: providerData.location ?? '',
          bio: providerData.bio ?? '',
        });

        const rawServices: any[] = servicesRes.data?.data ?? servicesRes.data ?? [];
        setServices(rawServices.map(s => ({
          id: s.id,
          categoryId: s.category?.id ?? '',
          providerId: id,
          name: [providerData.firstName, providerData.lastName].filter(Boolean).join(' '),
          title: s.title ?? '',
          summary: s.description ?? '',
          thumbnail: s.images?.[0] ?? undefined,
          images: s.images ?? [],
          location: providerData.location ?? '',
          rate: {
            amount: parseFloat(s.price?.amount ?? 0) || 0,
            currency: s.price?.currency ?? 'ARS',
            unit: s.price?.unit ?? undefined,
          },
          averageRating: Number(providerData.rating ?? 0),
          reviewsCount: providerData.reviewsCount ?? 0,
        })));

        Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }).start();
      } catch (err) {
        console.error('Error loading provider profile:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => { mounted = false; };
  }, [id]);

  const fullName = provider ? [provider.firstName, provider.lastName].filter(Boolean).join(' ') : '';
  const initials = provider ? (provider.firstName[0] ?? '') + (provider.lastName?.[0] ?? '') : '';

  if (loading) {
    return (
      <View style={[s.root, s.center, { paddingTop: insets.top }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color={C.primary} />
      </View>
    );
  }

  if (!provider) {
    return (
      <View style={[s.root, s.center, { paddingTop: insets.top }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <Pressable onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color={C.text} />
        </Pressable>
        <Text style={s.errorTitle}>Perfil no encontrado</Text>
        <Text style={s.errorSub}>Volvé y elegí otro profesional.</Text>
      </View>
    );
  }

  const handleRequest = () => {
    if (services.length === 0) return;
    router.push({
      pathname: '/(tabs)/orders/quote',
      params: {
        serviceId: services[0].id,
        providerName: fullName,
        serviceTitle: services[0].title,
      },
    });
  };

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

      {/* Back button flotante */}
      <Pressable onPress={() => router.back()} style={[s.backBtn, s.backBtnFloat]}>
        <Ionicons name="arrow-back" size={22} color={C.text} />
      </Pressable>

      <Animated.ScrollView
        style={{ opacity: fadeAnim }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 110 }]}
      >
        {/* ── Hero ── */}
        <LinearGradient
          colors={[C.primary, '#c0002f', C.dark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={s.hero}
        >
          <View style={s.heroBubble1} />
          <View style={s.heroBubble2} />

          <View style={s.heroBody}>
            {provider.avatarUrl ? (
              <Image source={{ uri: provider.avatarUrl }} style={s.avatar} contentFit="cover" />
            ) : (
              <LinearGradient colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.15)']} style={s.avatarFallback}>
                <Text style={s.avatarInitials}>{initials.toUpperCase()}</Text>
              </LinearGradient>
            )}

            <View style={s.heroInfo}>
              <View style={s.nameRow}>
                <Text style={s.heroName}>{fullName}</Text>
                {provider.isVerified && (
                  <MaterialIcons name="verified" size={18} color="#60A5FA" />
                )}
              </View>

              {provider.location ? (
                <View style={s.locationRow}>
                  <Ionicons name="location-outline" size={13} color="rgba(255,255,255,0.75)" />
                  <Text style={s.locationText}>{provider.location}</Text>
                </View>
              ) : null}

              <View style={s.statsRow}>
                <Ionicons name="star" size={13} color={C.amber} />
                <Text style={s.statText}>
                  {provider.rating ? Number(provider.rating).toFixed(1) : 'Sin reseñas'}
                </Text>
                {provider.reviewsCount > 0 && (
                  <Text style={s.statSub}>({provider.reviewsCount} reseñas)</Text>
                )}
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* ── Verificación ── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Verificación</Text>
          <View style={s.badgeRow}>
            <View style={[s.badge, provider.kycApproved ? s.badgeOk : s.badgePending]}>
              <Ionicons
                name={provider.kycApproved ? 'shield-checkmark' : 'shield-outline'}
                size={15}
                color={provider.kycApproved ? '#16A34A' : C.sub}
              />
              <Text style={[s.badgeText, provider.kycApproved ? s.badgeTextOk : s.badgeTextPending]}>
                {provider.kycApproved ? 'Identidad verificada' : 'Sin verificar'}
              </Text>
            </View>

            {provider.isVerified && (
              <View style={[s.badge, s.badgeOk]}>
                <Ionicons name="checkmark-circle" size={15} color="#16A34A" />
                <Text style={[s.badgeText, s.badgeTextOk]}>Profesional aprobado</Text>
              </View>
            )}

            <View style={[s.badge, s.badgeInfo]}>
              <Ionicons name="star" size={15} color={C.amber} />
              <Text style={[s.badgeText, s.badgeTextInfo]}>
                {provider.reviewsCount > 0
                  ? `${Number(provider.rating ?? 0).toFixed(1)} · ${provider.reviewsCount} reseñas`
                  : 'Sin reseñas aún'}
              </Text>
            </View>
          </View>
        </View>

        {/* ── Bio ── */}
        {provider.bio ? (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Sobre el profesional</Text>
            <Text style={s.bioText}>{provider.bio}</Text>
          </View>
        ) : null}

        {/* ── Servicios ── */}
        {services.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>
              Servicios
              <Text style={s.sectionCount}> ({services.length})</Text>
            </Text>
            {services.map(item => (
              <ServiceRow
                key={item.id}
                item={item}
                onPress={() => {
                  setSelectedService(item);
                  setModalVisible(true);
                }}
              />
            ))}
          </View>
        )}

        {services.length === 0 && (
          <View style={[s.section, s.emptyServices]}>
            <Ionicons name="construct-outline" size={36} color={C.border} />
            <Text style={s.emptySub}>Este profesional aún no publicó servicios.</Text>
          </View>
        )}
      </Animated.ScrollView>

      {/* ── Footer CTA ── */}
      {services.length > 0 && (
        <View style={[s.footer, { paddingBottom: insets.bottom + 12 }]}>
          <Pressable style={s.ctaBtn} onPress={handleRequest}>
            <Ionicons name="chatbubble-ellipses-outline" size={18} color="#fff" />
            <Text style={s.ctaBtnText}>Solicitar servicio</Text>
          </Pressable>
        </View>
      )}

      <ServiceDetailModal
        visible={modalVisible}
        service={selectedService}
        onClose={() => setModalVisible(false)}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  center: { alignItems: 'center', justifyContent: 'center' },
  scroll: { gap: 12, paddingTop: 0 },

  backBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: C.card, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
  },
  backBtnFloat: {
    position: 'absolute', top: 56, left: 16, zIndex: 10,
  },

  // Hero
  hero: {
    paddingTop: 64, paddingBottom: 24, paddingHorizontal: 20,
    gap: 20, overflow: 'hidden',
  },
  heroBubble1: {
    position: 'absolute', width: 220, height: 220,
    borderRadius: 110, backgroundColor: 'rgba(255,255,255,0.07)',
    top: -60, right: -60,
  },
  heroBubble2: {
    position: 'absolute', width: 140, height: 140,
    borderRadius: 70, backgroundColor: 'rgba(255,255,255,0.05)',
    bottom: -40, left: 20,
  },
  heroBody: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  avatar: {
    width: 80, height: 80, borderRadius: 24,
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.4)',
  },
  avatarFallback: {
    width: 80, height: 80, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)',
  },
  avatarInitials: { fontSize: 28, fontWeight: '700', color: '#FFFFFF' },
  heroInfo: { flex: 1, gap: 6 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  heroName: { fontSize: 20, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.3 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locationText: { fontSize: 12, color: 'rgba(255,255,255,0.75)' },
  statsRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { fontSize: 13, fontWeight: '700', color: '#FFE082' },
  statSub: { fontSize: 12, color: 'rgba(255,255,255,0.65)' },
  // Footer CTA
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: 16, paddingTop: 12,
    backgroundColor: C.card,
    borderTopWidth: 1, borderTopColor: C.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 8,
  },
  ctaBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: C.primary, borderRadius: 16,
    paddingVertical: 15,
  },
  ctaBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },

  // Sections
  section: {
    backgroundColor: C.card, marginHorizontal: 16, borderRadius: 20,
    padding: 18, gap: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06, shadowRadius: 10, elevation: 3,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: C.text },
  sectionCount: { fontWeight: '400', color: C.sub },
  bioText: { fontSize: 14, color: C.sub, lineHeight: 21 },

  // Verification badges
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20,
  },
  badgeOk: { backgroundColor: '#DCFCE7' },
  badgePending: { backgroundColor: '#F3F4F6' },
  badgeInfo: { backgroundColor: '#FEF9C3' },
  badgeText: { fontSize: 12, fontWeight: '600' },
  badgeTextOk: { color: '#16A34A' },
  badgeTextPending: { color: C.sub },
  badgeTextInfo: { color: '#A16207' },

  // Service row
  serviceRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  serviceThumb: {
    width: 56, height: 56, borderRadius: 14,
    backgroundColor: '#F0F0F4', alignItems: 'center', justifyContent: 'center',
  },
  serviceTitle: { fontSize: 14, fontWeight: '600', color: C.text },
  serviceSummary: { fontSize: 12, color: C.sub, lineHeight: 17, marginTop: 2 },
  servicePrice: { fontSize: 13, fontWeight: '600', color: C.sub, marginTop: 4 },

  // Empty
  emptyServices: { alignItems: 'center', paddingVertical: 24 },
  emptySub: { fontSize: 14, color: C.sub, textAlign: 'center' },
  errorTitle: { fontSize: 18, fontWeight: '700', color: C.text, marginTop: 16 },
  errorSub: { fontSize: 14, color: C.sub, marginTop: 6 },
});
