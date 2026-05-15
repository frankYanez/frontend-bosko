/**
 * DeleteAccountScreen — Eliminar cuenta del usuario.
 * DELETE /users/me — requiere confirmación por escrito.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from '@/core/components/BlurView';
import { MaterialIcons } from '@expo/vector-icons';
import { MotiView } from '@/core/components/MotiView';
import { router } from 'expo-router';
import { useAuth } from '@/features/auth/state/AuthContext';
import api from '@/core/api/axiosinstance';
import { TOKENS } from '@/core/design-system/tokens';

const CONFIRM_WORD = 'ELIMINAR';

const WARNINGS = [
  'Tu perfil y datos personales serán eliminados permanentemente.',
  'Tus servicios publicados serán dados de baja.',
  'No podrás recuperar tu historial de órdenes ni conversaciones.',
  'Esta acción no tiene vuelta atrás.',
];

export default function DeleteAccountScreen() {
  const { logout } = useAuth();

  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const canDelete = confirmText === CONFIRM_WORD;

  const handleDelete = async () => {
    if (!canDelete) return;

    Alert.alert(
      'Última confirmación',
      '¿Estás absolutamente seguro? Esta acción eliminará tu cuenta para siempre.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sí, eliminar',
          style: 'destructive',
          onPress: async () => {
            setError('');
            setLoading(true);
            try {
              await api.delete('/users/me');
              await logout();
              router.replace('/login');
            } catch (err: any) {
              const code = err?.response?.data?.code;
              if (code === 'NOT_FOUND') setError('Usuario no encontrado.');
              else setError('Error al eliminar la cuenta. Intentá más tarde.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <LinearGradient
      colors={['#fff5f5', '#fef7ff', '#f0f4ff']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.bg}
    >
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
            <MaterialIcons name="arrow-back" size={24} color={TOKENS.color.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Eliminar cuenta</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Ícono de advertencia */}
        <MotiView
          from={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', damping: 14 }}
          style={styles.warningIconWrap}
        >
          <View style={styles.warningCircle}>
            <MaterialIcons name="warning" size={48} color="#dc2626" />
          </View>
          <Text style={styles.warningTitle}>Zona de peligro</Text>
          <Text style={styles.warningSubtitle}>
            Esta acción es permanente e irreversible.
          </Text>
        </MotiView>

        {/* Lista de consecuencias */}
        <MotiView
          from={{ opacity: 0, translateY: 16 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400, delay: 100 }}
        >
          <BlurView intensity={25} tint="light" style={styles.card}>
            <Text style={styles.cardTitle}>Si eliminás tu cuenta:</Text>
            {WARNINGS.map((w, i) => (
              <View key={i} style={styles.warningItem}>
                <MaterialIcons name="close" size={16} color="#dc2626" style={{ marginTop: 2 }} />
                <Text style={styles.warningText}>{w}</Text>
              </View>
            ))}
          </BlurView>
        </MotiView>

        {/* Campo de confirmación */}
        <MotiView
          from={{ opacity: 0, translateY: 16 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400, delay: 200 }}
        >
          <BlurView intensity={25} tint="light" style={styles.card}>
            <Text style={styles.confirmLabel}>
              Escribí{' '}
              <Text style={styles.confirmWord}>{CONFIRM_WORD}</Text>
              {' '}para continuar:
            </Text>
            <TextInput
              style={[
                styles.confirmInput,
                canDelete && styles.confirmInputValid,
              ]}
              value={confirmText}
              onChangeText={setConfirmText}
              placeholder={CONFIRM_WORD}
              placeholderTextColor="rgba(30,30,30,0.25)"
              autoCapitalize="characters"
              autoCorrect={false}
            />
          </BlurView>
        </MotiView>

        {/* Error */}
        {!!error && (
          <View style={styles.errorBanner}>
            <MaterialIcons name="error-outline" size={16} color="#dc2626" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Botón eliminar */}
        <MotiView
          from={{ opacity: 0, translateY: 16 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400, delay: 300 }}
        >
          <Pressable
            onPress={handleDelete}
            disabled={!canDelete || loading}
            style={({ pressed }) => [
              styles.deleteBtn,
              !canDelete && styles.deleteBtnDisabled,
              pressed && canDelete && styles.btnPressed,
            ]}
          >
            <LinearGradient
              colors={canDelete ? ['#dc2626', '#b91c1c', '#991b1b'] : ['#ccc', '#bbb']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.btnGradient}
            >
              {loading
                ? <ActivityIndicator color="#fff" size="small" />
                : (
                  <>
                    <MaterialIcons name="delete-forever" size={20} color="#fff" />
                    <Text style={styles.btnText}>Eliminar mi cuenta</Text>
                  </>
                )
              }
            </LinearGradient>
          </Pressable>
        </MotiView>

        {/* Cancelar */}
        <Pressable onPress={() => router.back()} style={styles.cancelRow}>
          <Text style={styles.cancelText}>Cancelar, mantener mi cuenta</Text>
        </Pressable>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  scroll: { paddingTop: 60, paddingBottom: 40, paddingHorizontal: 24, gap: 16 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  backBtn: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: TOKENS.color.text },
  warningIconWrap: { alignItems: 'center', gap: 10, paddingVertical: 8 },
  warningCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#fef2f2',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fecaca',
  },
  warningTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#dc2626',
    textAlign: 'center',
  },
  warningSubtitle: {
    fontSize: 14,
    color: TOKENS.color.sub,
    textAlign: 'center',
  },
  card: {
    borderRadius: 20,
    overflow: 'hidden',
    padding: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.85)',
    gap: 12,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: TOKENS.color.text },
  warningItem: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: TOKENS.color.sub,
    lineHeight: 18,
  },
  confirmLabel: {
    fontSize: 14,
    color: TOKENS.color.sub,
    lineHeight: 20,
  },
  confirmWord: {
    fontWeight: '800',
    color: '#dc2626',
    letterSpacing: 1,
  },
  confirmInput: {
    borderWidth: 2,
    borderColor: 'rgba(200,200,220,0.5)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: '700',
    color: TOKENS.color.text,
    letterSpacing: 2,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  confirmInputValid: {
    borderColor: '#dc2626',
    backgroundColor: '#fff5f5',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fee2e2',
    borderRadius: 12,
    padding: 12,
  },
  errorText: { flex: 1, fontSize: 13, color: '#dc2626' },
  deleteBtn: {
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#dc2626',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  deleteBtnDisabled: { shadowOpacity: 0, elevation: 0 },
  btnPressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  btnGradient: {
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  cancelRow: { alignItems: 'center', paddingVertical: 12 },
  cancelText: {
    fontSize: 14,
    color: TOKENS.color.sub,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
