/**
 * axiosinstance — Cliente HTTP centralizado de la aplicación.
 *
 * Incluye dos interceptores:
 *  1. Request: adjunta el Bearer token a cada solicitud saliente.
 *  2. Response: ante un 401, intenta renovar el access token con el refresh
 *     token y reintenta la request original. Si el refresh falla, fuerza el
 *     logout a través de tokenStorage (sin importar AuthContext directamente).
 */

import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { API_URL } from '@/core/config/env';
import { tokenStorage } from '@/core/auth/tokenStorage';
import { ApiResponse, AuthResponse } from '@/features/auth/types';

// Instancia base compartida por toda la app
const api = axios.create({ baseURL: API_URL });

// ── Interceptor de solicitudes ───────────────────────────────────────────────
// Adjunta el access token desde el cache en memoria (lectura síncrona, sin
// impacto en performance). No toca rutas públicas de autenticación.
api.interceptors.request.use((config) => {
  const token = tokenStorage.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Interceptor de respuestas ────────────────────────────────────────────────
// Tipo extendido para marcar requests que ya intentaron un retry
type RetryableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

// Rutas que NO deben disparar un intento de refresh (evitar loops infinitos)
const AUTH_ROUTES = ['/auth/login', '/auth/register', '/auth/refresh-token'];

// El servidor envuelve TODAS las respuestas en { success, timestamp, data: T }.
// Este interceptor desempaqueta automáticamente ese wrapper para que el resto
// del código reciba directamente el payload esperado.
const unwrapResponse = (response: any) => {
  if (
    response?.data &&
    typeof response.data === 'object' &&
    'success' in response.data &&
    'data' in response.data
  ) {
    return { ...response, data: response.data.data };
  }
  return response;
};

api.interceptors.response.use(
  (response) => unwrapResponse(response),

  async (error: AxiosError) => {
    const original = error.config as RetryableConfig | undefined;

    if (!original) return Promise.reject(error);

    // Si el error viene de una ruta pública de auth, rechazar directamente
    const isAuthRoute = AUTH_ROUTES.some((url) => original.url?.includes(url));
    if (isAuthRoute) return Promise.reject(error);

    // Solo manejar 401 y solo un intento de retry por request
    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error);
    }

    original._retry = true;

    const refreshToken = tokenStorage.getRefreshToken();
    if (!refreshToken) {
      // No hay refresh token → sesión inválida, forzar logout
      tokenStorage.triggerForceLogout();
      return Promise.reject(error);
    }

    try {
      // Usar axios directamente (no la instancia) para evitar que este request
      // pase por el interceptor de response y genere un loop.
      // Como no pasa por unwrapResponse, desempaquetamos manualmente.
      const { data: refreshRaw } = await axios.post<ApiResponse<AuthResponse>>(
        `${API_URL}/auth/refresh-token`,
        { refreshToken },
      );
      const refreshed = refreshRaw.data;

      await tokenStorage.save(refreshed.accessToken, refreshed.refreshToken);

      // Reintentar la request original con el nuevo access token
      original.headers.Authorization = `Bearer ${refreshed.accessToken}`;
      return api(original);
    } catch {
      // El refresh token expiró o es inválido → limpiar sesión y forzar logout
      await tokenStorage.clear();
      tokenStorage.triggerForceLogout();
      return Promise.reject(error);
    }
  },
);

export default api;
