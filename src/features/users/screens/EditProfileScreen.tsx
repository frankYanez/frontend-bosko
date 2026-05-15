/**
 * EditProfileScreen — Editar perfil con avatar upload.
 * PATCH /users/me + POST /users/me/avatar
 */

import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  Image,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from '@/core/components/BlurView';
import { MaterialIcons } from '@expo/vector-icons';
import { MotiView } from '@/core/components/MotiView';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useProfile } from '@/features/profile/state/ProfileContext';
import { uploadAvatar } from '@/features/servicesUser/services/profile';
import { TOKENS } from '@/core/design-system/tokens';

export default function EditProfileScreen() {
  const { profile, updateProfile, isLoading } = useProfile();

  const [firstName, setFirstName] = useState(profile?.firstName || '');
  const [lastName, setLastName] = useState(profile?.lastName || '');
  const [username, setUsername] = useState(profile?.username || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [location, setLocation] = useState(profile?.location || '');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [saving, setSaving] = useState(false);

  const pickImage = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a tu galería para cambiar el avatar.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      setAvatarUri(uri);

      setUploadingAvatar(true);
      try {
        await uploadAvatar(uri);
      } catch (err: any) {
        Alert.alert('Error', err?.response?.data?.message || 'No se pudo subir el avatar');
        setAvatarUri(null);
      } finally {
        setUploadingAvatar(false);
      }
    }
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await updateProfile({ firstName, lastName, bio, location });
      Alert.alert('Perfil actualizado', 'Tus datos se guardaron correctamente.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'No se pudo guardar');
    } finally {
      setSaving(false);
    }
  }, [firstName, lastName, bio, location, updateProfile]);

  const hasChanges =
    firstName !== profile?.firstName ||
    lastName !== profile?.lastName ||
    bio !== profile?.bio ||
    location !== profile?.location;

  const displayUri = avatarUri || profile?.avatarUrl;

  return (
    <LinearGradient
      colors={['#fdf2f4', '#fef7ff', '#f0f4ff']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.bg}
    >
      {/* Header */}
      <BlurView intensity={25} tint="light" style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color={TOKENS.color.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Editar Perfil</Text>
        <View style={{ width: 40 }} />
      </BlurView>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Avatar */}
        <MotiView
          from={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', damping: 14 }}
          style={styles.avatarSection}
        >
          <Pressable onPress={pickImage} disabled={uploadingAvatar}>
            <LinearGradient
              colors={['#850021', '#4A0F20']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.avatarBorder}
            >
              <View style={styles.avatarContainer}>
                {uploadingAvatar ? (
                  <ActivityIndicator color="#850021" size="large" />
                ) : displayUri ? (
                  <Image source={{ uri: displayUri }} style={styles.avatarImage} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarInitial}>
                      {(profile?.firstName || 'U').charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
                <View style={styles.cameraBadge}>
                  <MaterialIcons name="camera-alt" size={16} color="#fff" />
                </View>
              </View>
            </LinearGradient>
          </Pressable>
          <Text style={styles.avatarHint}>Tocá para cambiar foto</Text>
        </MotiView>

        {/* Form */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 350, delay: 100 }}
          style={styles.formCard}
        >
          <BlurView intensity={25} tint="light" style={styles.formBlur}>
            {/* Nombre */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Nombre</Text>
              <TextInput
                style={styles.input}
                value={firstName}
                onChangeText={setFirstName}
                placeholder="Tu nombre"
                placeholderTextColor="rgba(107,107,107,0.4)"
              />
            </View>

            {/* Apellido */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Apellido</Text>
              <TextInput
                style={styles.input}
                value={lastName}
                onChangeText={setLastName}
                placeholder="Tu apellido"
                placeholderTextColor="rgba(107,107,107,0.4)"
              />
            </View>

            {/* Username (solo lectura, se muestra) */}
            {username ? (
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Usuario</Text>
                <View style={styles.readonlyField}>
                  <Text style={styles.readonlyText}>@{username}</Text>
                  <MaterialIcons name="lock" size={14} color="rgba(107,107,107,0.4)" />
                </View>
              </View>
            ) : null}

            {/* Teléfono */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Teléfono</Text>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="+54 11 1234 5678"
                placeholderTextColor="rgba(107,107,107,0.4)"
                keyboardType="phone-pad"
              />
            </View>

            {/* Ubicación */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Ubicación</Text>
              <TextInput
                style={styles.input}
                value={location}
                onChangeText={setLocation}
                placeholder="Ciudad, País"
                placeholderTextColor="rgba(107,107,107,0.4)"
              />
            </View>

            {/* Bio */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Bio</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={bio}
                onChangeText={setBio}
                placeholder="Contanos sobre vos..."
                placeholderTextColor="rgba(107,107,107,0.4)"
                multiline
                maxLength={500}
                textAlignVertical="top"
              />
              <Text style={styles.charCount}>{bio.length}/500</Text>
            </View>
          </BlurView>
        </MotiView>

        {/* Save */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 350, delay: 200 }}
        >
          <Pressable
            onPress={handleSave}
            disabled={!hasChanges || saving || isLoading}
            style={({ pressed }) => [
              styles.saveBtn,
              (!hasChanges || saving || isLoading) && styles.saveBtnDisabled,
              pressed && styles.saveBtnPressed,
            ]}
          >
            <LinearGradient
              colors={['#850021', '#4A0F20']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.saveGrad}
            >
              {saving || isLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <MaterialIcons name="check" size={20} color="#fff" />
                  <Text style={styles.saveText}>Guardar Cambios</Text>
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
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
    gap: 24,
  },
  // Avatar
  avatarSection: { alignItems: 'center', gap: 8 },
  avatarBorder: {
    width: 110,
    height: 110,
    borderRadius: 55,
    padding: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarContainer: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  avatarImage: {
    width: 104,
    height: 104,
    borderRadius: 52,
  },
  avatarPlaceholder: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 36,
    fontWeight: '700',
    color: '#850021',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#850021',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  avatarHint: {
    fontSize: 12,
    color: 'rgba(107,107,107,0.6)',
    fontWeight: '500',
  },
  // Form
  formCard: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.85)',
  },
  formBlur: {
    padding: 20,
    gap: 18,
  },
  fieldGroup: { gap: 6 },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: TOKENS.color.text,
    letterSpacing: 0.3,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: TOKENS.color.text,
    borderWidth: 1.5,
    borderColor: 'rgba(200,200,220,0.5)',
  },
  textArea: {
    minHeight: 100,
    paddingTop: 14,
  },
  charCount: {
    fontSize: 11,
    color: 'rgba(107,107,107,0.5)',
    alignSelf: 'flex-end',
  },
  readonlyField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(200,200,220,0.2)',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(200,200,220,0.3)',
  },
  readonlyText: {
    fontSize: 15,
    color: 'rgba(107,107,107,0.6)',
  },
  // Save
  saveBtn: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#850021',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnPressed: { transform: [{ scale: 0.97 }] },
  saveGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  saveText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});
