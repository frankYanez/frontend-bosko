/**
 * Pantalla raíz — Gate de enrutamiento inicial.
 *
 * Decide a dónde enviar al usuario según el estado de la sesión:
 *  1. Mientras se carga la sesión → muestra indicador (evita flash de contenido)
 *  2. Con sesión activa → va directo a las tabs (sin pasar por onboarding/login)
 *  3. Sin sesión → muestra OnBoarding (que internamente detecta si ya fue visto
 *     y redirige a /login si corresponde)
 */

import React from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { Redirect, Stack } from 'expo-router';
import { useAuth } from '@/features/auth/state/AuthContext';
import OnBoarding from '@/features/auth/screens/OnBoarding';
import { TOKENS } from '@/core/design-system/tokens';

export default function IndexScreen() {
  const { authLoaded, isAuthenticated } = useAuth();

  // Mientras AuthProvider verifica la sesión guardada, no renderizar nada visible
  if (!authLoaded) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator size="large" color={TOKENS.color.primary} />
      </View>
    );
  }

  // Sesión activa → ir al dashboard sin pasar por onboarding
  if (isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  }

  // Sin sesión → OnBoarding (maneja internamente si ya fue visto)
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <OnBoarding />
    </>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
});
