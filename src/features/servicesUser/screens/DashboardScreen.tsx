import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { useAuth } from '@/features/auth/state/AuthContext';
import { useProfile } from '@/features/profile/state/ProfileContext';
import { useServices } from '@/features/servicesUser/state/ServicesContext';
import { useNotifications } from '@/features/notifications/state/NotificationsContext';
import { fetchFeaturedServices } from '@/features/servicesUser/services/services';
import type { ServiceSummary } from '@/types/services';
import { TOKENS } from '@/core/design-system/tokens';
import { useThemeColors, useIsDark } from '@/stores/theme.store';
import { useFavorites } from '@/features/favorites/state/FavoritesContext';

const { width: W } = Dimensions.get('window');

// ── Paleta dinámica (se instancia por render con useMemo) ─────────────────────
type CPalette = ReturnType<typeof makeC>;
function makeC(tc: ReturnType<typeof useThemeColors>) {
  return {
    primary:   TOKENS.color.primary,
    primaryMd: '#a8002a',
    dark:      TOKENS.color.primaryDark,
    bg:        tc.bg,
    card:      tc.card,
    text:      tc.text,
    sub:       tc.textSub,
    border:    tc.border,
    accent:    tc.accent,
  };
}

// ── Datos estáticos ──────────────────────────────────────────────────────────
const HERO_SLIDES_CLIENT = [
  {
    id: '1',
    title: 'Encontrá el\nprofesional ideal',
    subtitle: 'Miles de expertos cerca tuyo',
    cta: 'Explorar',
    icon: 'search' as const,
    gradient: [TOKENS.color.primary, '#c0002f', TOKENS.color.primary] as const,
    route: '/(tabs)/services' as const,
  },
  {
    id: '3',
    title: 'Gestión de\npedidos',
    subtitle: 'Seguí tus órdenes en tiempo real',
    cta: 'Ver pedidos',
    icon: 'clipboard' as const,
    gradient: ['#2D1B69', '#11998E', '#38EF7D'] as const,
    route: '/(tabs)/orders' as const,
  },
];

const HERO_SLIDES_PROVIDER = [
  {
    id: '1',
    title: 'Encontrá el\nprofesional ideal',
    subtitle: 'Miles de expertos cerca tuyo',
    cta: 'Explorar',
    icon: 'search' as const,
    gradient: [TOKENS.color.primary, '#c0002f', TOKENS.color.primary] as const,
    route: '/(tabs)/services' as const,
  },
  {
    id: '2',
    title: 'Publicá\ntu servicio',
    subtitle: 'Llega a nuevos clientes hoy',
    cta: 'Publicar',
    icon: 'add-circle' as const,
    gradient: ['#1A1A2E', '#16213E', '#0F3460'] as const,
    route: '/service-form' as const,
  },
  {
    id: '3',
    title: 'Gestión de\npedidos',
    subtitle: 'Seguí tus órdenes en tiempo real',
    cta: 'Ver pedidos',
    icon: 'clipboard' as const,
    gradient: ['#2D1B69', '#11998E', '#38EF7D'] as const,
    route: '/(tabs)/orders' as const,
  },
];

const QUICK_ACTIONS_CLIENT = [
  { id: 'search', label: 'Buscar',   icon: 'search' as const,      color: '#E8F4FD', iconColor: '#2196F3' },
  { id: 'orders', label: 'Pedidos',  icon: 'list' as const,        color: '#F0FFF4', iconColor: '#22C55E' },
  { id: 'chat',   label: 'Mensajes', icon: 'chatbubbles' as const, color: '#FFF8E1', iconColor: '#F59E0B' },
];

const QUICK_ACTIONS_PROVIDER = [
  { id: 'search', label: 'Buscar',   icon: 'search' as const,      color: '#E8F4FD', iconColor: '#2196F3' },
  { id: 'post',   label: 'Publicar', icon: 'add-circle' as const,  color: '#FFF0F3', iconColor: '#850021' },
  { id: 'orders', label: 'Pedidos',  icon: 'list' as const,        color: '#F0FFF4', iconColor: '#22C55E' },
  { id: 'chat',   label: 'Mensajes', icon: 'chatbubbles' as const, color: '#FFF8E1', iconColor: '#F59E0B' },
];

// ── Helpers ──────────────────────────────────────────────────────────────────
function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Buenos días';
  if (h < 18) return 'Buenas tardes';
  return 'Buenas noches';
}

function formatPrice(price: number, currency = 'ARS') {
  const sym = currency === 'USD' ? 'US$' : '$';
  return `${sym}${price.toLocaleString('es-AR')}`;
}

// ── Componentes pequeños ─────────────────────────────────────────────────────

function SectionHeader({ title, onPress }: { title: string; onPress?: () => void }) {
  const tc = useThemeColors();
  return (
    <View style={ds.sectionRow}>
      <Text style={[ds.sectionTitle, { color: tc.text }]}>{title}</Text>
      {onPress && (
        <Pressable onPress={onPress} hitSlop={8}>
          <Text style={[ds.sectionLink, { color: TOKENS.color.primary }]}>Ver todo</Text>
        </Pressable>
      )}
    </View>
  );
}

function CategoryPill({
  name,
  icon,
  accent,
  onPress,
  delay,
}: {
  name: string;
  icon: string;
  accent: string;
  onPress: () => void;
  delay: number;
}) {
  const anim   = useRef(new Animated.Value(0)).current;
  const scaleA = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 350,
      delay,
      useNativeDriver: true,
    }).start();
  }, []);

  const pressIn  = () => Animated.spring(scaleA, { toValue: 0.93, useNativeDriver: true }).start();
  const pressOut = () => Animated.spring(scaleA, { toValue: 1,    useNativeDriver: true }).start();

  return (
    <Animated.View
      style={{
        opacity: anim,
        transform: [
          { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) },
          { scale: scaleA },
        ],
      }}
    >
      <Pressable
        onPressIn={pressIn}
        onPressOut={pressOut}
        onPress={onPress}
        style={[ds.pill, { backgroundColor: accent + '18', borderColor: accent + '40' }]}
      >
        <Text style={ds.pillIcon}>{icon}</Text>
        <PillText name={name} />
      </Pressable>
    </Animated.View>
  );
}

function PillText({ name }: { name: string }) {
  const tc = useThemeColors();
  return <Text style={[ds.pillText, { color: tc.text }]}>{name}</Text>;
}

function ServiceCard({ item, delay }: { item: ServiceSummary; delay: number }) {
  const anim   = useRef(new Animated.Value(0)).current;
  const scaleA = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(anim, { toValue: 1, duration: 380, delay, useNativeDriver: true }).start();
  }, []);

  return (
    <Animated.View
      style={{
        opacity: anim,
        transform: [{ scale: scaleA }],
        width: (W - 48) / 2,
      }}
    >
      <ServiceCardInner item={item} scaleA={scaleA} />
    </Animated.View>
  );
}

function ServiceCardInner({ item, scaleA }: { item: ServiceSummary; scaleA: Animated.Value }) {
  const tc = useThemeColors();
  const { isFavorite, toggle } = useFavorites();
  const fav = isFavorite(item.id);
  const heartScale = useRef(new Animated.Value(1)).current;

  const handleFavorite = () => {
    Animated.sequence([
      Animated.spring(heartScale, { toValue: 1.4, useNativeDriver: true }),
      Animated.spring(heartScale, { toValue: 1,   useNativeDriver: true }),
    ]).start();
    toggle(item);
  };

  const pressIn  = () => Animated.spring(scaleA, { toValue: 0.96, useNativeDriver: true }).start();
  const pressOut = () => Animated.spring(scaleA, { toValue: 1,    useNativeDriver: true }).start();
  return (
    <View style={ds.serviceCardShadow}>
    <Pressable
      onPressIn={pressIn}
      onPressOut={pressOut}
      onPress={() => router.push({ pathname: '/(tabs)/services/provider/[id]', params: { id: item.providerId ?? item.id } })}
      style={[ds.serviceCard, { backgroundColor: tc.card }]}
    >
      <View>
        {(item.thumbnail || item.images?.[0]) ? (
          <Image source={{ uri: item.thumbnail ?? item.images![0] }} style={ds.serviceThumb} contentFit="cover" />
        ) : (
          <LinearGradient colors={[tc.surface2, tc.surface]} style={ds.serviceThumb}>
            <Ionicons name="image-outline" size={28} color={tc.textSub} />
          </LinearGradient>
        )}
        <Pressable onPress={handleFavorite} hitSlop={8} style={ds.heartBtn}>
          <Animated.View style={{ transform: [{ scale: heartScale }] }}>
            <Ionicons
              name={fav ? 'heart' : 'heart-outline'}
              size={18}
              color={fav ? '#EF4444' : 'rgba(255,255,255,0.9)'}
            />
          </Animated.View>
        </Pressable>
      </View>
      <View style={ds.serviceInfo}>
        <Text style={[ds.serviceTitle, { color: tc.text }]} numberOfLines={2}>{item.title ?? item.name}</Text>
        <View style={ds.serviceRow}>
          <Ionicons name="star" size={11} color="#F59E0B" />
          <Text style={ds.serviceStar}>{item.averageRating ? Number(item.averageRating).toFixed(1) : '—'}</Text>
          <Text style={[ds.serviceReviews, { color: tc.textSub }]}> ({item.reviewsCount ?? 0})</Text>
        </View>
        <Text style={[ds.servicePrice, { color: TOKENS.color.primary }]}>Cotizar por chat</Text>
      </View>
    </Pressable>
    </View>
  );
}

function QuickActionBtn({
  icon, label, color, iconColor, onPress, delay,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  color: string;
  iconColor: string;
  onPress: () => void;
  delay: number;
}) {
  const anim   = useRef(new Animated.Value(0)).current;
  const scaleA = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(anim, { toValue: 1, delay, useNativeDriver: true, friction: 7 }).start();
  }, []);

  return (
    <Animated.View
      style={{
        opacity: anim,
        transform: [
          { scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] }) },
        ],
        flex: 1,
      }}
    >
      <Pressable
        onPressIn={() => Animated.spring(scaleA, { toValue: 0.9, useNativeDriver: true }).start()}
        onPressOut={() => Animated.spring(scaleA, { toValue: 1,   useNativeDriver: true }).start()}
        onPress={onPress}
        style={ds.qaBtn}
      >
        <Animated.View style={[ds.qaIcon, { backgroundColor: color, transform: [{ scale: scaleA }] }]}>
          <Ionicons name={icon} size={22} color={iconColor} />
        </Animated.View>
        <QALabel label={label} />
      </Pressable>
    </Animated.View>
  );
}

function QALabel({ label }: { label: string }) {
  const tc = useThemeColors();
  return <Text style={[ds.qaLabel, { color: tc.text }]}>{label}</Text>;
}

// ── Componente principal ─────────────────────────────────────────────────────
export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const tc = useThemeColors();
  const isDark = useIsDark();
  const C = useMemo(() => makeC(tc), [tc]);
  const s = useMemo(() => makeStyles(C), [C]);

  const { authState } = useAuth();
  const { profile }   = useProfile();
  const {
    categories,
    categoriesStatus,
    fetchCategories,
    getServicesForCategory,
  } = useServices();

  const { unreadCount } = useNotifications();
  const isProvider = profile?.isProvider === true;
  const HERO_SLIDES   = isProvider ? HERO_SLIDES_PROVIDER   : HERO_SLIDES_CLIENT;
  const QUICK_ACTIONS = isProvider ? QUICK_ACTIONS_PROVIDER : QUICK_ACTIONS_CLIENT;

  // ── Estado ────────────────────────────────────────────────────────────────
  const [heroIndex, setHeroIndex] = useState(0);
  const [featuredServices, setFeaturedServices] = useState<ServiceSummary[]>([]);
  const [featuredLoading, setFeaturedLoading]   = useState(true);
  const [featuredError, setFeaturedError]       = useState(false);

  // ── Animaciones de entrada ────────────────────────────────────────────────
  const sections = useRef(
    Array.from({ length: 5 }, () => new Animated.Value(0))
  ).current;

  useEffect(() => {
    Animated.stagger(
      90,
      sections.map(v =>
        Animated.timing(v, { toValue: 1, duration: 420, useNativeDriver: true })
      )
    ).start();
  }, []);

  const sectionStyle = (i: number) => ({
    opacity: sections[i],
    transform: [
      {
        translateY: sections[i].interpolate({
          inputRange: [0, 1],
          outputRange: [24, 0],
        }),
      },
    ],
  });

  // ── Auto-rotate hero ──────────────────────────────────────────────────────
  const heroRef        = useRef<FlatList>(null);
  const heroTimerRef   = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setHeroIndex(0);
    heroRef.current?.scrollToIndex({ index: 0, animated: false });
  }, [isProvider]);

  const advanceHero = useCallback(() => {
    setHeroIndex(prev => {
      const next = (prev + 1) % HERO_SLIDES.length;
      heroRef.current?.scrollToIndex({ index: next, animated: true });
      return next;
    });
  }, []);

  useEffect(() => {
    heroTimerRef.current = setInterval(advanceHero, 3600);
    return () => { if (heroTimerRef.current) clearInterval(heroTimerRef.current); };
  }, [advanceHero]);

  // ── Cargar datos ──────────────────────────────────────────────────────────
  useEffect(() => {
    fetchCategories().catch(() => {});
  }, []);

  const loadFeatured = useCallback(() => {
    setFeaturedLoading(true);
    setFeaturedError(false);
    fetchFeaturedServices()
      .then(services => {
        setFeaturedServices(services.slice(0, 6));
        setFeaturedLoading(false);
      })
      .catch(() => {
        setFeaturedError(true);
        setFeaturedLoading(false);
      });
  }, []);

  useEffect(() => { loadFeatured(); }, [loadFeatured]);

  // ── Datos derivados ───────────────────────────────────────────────────────
  const displayName = profile?.firstName ?? 'Bienvenido';

  const greeting = getGreeting();

  // ── Acciones ──────────────────────────────────────────────────────────────
  const handleQuickAction = (id: string) => {
    if (id === 'search')  router.push('/search');
    if (id === 'orders')  router.push('/(tabs)/orders');
    if (id === 'chat')    router.push('/(tabs)/chat');
    if (id === 'post')    router.push('/service-form');
  };

  const handleCategoryPress = (catId: string) => {
    router.push({ pathname: '/(tabs)/services/category/[id]', params: { id: catId, from: 'home' } });
  };

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={C.bg} />

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <Animated.View style={[s.header, sectionStyle(0)]}>
        <View style={s.headerLeft}>
          {profile?.avatarUrl ? (
            <Image source={{ uri: profile.avatarUrl }} style={s.avatar} contentFit="cover" />
          ) : (
            <LinearGradient colors={[C.primary, C.dark]} style={s.avatarGrad}>
              <Text style={s.avatarInitial}>
                {(profile?.firstName?.[0] ?? 'U').toUpperCase()}
              </Text>
            </LinearGradient>
          )}
          <View>
            <Text style={s.greeting}>{greeting} 👋</Text>
            <Text style={s.userName}>{displayName}</Text>
          </View>
        </View>

        <Pressable
          style={s.notifBtn}
          onPress={() => router.push('/(tabs)/profile/Notifications')}
          hitSlop={8}
        >
          <Ionicons name="notifications-outline" size={22} color={C.text} />
          {unreadCount > 0 && <View style={s.notifDot} />}
        </Pressable>
      </Animated.View>

      {/* ── Search bar ─────────────────────────────────────────────────── */}
      <Animated.View style={[s.searchWrap, sectionStyle(0)]}>
        <Pressable style={s.searchBar} onPress={() => router.push('/search')}>
          <Ionicons name="search-outline" size={18} color={C.sub} />
          <Text style={s.searchPlaceholder}>Buscar servicios, profesionales…</Text>
          <View style={s.searchFilter}>
            <Ionicons name="options-outline" size={16} color={C.primary} />
          </View>
        </Pressable>
      </Animated.View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 90 }]}
      >

        {/* ── Hero Carousel ──────────────────────────────────────────────── */}
        <Animated.View style={sectionStyle(1)}>
          <FlatList
            ref={heroRef}
            data={HERO_SLIDES}
            keyExtractor={i => i.id}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            scrollEnabled
            onMomentumScrollEnd={e => {
              if (heroTimerRef.current) clearInterval(heroTimerRef.current);
              const idx = Math.round(e.nativeEvent.contentOffset.x / W);
              setHeroIndex(idx);
              heroTimerRef.current = setInterval(advanceHero, 3600);
            }}
            renderItem={({ item }) => <HeroSlide slide={item} s={s} C={C} />}
          />

          {/* Dots */}
          <View style={s.dotsRow}>
            {HERO_SLIDES.map((_, i) => (
              <View
                key={i}
                style={[
                  s.dot,
                  i === heroIndex ? s.dotActive : s.dotInactive,
                ]}
              />
            ))}
          </View>
        </Animated.View>

        {/* ── Quick Actions ──────────────────────────────────────────────── */}
        <Animated.View style={[s.section, sectionStyle(2)]}>
          <View style={s.qaRow}>
            {QUICK_ACTIONS.map((a, idx) => (
              <QuickActionBtn
                key={a.id}
                icon={a.icon}
                label={a.label}
                color={a.color}
                iconColor={a.iconColor}
                onPress={() => handleQuickAction(a.id)}
                delay={idx * 60}
              />
            ))}
          </View>
        </Animated.View>

        {/* ── Categorías ─────────────────────────────────────────────────── */}
        <Animated.View style={[s.section, sectionStyle(3)]}>
          <SectionHeader
            title="Categorías"
            onPress={() => router.push('/(tabs)/services')}
          />

          {categoriesStatus.loading && !categories.length ? (
            <View style={s.pillSkeleton}>
              {[80, 110, 90, 100, 75].map((w, i) => (
                <View key={i} style={[s.pillSkeletonItem, { width: w }]} />
              ))}
            </View>
          ) : categoriesStatus.error && !categories.length ? (
            <ErrorBanner
              message="No se pudieron cargar las categorías"
              onRetry={() => fetchCategories().catch(() => {})}
              C={C}
            />
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.pillRow}
            >
              {categories.map((cat, idx) => (
                <CategoryPill
                  key={cat.id}
                  name={cat.name}
                  icon={cat.icon || '🔧'}
                  accent={cat.accent ?? C.primary}
                  onPress={() => handleCategoryPress(cat.id)}
                  delay={idx * 40}
                />
              ))}
            </ScrollView>
          )}
        </Animated.View>

        {/* ── Servicios destacados ───────────────────────────────────────── */}
        <Animated.View style={[s.section, sectionStyle(4)]}>
          <SectionHeader
            title="Servicios populares"
            onPress={() => router.push('/(tabs)/services')}
          />

          {featuredLoading ? (
            <SkeletonGrid s={s} />
          ) : featuredError ? (
            <ErrorBanner message="No se pudieron cargar los servicios" onRetry={loadFeatured} C={C} />
          ) : featuredServices.length > 0 ? (
            <View style={s.servicesGrid}>
              {featuredServices.map((item, idx) => (
                <ServiceCard key={item.id} item={item} delay={idx * 50} />
              ))}
            </View>
          ) : (
            <SkeletonGrid s={s} />
          )}
        </Animated.View>

        {/* ── Banner CTA (solo proveedores) ──────────────────────────────── */}
        {isProvider && (
          <Animated.View style={[s.section, sectionStyle(4)]}>
            <CTABanner s={s} />
          </Animated.View>
        )}

      </ScrollView>
    </View>
  );
}

// ── ErrorBanner ──────────────────────────────────────────────────────────────
function ErrorBanner({ message, onRetry, C }: { message: string; onRetry: () => void; C: CPalette }) {
  return (
    <View style={{ alignItems: 'center', paddingVertical: 24, gap: 10 }}>
      <Ionicons name="cloud-offline-outline" size={32} color={C.sub} />
      <Text style={{ color: C.sub, fontSize: 13 }}>{message}</Text>
      <Pressable
        onPress={onRetry}
        style={{ backgroundColor: C.primary, borderRadius: 10, paddingHorizontal: 18, paddingVertical: 8 }}
      >
        <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>Reintentar</Text>
      </Pressable>
    </View>
  );
}

// ── HeroSlide ────────────────────────────────────────────────────────────────
function HeroSlide({ slide, s, C }: { slide: typeof HERO_SLIDES[number]; s: ReturnType<typeof makeStyles>; C: CPalette }) {
  const scaleA = useRef(new Animated.Value(1)).current;

  return (
    // Full screen width — pagingEnabled snaps by W
    <View style={{ width: W, paddingHorizontal: 16 }}>
      <View style={s.heroSlide}>
      <LinearGradient colors={slide.gradient} style={s.heroGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        {/* Decorative circles */}
        <View style={[s.heroBubble, { width: 160, height: 160, top: -40, right: -40, opacity: 0.12 }]} />
        <View style={[s.heroBubble, { width: 100, height: 100, bottom: 20, right: 60, opacity: 0.08 }]} />

        <View style={s.heroContent}>
          <View style={s.heroIconWrap}>
            <Ionicons name={slide.icon} size={26} color="rgba(255,255,255,0.9)" />
          </View>
          <Text style={s.heroTitle}>{slide.title}</Text>
          <Text style={s.heroSubtitle}>{slide.subtitle}</Text>

          <Pressable
            onPressIn={() => Animated.spring(scaleA, { toValue: 0.94, useNativeDriver: true }).start()}
            onPressOut={() => Animated.spring(scaleA, { toValue: 1, useNativeDriver: true }).start()}
            onPress={() => router.push(slide.route)}
          >
            <Animated.View style={[s.heroCta, { transform: [{ scale: scaleA }] }]}>
              <Text style={s.heroCtaText}>{slide.cta}</Text>
              <Ionicons name="arrow-forward" size={14} color={C.primary} />
            </Animated.View>
          </Pressable>
        </View>
      </LinearGradient>
      </View>
    </View>
  );
}

// ── CTABanner ────────────────────────────────────────────────────────────────
function CTABanner({ s }: { s: ReturnType<typeof makeStyles> }) {
  const scaleA = useRef(new Animated.Value(1)).current;
  const tc = useThemeColors();
  const C = useMemo(() => ({
    primary:    tc.primary,
    dark:       tc.surface2,
  }), [tc]);

  return (
    <Pressable
      onPressIn={() => Animated.spring(scaleA, { toValue: 0.97, useNativeDriver: true }).start()}
      onPressOut={() => Animated.spring(scaleA, { toValue: 1, useNativeDriver: true }).start()}
      onPress={() => router.push('/(tabs)/profile')}
    >
      <Animated.View style={{ transform: [{ scale: scaleA }] }}>
        <LinearGradient
          colors={[C.primary, '#c0002f', C.dark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={s.ctaBanner}
        >
          <View style={s.ctaLeft}>
            <Text style={s.ctaTitle}>¿Ofrecés servicios?</Text>
            <Text style={s.ctaSub}>Publicá tu perfil y conseguí más clientes</Text>
            <View style={s.ctaBtn}>
              <Text style={s.ctaBtnText}>Empezar ahora</Text>
              <Ionicons name="arrow-forward" size={13} color={C.primary} />
            </View>
          </View>
          {/* Decorative */}
          <View style={s.ctaBubble1} />
          <View style={s.ctaBubble2} />
        </LinearGradient>
      </Animated.View>
    </Pressable>
  );
}

// ── Skeletons ─────────────────────────────────────────────────────────────────
function SkeletonGrid({ s }: { s: ReturnType<typeof makeStyles> }) {
  return (
    <View style={s.servicesGrid}>
      {Array.from({ length: 4 }).map((_, i) => (
        <View key={i} style={[s.serviceCardShadow, { width: (W - 48) / 2 }]}>
          <View style={s.serviceCard}>
            <View style={[s.serviceThumb, { backgroundColor: '#EFEFEF' }]} />
            <View style={s.serviceInfo}>
              <View style={{ height: 12, width: '80%', backgroundColor: '#EFEFEF', borderRadius: 6, marginBottom: 6 }} />
              <View style={{ height: 10, width: '50%', backgroundColor: '#EFEFEF', borderRadius: 6 }} />
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

// ds = static layout styles for sub-components
const ds = StyleSheet.create({
  sectionRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  sectionTitle:  { fontSize: 17, fontWeight: '700', letterSpacing: -0.2 },
  sectionLink:   { fontSize: 13, fontWeight: '500' },
  pill:          { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 99, borderWidth: 1 },
  pillIcon:      { fontSize: 15 },
  pillText:      { fontSize: 13, fontWeight: '600' },
  serviceCardShadow: { borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 4 },
  serviceCard:   { borderRadius: 16, overflow: 'hidden' },
  serviceThumb:  { width: '100%', height: 110, alignItems: 'center', justifyContent: 'center' },
  serviceInfo:   { padding: 10, gap: 3 },
  serviceTitle:  { fontSize: 13, fontWeight: '600', lineHeight: 18 },
  serviceRow:    { flexDirection: 'row', alignItems: 'center', gap: 2 },
  serviceStar:   { fontSize: 11, fontWeight: '700', color: '#F59E0B' },
  serviceReviews:{ fontSize: 11 },
  servicePrice:  { fontSize: 13, fontWeight: '700', marginTop: 2 },
  heartBtn:      { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.35)', borderRadius: 14, padding: 6 },
  qaBtn:         { alignItems: 'center', gap: 7 },
  qaIcon:        { width: 54, height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  qaLabel:       { fontSize: 11.5, fontWeight: '500' },
});

// ── Styles ────────────────────────────────────────────────────────────────────
function makeStyles(C: CPalette) { return StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bg,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 6,
    backgroundColor: C.bg,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 2,
    borderColor: C.primary + '30',
  },
  avatarGrad: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  greeting: {
    fontSize: 12,
    color: C.sub,
    marginBottom: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: C.text,
  },
  notifBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.card,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  notifDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
    borderColor: C.bg,
  },

  // Search
  searchWrap: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: C.bg,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.card,
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
    backgroundColor: C.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Scroll
  scroll: {
    paddingTop: 4,
  },

  // Hero — item wraps full W, padding goes in the wrapper View
  heroSlide: {
    width: '100%',
    height: 192,
    borderRadius: 20,
    overflow: 'hidden',
  },
  heroGrad: {
    flex: 1,
    padding: 22,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  heroBubble: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
  },
  heroContent: {
    gap: 6,
  },
  heroIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 28,
    letterSpacing: -0.4,
  },
  heroSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
    marginBottom: 4,
  },
  heroCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 7,
    alignSelf: 'flex-start',
  },
  heroCtaText: {
    fontSize: 13,
    fontWeight: '700',
    color: C.primary,
  },

  // Dots
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    paddingTop: 12,
    paddingBottom: 2,
  },
  dot: {
    height: 5,
    borderRadius: 2.5,
  },
  dotActive: {
    width: 20,
    backgroundColor: C.primary,
  },
  dotInactive: {
    width: 5,
    backgroundColor: '#D1D5DB',
  },

  // Section
  section: {
    paddingHorizontal: 16,
    marginTop: 20,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: C.text,
    letterSpacing: -0.2,
  },
  sectionLink: {
    fontSize: 13,
    fontWeight: '500',
    color: C.primary,
  },

  // Quick Actions
  qaRow: {
    flexDirection: 'row',
    gap: 8,
  },
  qaBtn: {
    alignItems: 'center',
    gap: 7,
  },
  qaIcon: {
    width: 54,
    height: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  qaLabel: {
    fontSize: 11.5,
    fontWeight: '500',
    color: C.text,
  },

  // Category Pills
  pillRow: {
    gap: 8,
    paddingRight: 4,
  },
  pillSkeleton: {
    flexDirection: 'row',
    gap: 8,
  },
  pillSkeletonItem: {
    height: 38,
    borderRadius: 99,
    backgroundColor: '#EDEDF0',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 99,
    borderWidth: 1,
  },
  pillIcon: {
    fontSize: 15,
  },
  pillText: {
    fontSize: 13,
    fontWeight: '600',
  },

  // Services Grid
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  serviceCardShadow: {
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
  },
  serviceCard: {
    backgroundColor: C.card,
    borderRadius: 16,
    overflow: 'hidden',
  },
  serviceThumb: {
    width: '100%',
    height: 110,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceInfo: {
    padding: 10,
    gap: 3,
  },
  serviceTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: C.text,
    lineHeight: 18,
  },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  serviceStar: {
    fontSize: 11,
    fontWeight: '700',
    color: '#F59E0B',
  },
  serviceReviews: {
    fontSize: 11,
    color: C.sub,
  },
  servicePrice: {
    fontSize: 13,
    fontWeight: '700',
    color: C.primary,
    marginTop: 2,
  },

  // CTA Banner
  ctaBanner: {
    borderRadius: 20,
    padding: 22,
    overflow: 'hidden',
    minHeight: 120,
  },
  ctaLeft: {
    flex: 1,
    gap: 4,
    zIndex: 1,
  },
  ctaTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  ctaSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
    lineHeight: 19,
    marginBottom: 10,
  },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 7,
    alignSelf: 'flex-start',
  },
  ctaBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: C.primary,
  },
  ctaBubble1: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.08)',
    right: -20,
    top: -20,
  },
  ctaBubble2: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.06)',
    right: 50,
    bottom: -20,
  },
}); }
