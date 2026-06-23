import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';

import { TOKENS } from '@/core/design-system/tokens';
import {
  BackgroundCheckState,
  BackgroundCheckStatus,
  getBackgroundCheckStatus,
  uploadBackgroundCheck,
} from '../services/background-check.service';

const C = {
  primary: TOKENS.color.primary,
  dark:    TOKENS.color.primaryDark,
  bg:      '#F7F7FA',
  card:    '#FFFFFF',
  text:    '#1A1A1A',
  sub:     '#6B7280',
  border:  '#EDEDF0',
  green:   '#22C55E',
  amber:   '#F59E0B',
  red:     '#EF4444',
  blue:    '#3B82F6',
};

const STATUS_CONFIG: Record<BackgroundCheckStatus, { label: string; color: string; bg: string; icon: React.ComponentProps<typeof Ionicons>['name'] }> = {
  NOT_SUBMITTED: { label: 'Sin enviar',       color: C.sub,   bg: '#F3F4F6', icon: 'document-outline' },
  UNDER_REVIEW:  { label: 'En revisión',      color: C.amber, bg: '#FFF8E1', icon: 'time-outline' },
  APPROVED:      { label: 'Aprobado',         color: C.green, bg: '#F0FFF4', icon: 'checkmark-circle' },
  REJECTED:      { label: 'Rechazado',        color: C.red,   bg: '#FEF2F2', icon: 'close-circle' },
};

export default function BackgroundCheckScreen() {
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const [state, setState]       = useState<BackgroundCheckState | null>(null);
  const [loading, setLoading]   = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    load();
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getBackgroundCheckStatus();
      setState(data ?? { status: 'NOT_SUBMITTED' });
    } catch {
      setState({ status: 'NOT_SUBMITTED' });
    } finally {
      setLoading(false);
    }
  };

  const handlePickAndUpload = async (source: 'document' | 'camera' | 'gallery') => {
    let uri: string, mimeType: string, fileName: string;

    try {
      if (source === 'document') {
        const result = await DocumentPicker.getDocumentAsync({
          type: ['application/pdf', 'image/jpeg', 'image/png'],
          copyToCacheDirectory: true,
        });
        if (result.canceled) return;
        const asset = result.assets[0];
        uri      = asset.uri;
        mimeType = asset.mimeType ?? 'application/pdf';
        fileName = asset.name ?? 'antecedentes.pdf';
      } else if (source === 'camera') {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (perm.status !== 'granted') {
          Alert.alert('Permiso requerido', 'Necesitamos acceso a la cámara.');
          return;
        }
        const result = await ImagePicker.launchCameraAsync({ quality: 0.9 });
        if (result.canceled) return;
        uri      = result.assets[0].uri;
        mimeType = 'image/jpeg';
        fileName = 'antecedentes.jpg';
      } else {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (perm.status !== 'granted') {
          Alert.alert('Permiso requerido', 'Necesitamos acceso a tu galería.');
          return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.9 });
        if (result.canceled) return;
        uri      = result.assets[0].uri;
        mimeType = 'image/jpeg';
        fileName = 'antecedentes.jpg';
      }
    } catch {
      Alert.alert('Error', 'No se pudo seleccionar el archivo.');
      return;
    }

    setUploading(true);
    try {
      await uploadBackgroundCheck(uri, mimeType, fileName);
      await load();
      Alert.alert('¡Enviado!', 'Tu documento fue enviado y está bajo revisión del equipo de Bosko.');
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? 'No se pudo subir el documento.';
      Alert.alert('Error', Array.isArray(msg) ? msg.join('\n') : msg);
    } finally {
      setUploading(false);
    }
  };

  const showPickerOptions = () => {
    Alert.alert('Subir documento', 'Elegí cómo querés adjuntar tu certificado', [
      { text: 'PDF o imagen desde archivos', onPress: () => handlePickAndUpload('document') },
      { text: 'Tomar foto', onPress: () => handlePickAndUpload('camera') },
      { text: 'Elegir de galería', onPress: () => handlePickAndUpload('gallery') },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  };

  const status   = state?.status ?? 'NOT_SUBMITTED';
  const cfg      = STATUS_CONFIG[status];
  const canUpload = status === 'NOT_SUBMITTED' || status === 'REJECTED';

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

      {/* Header */}
      <View style={s.header}>
        <Pressable onPress={() => router.back()} style={s.backBtn} hitSlop={8}>
          <Ionicons name="arrow-back" size={20} color={C.text} />
        </Pressable>
        <Text style={s.headerTitle}>Antecedentes penales</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 40 }]} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim }}>

          {/* Hero */}
          <LinearGradient colors={[C.dark, C.primary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.hero}>
            <View style={s.heroIconWrap}>
              <Ionicons name="shield-checkmark" size={32} color="#fff" />
            </View>
            <Text style={s.heroTitle}>Certificado de antecedentes</Text>
            <Text style={s.heroSub}>
              Subí tu certificado del Registro Nacional de Reincidencia para generar confianza con tus clientes.
            </Text>
          </LinearGradient>

          {/* Estado actual */}
          {loading ? (
            <ActivityIndicator color={C.primary} style={{ marginTop: 40 }} />
          ) : (
            <>
              <View style={[s.statusCard, { backgroundColor: cfg.bg }]}>
                <Ionicons name={cfg.icon} size={22} color={cfg.color} />
                <View style={{ flex: 1 }}>
                  <Text style={[s.statusLabel, { color: cfg.color }]}>{cfg.label}</Text>
                  {state?.notes ? (
                    <Text style={s.statusNotes}>{state.notes}</Text>
                  ) : null}
                  {state?.reviewedAt ? (
                    <Text style={s.statusDate}>
                      Revisado: {new Date(state.reviewedAt).toLocaleDateString('es-AR')}
                    </Text>
                  ) : null}
                </View>
              </View>

              {/* Info */}
              <View style={s.infoCard}>
                <Text style={s.infoTitle}>¿Cómo obtener el certificado?</Text>
                {[
                  'Ingresá a www.argentina.gob.ar/reincidencia',
                  'Iniciá sesión con tu CUIL y clave fiscal',
                  'Solicitá el certificado de antecedentes penales',
                  'Descargá el PDF y subilo acá',
                ].map((step, i) => (
                  <View key={i} style={s.step}>
                    <View style={s.stepNum}>
                      <Text style={s.stepNumText}>{i + 1}</Text>
                    </View>
                    <Text style={s.stepText}>{step}</Text>
                  </View>
                ))}
              </View>

              {/* Formatos */}
              <View style={s.formatsRow}>
                {['PDF', 'JPG', 'PNG'].map(fmt => (
                  <View key={fmt} style={s.formatChip}>
                    <Ionicons name="document-outline" size={13} color={C.sub} />
                    <Text style={s.formatText}>{fmt}</Text>
                  </View>
                ))}
                <Text style={s.formatNote}>Tamaño máximo: 10 MB</Text>
              </View>

              {/* Botón */}
              {canUpload && (
                <View style={s.uploadBtnShadow}>
                  <Pressable
                    onPress={showPickerOptions}
                    disabled={uploading}
                    style={({ pressed }) => [s.uploadBtn, pressed && { opacity: 0.85 }]}
                  >
                  <LinearGradient colors={[C.dark, C.primary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.uploadBtnGrad}>
                    {uploading
                      ? <ActivityIndicator color="#fff" />
                      : <>
                          <Ionicons name="cloud-upload-outline" size={20} color="#fff" />
                          <Text style={s.uploadBtnText}>
                            {status === 'REJECTED' ? 'Subir nuevo documento' : 'Subir certificado'}
                          </Text>
                        </>
                    }
                  </LinearGradient>
                </Pressable>
                </View>
              )}

              {status === 'UNDER_REVIEW' && (
                <View style={s.reviewNote}>
                  <Ionicons name="information-circle-outline" size={16} color={C.amber} />
                  <Text style={s.reviewNoteText}>El equipo de Bosko revisará tu documento en un plazo de 1-3 días hábiles.</Text>
                </View>
              )}
            </>
          )}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root:         { flex: 1, backgroundColor: C.bg },
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  backBtn:      { width: 36, height: 36, borderRadius: 12, backgroundColor: C.card, alignItems: 'center', justifyContent: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4 },
  headerTitle:  { fontSize: 17, fontWeight: '700', color: C.text },
  scroll:       { paddingHorizontal: 16, paddingTop: 4 },

  hero:         { borderRadius: 20, padding: 24, marginBottom: 16, gap: 10 },
  heroIconWrap: { width: 56, height: 56, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  heroTitle:    { fontSize: 20, fontWeight: '800', color: '#fff', letterSpacing: -0.3 },
  heroSub:      { fontSize: 13, color: 'rgba(255,255,255,0.75)', lineHeight: 19 },

  statusCard:   { flexDirection: 'row', alignItems: 'flex-start', gap: 12, borderRadius: 16, padding: 16, marginBottom: 16 },
  statusLabel:  { fontSize: 15, fontWeight: '700' },
  statusNotes:  { fontSize: 13, color: C.sub, marginTop: 3 },
  statusDate:   { fontSize: 12, color: C.sub, marginTop: 2 },

  infoCard:     { backgroundColor: C.card, borderRadius: 16, padding: 18, marginBottom: 14, gap: 12, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
  infoTitle:    { fontSize: 15, fontWeight: '700', color: C.text, marginBottom: 4 },
  step:         { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  stepNum:      { width: 22, height: 22, borderRadius: 11, backgroundColor: C.primary + '18', alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  stepNumText:  { fontSize: 11, fontWeight: '700', color: C.primary },
  stepText:     { flex: 1, fontSize: 13, color: C.sub, lineHeight: 19 },

  formatsRow:   { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20, flexWrap: 'wrap' },
  formatChip:   { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.card, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: C.border },
  formatText:   { fontSize: 12, fontWeight: '600', color: C.sub },
  formatNote:   { fontSize: 12, color: C.sub, marginLeft: 4 },

  uploadBtn:    { borderRadius: 14, overflow: 'hidden' },
  uploadBtnShadow: { borderRadius: 14, elevation: 4, shadowColor: C.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10 },
  uploadBtnGrad:{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16 },
  uploadBtnText:{ fontSize: 15, fontWeight: '700', color: '#fff' },

  reviewNote:   { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: '#FFF8E1', borderRadius: 12, padding: 14, marginTop: 16 },
  reviewNoteText: { flex: 1, fontSize: 13, color: C.amber, lineHeight: 18 },
});
