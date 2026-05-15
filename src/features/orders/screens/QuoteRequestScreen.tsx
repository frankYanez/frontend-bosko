/**
 * QuoteRequestScreen — Formulario para solicitar un servicio.
 * El cliente completa los datos y crea una orden (POST /orders).
 * Se accede desde ProviderProfileScreen al tocar "Cotizar servicio".
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from '@/core/components/BlurView';
import { MaterialIcons } from '@expo/vector-icons';
import { MotiView } from '@/core/components/MotiView';
import { router, useLocalSearchParams } from 'expo-router';
import { useOrders } from '../state/OrdersContext';
import { TOKENS } from '@/core/design-system/tokens';

const { width } = Dimensions.get('window');

export default function QuoteRequestScreen() {
  const params = useLocalSearchParams<{ serviceId: string; providerName?: string; serviceTitle?: string }>();
  const { addOrder } = useOrders();

  const [message, setMessage] = useState('');
  const [address, setAddress] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!message.trim()) {
      Alert.alert('Campo requerido', 'Describí qué necesitás para que el proveedor pueda cotizar.');
      return;
    }

    if (!params.serviceId) {
      Alert.alert('Error', 'No se encontró el servicio. Volvé e intentá nuevamente.');
      return;
    }

    setIsLoading(true);
    try {
      await addOrder({
        serviceId: params.serviceId,
        message: message.trim(),
        address: address.trim() || undefined,
        scheduledDate: scheduledDate.trim() || undefined,
      });

      Alert.alert(
        '¡Solicitud enviada!',
        'El proveedor recibirá tu solicitud y te responderá pronto.',
        [{ text: 'Ver mis órdenes', onPress: () => router.replace('/(tabs)/orders') }],
      );
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'No se pudo enviar la solicitud';
      Alert.alert('Error', Array.isArray(msg) ? msg.join('\n') : msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={['#fdf2f4', '#fef7ff', '#f0f4ff']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.background}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backButton}>
              <MaterialIcons name="arrow-back" size={24} color={TOKENS.color.text} />
            </Pressable>
            <Text style={styles.headerTitle}>Solicitar servicio</Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Info del servicio */}
          {params.serviceTitle && (
            <MotiView
              from={{ opacity: 0, translateY: 16 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 400 }}
            >
              <BlurView intensity={25} tint="light" style={styles.serviceInfo}>
                <MaterialIcons name="work" size={20} color={TOKENS.color.primary} />
                <View style={styles.serviceInfoText}>
                  <Text style={styles.serviceTitle}>{params.serviceTitle}</Text>
                  {params.providerName && (
                    <Text style={styles.providerName}>por {params.providerName}</Text>
                  )}
                </View>
              </BlurView>
            </MotiView>
          )}

          {/* Formulario */}
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 450, delay: 100 }}
          >
            <BlurView intensity={30} tint="light" style={styles.card}>
              {/* Mensaje al proveedor (requerido) */}
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>
                  Mensaje al proveedor <Text style={styles.required}>*</Text>
                </Text>
                <Text style={styles.fieldHint}>
                  Describí qué necesitás, cuándo y cualquier detalle relevante.
                </Text>
                <TextInput
                  style={[styles.textArea]}
                  placeholder="Ej: Necesito una instalación eléctrica en 3 habitaciones. Tengo los materiales..."
                  placeholderTextColor={TOKENS.color.sub}
                  value={message}
                  onChangeText={setMessage}
                  multiline
                  numberOfLines={5}
                  textAlignVertical="top"
                  maxLength={500}
                />
                <Text style={styles.charCount}>{message.length}/500</Text>
              </View>

              {/* Dirección (opcional) */}
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Dirección del trabajo</Text>
                <Text style={styles.fieldHint}>Opcional — dónde se realizará el servicio.</Text>
                <View style={styles.inputWrapper}>
                  <MaterialIcons name="location-on" size={20} color={TOKENS.color.sub} />
                  <TextInput
                    style={styles.input}
                    placeholder="Ej: Av. Corrientes 1234, CABA"
                    placeholderTextColor={TOKENS.color.sub}
                    value={address}
                    onChangeText={setAddress}
                    returnKeyType="next"
                  />
                </View>
              </View>

              {/* Fecha deseada (opcional) */}
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Fecha deseada</Text>
                <Text style={styles.fieldHint}>Opcional — cuándo preferís que se realice.</Text>
                <View style={styles.inputWrapper}>
                  <MaterialIcons name="event" size={20} color={TOKENS.color.sub} />
                  <TextInput
                    style={styles.input}
                    placeholder="Ej: Sábado por la mañana"
                    placeholderTextColor={TOKENS.color.sub}
                    value={scheduledDate}
                    onChangeText={setScheduledDate}
                    returnKeyType="done"
                  />
                </View>
              </View>

              {/* Aviso */}
              <View style={styles.notice}>
                <MaterialIcons name="info-outline" size={16} color={TOKENS.color.primary} />
                <Text style={styles.noticeText}>
                  El proveedor verá tu solicitud y podrá aceptarla o rechazarla.
                  El precio final se acuerda entre ambas partes.
                </Text>
              </View>

              {/* Botón enviar */}
              <Pressable
                onPress={handleSubmit}
                disabled={isLoading}
                style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
              >
                <LinearGradient
                  colors={[TOKENS.color.primary, '#a0032a', TOKENS.color.primaryDark]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.buttonGradient}
                >
                  {isLoading
                    ? <ActivityIndicator color="#fff" size="small" />
                    : (
                      <View style={styles.buttonContent}>
                        <MaterialIcons name="send" size={18} color="#fff" />
                        <Text style={styles.buttonText}>Enviar solicitud</Text>
                      </View>
                    )
                  }
                </LinearGradient>
              </Pressable>
            </BlurView>
          </MotiView>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  flex: { flex: 1 },
  container: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 20,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  backButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: TOKENS.color.text,
  },
  serviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.85)',
    overflow: 'hidden',
  },
  serviceInfoText: { flex: 1 },
  serviceTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: TOKENS.color.text,
  },
  providerName: {
    fontSize: 13,
    color: TOKENS.color.sub,
    marginTop: 2,
  },
  card: {
    borderRadius: 24,
    overflow: 'hidden',
    padding: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.85)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 8,
    gap: 4,
  },
  fieldContainer: { marginBottom: 16 },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: TOKENS.color.text,
    marginBottom: 4,
  },
  fieldHint: {
    fontSize: 12,
    color: TOKENS.color.sub,
    marginBottom: 8,
  },
  required: { color: '#ef4444' },
  textArea: {
    backgroundColor: 'rgba(255,255,255,0.75)',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(200,200,220,0.5)',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: TOKENS.color.text,
    minHeight: 120,
  },
  charCount: {
    fontSize: 11,
    color: TOKENS.color.sub,
    textAlign: 'right',
    marginTop: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.75)',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(200,200,220,0.5)',
    paddingHorizontal: 14,
    paddingVertical: 4,
    gap: 10,
    minHeight: 52,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: TOKENS.color.text,
    paddingVertical: 8,
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: 'rgba(133,0,33,0.06)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  noticeText: {
    flex: 1,
    fontSize: 12,
    color: TOKENS.color.sub,
    lineHeight: 18,
  },
  button: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 4,
    shadowColor: TOKENS.color.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  buttonPressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  buttonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
