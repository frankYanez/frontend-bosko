/**
 * MyReviewsScreen — Reseñas recibidas por el proveedor.
 * Muestra reseñas con opción de responder (POST /reviews/:id/reply).
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from '@/core/components/BlurView';
import { MaterialIcons } from '@expo/vector-icons';
import { MotiView } from '@/core/components/MotiView';
import { router } from 'expo-router';
import api from '@/core/api/axiosinstance';
import { replyToReview } from '@/features/reviews/services/review.service';
import { useProfile } from '@/features/profile/state/ProfileContext';
import { TOKENS } from '@/core/design-system/tokens';
import { Button, Text as AppText, useThemeColors, wash } from '@/core/design-system';

interface ReviewItem {
  id: string;
  reviewer: { firstName: string; lastName?: string };
  rating: number;
  comment: string;
  reply?: string | null;
  createdAt: string;
}

export default function MyReviewsScreen() {
  const tc = useThemeColors();
  const { profile } = useProfile();
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  const loadReviews = useCallback(async () => {
    if (!profile?.id) return;
    try {
      const { data } = await api.get<any>(`/reviews/providers/${profile.id}/reviews`);
      const list = (data as any)?.data ?? (Array.isArray(data) ? data : []);
      setReviews(list);
    } catch (err) {
      console.error('Error loading reviews:', err);
    } finally {
      setLoading(false);
    }
  }, [profile?.id]);

  useEffect(() => { loadReviews(); }, [loadReviews]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadReviews();
    setRefreshing(false);
  };

  const handleReply = async (reviewId: string) => {
    if (!replyText.trim()) return;
    setSendingReply(true);
    try {
      await replyToReview(reviewId, replyText.trim());
      setReviews(prev => prev.map(r =>
        r.id === reviewId ? { ...r, reply: replyText.trim() } : r
      ));
      setReplyingTo(null);
      setReplyText('');
      Alert.alert('Respuesta enviada', 'Tu respuesta se publicó correctamente.');
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'No se pudo enviar la respuesta');
    } finally {
      setSendingReply(false);
    }
  };

  function Stars({ rating }: { rating: number }) {
    return (
      <View style={{ flexDirection: 'row', gap: 2 }}>
        {[1, 2, 3, 4, 5].map(s => (
          <MaterialIcons
            key={s}
            name={s <= rating ? 'star' : 'star-outline'}
            size={16}
            color={s <= rating ? '#FFD700' : 'rgba(0,0,0,0.12)'}
          />
        ))}
      </View>
    );
  }

  return (
    <LinearGradient
      colors={wash(tc)}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.bg}
    >
      <BlurView intensity={25} tint="light" style={[styles.header, { borderBottomColor: tc.cardBorder }]}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={[styles.backBtn, { backgroundColor: tc.card }]}>
          <MaterialIcons name="arrow-back" size={24} color={tc.text} />
        </Pressable>
        <AppText variant="h3" color={tc.text}>Mis Reseñas</AppText>
        <View style={{ width: 40 }} />
      </BlurView>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={TOKENS.color.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={reviews}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[TOKENS.color.primary]} />
          }
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <MaterialIcons name="star-outline" size={64} color="rgba(133,0,33,0.15)" />
              <AppText variant="title" color={tc.text}>Sin reseñas todavía</AppText>
              <AppText variant="body" color={tc.textSub} center style={{ paddingHorizontal: 40 }}>
                Cuando los clientes te califiquen, aparecerán acá.
              </AppText>
            </View>
          }
          renderItem={({ item, index }) => (
            <MotiView
              from={{ opacity: 0, translateY: 16 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 300, delay: index * 50 }}
            >
              <BlurView intensity={25} tint="light" style={[styles.reviewCard, { borderColor: tc.cardBorder }]}>
                <View style={styles.reviewHeader}>
                  <View style={styles.reviewerAvatar}>
                    <AppText variant="subtitle" color="#fff">
                      {(item.reviewer?.firstName || '?').charAt(0).toUpperCase()}
                    </AppText>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.reviewerName, { color: tc.text }]}>
                      {item.reviewer?.firstName} {item.reviewer?.lastName || ''}
                    </Text>
                    <Stars rating={item.rating} />
                  </View>
                  <Text style={[styles.reviewDate, { color: tc.textMuted }]}>
                    {new Date(item.createdAt).toLocaleDateString('es-AR')}
                  </Text>
                </View>

                <AppText variant="body" color={tc.text}>{item.comment}</AppText>

                {/* Provider reply */}
                {item.reply ? (
                  <View style={styles.replyBox}>
                    <View style={styles.replyHeader}>
                      <MaterialIcons name="reply" size={14} color={TOKENS.color.primary} />
                      <AppText variant="caption" weight="700" color={TOKENS.color.primary}>Tu respuesta</AppText>
                    </View>
                    <AppText variant="bodySmall" color={tc.text}>{item.reply}</AppText>
                  </View>
                ) : replyingTo === item.id ? (
                  <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                    <TextInput
                      style={[styles.replyInput, { backgroundColor: tc.surface2, color: tc.text, borderColor: tc.border }]}
                      value={replyText}
                      onChangeText={setReplyText}
                      placeholder="Escribí tu respuesta..."
                      placeholderTextColor={tc.textMuted}
                      multiline
                      maxLength={500}
                      autoFocus
                    />
                    <View style={styles.replyActions}>
                      <Pressable onPress={() => { setReplyingTo(null); setReplyText(''); }}>
                        <AppText
                          variant="body"
                          weight="600"
                          color={tc.textSub}
                          style={{ paddingVertical: 8, paddingHorizontal: 4 }}
                        >
                          Cancelar
                        </AppText>
                      </Pressable>
                      <Button
                        label="Responder"
                        size="sm"
                        onPress={() => handleReply(item.id)}
                        disabled={!replyText.trim()}
                        loading={sendingReply}
                      />
                    </View>
                  </KeyboardAvoidingView>
                ) : (
                  <Pressable
                    style={styles.replyBtn}
                    onPress={() => { setReplyingTo(item.id); setReplyText(''); }}
                  >
                    <MaterialIcons name="reply" size={16} color={TOKENS.color.primary} />
                    <AppText variant="label" color={TOKENS.color.primary}>Responder</AppText>
                  </Pressable>
                )}
              </BlurView>
            </MotiView>
          )}
        />
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 16,
    overflow: 'hidden',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.6)',
  },
  backBtn: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContent: { padding: 24, paddingBottom: 40, gap: 14 },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 12 },
  // Review card
  reviewCard: {
    padding: 16,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.85)',
    gap: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  reviewerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: TOKENS.color.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewerName: { fontSize: 15, fontWeight: '700', color: TOKENS.color.text },
  reviewDate: { fontSize: 11, color: 'rgba(107,107,107,0.5)' },
  // Reply
  replyBox: {
    backgroundColor: 'rgba(133,0,33,0.05)',
    borderRadius: 12,
    padding: 12,
    gap: 6,
  },
  replyHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  replyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(133,0,33,0.06)',
  },
  replyInput: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: TOKENS.color.text,
    minHeight: 80,
    borderWidth: 1.5,
    borderColor: 'rgba(200,200,220,0.5)',
  },
  replyActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 8,
  },
});
