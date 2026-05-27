import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
  ViewToken,
} from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getReelsFeed, toggleLikeReel, Reel } from '@/features/reels/services/reels.service';

const { width: W, height: H } = Dimensions.get('window');

// ── Format number helper ──────────────────────────────────────────────────────
function fmtNum(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

// ── Action button (right sidebar) ────────────────────────────────────────────
function ActionBtn({
  icon, label, color, onPress,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label?: string;
  color?: string;
  onPress?: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const press = () => {
    Animated.sequence([
      Animated.spring(scale, { toValue: 1.35, useNativeDriver: true, tension: 200, friction: 5 }),
      Animated.spring(scale, { toValue: 1,    useNativeDriver: true, tension: 200, friction: 8 }),
    ]).start();
    onPress?.();
  };

  return (
    <Pressable onPress={press} style={s.actionBtn}>
      <Animated.View style={{ transform: [{ scale }] }}>
        <Ionicons name={icon} size={28} color={color ?? '#FFFFFF'} />
      </Animated.View>
      {label !== undefined && <Text style={s.actionLabel}>{label}</Text>}
    </Pressable>
  );
}

// ── Progress bar ─────────────────────────────────────────────────────────────
function ProgressBar({ position, duration }: { position: number; duration: number }) {
  const progress = duration > 0 ? Math.min(position / duration, 1) : 0;
  const barAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    barAnim.setValue(progress);
  }, [progress]);

  return (
    <View style={s.progressTrack}>
      <Animated.View
        style={[
          s.progressFill,
          { width: `${progress * 100}%` },
        ]}
      />
    </View>
  );
}

// ── Floating heart (double-tap) ───────────────────────────────────────────────
function FloatingHeart({ visible, x, y }: { visible: boolean; x: number; y: number }) {
  const scaleA   = useRef(new Animated.Value(0)).current;
  const opacityA = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;
    scaleA.setValue(0);
    opacityA.setValue(1);
    translateY.setValue(0);

    Animated.parallel([
      Animated.sequence([
        Animated.spring(scaleA, { toValue: 1.4, useNativeDriver: true, tension: 180, friction: 5 }),
        Animated.spring(scaleA, { toValue: 1.1, useNativeDriver: true, tension: 180, friction: 8 }),
      ]),
      Animated.sequence([
        Animated.delay(400),
        Animated.parallel([
          Animated.timing(opacityA,   { toValue: 0, duration: 400, useNativeDriver: true }),
          Animated.timing(translateY, { toValue: -60, duration: 400, useNativeDriver: true }),
        ]),
      ]),
    ]).start();
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        s.floatingHeart,
        {
          left: x - 40,
          top: y - 40,
          opacity: opacityA,
          transform: [{ scale: scaleA }, { translateY }],
        },
      ]}
    >
      <Ionicons name="heart" size={80} color="#FF2D55" />
    </Animated.View>
  );
}

// ── Single reel item ──────────────────────────────────────────────────────────
const ReelItem = React.memo(function ReelItem({
  reel,
  isActive,
}: {
  reel: Reel;
  isActive: boolean;
}) {
  const insets = useSafeAreaInsets();

  const [isMuted,     setIsMuted]     = useState(true);
  const [isPaused,    setIsPaused]    = useState(false);
  const [position,    setPosition]    = useState(0);
  const [duration,    setDuration]    = useState(0);
  const [isBuffering, setIsBuffering] = useState(true);
  const [liked,       setLiked]       = useState(reel.isLiked ?? false);
  const [likeCount,   setLikeCount]   = useState(reel.likes ?? 0);

  // Heart animation state
  const [heartVisible, setHeartVisible] = useState(false);
  const [heartPos,     setHeartPos]     = useState({ x: W / 2, y: H / 2 });

  // Double-tap detection
  const lastTap = useRef(0);

  // ── expo-video player ─────────────────────────────────────────────────────
  const player = useVideoPlayer({ uri: reel.videoUrl }, (p) => {
    p.loop = true;
    p.muted = true;
  });

  // Play / pause según visibilidad
  useEffect(() => {
    if (isActive && !isPaused) {
      player.play();
    } else {
      player.pause();
      if (!isActive) {
        player.currentTime = 0;
        setIsPaused(false);
        setPosition(0);
      }
    }
  }, [isActive, isPaused, player]);

  // Sincronizar mute con el player
  useEffect(() => {
    player.muted = isMuted;
  }, [isMuted, player]);

  // Escuchar progreso y buffering
  useEffect(() => {
    const sub = player.addListener('timeUpdate', (e) => {
      setPosition(e.currentTime * 1000);
      setDuration((player.duration ?? 0) * 1000);
      setIsBuffering(false);
    });
    return () => sub.remove();
  }, [player]);

  useEffect(() => {
    const sub = player.addListener('statusChange', ({ status }) => {
      setIsBuffering(status === 'loading');
    });
    return () => sub.remove();
  }, [player]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handlePress = useCallback((evt: any) => {
    const now = Date.now();
    if (now - lastTap.current < 280) {
      // Double tap → like + floating heart
      const { locationX, locationY } = evt.nativeEvent;
      setHeartPos({ x: locationX, y: locationY });
      setHeartVisible(false);
      setTimeout(() => setHeartVisible(true), 10);
      if (!liked) {
        setLiked(true);
        setLikeCount(c => c + 1);
      }
    } else {
      // Single tap → toggle pause
      setIsPaused(p => !p);
    }
    lastTap.current = now;
  }, [liked]);

  const handleLikePress = useCallback(() => {
    setLiked(l => {
      setLikeCount(c => l ? c - 1 : c + 1);
      return !l;
    });
    toggleLikeReel(reel.id).catch(() => {
      setLiked(l => {
        setLikeCount(c => l ? c - 1 : c + 1);
        return !l;
      });
    });
  }, [reel.id]);

  const muteScale   = useRef(new Animated.Value(0)).current;
  const muteOpacity = useRef(new Animated.Value(0)).current;

  const handleMuteToggle = () => {
    setIsMuted(m => !m);
    muteOpacity.setValue(1);
    muteScale.setValue(0.5);
    Animated.parallel([
      Animated.spring(muteScale,   { toValue: 1, useNativeDriver: true, tension: 200, friction: 7 }),
      Animated.sequence([
        Animated.delay(700),
        Animated.timing(muteOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]),
    ]).start();
  };

  return (
    <View style={s.reel}>
      {/* ── Video ──────────────────────────────────────────────────────── */}
      <Pressable onPress={handlePress} style={StyleSheet.absoluteFill}>
        <VideoView
          player={player}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          nativeControls={false}
        />
      </Pressable>

      {/* ── Dark gradient overlays ──────────────────────────────────────── */}
      <LinearGradient
        colors={['rgba(0,0,0,0.35)', 'transparent']}
        style={s.gradTop}
        pointerEvents="none"
      />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.75)']}
        style={s.gradBottom}
        pointerEvents="none"
      />

      {/* ── Buffering spinner ──────────────────────────────────────────── */}
      {isBuffering && isActive && (
        <View style={s.pauseIcon} pointerEvents="none">
          <ActivityIndicator size="large" color="rgba(255,255,255,0.8)" />
        </View>
      )}

      {/* ── Pause icon flash ────────────────────────────────────────────── */}
      {isPaused && !isBuffering && (
        <View style={s.pauseIcon} pointerEvents="none">
          <Ionicons name="pause" size={60} color="rgba(255,255,255,0.75)" />
        </View>
      )}

      {/* ── Mute indicator ─────────────────────────────────────────────── */}
      <Animated.View
        style={[s.muteIndicator, { opacity: muteOpacity, transform: [{ scale: muteScale }] }]}
        pointerEvents="none"
      >
        <Ionicons name={isMuted ? 'volume-mute' : 'volume-high'} size={32} color="#fff" />
      </Animated.View>

      {/* ── Floating heart (double-tap) ─────────────────────────────────── */}
      <FloatingHeart visible={heartVisible} x={heartPos.x} y={heartPos.y} />

      {/* ── Right sidebar ───────────────────────────────────────────────── */}
      <View style={[s.sidebar, { paddingBottom: insets.bottom + 80 }]}>
        {/* Avatar + follow button */}
        <View style={s.avatarWrap}>
          <Image
            source={reel.user.avatar ? { uri: reel.user.avatar } : undefined}
            style={s.avatar}
            contentFit="cover"
          />
          <View style={s.followDot}>
            <Ionicons name="add" size={12} color="#fff" />
          </View>
        </View>

        <ActionBtn
          icon={liked ? 'heart' : 'heart-outline'}
          label={fmtNum(likeCount)}
          color={liked ? '#FF2D55' : '#FFFFFF'}
          onPress={handleLikePress}
        />
        <ActionBtn icon="chatbubble-ellipses" label={fmtNum(reel.comments)} />
        <ActionBtn icon="arrow-redo" label="Compartir" />
        <ActionBtn icon="ellipsis-horizontal" />
        <Pressable onPress={handleMuteToggle} style={s.actionBtn}>
          <Ionicons name={isMuted ? 'volume-mute' : 'volume-high'} size={24} color="#fff" />
        </Pressable>
      </View>

      {/* ── Bottom info ─────────────────────────────────────────────────── */}
      <View style={[s.bottomInfo, { paddingBottom: insets.bottom + 72 }]}>
        <Text style={s.username}>@{reel.user.username}</Text>
        <Text style={s.description} numberOfLines={2}>{reel.description}</Text>
        <Text style={s.tags}>{reel.tags.join(' ')}</Text>
        <View style={s.musicRow}>
          <Ionicons name="musical-notes" size={13} color="rgba(255,255,255,0.8)" />
          <Text style={s.musicText} numberOfLines={1}>{reel.music}</Text>
        </View>

        {/* Progress bar */}
        <ProgressBar position={position} duration={duration} />
      </View>
    </View>
  );
});

// ── Top bar ───────────────────────────────────────────────────────────────────
function TopBar({ insetTop }: { insetTop: number }) {
  const [tab, setTab] = useState<'siguiendo' | 'parati'>('parati');

  return (
    <View style={[s.topBar, { paddingTop: insetTop + 8 }]} pointerEvents="box-none">
      <View style={s.topTabs} pointerEvents="auto">
        <Pressable onPress={() => setTab('siguiendo')}>
          <Text style={[s.topTab, tab === 'siguiendo' && s.topTabActive]}>Siguiendo</Text>
        </Pressable>
        <View style={s.topDivider} />
        <Pressable onPress={() => setTab('parati')}>
          <Text style={[s.topTab, tab === 'parati' && s.topTabActive]}>Para ti</Text>
        </Pressable>
      </View>
      <Pressable style={s.topSearch} pointerEvents="auto">
        <Ionicons name="search" size={22} color="#fff" />
      </Pressable>
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function ReelsScreen() {
  const insets       = useSafeAreaInsets();
  const [reels,      setReels]      = useState<Reel[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page,       setPage]       = useState(1);
  const [hasMore,    setHasMore]    = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);

  // Carga inicial
  useEffect(() => {
    (async () => {
      try {
        const data = await getReelsFeed(1, 10);
        setReels(data);
        setHasMore(data.length === 10);
      } catch {
        // Si falla la API, la lista queda vacía (sin crash)
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Carga paginada al final del feed
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const data = await getReelsFeed(nextPage, 10);
      if (data.length === 0) {
        setHasMore(false);
      } else {
        setReels(prev => [...prev, ...data]);
        setPage(nextPage);
        setHasMore(data.length === 10);
      }
    } catch {
      // silenciar error de paginación
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, page]);

  // viewabilityConfigCallbackPairs must be stable (useRef, never recreated)
  const viewabilityConfigCallbackPairs = useRef([
    {
      viewabilityConfig: {
        itemVisiblePercentThreshold: 60,
        minimumViewTime: 100,
      },
      onViewableItemsChanged: ({ viewableItems }: { viewableItems: ViewToken[] }) => {
        if (viewableItems.length > 0 && viewableItems[0].index != null) {
          setActiveIndex(viewableItems[0].index);
        }
      },
    },
  ]);

  // renderItem depends on activeIndex — React.memo on ReelItem ensures only
  // the two items whose isActive prop actually flipped get re-rendered.
  const renderItem = useCallback(
    ({ item, index }: { item: Reel; index: number }) => (
      <ReelItem reel={item} isActive={index === activeIndex} />
    ),
    [activeIndex],
  );

  const keyExtractor = useCallback((item: Reel) => item.id, []);

  const getItemLayout = useCallback(
    (_: any, index: number) => ({ length: H, offset: H * index, index }),
    [],
  );

  if (loading) {
    return (
      <View style={[s.root, s.center]}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <View style={s.root}>
      <StatusBar hidden />

      <FlatList
        data={reels}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={H}
        snapToAlignment="start"
        decelerationRate="fast"
        getItemLayout={getItemLayout}
        viewabilityConfigCallbackPairs={viewabilityConfigCallbackPairs.current}
        windowSize={3}
        maxToRenderPerBatch={2}
        initialNumToRender={1}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          loadingMore ? (
            <View style={s.footerLoader}>
              <ActivityIndicator color="#fff" />
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={s.center}>
            <Text style={s.emptyText}>No hay reels todavía</Text>
          </View>
        }
      />

      {/* Floating top bar */}
      <TopBar insetTop={insets.top} />
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
  },
  emptyText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 16,
  },
  footerLoader: {
    height: H,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Reel item
  reel: {
    width: W,
    height: H,
    backgroundColor: '#000',
  },

  // Gradient overlays
  gradTop: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: 120,
  },
  gradBottom: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: 280,
  },

  // Pause
  pauseIcon: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Mute indicator
  muteIndicator: {
    position: 'absolute',
    top: '40%',
    alignSelf: 'center',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Floating heart
  floatingHeart: {
    position: 'absolute',
    width: 80,
    height: 80,
  },

  // Right sidebar
  sidebar: {
    position: 'absolute',
    right: 12,
    bottom: 0,
    alignItems: 'center',
    gap: 18,
  },
  avatarWrap: {
    marginBottom: 4,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 2,
    borderColor: '#fff',
  },
  followDot: {
    position: 'absolute',
    bottom: -8,
    alignSelf: 'center',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FF2D55',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#000',
  },
  actionBtn: {
    alignItems: 'center',
    gap: 3,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },

  // Bottom info
  bottomInfo: {
    position: 'absolute',
    bottom: 0,
    left: 14,
    right: 80,
    gap: 5,
  },
  username: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  description: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.90)',
    lineHeight: 19,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  tags: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
    fontWeight: '600',
  },
  musicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  musicText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    flex: 1,
  },

  // Progress bar
  progressTrack: {
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 1,
    marginTop: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 1,
  },

  // Top bar
  topBar: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    zIndex: 10,
  },
  topTabs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  topDivider: {
    width: 1,
    height: 16,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  topTab: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.55)',
  },
  topTabActive: {
    color: '#FFFFFF',
    textDecorationLine: 'underline',
    textDecorationColor: '#FFFFFF',
  },
  topSearch: {
    position: 'absolute',
    right: 16,
    padding: 4,
  },
});
