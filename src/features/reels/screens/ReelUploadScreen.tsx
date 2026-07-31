import React, { useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { VideoView, useVideoPlayer } from 'expo-video';
import { useQueryClient } from '@tanstack/react-query';
import { uploadReelWithFile } from '../services/reels.service';
import { toast } from '@/core/components/Toast';
import { TOKENS } from '@/core/design-system/tokens';
import { useThemeColors } from '@/stores/theme.store';

const MAX_DURATION_S = 60;
const MAX_TAGS = 8;

export default function ReelUploadScreen() {
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const tc = useThemeColors();

  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [videoMime, setVideoMime] = useState('video/mp4');
  const [duration, setDuration] = useState<number>(0);
  const [description, setDescription] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const tagInputRef = useRef<TextInput>(null);

  const player = useVideoPlayer(videoUri ?? '', p => {
    p.loop = true;
    if (videoUri) p.play();
  });

  // ── Media pick ───────────────────────────────────────────────────────────

  const pickVideo = useCallback(async (source: 'gallery' | 'camera') => {
    const perm = source === 'gallery'
      ? await ImagePicker.requestMediaLibraryPermissionsAsync()
      : await ImagePicker.requestCameraPermissionsAsync();

    if (perm.status !== 'granted') {
      Alert.alert('Permiso requerido', source === 'gallery'
        ? 'Necesitamos acceso a tu galería.'
        : 'Necesitamos acceso a tu cámara.');
      return;
    }

    const result = source === 'gallery'
      ? await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['videos'],
          videoMaxDuration: MAX_DURATION_S,
          quality: 0.7,
        })
      : await ImagePicker.launchCameraAsync({
          mediaTypes: ['videos'],
          videoMaxDuration: MAX_DURATION_S,
          quality: 0.7,
        });

    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];

    if (asset.duration && asset.duration > MAX_DURATION_S * 1000) {
      Alert.alert('Video muy largo', `El video no puede superar ${MAX_DURATION_S} segundos.`);
      return;
    }

    setVideoUri(asset.uri);
    setVideoMime(asset.mimeType ?? 'video/mp4');
    setDuration(asset.duration ? Math.round(asset.duration / 1000) : 0);
  }, []);

  // ── Tags ─────────────────────────────────────────────────────────────────

  const addTag = useCallback((raw: string) => {
    const tag = raw.trim().replace(/^#/, '').toLowerCase();
    if (!tag || tags.includes(tag) || tags.length >= MAX_TAGS) return;
    setTags(prev => [...prev, tag]);
    setTagInput('');
  }, [tags]);

  const removeTag = useCallback((tag: string) => {
    setTags(prev => prev.filter(t => t !== tag));
  }, []);

  const handleTagKeyPress = useCallback(({ nativeEvent }: any) => {
    if (nativeEvent.key === ' ' || nativeEvent.key === 'Enter') {
      addTag(tagInput);
    }
  }, [tagInput, addTag]);

  // ── Upload ───────────────────────────────────────────────────────────────

  const handleUpload = useCallback(async () => {
    if (!videoUri) return;
    setUploading(true);
    try {
      await uploadReelWithFile(videoUri, videoMime, description, tags);
      qc.invalidateQueries({ queryKey: ['reels'] });
      toast.success('Reel publicado', 'Tu reel ya está disponible en el feed.');
      router.back();
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'No se pudo publicar el reel.';
      toast.error('Error al publicar', Array.isArray(msg) ? msg.join(' ') : msg);
    } finally {
      setUploading(false);
    }
  }, [videoUri, videoMime, description, tags, qc]);

  const formatDuration = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <KeyboardAvoidingView
      style={[s.root, { backgroundColor: tc.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top + 8, borderBottomColor: tc.divider }]}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={[s.backBtn, { backgroundColor: tc.surface2 }]}>
          <MaterialIcons name="arrow-back" size={24} color={tc.text} />
        </Pressable>
        <Text style={[s.headerTitle, { color: tc.text }]}>Nuevo Reel</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Video picker ────────────────────────────────────────────── */}
        {!videoUri ? (
          <View style={[s.pickerArea, { borderColor: tc.border, backgroundColor: tc.surface2 }]}>
            <View style={[s.pickerIcon, { backgroundColor: tc.surface }]}>
              <Ionicons name="videocam" size={44} color={tc.textSub} />
            </View>
            <Text style={[s.pickerTitle, { color: tc.text }]}>Seleccioná tu video</Text>
            <Text style={[s.pickerSub, { color: tc.textSub }]}>Máximo {MAX_DURATION_S} segundos</Text>
            <View style={s.pickerBtns}>
              <Pressable style={[s.pickerBtn, { backgroundColor: tc.surface }]} onPress={() => pickVideo('gallery')}>
                <Ionicons name="images-outline" size={20} color={tc.text} />
                <Text style={[s.pickerBtnText, { color: tc.text }]}>Galería</Text>
              </Pressable>
              <Pressable style={[s.pickerBtn, s.pickerBtnAccent]} onPress={() => pickVideo('camera')}>
                <Ionicons name="camera-outline" size={20} color="#fff" />
                <Text style={s.pickerBtnText}>Cámara</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <View style={s.preview}>
            <VideoView
              player={player}
              style={s.video}
              contentFit="cover"
              nativeControls={false}
            />
            {/* Duration badge */}
            {duration > 0 && (
              <View style={s.durationBadge}>
                <Text style={s.durationText}>{formatDuration(duration)}</Text>
              </View>
            )}
            {/* Change video */}
            <Pressable style={s.changeVideoBtn} onPress={() => pickVideo('gallery')}>
              <MaterialIcons name="swap-horiz" size={16} color="#fff" />
              <Text style={s.changeVideoBtnText}>Cambiar video</Text>
            </Pressable>
          </View>
        )}

        {/* ── Form ─────────────────────────────────────────────────── */}
        <View style={s.form}>
          {/* Description */}
          <View style={s.field}>
            <Text style={[s.fieldLabel, { color: tc.textSub }]}>Descripción</Text>
            <TextInput
              style={[s.textarea, { backgroundColor: tc.surface2, borderColor: tc.border, color: tc.text }]}
              placeholder="Contá qué muestra este reel..."
              placeholderTextColor={tc.textMuted}
              multiline
              maxLength={300}
              value={description}
              onChangeText={setDescription}
              textAlignVertical="top"
            />
            <Text style={[s.charCount, { color: tc.textMuted }]}>{description.length}/300</Text>
          </View>

          {/* Tags */}
          <View style={s.field}>
            <Text style={[s.fieldLabel, { color: tc.textSub }]}>Tags <Text style={[s.fieldSub, { color: tc.textMuted }]}>(máx. {MAX_TAGS})</Text></Text>
            {tags.length > 0 && (
              <View style={s.tagsRow}>
                {tags.map(tag => (
                  <Pressable key={tag} style={s.tagChip} onPress={() => removeTag(tag)}>
                    <Text style={[s.tagChipText, { color: tc.text }]}>#{tag}</Text>
                    <MaterialIcons name="close" size={13} color={tc.textSub} />
                  </Pressable>
                ))}
              </View>
            )}
            {tags.length < MAX_TAGS && (
              <View style={s.tagInputRow}>
                <TextInput
                  ref={tagInputRef}
                  style={[s.tagInput, { backgroundColor: tc.surface2, borderColor: tc.border, color: tc.text }]}
                  placeholder="Agregá un tag y presioná espacio"
                  placeholderTextColor={tc.textMuted}
                  value={tagInput}
                  onChangeText={setTagInput}
                  onKeyPress={handleTagKeyPress}
                  onSubmitEditing={() => addTag(tagInput)}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="done"
                />
                {tagInput.trim().length > 0 && (
                  <Pressable style={[s.tagAddBtn, { backgroundColor: tc.surface2 }]} onPress={() => addTag(tagInput)}>
                    <MaterialIcons name="add" size={20} color={tc.text} />
                  </Pressable>
                )}
              </View>
            )}
          </View>
        </View>

        {/* ── Upload button ────────────────────────────────────────── */}
        <View style={[s.uploadBtnShadow, !videoUri && s.uploadBtnShadowDisabled]}>
        <Pressable
          style={({ pressed }) => [
            s.uploadBtn,
            pressed && videoUri && s.uploadBtnPressed,
          ]}
          onPress={handleUpload}
          disabled={!videoUri || uploading}
        >
          <LinearGradient
            colors={videoUri ? [TOKENS.color.primary, '#c0002f'] : ['#555', '#444']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={s.uploadGradient}
          >
            {uploading ? (
              <>
                <ActivityIndicator color="#fff" size="small" />
                <Text style={s.uploadBtnText}>Subiendo...</Text>
              </>
            ) : (
              <>
                <MaterialIcons name="publish" size={22} color="#fff" />
                <Text style={s.uploadBtnText}>Publicar Reel</Text>
              </>
            )}
          </LinearGradient>
        </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0d0d0d',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -0.3,
  },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: 16,
    paddingTop: 20,
    gap: 20,
  },

  // ── Picker ──────────────────────────────────────────────────────────────
  pickerArea: {
    height: 240,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.12)',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  pickerIcon: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  pickerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  pickerSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.4)',
    marginBottom: 4,
  },
  pickerBtns: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  pickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  pickerBtnAccent: {
    backgroundColor: TOKENS.color.primary,
  },
  pickerBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },

  // ── Preview ─────────────────────────────────────────────────────────────
  preview: {
    height: 340,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#000',
    position: 'relative',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  durationBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  durationText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  changeVideoBtn: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  changeVideoBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },

  // ── Form ────────────────────────────────────────────────────────────────
  form: {
    gap: 16,
  },
  field: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  fieldSub: {
    fontWeight: '400',
    textTransform: 'none',
    fontSize: 12,
    color: 'rgba(255,255,255,0.35)',
    letterSpacing: 0,
  },
  textarea: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    padding: 14,
    color: '#fff',
    fontSize: 15,
    minHeight: 96,
    lineHeight: 22,
  },
  charCount: {
    alignSelf: 'flex-end',
    fontSize: 11,
    color: 'rgba(255,255,255,0.3)',
  },

  // ── Tags ────────────────────────────────────────────────────────────────
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(133,0,33,0.35)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(133,0,33,0.5)',
  },
  tagChipText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  tagInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tagInput: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#fff',
    fontSize: 14,
  },
  tagAddBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Upload button ───────────────────────────────────────────────────────
  uploadBtnShadow: {
    borderRadius: 16,
    shadowColor: TOKENS.color.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
    marginTop: 4,
  },
  uploadBtnShadowDisabled: {
    shadowOpacity: 0,
    elevation: 0,
    opacity: 0.5,
  },
  uploadBtn: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  uploadBtnPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
  uploadGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
  },
  uploadBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
});
