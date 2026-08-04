/**
 * auth.service — Llamadas HTTP del módulo de autenticación.
 *
 * El axiosinstance desempaqueta automáticamente el wrapper
 * { success, timestamp, data: T } → el código recibe T directamente.
 */

import api from '@/core/api/axiosinstance';
import type { AuthResponse, Credentials, RegisterResponse, RegisterUserPayload } from '../types';

export async function loginService(credentials: Credentials): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/auth/login', credentials);
  return data;
}

export async function registerUserService(
  payload: RegisterUserPayload,
): Promise<RegisterResponse> {
  const { data } = await api.post<RegisterResponse>('/auth/register', payload);
  return data;
}

export async function verifyEmailService(email: string, code: string): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/auth/verify-email', { email, code });
  return data;
}

