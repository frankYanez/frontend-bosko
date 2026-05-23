import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUnread } from '@/features/chat/state/UnreadContext';

const COLORS = {
  bordo:     '#850021',
  bordoDark: '#3D000F',
  bordoMid:  '#6B001A',
  white:     '#FFFFFF',
};

const BAR_H  = 68;
const PILL_H = 38;

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const ICONS: Record<string, { icon: IconName; activeIcon?: IconName; label: string }> = {
  index:    { icon: 'home-outline',                activeIcon: 'home',                label: 'Inicio'    },
  services: { icon: 'grid-outline',                activeIcon: 'grid',                label: 'Servicios' },
  orders:   { icon: 'receipt-outline',             activeIcon: 'receipt',             label: 'Pedidos'   },
  reels:    { icon: 'play-circle-outline',         activeIcon: 'play-circle',         label: 'Reels'     },
  chat:     { icon: 'chatbubble-ellipses-outline', activeIcon: 'chatbubble-ellipses', label: 'Mensajes'  },
  profile:  { icon: 'person-outline',              activeIcon: 'person',              label: 'Perfil'    },
};

function getRouteConfig(routeName: string) {
  return ICONS[routeName] ?? { icon: 'ellipse-outline' as IconName, activeIcon: 'ellipse' as IconName, label: routeName };
}

// ── Tab bar ───────────────────────────────────────────────────────────────────
export function CustomTabBar({ state, navigation, descriptors }: BottomTabBarProps) {
  const { total: unreadMessages } = useUnread();
  const insets   = useSafeAreaInsets();
  const [barWidth, setBarWidth] = useState<number>(Dimensions.get('window').width - 32);

  const tabCount = state.routes.length;
  const tabWidth = barWidth / Math.max(1, tabCount);
  const pillW    = Math.min(62, tabWidth - 8);

  // Pill slides to center of active tab
  const pillX = useRef(
    new Animated.Value(state.index * tabWidth + (tabWidth - pillW) / 2)
  ).current;

  useEffect(() => {
    Animated.spring(pillX, {
      toValue: state.index * tabWidth + (tabWidth - pillW) / 2,
      damping: 20,
      stiffness: 260,
      mass: 0.6,
      useNativeDriver: true,
    }).start();
  }, [state.index, tabWidth, pillW]);

  const onTabPress = useCallback(
    (routeIndex: number) => {
      const route = state.routes[routeIndex];
      if (!route) return;
      const isFocused = state.index === routeIndex;
      const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
      if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name, route.params);
    },
    [navigation, state.index, state.routes],
  );

  const onTabLongPress = useCallback(
    (routeIndex: number) => {
      const route = state.routes[routeIndex];
      if (!route) return;
      navigation.emit({ type: 'tabLongPress', target: route.key });
    },
    [navigation, state.routes],
  );

  const routes = useMemo(() => state.routes, [state.routes]);

  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrapper, { bottom: Math.max(insets.bottom, 14) }]}
    >
      <View
        onLayout={e => setBarWidth(e.nativeEvent.layout.width)}
        style={styles.shell}
      >
        {/* ── Main background gradient ─────────────────────────────────── */}
        <LinearGradient
          colors={[COLORS.bordoDark, COLORS.bordoMid, COLORS.bordo, COLORS.bordoMid, COLORS.bordoDark]}
          locations={[0, 0.25, 0.5, 0.75, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />

        {/* ── Subtle top edge glow ─────────────────────────────────────── */}
        <View style={styles.topGlow} />

        {/* ── Bottom depth shadow line ─────────────────────────────────── */}
        <LinearGradient
          colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.35)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={[StyleSheet.absoluteFill, { opacity: 0.4 }]}
        />

        {/* ── Sliding pill indicator ───────────────────────────────────── */}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.pill,
            { width: pillW, transform: [{ translateX: pillX }] },
          ]}
        >
          {/* Glass shine inside pill */}
          <LinearGradient
            colors={['rgba(255,255,255,0.28)', 'rgba(255,255,255,0.10)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={[StyleSheet.absoluteFill, { borderRadius: 13 }]}
          />
        </Animated.View>

        {/* ── Tabs ─────────────────────────────────────────────────────── */}
        <View style={styles.row}>
          {routes.map((route, idx) => {
            const cfg       = getRouteConfig(route.name);
            const isFocused = idx === state.index;
            const label     = descriptors[route.key]?.options?.title ?? cfg.label;
            return (
              <TabButton
                key={route.key}
                label={label}
                icon={cfg.icon}
                activeIcon={cfg.activeIcon}
                isFocused={isFocused}
                badge={route.name === 'chat' ? unreadMessages : 0}
                onPress={() => onTabPress(idx)}
                onLongPress={() => onTabLongPress(idx)}
              />
            );
          })}
        </View>
      </View>
    </View>
  );
}

// ── Tab button ────────────────────────────────────────────────────────────────
function TabButton({
  label, icon, activeIcon, isFocused, badge, onPress, onLongPress,
}: {
  label: string;
  icon: IconName;
  activeIcon?: IconName;
  isFocused: boolean;
  badge?: number;
  onPress: () => void;
  onLongPress: () => void;
}) {
  const progress = useRef(new Animated.Value(isFocused ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(progress, {
      toValue: isFocused ? 1 : 0,
      damping: 18,
      stiffness: 200,
      useNativeDriver: true,
    }).start();
  }, [isFocused]);

  // Icon: scales up + lifts slightly when active
  const iconScale     = progress.interpolate({ inputRange: [0, 1], outputRange: [1,    1.15] });
  const iconTranslateY = progress.interpolate({ inputRange: [0, 1], outputRange: [0,   -2] });
  const iconOpacity   = progress.interpolate({ inputRange: [0, 1], outputRange: [0.42, 1] });

  // Label: fades + slides in
  const labelOpacity   = progress.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 0, 1] });
  const labelTranslateY = progress.interpolate({ inputRange: [0, 1],    outputRange: [5, 0] });
  const labelScale     = progress.interpolate({ inputRange: [0, 1],     outputRange: [0.8, 1] });

  return (
    <Pressable
      style={styles.tab}
      accessibilityRole="button"
      accessibilityState={isFocused ? { selected: true } : {}}
      onPress={onPress}
      onLongPress={onLongPress}
      hitSlop={8}
    >
      <Animated.View
        style={[
          styles.iconWrap,
          {
            opacity:   iconOpacity,
            transform: [{ scale: iconScale }, { translateY: iconTranslateY }],
          },
        ]}
      >
        <Ionicons
          name={isFocused ? activeIcon ?? icon : icon}
          size={22}
          color={COLORS.white}
        />
        {!!badge && badge > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge > 9 ? '9+' : badge}</Text>
          </View>
        )}
      </Animated.View>

      <Animated.Text
        numberOfLines={1}
        style={[
          styles.label,
          {
            opacity:   labelOpacity,
            transform: [{ translateY: labelTranslateY }, { scale: labelScale }],
          },
        ]}
      >
        {label}
      </Animated.Text>
    </Pressable>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 999,
    elevation: 999,
    // Outer glow / shadow
    shadowColor: COLORS.bordo,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
  },
  shell: {
    height: BAR_H,
    borderRadius: 30,
    overflow: 'hidden',
    // Hard shadow for depth on Android
    elevation: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },

  // Top 1px bright line — looks like light hitting the top edge
  topGlow: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderRadius: 1,
  },

  pill: {
    position: 'absolute',
    top: (BAR_H - PILL_H) / 2,
    left: 0,
    height: PILL_H,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.20)',
    overflow: 'hidden',
  },

  row: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingVertical: 6,
  },
  iconWrap: {
    width: 36,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
    color: COLORS.white,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -6,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: COLORS.bordo,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#fff',
  },
});
