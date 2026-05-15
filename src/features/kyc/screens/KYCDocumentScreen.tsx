/**
 * KYCDocumentScreen — Upload de documentos de identidad.
 * Permite seleccionar el tipo de documento y subir frente, dorso y selfie.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from '@/core/components/BlurView';
import { MaterialIcons } from '@expo/vector-icons';
import { MotiView } from '@/core/components/MotiView';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useKYC } from '../state/KYCContext';
import { DocumentType } from '../types/kyc.types';
import { TOKENS } from '@/core/design-system/tokens';

const DOCUMENT_TYPES: { value: DocumentType; label: string }[] = [
  { value: 'DNI',      label: 'DNI (Argentina)' },
  { value: 'CEDULA',   label: 'Cédula' },
  { value: 'PASAPORTE', label: 'Pasaporte' },
  { value: 'RUT',      label: 'RUT (Chile/Uruguay)' },
];

interface DocumentPhoto {
  uri: string;
}

export default function KYCDocumentScreen() {
  const { submit, loading, error, clearError } = useKYC();

  const [docType, setDocType] = useState<DocumentType>('DNI');
  const [front, setFront] = useState<DocumentPhoto | null>(null);
  const [back, setBack] = useState<DocumentPhoto | null>(null);
  const [selfie, setSelfie] = useState<DocumentPhoto | null>(null);

  const pickImage = async (type: 'front' | 'back' | 'selfie') => {
    // Pedir permiso a la galería
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a tu galería para continuar.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
      aspect: type === 'selfie' ? [1, 1] : [4, 3],
    });

    if (!result.canceled && result.assets.length > 0) {
      const uri = result.assets[0].uri;
      if (type === 'front')  setFront({ uri });
      if (type === 'back')   setBack({ uri });
      if (type === 'selfie') setSelfie({ uri });
    }
  };

  const canSubmit = front && back && selfie;

  const handleSubmit = async () => {
    if (!canSubmit) return;

    clearError();
    try {
      await submit({
        documentType: docType,
        documentFront: front.uri,
        documentBack: back.uri,
        selfie: selfie.uri,
      });
      router.replace('/(tabs)/profile/kyc');
    } catch {
      // El error ya está en el contexto
    }
  };

  const PhotoSlot = ({
    label,
    hint,
    icon,
    photo,
    onPress,
  }: {
    label: string;
    hint: string;
    icon: any;
    photo: DocumentPhoto | null;
    onPress: () => void;
  }) => (
    <Pressable
      style={({ pressed }) => [styles.photoSlot, pressed && styles.photoSlotPressed]}
      onPress={onPress}
    >
      {photo ? (
        <>
          <Image source={{ uri: photo.uri }} style={styles.photoPreview} />
          <View style={styles.photoCheck}>
            <MaterialIcons name="check-circle" size={28} color="#16a34a" />
          </View>
        </>
      ) : (
        <View style={styles.photoEmpty}>
          <MaterialIcons name={icon} size={32} color="rgba(133,0,33,0.3)" />
          <Text style={styles.photoLabel}>{label}</Text>
          <Text style={styles.photoHint}>{hint}</Text>
        </View>
      )}
    </Pressable>
  );

  return (
    <LinearGradient
      colors={['#fdf2f4', '#fef7ff', '#f0f4ff']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.background}
    >
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color={TOKENS.color.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Subir documentos</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Tipo de documento */}
        <MotiView
          from={{ opacity: 0, translateY: 16 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400 }}
        >
          <BlurView intensity={25} tint="light" style={styles.card}>
            <Text style={styles.cardTitle}>Tipo de documento</Text>
            <View style={styles.docTypeGrid}>
              {DOCUMENT_TYPES.map(dt => (
                <Pressable
                  key={dt.value}
                  style={[
                    styles.docTypeButton,
                    docType === dt.value && styles.docTypeButtonActive,
                  ]}
                  onPress={() => setDocType(dt.value)}
                >
                  <Text style={[
                    styles.docTypeText,
                    docType === dt.value && styles.docTypeTextActive,
                  ]}>
                    {dt.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </BlurView>
        </MotiView>

        {/* Fotos del documento */}
        <MotiView
          from={{ opacity: 0, translateY: 16 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400, delay: 100 }}
        >
          <BlurView intensity={25} tint="light" style={styles.card}>
            <Text style={styles.cardTitle}>Fotos del documento</Text>
            <View style={styles.photosRow}>
              <PhotoSlot
                label="Frente"
                hint="Lado con tu foto"
                icon="credit-card"
                photo={front}
                onPress={() => pickImage('front')}
              />
              <PhotoSlot
                label="Dorso"
                hint="Lado trasero"
                icon="flip"
                photo={back}
                onPress={() => pickImage('back')}
              />
            </View>
          </BlurView>
        </MotiView>

        {/* Selfie */}
        <MotiView
          from={{ opacity: 0, translateY: 16 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400, delay: 200 }}
        >
          <BlurView intensity={25} tint="light" style={styles.card}>
            <Text style={styles.cardTitle}>Selfie de verificación</Text>
            <Text style={styles.cardSubtitle}>
              Sacate una foto sosteniendo el documento junto a tu rostro.
            </Text>
            <PhotoSlot
              label="Selfie con documento"
              hint="Tocá para elegir"
              icon="face"
              photo={selfie}
              onPress={() => pickImage('selfie')}
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

        {/* Botón enviar */}
        <MotiView
          from={{ opacity: 0, translateY: 16 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400, delay: 300 }}
        >
          <Pressable
            onPress={handleSubmit}
            disabled={!canSubmit || loading}
            style={({ pressed }) => [
              styles.submitButton,
              !canSubmit && styles.submitButtonDisabled,
              pressed && canSubmit && styles.buttonPressed,
            ]}
          >
            <LinearGradient
              colors={canSubmit
                ? [TOKENS.color.primary, '#a0032a', TOKENS.color.primaryDark]
                : ['#ccc', '#bbb']
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.buttonGradient}
            >
              {loading
                ? <ActivityIndicator color="#fff" size="small" />
                : (
                  <>
                    <Text style={styles.submitButtonText}>
                      {canSubmit ? 'Enviar documentos' : `Faltan ${[!front, !back, !selfie].filter(Boolean).length} foto(s)`}
                    </Text>
                    {canSubmit && <MaterialIcons name="upload" size={18} color="#fff" />}
                  </>
                )
              }
            </LinearGradient>
          </Pressable>
        </MotiView>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  container: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 24,
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
  card: {
    borderRadius: 20,
    overflow: 'hidden',
    padding: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.85)',
    gap: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: TOKENS.color.text,
  },
  cardSubtitle: {
    fontSize: 13,
    color: TOKENS.color.sub,
    marginTop: -8,
  },
  docTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  docTypeButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(200,200,220,0.5)',
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  docTypeButtonActive: {
    borderColor: TOKENS.color.primary,
    backgroundColor: 'rgba(133,0,33,0.08)',
  },
  docTypeText: {
    fontSize: 13,
    fontWeight: '500',
    color: TOKENS.color.sub,
  },
  docTypeTextActive: {
    color: TOKENS.color.primary,
    fontWeight: '700',
  },
  photosRow: {
    flexDirection: 'row',
    gap: 12,
  },
  photoSlot: {
    flex: 1,
    height: 130,
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(133,0,33,0.25)',
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  photoSlotPressed: { opacity: 0.8 },
  photoPreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  photoCheck: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: '#fff',
    borderRadius: 14,
  },
  photoEmpty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    padding: 8,
  },
  photoLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: TOKENS.color.text,
    textAlign: 'center',
  },
  photoHint: {
    fontSize: 11,
    color: TOKENS.color.sub,
    textAlign: 'center',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fee2e2',
    borderRadius: 12,
    padding: 12,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: '#dc2626',
  },
  submitButton: {
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: TOKENS.color.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  submitButtonDisabled: {
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonPressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  buttonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
