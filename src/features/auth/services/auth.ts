/**
 * auth.service — Llamadas HTTP del módulo de autenticación.
 *
 * El axiosinstance desempaqueta automáticamente el wrapper
 * { success, timestamp, data: T } → el código recibe T directamente.
 */

import api from '@/core/api/axiosinstance';
import type { AuthResponse, Credentials, RegisterUserPayload } from '../types';

export async function loginService(credentials: Credentials): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/auth/login', credentials);
  return data;
}

export async function registerUserService(
  payload: RegisterUserPayload,
): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/auth/register', payload);
  return data;
}

