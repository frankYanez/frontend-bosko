/**
 * Layout del grupo /login.
 *
 * Guarda inversa: si el usuario ya tiene sesión activa y navega
 * a /login (p.ej. por un deep link), lo redirige a las tabs.
 */

import React from 'react';
import { Redirect, Slot } from 'expo-router';
import { useAuth } from '@/features/auth/state/AuthContext';

export default function LoginLayout() {
  const { authLoaded, isAuthenticated } = useAuth();

  // Mientras carga no redirigir (evita flash)
  if (!authLoaded) return null;

  // Usuario ya autenticado → no debería estar en /login
  if (isAuthenticated) return <Redirect href="/(tabs)" />;

  return <Slot />;
}
