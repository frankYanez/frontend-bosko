import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Pressable,
  RefreshControl,
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
import { useProfile } from './state/ProfileContext';
import { useKYC } from '@/features/kyc/state/KYCContext';
import { getUserStats, UpdateProfilePayload, UserStats } from '@/features/servicesUser/services/profile';
import { EditProfileModal } from './components/EditProfileModal';

const { width: W } = Dimensions.get('window');

const C = {
  primary:  '#850021',
  dark:     '#4A0F20',
  bg:       '#F7F7FA',
  card:     '#FFFFFF',
  text:     '#1A1A1A',
  sub:      '#6B7280',
  border:   '#EDEDF0',
  accent:   '#FFF0F3',
  blue:     '#3B82F6',
  green:    '#22C55E',
  amber:    '#F59E0B',
  red:      '#EF4444',
};

// ── KYC badge config ─────────────────────────────────────────────────────────
const KYC_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ComponentProps<typeof Ionicons>['name'] }> = {
  pending:      { label: 'KYC Pendiente',  color: C.amber,  bg: '#FFF8E1', icon: 'time-outline' },
  in_progress:  { label: 'KYC Pendiente',  color: C.amber,  bg: '#FFF8E1', icon: 'time-outline' },
  not_started:  { label: 'Sin verificar',  color: C.amber,  bg: '#FFF8E1', icon: 'time-outline' },
  approved:     { label: 'Verificado',     color: C.green,  bg: '#F0FFF4', icon: 'checkmark-circle' },
  rejected:     { label: 'KYC Rechazado',  color: C.red,    bg: '#FEF2F2', icon: 'close-circle' },
  declined:     { label: 'KYC Rechazado',  color: C.red,    bg: '#FEF2F2', icon: 'close-circle' },
  failed:       { label: 'KYC Fallido',    color: C.red,    bg: '#FEF2F2', icon: 'close-circle' },
  expired:      { label: 'KYC Vencido',    color: C.amber,  bg: '#FFF8E1', icon: 'time-outline' },
};

// ── Count-up hook ─────────────────────────────────────────────────────────────
function useCountUp(target: number, duration = 900) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!target) { setCount(0); return; }
    const steps    = 28;
    const increment = target / steps;
    const interval  = duration / steps;
    let current     = 0;
    const t = setInterval(() => {
      current += increment;
      if (current >= target) { setCount(target); clearInterval(t); }
      else { setCount(Math.floor(current)); }
    }, interval);
    return () => clearInterval(t);
  }, [target]);
  return count;
}

// ── Stat cell ────────────────────────────────────────────────────────────────
function StatCell({
  value, label, suffix, color,
}: {
  value: number; label: string; suffix?: string; color?: string;
}) {
  const displayed = useCountUp(value);
  return (
    <View style={s.statCell}>
      <Text style={[s.statValue, color ? { color } : null]}>
        {suffix === 'fixed' ? displayed.toFixed(1) : displayed}
        {suffix && suffix !== 'fixed' ? suffix : ''}
      </Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

// ── Quick action card ─────────────────────────────────────────────────────────
function QuickCard({
  icon, label, color, iconColor, onPress, delay,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  color: string;
  iconColor: string;
  onPress: () => void;
  delay: number;
}) {
  const anim  = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(anim, { toValue: 1, delay, useNativeDriver: true, friction: 7 }).start();
  }, []);

  return (
    <Animated.View
      style={{
        opacity: anim,
        transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.75, 1] }) }],
        flex: 1,
      }}
    >
      <Pressable
        onPressIn={() => Animated.spring(scale, { toValue: 0.93, useNativeDriver: true }).start()}
        onPressOut={() => Animated.spring(scale, { toValue: 1,    useNativeDriver: true }).start()}
        onPress={onPress}
        style={s.quickCard}
      >
        <Animated.View style={[s.quickIconWrap, { backgroundColor: color, transform: [{ scale }] }]}>
          <Ionicons name={icon} size={22} color={iconColor} />
        </Animated.View>
        <Text style={s.quickLabel}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

// ── Settings row ─────────────────────────────────────────────────────────────
function SettingsRow({
  icon, iconBg, iconColor, label, badge, badgeColor, badgeBg, onPress, danger,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  iconBg: string;
  iconColor: string;
  label: string;
  badge?: string;
  badgeColor?: string;
  badgeBg?: string;
  onPress: () => void;
  danger?: boolean;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  return (
    <Pressable
      onPressIn={() => Animated.spring(scale, { toValue: 0.98, useNativeDriver: true }).start()}
      onPressOut={() => Animated.spring(scale, { toValue: 1,   useNativeDriver: true }).start()}
      onPress={onPress}
      style={s.settingsRow}
    >
      <Animated.View style={[s.settingsInner, { transform: [{ scale }] }]}>
        <View style={[s.settingsIcon, { backgroundColor: iconBg }]}>
          <Ionicons name={icon} size={18} color={iconColor} />
        </View>
        <Text style={[s.settingsLabel, danger && { color: C.red }]}>{label}</Text>
        <View style={s.settingsRight}>
          {badge ? (
            <View style={[s.badge, { backgroundColor: badgeBg ?? C.accent }]}>
              <Text style={[s.badgeText, { color: badgeColor ?? C.primary }]}>{badge}</Text>
            </View>
          ) : null}
          {!danger && (
            <Ionicons name="chevron-forward" size={16} color={C.border} />
          )}
        </View>
      </Animated.View>
    </Pressable>
  );
}

// ── Settings group ────────────────────────────────────────────────────────────
function SettingsGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={s.group}>
      <Text style={s.groupTitle}>{title}</Text>
      <View style={s.groupCard}>{children}</View>
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────
export const ProfileScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { authState, logout } = useAuth();
  const { profile, isLoading, refreshProfile, updateProfile } = useProfile();
  const { verification } = useKYC();

  const [stats, setStats]               = useState<UserStats | null>(null);
  const [editVisible, setEditVisible]   = useState(false);
  const [refreshing, setRefreshing]     = useState(false);

  // Entrance animations for 5 sections
  const sections = useRef(Array.from({ length: 5 }, () => new Animated.Value(0))).current;
  const avatarAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(avatarAnim, { toValue: 1, friction: 6, useNativeDriver: true }),
      Animated.stagger(80, sections.map(v =>
        Animated.timing(v, { toValue: 1, duration: 400, useNativeDriver: true })
      )),
    ]).start();
  }, []);

  const sec = (i: number) => ({
    opacity: sections[i],
    transform: [{ translateY: sections[i].interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
  });

  // Load stats
  useEffect(() => {
    if (profile) getUserStats().then(setStats).catch(() => {});
  }, [profile?.id]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshProfile().catch(() => {});
    await getUserStats().then(setStats).catch(() => {});
    setRefreshing(false);
  }, [refreshProfile]);

  const handleSave = async (data: UpdateProfilePayload) => {
    await updateProfile(data);
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  // Derived
  const isProvider = authState.user?.role?.toLowerCase() === 'provider';
  const kycStatus  = verification?.status?.toLowerCase() ?? 'not_started';
  const kycCfg     = KYC_CONFIG[kycStatus];
  const fullName   = profile
    ? `${profile.firstName}${profile.lastName ? ' ' + profile.lastName : ''}`
    : authState.user?.username ?? '';
  const memberSince = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })
    : '';

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 100 }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />
        }
      >

        {/* ── Hero banner + avatar ──────────────────────────────────────── */}
        <View style={s.hero}>
          {profile?.bannerUrl ? (
            <Image source={{ uri: profile.bannerUrl }} style={s.banner} contentFit="cover" />
          ) : (
            <LinearGradient
              colors={[C.dark, C.primary, '#c0002f']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={s.banner}
            />
          )}
          <View style={[s.heroBubble, { width: 180, height: 180, top: -50, right: -30, opacity: 0.10 }]} />
          <View style={[s.heroBubble, { width: 100, height: 100, top: 20, right: 100, opacity: 0.06 }]} />

          <View style={s.avatarWrap}>
            <Animated.View
              style={[
                s.avatarRing,
                {
                  transform: [{ scale: avatarAnim.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) }],
                  opacity: avatarAnim,
                },
              ]}
            >
              {profile?.avatarUrl ? (
                <Image source={{ uri: profile.avatarUrl }} style={s.avatar} contentFit="cover" />
              ) : (
                <LinearGradient colors={[C.primary, C.dark]} style={s.avatarFallback}>
                  <Text style={s.avatarInitial}>
                    {(profile?.firstName ?? authState.user?.username ?? 'U')[0].toUpperCase()}
                  </Text>
                </LinearGradient>
              )}
            </Animated.View>
          </View>
        </View>

        {/* ── Profile info ─────────────────────────────────────────────── */}
        <Animated.View style={[s.infoBlock, sec(0)]}>
          <View style={s.nameRow}>
            <Text style={s.nameText}>{fullName}</Text>
            {profile?.isVerified && profile?.backgroundCheckStatus === 'APPROVED' && (
              <View style={s.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={16} color={C.blue} />
                <Text style={s.verifiedText}>Verificado</Text>
              </View>
            )}
          </View>

          <Text style={s.usernameText}>@{profile?.username ?? authState.user?.username}</Text>

          <View style={s.metaRow}>
            {profile?.location ? (
              <View style={s.metaItem}>
                <Ionicons name="location-outline" size={13} color={C.sub} />
                <Text style={s.metaText}>{profile.location}</Text>
              </View>
            ) : null}
            {memberSince ? (
              <View style={s.metaItem}>
                <Ionicons name="calendar-outline" size={13} color={C.sub} />
                <Text style={s.metaText}>Desde {memberSince}</Text>
              </View>
            ) : null}
          </View>

          {/* KYC badge solo para providers o en proceso */}
          {isProvider && kycCfg ? (
            <Pressable
              onPress={() => router.push('/(tabs)/profile/kyc')}
              style={[s.kycBadge, { backgroundColor: kycCfg.bg }]}
            >
              <Ionicons name={kycCfg.icon} size={14} color={kycCfg.color} />
              <Text style={[s.kycText, { color: kycCfg.color }]}>{kycCfg.label}</Text>
            </Pressable>
          ) : null}

          {profile?.bio ? (
            <Text style={s.bioText}>{profile.bio}</Text>
          ) : null}

          <Pressable onPress={() => setEditVisible(true)} style={s.editBtn}>
            <Ionicons name="pencil-outline" size={15} color={C.primary} />
            <Text style={s.editBtnText}>Editar perfil</Text>
          </Pressable>
        </Animated.View>

        {/* ── Stats (distintas según rol) ───────────────────────────────── */}
        <Animated.View style={[s.statsCard, sec(1)]}>
          {isProvider ? (
            <>
              <StatCell value={stats?.servicesCount ?? 0}   label="Servicios" />
              <View style={s.statDivider} />
              <StatCell value={stats?.averageRating ?? 0}   label="Valoración" suffix="fixed" color="#F59E0B" />
              <View style={s.statDivider} />
              <StatCell value={stats?.reviewsCount ?? 0}    label="Reseñas" />
              <View style={s.statDivider} />
              <StatCell value={stats?.completedOrders ?? 0} label="Completados" color={C.green} />
            </>
          ) : (
            <>
              <StatCell value={stats?.completedOrders ?? 0} label="Pedidos" color={C.green} />
              <View style={s.statDivider} />
              <StatCell value={0}                           label="Favoritos" color={C.primary} />
            </>
          )}
        </Animated.View>

        {/* ── Quick access (distintas según rol) ────────────────────────── */}
        <Animated.View style={[s.section, sec(2)]}>
          <Text style={s.sectionTitle}>Acceso rápido</Text>
          <View style={s.quickRow}>
            {isProvider ? (
              <>
                <QuickCard
                  icon="construct-outline"
                  label="Servicios"
                  color={C.accent}
                  iconColor={C.primary}
                  onPress={() => router.push('/(tabs)/profile/Services')}
                  delay={0}
                />
                <QuickCard
                  icon="receipt-outline"
                  label="Órdenes"
                  color="#EBF4FF"
                  iconColor={C.blue}
                  onPress={() => router.push('/(tabs)/orders')}
                  delay={60}
                />
                <QuickCard
                  icon="star-outline"
                  label="Reseñas"
                  color="#FFFBEB"
                  iconColor={C.amber}
                  onPress={() => router.push('/(tabs)/profile/my-reviews')}
                  delay={120}
                />
              </>
            ) : (
              <>
                <QuickCard
                  icon="receipt-outline"
                  label="Mis pedidos"
                  color="#EBF4FF"
                  iconColor={C.blue}
                  onPress={() => router.push('/(tabs)/orders')}
                  delay={0}
                />
                <QuickCard
                  icon="chatbubbles-outline"
                  label="Mensajes"
                  color="#FFF8E1"
                  iconColor={C.amber}
                  onPress={() => router.push('/(tabs)/chat')}
                  delay={60}
                />
              </>
            )}
          </View>
        </Animated.View>

        {/* ── CTA "Quiero ser proveedor" (solo USER) ────────────────────── */}
        {!isProvider && (
          <Animated.View style={[s.section, sec(2)]}>
            <Pressable
              onPress={() => router.push('/(tabs)/profile/kyc')}
              style={s.providerCta}
            >
              <LinearGradient
                colors={[C.dark, C.primary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={s.providerCtaGrad}
              >
                <View style={s.providerCtaIcon}>
                  <Ionicons name="briefcase-outline" size={22} color="#fff" />
                </View>
                <View style={s.providerCtaText}>
                  <Text style={s.providerCtaTitle}>¿Querés ofrecer servicios?</Text>
                  <Text style={s.providerCtaSub}>Verificá tu identidad y empezá a publicar</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.7)" />
              </LinearGradient>
            </Pressable>
          </Animated.View>
        )}

        {/* ── Settings: Mi cuenta ──────────────────────────────────────── */}
        <Animated.View style={sec(3)}>
          <SettingsGroup title="Mi cuenta">
            <SettingsRow
              icon="person-outline"
              iconBg="#EBF4FF"
              iconColor={C.blue}
              label="Editar Perfil"
              onPress={() => setEditVisible(true)}
            />
            <View style={s.rowSep} />
            {isProvider && (
              <>
                <SettingsRow
                  icon="shield-checkmark-outline"
                  iconBg={kycCfg?.bg ?? '#F0FFF4'}
                  iconColor={kycCfg?.color ?? C.green}
                  label="Verificación de Identidad"
                  badge={kycCfg?.label}
                  badgeColor={kycCfg?.color}
                  badgeBg={kycCfg?.bg}
                  onPress={() => router.push('/(tabs)/profile/kyc')}
                />
                <View style={s.rowSep} />
                <SettingsRow
                  icon="document-text-outline"
                  iconBg="#EBF4FF"
                  iconColor={C.blue}
                  label="Antecedentes penales"
                  onPress={() => router.push('/(tabs)/profile/background-check')}
                />
                <View style={s.rowSep} />
                <SettingsRow
                  icon="diamond-outline"
                  iconBg="#FFF8E1"
                  iconColor={C.amber}
                  label="Planes Premium"
                  badge="Ver planes"
                  badgeColor={C.amber}
                  badgeBg="#FFF8E1"
                  onPress={() => router.push('/(tabs)/profile/plans')}
                />
                <View style={s.rowSep} />
              </>
            )}
            <SettingsRow
              icon="card-outline"
              iconBg="#F0FFF4"
              iconColor={C.green}
              label="Métodos de Pago"
              onPress={() => router.push('/(tabs)/profile/Payments')}
            />
          </SettingsGroup>
        </Animated.View>

        {/* ── Settings: Preferencias ───────────────────────────────────── */}
        <Animated.View style={sec(4)}>
          <SettingsGroup title="Preferencias">
            <SettingsRow
              icon="notifications-outline"
              iconBg="#F0F4FF"
              iconColor="#6366F1"
              label="Notificaciones"
              onPress={() => router.push('/(tabs)/profile/Notifications')}
            />
            <View style={s.rowSep} />
            <SettingsRow
              icon="lock-closed-outline"
              iconBg="#FFF0F3"
              iconColor={C.primary}
              label="Cambiar Contraseña"
              onPress={() => router.push('/(tabs)/profile/ChangePassword')}
            />
          </SettingsGroup>

          <View style={s.dangerGroup}>
            <Pressable onPress={handleLogout} style={s.logoutBtn}>
              <Ionicons name="log-out-outline" size={18} color={C.red} />
              <Text style={s.logoutText}>Cerrar Sesión</Text>
            </Pressable>
            <Pressable
              onPress={() => router.push('/(tabs)/profile/delete-account')}
              style={s.deleteBtn}
            >
              <Text style={s.deleteText}>Eliminar cuenta</Text>
            </Pressable>
          </View>
        </Animated.View>

      </ScrollView>

      <EditProfileModal
        visible={editVisible}
        onClose={() => setEditVisible(false)}
        onSave={handleSave}
        initialData={{
          firstName: profile?.firstName ?? '',
          lastName:  profile?.lastName,
          bio:       profile?.bio,
          avatarUrl: profile?.avatarUrl,
        }}
      />
    </View>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bg,
  },
  scroll: {
    paddingBottom: 40,
  },

  // Hero / banner
  hero: {
    height: 170,
    overflow: 'visible',
  },
  banner: {
    width: '100%',
    height: 170,
  },
  heroBubble: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
  },
  avatarWrap: {
    position: 'absolute',
    bottom: -52,
    left: 20,
  },
  avatarRing: {
    width: 104,
    height: 104,
    borderRadius: 52,
    borderWidth: 4,
    borderColor: C.card,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
    backgroundColor: C.card,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 38,
    fontWeight: '700',
    color: '#fff',
  },

  // Profile info
  infoBlock: {
    marginTop: 62,
    paddingHorizontal: 20,
    paddingBottom: 8,
    gap: 6,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  nameText: {
    fontSize: 22,
    fontWeight: '800',
    color: C.text,
    letterSpacing: -0.3,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#EBF4FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 99,
  },
  verifiedText: {
    fontSize: 11,
    fontWeight: '600',
    color: C.blue,
  },
  usernameText: {
    fontSize: 14,
    color: C.sub,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 2,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: C.sub,
  },
  kycBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 99,
    marginTop: 2,
  },
  kycText: {
    fontSize: 12,
    fontWeight: '600',
  },
  bioText: {
    fontSize: 14,
    color: C.sub,
    lineHeight: 20,
    marginTop: 4,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: C.primary + '40',
    backgroundColor: C.accent,
  },
  editBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: C.primary,
  },

  // Stats
  statsCard: {
    marginHorizontal: 16,
    marginTop: 20,
    backgroundColor: C.card,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 4,
  },
  statCell: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: C.text,
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 11,
    color: C.sub,
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: C.border,
  },

  // Quick access
  section: {
    marginHorizontal: 16,
    marginTop: 22,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: C.text,
    marginBottom: 12,
    letterSpacing: -0.2,
  },
  quickRow: {
    flexDirection: 'row',
    gap: 10,
  },
  quickCard: {
    backgroundColor: C.card,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  quickIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: C.text,
  },

  // Settings
  group: {
    marginHorizontal: 16,
    marginTop: 22,
  },
  groupTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: C.sub,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 8,
    paddingLeft: 4,
  },
  groupCard: {
    backgroundColor: C.card,
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  settingsRow: {
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  settingsInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  settingsIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: C.text,
  },
  settingsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 99,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  rowSep: {
    height: 1,
    backgroundColor: C.border,
    marginLeft: 64,
    marginRight: 16,
  },

  // Danger zone
  dangerGroup: {
    marginHorizontal: 16,
    marginTop: 22,
    gap: 8,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderRadius: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: C.red + '30',
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '700',
    color: C.red,
  },
  deleteBtn: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  deleteText: {
    fontSize: 13,
    color: C.sub,
    textDecorationLine: 'underline',
  },

  // CTA "Quiero ser proveedor"
  providerCta: {
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  providerCtaGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    gap: 14,
  },
  providerCtaIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  providerCtaText: {
    flex: 1,
    gap: 3,
  },
  providerCtaTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  providerCtaSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.72)',
    lineHeight: 17,
  },
});
