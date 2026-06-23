import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
  ViewToken,
} from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { toggleLikeReel, commentOnReel, Reel } from '@/features/reels/services/reels.service';
import { useAuth } from '@/features/auth/state/AuthContext';
import {
  useReelsFeed,
  useDeleteReel,
  useReelComments,
  useDeleteReelComment,
  useReportReel,
} from '@/hooks/queries/useReelsQuery';

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

// ── Comments sheet ────────────────────────────────────────────────────────────
function CommentsSheet({
  reelId,
  currentUserId,
  onClose,
  onCommentPosted,
}: {
  reelId: string;
  currentUserId?: string;
  onClose: () => void;
  onCommentPosted: () => void;
}) {
  const insets      = useSafeAreaInsets();
  const [text,    setText]    = useState('');
  const [sending, setSending] = useState(false);

  const { data: comments = [], isLoading, refetch } = useReelComments(reelId);
  const { mutate: deleteComment } = useDeleteReelComment(reelId);

  const handleSend = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      await commentOnReel(reelId, text.trim());
      setText('');
      onCommentPosted();
      refetch();
    } catch {
      Alert.alert('Error', 'No se pudo enviar el comentario. Intentá de nuevo.');
    } finally {
      setSending(false);
    }
  };

  const handleDeleteComment = (commentId: string) => {
    Alert.alert('Eliminar comentario', '¿Seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: () => deleteComment(commentId),
      },
    ]);
  };

  return (
    <Modal
      visible
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {/* Backdrop */}
        <Pressable style={[StyleSheet.absoluteFill, s.commentsBackdrop]} onPress={onClose} />

        <View style={[s.commentsSheet, { paddingBottom: insets.bottom + 8 }]}>
          {/* Handle */}
          <View style={s.commentsHandle} />
          <Text style={s.commentsTitle}>Comentarios</Text>

          {isLoading ? (
            <View style={s.commentsEmpty}>
              <ActivityIndicator color="rgba(255,255,255,0.5)" />
            </View>
          ) : comments.length === 0 ? (
            <View style={s.commentsEmpty}>
              <Ionicons name="chatbubbles-outline" size={44} color="rgba(255,255,255,0.25)" />
              <Text style={s.commentsEmptyText}>Sé el primero en comentar</Text>
            </View>
          ) : (
            <FlatList
              data={comments}
              keyExtractor={(c) => c.id}
              style={{ maxHeight: 320 }}
              renderItem={({ item }) => (
                <View style={s.commentItem}>
                  <View style={s.commentAvatar}>
                    <Ionicons name="person-circle" size={32} color="rgba(255,255,255,0.4)" />
                  </View>
                  <View style={s.commentBody}>
                    <Text style={s.commentUser}>{item.user.name}</Text>
                    <Text style={s.commentText}>{item.comment}</Text>
                  </View>
                  {item.userId === currentUserId && (
                    <Pressable onPress={() => handleDeleteComment(item.id)} style={s.commentDelete}>
                      <Ionicons name="trash-outline" size={16} color="rgba(255,255,255,0.35)" />
                    </Pressable>
                  )}
                </View>
              )}
            />
          )}

          {/* Input */}
          <View style={s.commentsInputRow}>
            <TextInput
              style={s.commentsInput}
              placeholder="Escribí un comentario..."
              placeholderTextColor="rgba(255,255,255,0.35)"
              value={text}
              onChangeText={setText}
              multiline
              maxLength={500}
            />
            <Pressable onPress={handleSend} disabled={!text.trim() || sending} style={s.commentsSendBtn}>
              {sending
                ? <ActivityIndicator size="small" color="#fff" />
                : <Ionicons name="send" size={20} color={text.trim() ? '#fff' : 'rgba(255,255,255,0.25)'} />
              }
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ── Before / After comparison slider ─────────────────────────────────────────
function BeforeAfterSlider({ before, after }: { before: string; after: string }) {
  const dividerX = useRef(new Animated.Value(W / 2)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, { dx, dy }) => Math.abs(dx) > Math.abs(dy),
      onPanResponderMove: (_, { moveX }) => {
        dividerX.setValue(Math.max(30, Math.min(W - 30, moveX)));
      },
    }),
  ).current;

  return (
    <View style={StyleSheet.absoluteFill} {...panResponder.panHandlers}>
      {/* DESPUÉS — visible siempre, detrás */}
      <Image source={{ uri: after }} style={StyleSheet.absoluteFill} contentFit="cover" />
      <View style={[s.baLabel, s.baLabelRight]}>
        <Text style={s.baLabelText}>DESPUÉS</Text>
      </View>

      {/* ANTES — clippeado por la posición del divider */}
      <Animated.View style={[StyleSheet.absoluteFill, { width: dividerX, overflow: 'hidden' }]}>
        <Image source={{ uri: before }} style={{ width: W, height: H }} contentFit="cover" />
        <View style={[s.baLabel, s.baLabelLeft]}>
          <Text style={s.baLabelText}>ANTES</Text>
        </View>
      </Animated.View>

      {/* Divider — línea vertical + handle */}
      <Animated.View style={[s.baDividerLine, { left: dividerX }]} pointerEvents="none">
        <View style={s.baDividerHandle}>
          <Ionicons name="chevron-back"    size={11} color="#fff" />
          <Ionicons name="chevron-forward" size={11} color="#fff" />
        </View>
      </Animated.View>
    </View>
  );
}

// ── Single reel item ──────────────────────────────────────────────────────────
const ReelItem = React.memo(function ReelItem({
  reel,
  isActive,
  currentUserId,
}: {
  reel: Reel;
  isActive: boolean;
  currentUserId?: string;
}) {
  const insets = useSafeAreaInsets();
  const { mutate: deleteReelMutate } = useDeleteReel();
  const { mutate: reportReelMutate } = useReportReel();

  const isBeforeAfter = reel.type === 'before_after';

  const [isMuted,     setIsMuted]     = useState(true);
  const [isPaused,    setIsPaused]    = useState(false);
  const [position,    setPosition]    = useState(0);
  const [duration,    setDuration]    = useState(0);
  const [isBuffering, setIsBuffering] = useState(!isBeforeAfter);
  const [liked,         setLiked]         = useState(reel.isLiked ?? false);
  const [likeCount,     setLikeCount]     = useState(reel.likes ?? 0);
  const [commentCount,  setCommentCount]  = useState(reel.comments ?? 0);
  const [isFollowing,   setIsFollowing]   = useState(reel.user.isFollowing ?? false);
  const [showComments,  setShowComments]  = useState(false);

  // Heart animation state
  const [heartVisible, setHeartVisible] = useState(false);
  const [heartPos,     setHeartPos]     = useState({ x: W / 2, y: H / 2 });

  // Double-tap detection
  const lastTap = useRef(0);

  // ── expo-video player — always called (hook rule), ignored for before_after ─
  const player = useVideoPlayer({ uri: reel.videoUrl ?? '' }, (p) => {
    p.loop = true;
    p.muted = true;
  });

  // Play / pause según visibilidad (video only)
  useEffect(() => {
    if (isBeforeAfter) return;
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
  }, [isActive, isPaused, player, isBeforeAfter]);

  // Sincronizar mute con el player (video only)
  useEffect(() => {
    if (isBeforeAfter) return;
    player.muted = isMuted;
  }, [isMuted, player, isBeforeAfter]);

  // Escuchar progreso y buffering (video only)
  useEffect(() => {
    if (isBeforeAfter) return;
    const sub = player.addListener('timeUpdate', (e) => {
      setPosition(e.currentTime * 1000);
      setDuration((player.duration ?? 0) * 1000);
      setIsBuffering(false);
    });
    return () => sub.remove();
  }, [player, isBeforeAfter]);

  useEffect(() => {
    if (isBeforeAfter) return;
    const sub = player.addListener('statusChange', ({ status }) => {
      setIsBuffering(status === 'loading');
    });
    return () => sub.remove();
  }, [player, isBeforeAfter]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handlePress = useCallback((evt: any) => {
    if (isBeforeAfter) return;
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
  }, [liked, isBeforeAfter]);

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

  const handleQuote = useCallback(() => {
    router.push({
      pathname: '/(tabs)/services/provider/[id]',
      params: { id: reel.user.id },
    });
  }, [reel.user.id]);

  const handleFollow = useCallback(() => {
    setIsFollowing(f => !f);
    // TODO: conectar a API follow/unfollow cuando exista el endpoint
  }, []);

  const handleShare = useCallback(async () => {
    try {
      await Share.share({
        message: `Mirá el trabajo de @${reel.user.username} en Bosko`,
        url: `https://boskoapp.site/provider/${reel.user.id}`,
      });
    } catch {}
  }, [reel.user.username, reel.user.id]);

  const handleMore = useCallback(() => {
    const isOwner = reel.user.id === currentUserId;
    const options: any[] = [
      { text: 'No me interesa', onPress: () => {} },
      {
        text: 'Reportar contenido',
        style: 'destructive',
        onPress: () =>
          reportReelMutate(
            { reelId: reel.id },
            {
              onSuccess: () =>
                Alert.alert('Reporte enviado', 'Gracias por ayudarnos a mantener la comunidad.'),
              onError: () =>
                Alert.alert('Error', 'No se pudo enviar el reporte.'),
            },
          ),
      },
    ];
    if (isOwner) {
      options.push({
        text: 'Eliminar reel',
        style: 'destructive',
        onPress: () =>
          Alert.alert('Eliminar reel', '¿Seguro que querés eliminarlo?', [
            { text: 'Cancelar', style: 'cancel' },
            {
              text: 'Eliminar',
              style: 'destructive',
              onPress: () => deleteReelMutate(reel.id),
            },
          ]),
      });
    }
    options.push({ text: 'Cancelar', style: 'cancel' });
    Alert.alert('Opciones', undefined, options);
  }, [reel.id, reel.user.id, currentUserId, reportReelMutate, deleteReelMutate]);

  const handleCommentPosted = useCallback(() => {
    setCommentCount(c => c + 1);
  }, []);

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
      {/* ── Media ──────────────────────────────────────────────────────── */}
      {isBeforeAfter ? (
        <BeforeAfterSlider
          before={reel.beforeImageUrl!}
          after={reel.afterImageUrl!}
        />
      ) : (
        <Pressable onPress={handlePress} style={StyleSheet.absoluteFill}>
          <VideoView
            player={player}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            nativeControls={false}
          />
        </Pressable>
      )}

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

      {/* ── Video-only overlays ─────────────────────────────────────────── */}
      {!isBeforeAfter && isBuffering && isActive && (
        <View style={s.pauseIcon} pointerEvents="none">
          <ActivityIndicator size="large" color="rgba(255,255,255,0.8)" />
        </View>
      )}
      {!isBeforeAfter && isPaused && !isBuffering && (
        <View style={s.pauseIcon} pointerEvents="none">
          <Ionicons name="pause" size={60} color="rgba(255,255,255,0.75)" />
        </View>
      )}
      {!isBeforeAfter && (
        <Animated.View
          style={[s.muteIndicator, { opacity: muteOpacity, transform: [{ scale: muteScale }] }]}
          pointerEvents="none"
        >
          <Ionicons name={isMuted ? 'volume-mute' : 'volume-high'} size={32} color="#fff" />
        </Animated.View>
      )}
      {!isBeforeAfter && (
        <FloatingHeart visible={heartVisible} x={heartPos.x} y={heartPos.y} />
      )}

      {/* ── Right sidebar ───────────────────────────────────────────────── */}
      <View style={[s.sidebar, { paddingBottom: insets.bottom + 80 }]}>
        {/* Avatar + follow button */}
        <Pressable onPress={handleFollow} style={s.avatarWrap}>
          <Image
            source={reel.user.avatar ? { uri: reel.user.avatar } : undefined}
            style={s.avatar}
            contentFit="cover"
          />
          <View style={[s.followDot, isFollowing && s.followDotActive]}>
            <Ionicons
              name={isFollowing ? 'checkmark' : 'add'}
              size={12}
              color="#fff"
            />
          </View>
        </Pressable>

        <ActionBtn
          icon={liked ? 'heart' : 'heart-outline'}
          label={fmtNum(likeCount)}
          color={liked ? '#FF2D55' : '#FFFFFF'}
          onPress={handleLikePress}
        />
        <ActionBtn
          icon="chatbubble-ellipses"
          label={fmtNum(commentCount)}
          onPress={() => setShowComments(true)}
        />
        <ActionBtn icon="arrow-redo" label="Compartir" onPress={handleShare} />
        <ActionBtn
          icon="pricetag-outline"
          label="Cotizar"
          onPress={handleQuote}
        />
        <ActionBtn icon="ellipsis-horizontal" onPress={handleMore} />
        {!isBeforeAfter && (
          <Pressable onPress={handleMuteToggle} style={s.actionBtn}>
            <Ionicons name={isMuted ? 'volume-mute' : 'volume-high'} size={24} color="#fff" />
          </Pressable>
        )}
      </View>

      {/* ── Bottom info ─────────────────────────────────────────────────── */}
      <View style={[s.bottomInfo, { paddingBottom: insets.bottom + 72 }]}>
        {reel.user.isAvailable && (
          <View style={s.availableBadge}>
            <View style={s.availableDot} />
            <Text style={s.availableText}>Disponible hoy</Text>
          </View>
        )}
        <Text style={s.username}>@{reel.user.username}</Text>
        <Text style={s.description} numberOfLines={2}>{reel.description}</Text>
        <Text style={s.tags}>{(reel.tags ?? []).join(' ')}</Text>
        {!isBeforeAfter && reel.music && (
          <View style={s.musicRow}>
            <Ionicons name="musical-notes" size={13} color="rgba(255,255,255,0.8)" />
            <Text style={s.musicText} numberOfLines={1}>{reel.music}</Text>
          </View>
        )}

        {isBeforeAfter && (
          <View style={s.beforeAfterBadge}>
            <Ionicons name="swap-horizontal" size={12} color="#fff" />
            <Text style={s.beforeAfterBadgeText}>Arrastrá para comparar</Text>
          </View>
        )}

        {/* Progress bar (video only) */}
        {!isBeforeAfter && <ProgressBar position={position} duration={duration} />}
      </View>

      {/* ── Comments sheet ──────────────────────────────────────────────── */}
      {showComments && (
        <CommentsSheet
          reelId={reel.id}
          currentUserId={currentUserId}
          onClose={() => setShowComments(false)}
          onCommentPosted={handleCommentPosted}
        />
      )}
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
  const insets = useSafeAreaInsets();
  const { authState } = useAuth();
  const currentUserId = authState.user?.id;
  const { data, isLoading, isFetchingNextPage, fetchNextPage, hasNextPage } = useReelsFeed();
  const reels = data?.pages.flat() ?? [];
  const [activeIndex, setActiveIndex] = useState(0);

  const loadMore = useCallback(() => {
    if (hasNextPage) fetchNextPage();
  }, [hasNextPage, fetchNextPage]);

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
      <ReelItem reel={item} isActive={index === activeIndex} currentUserId={currentUserId} />
    ),
    [activeIndex, currentUserId],
  );

  const keyExtractor = useCallback((item: Reel) => item.id, []);

  const getItemLayout = useCallback(
    (_: any, index: number) => ({ length: H, offset: H * index, index }),
    [],
  );

  if (isLoading) {
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
          isFetchingNextPage ? (
            <View style={s.footerLoader}>
              <ActivityIndicator color="#fff" />
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={s.emptyContainer}>
            <Ionicons name="videocam-off-outline" size={56} color="rgba(255,255,255,0.25)" />
            <Text style={s.emptyTitle}>Sin reels todavía</Text>
            <Text style={s.emptySubtitle}>Los proveedores aún no han publicado videos. Volvé pronto.</Text>
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
  emptyContainer: {
    height: H,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 40,
    backgroundColor: '#000',
  },
  emptyTitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptySubtitle: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
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
  followDotActive: {
    backgroundColor: '#22c55e',
  },

  // Comments sheet
  commentsBackdrop: {
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  commentsSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1a1a2e',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 12,
    maxHeight: '65%',
  },
  commentsHandle: {
    width: 36,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 14,
  },
  commentsTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 24,
  },
  commentsEmpty: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 32,
  },
  commentsEmptyText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.4)',
  },
  commentItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  commentAvatar: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentBody: {
    flex: 1,
    gap: 2,
  },
  commentUser: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
  commentText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 18,
  },
  commentDelete: {
    padding: 6,
    justifyContent: 'center',
  },
  commentsInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    paddingTop: 12,
  },
  commentsInput: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#fff',
    fontSize: 14,
    maxHeight: 100,
  },
  commentsSendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
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

  // Before / After slider
  baLabel: {
    position: 'absolute',
    top: 90,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 6,
  },
  baLabelLeft:  { left: 12 },
  baLabelRight: { right: 12 },
  baLabelText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  baDividerLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: '#fff',
    marginLeft: -1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  baDividerHandle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 6,
  },
  beforeAfterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 99,
    paddingHorizontal: 9,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  beforeAfterBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
  },

  // Available badge
  availableBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(34,197,94,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.4)',
    borderRadius: 99,
    paddingHorizontal: 9,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  availableDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22c55e',
  },
  availableText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#22c55e',
    letterSpacing: 0.2,
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
