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
import { Redirect, Stack } from 'expo-router';
import { useAuth } from '@/features/auth/state/AuthContext';
import OnBoarding from '@/features/auth/screens/OnBoarding';
import { AnimatedSplashScreen } from '@/features/auth/screens/AnimatedSplashScreen';

export default function IndexScreen() {
  const { authLoaded, isAuthenticated } = useAuth();

  // Mientras AuthProvider verifica la sesión guardada, mostrar el splash animado
  if (!authLoaded) {
    return <AnimatedSplashScreen onDone={() => {}} />;
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
