/**
 * ReviewScreen — Calificar orden completada.
 * POST /reviews con star rating + comentario.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { MaterialIcons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { router, useLocalSearchParams } from 'expo-router';
import { createReview } from '@/features/reviews/services/review.service';
import { TOKENS } from '@/core/design-system/tokens';

const LABELS = ['Pésimo', 'Malo', 'Regular', 'Bueno', 'Excelente'];

export default function ReviewScreen() {
  const { orderId, providerName, serviceName } = useLocalSearchParams<{
    orderId: string;
    providerName?: string;
    serviceName?: string;
  }>();

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const displayRating = hoverRating || rating;

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Calificación requerida', 'Seleccioná una cantidad de estrellas.');
      return;
    }

    setSubmitting(true);
    try {
      await createReview({ orderId: orderId!, rating, comment: comment.trim() });
      Alert.alert('¡Gracias!', 'Tu reseña ayuda a la comunidad.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'No se pudo enviar la reseña');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <LinearGradient
      colors={['#fdf2f4', '#fef7ff', '#f0f4ff']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.bg}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <MotiView
          from={{ opacity: 0, translateY: -20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', damping: 16 }}
          style={styles.header}
        >
          <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
            <MaterialIcons name="arrow-back" size={24} color={TOKENS.color.text} />
          </Pressable>
        </MotiView>

        {/* Icon */}
        <MotiView
          from={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', damping: 12, stiffness: 150 }}
          style={styles.iconWrap}
        >
          <LinearGradient
            colors={['#850021', '#4A0F20']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.iconGrad}
          >
            <MaterialIcons name="rate-review" size={40} color="#FFD700" />
          </LinearGradient>
        </MotiView>

        {/* Title */}
        <MotiView
          from={{ opacity: 0, translateY: 16 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400, delay: 100 }}
          style={styles.titleSection}
        >
          <Text style={styles.title}>Calificá el servicio</Text>
          {serviceName && <Text style={styles.subtitle}>{serviceName}</Text>}
          {providerName && (
            <Text style={styles.provider}>por {providerName}</Text>
          )}
        </MotiView>

        {/* Stars */}
        <MotiView
          from={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', damping: 12, delay: 200 }}
          style={styles.starsContainer}
        >
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map(star => (
              <Pressable
                key={star}
                onPress={() => setRating(star)}
                onPressIn={() => setHoverRating(star)}
                onPressOut={() => setHoverRating(0)}
                hitSlop={8}
              >
                <MaterialIcons
                  name={star <= displayRating ? 'star' : 'star-outline'}
                  size={48}
                  color={star <= displayRating ? '#FFD700' : 'rgba(0,0,0,0.15)'}
                  style={styles.star}
                />
              </Pressable>
            ))}
          </View>
          {displayRating > 0 && (
            <MotiView
              from={{ opacity: 0, translateY: -8 }}
              animate={{ opacity: 1, translateY: 0 }}
              style={styles.ratingLabel}
            >
              <Text style={styles.ratingText}>{LABELS[displayRating - 1]}</Text>
            </MotiView>
          )}
        </MotiView>

        {/* Comment */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400, delay: 300 }}
          style={styles.commentCard}
        >
          <BlurView intensity={25} tint="light" style={styles.commentBlur}>
            <Text style={styles.commentLabel}>Contanos tu experiencia</Text>
            <TextInput
              style={styles.commentInput}
              value={comment}
              onChangeText={setComment}
              placeholder="¿Qué te pareció el servicio? ¿Recomendarías al profesional?"
              placeholderTextColor="rgba(107,107,107,0.4)"
              multiline
              maxLength={500}
              textAlignVertical="top"
            />
            <Text style={styles.charCount}>{comment.length}/500</Text>
          </BlurView>
        </MotiView>

        {/* Submit */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400, delay: 400 }}
        >
          <Pressable
            onPress={handleSubmit}
            disabled={submitting || rating === 0}
            style={({ pressed }) => [
              styles.submitBtn,
              (submitting || rating === 0) && styles.submitBtnDisabled,
              pressed && styles.submitBtnPressed,
            ]}
          >
            <LinearGradient
              colors={['#850021', '#4A0F20']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.submitGrad}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <MaterialIcons name="send" size={18} color="#fff" />
                  <Text style={styles.submitText}>Enviar Reseña</Text>
                </>
              )}
            </LinearGradient>
          </Pressable>
        </MotiView>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
    alignItems: 'center',
  },
  header: {
    width: '100%',
    flexDirection: 'row',
    marginBottom: 16,
  },
  backBtn: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  iconWrap: {
    marginBottom: 20,
  },
  iconGrad: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#850021',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  titleSection: { alignItems: 'center', marginBottom: 24, gap: 4 },
  title: { fontSize: 24, fontWeight: '800', color: TOKENS.color.text },
  subtitle: { fontSize: 16, color: TOKENS.color.sub, marginTop: 4 },
  provider: { fontSize: 14, color: TOKENS.color.sub },
  starsContainer: { alignItems: 'center', gap: 12, marginBottom: 28 },
  starsRow: { flexDirection: 'row', gap: 4 },
  star: { marginHorizontal: 2 },
  ratingLabel: {
    backgroundColor: 'rgba(255,215,0,0.15)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  ratingText: { fontSize: 14, fontWeight: '700', color: '#92400e' },
  commentCard: {
    width: '100%',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.85)',
    marginBottom: 24,
  },
  commentBlur: { padding: 20, gap: 10 },
  commentLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: TOKENS.color.text,
  },
  commentInput: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: TOKENS.color.text,
    minHeight: 120,
    borderWidth: 1.5,
    borderColor: 'rgba(200,200,220,0.5)',
  },
  charCount: {
    fontSize: 11,
    color: 'rgba(107,107,107,0.5)',
    alignSelf: 'flex-end',
  },
  submitBtn: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#850021',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnPressed: { transform: [{ scale: 0.97 }] },
  submitGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  submitText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
