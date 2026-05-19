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

interface ReviewItem {
  id: string;
  reviewer: { firstName: string; lastName?: string };
  rating: number;
  comment: string;
  reply?: string | null;
  createdAt: string;
}

export default function MyReviewsScreen() {
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
      colors={['#fdf2f4', '#fef7ff', '#f0f4ff']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.bg}
    >
      <BlurView intensity={25} tint="light" style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color={TOKENS.color.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Mis Reseñas</Text>
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
              <Text style={styles.emptyTitle}>Sin reseñas todavía</Text>
              <Text style={styles.emptySub}>Cuando los clientes te califiquen, aparecerán acá.</Text>
            </View>
          }
          renderItem={({ item, index }) => (
            <MotiView
              from={{ opacity: 0, translateY: 16 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 300, delay: index * 50 }}
            >
              <BlurView intensity={25} tint="light" style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <View style={styles.reviewerAvatar}>
                    <Text style={styles.reviewerInitial}>
                      {(item.reviewer?.firstName || '?').charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.reviewerName}>
                      {item.reviewer?.firstName} {item.reviewer?.lastName || ''}
                    </Text>
                    <Stars rating={item.rating} />
                  </View>
                  <Text style={styles.reviewDate}>
                    {new Date(item.createdAt).toLocaleDateString('es-AR')}
                  </Text>
                </View>

                <Text style={styles.reviewComment}>{item.comment}</Text>

                {/* Provider reply */}
                {item.reply ? (
                  <View style={styles.replyBox}>
                    <View style={styles.replyHeader}>
                      <MaterialIcons name="reply" size={14} color={TOKENS.color.primary} />
                      <Text style={styles.replyLabel}>Tu respuesta</Text>
                    </View>
                    <Text style={styles.replyText}>{item.reply}</Text>
                  </View>
                ) : replyingTo === item.id ? (
                  <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                    <TextInput
                      style={styles.replyInput}
                      value={replyText}
                      onChangeText={setReplyText}
                      placeholder="Escribí tu respuesta..."
                      placeholderTextColor="rgba(107,107,107,0.4)"
                      multiline
                      maxLength={500}
                      autoFocus
                    />
                    <View style={styles.replyActions}>
                      <Pressable onPress={() => { setReplyingTo(null); setReplyText(''); }}>
                        <Text style={styles.cancelReplyText}>Cancelar</Text>
                      </Pressable>
                      <Pressable
                        style={[styles.sendReplyBtn, (!replyText.trim() || sendingReply) && { opacity: 0.5 }]}
                        onPress={() => handleReply(item.id)}
                        disabled={!replyText.trim() || sendingReply}
                      >
                        {sendingReply ? (
                          <ActivityIndicator color="#fff" size="small" />
                        ) : (
                          <Text style={styles.sendReplyText}>Responder</Text>
                        )}
                      </Pressable>
                    </View>
                  </KeyboardAvoidingView>
                ) : (
                  <Pressable
                    style={styles.replyBtn}
                    onPress={() => { setReplyingTo(item.id); setReplyText(''); }}
                  >
                    <MaterialIcons name="reply" size={16} color={TOKENS.color.primary} />
                    <Text style={styles.replyBtnText}>Responder</Text>
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
  headerTitle: { fontSize: 20, fontWeight: '800', color: TOKENS.color.text },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContent: { padding: 24, paddingBottom: 40, gap: 14 },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: TOKENS.color.text },
  emptySub: { fontSize: 14, color: TOKENS.color.sub, textAlign: 'center', paddingHorizontal: 40 },
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
  reviewerInitial: { fontSize: 16, fontWeight: '700', color: '#fff' },
  reviewerName: { fontSize: 15, fontWeight: '700', color: TOKENS.color.text },
  reviewDate: { fontSize: 11, color: 'rgba(107,107,107,0.5)' },
  reviewComment: { fontSize: 14, color: TOKENS.color.text, lineHeight: 20 },
  // Reply
  replyBox: {
    backgroundColor: 'rgba(133,0,33,0.05)',
    borderRadius: 12,
    padding: 12,
    gap: 6,
  },
  replyHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  replyLabel: { fontSize: 12, fontWeight: '700', color: TOKENS.color.primary },
  replyText: { fontSize: 13, color: TOKENS.color.text, lineHeight: 18 },
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
  replyBtnText: { fontSize: 13, fontWeight: '600', color: TOKENS.color.primary },
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
  cancelReplyText: { fontSize: 14, color: TOKENS.color.sub, fontWeight: '600', paddingVertical: 8, paddingHorizontal: 4 },
  sendReplyBtn: {
    backgroundColor: TOKENS.color.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    minWidth: 100,
    alignItems: 'center',
  },
  sendReplyText: { fontSize: 14, fontWeight: '700', color: '#fff' },
});
