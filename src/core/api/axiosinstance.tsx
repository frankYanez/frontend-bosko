/**
 * axiosinstance — Cliente HTTP centralizado de la aplicación.
 *
 * Interceptores:
 *  1. Request: adjunta Bearer token (desde cache en memoria), headers anti-caché.
 *  2. Response: unwrap { success, data }, refresh automático con cola para
 *     requests concurrentes, logout forzado si el refresh falla.
 */

import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { API_URL } from '@/core/config/env';
import { tokenStorage } from '@/core/auth/tokenStorage';
import { ApiResponse, AuthResponse } from '@/features/auth/types';

const REQUEST_TIMEOUT_MS = 15000;

// ── Cola de refresh (evita múltiples refreshes concurrentes) ──────────────────
let isRefreshing = false;
let refreshQueue: {
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}[] = [];

const resolveRefreshQueue = (token: string) => {
  refreshQueue.forEach(({ resolve }) => resolve(token));
  refreshQueue = [];
};

const rejectRefreshQueue = (error: unknown) => {
  refreshQueue.forEach(({ reject }) => reject(error));
  refreshQueue = [];
};

// ── Instancia base ────────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: API_URL,
  timeout: REQUEST_TIMEOUT_MS,
  validateStatus: (status) => (status >= 200 && status < 300) || status === 304,
});

// ── Tipos ─────────────────────────────────────────────────────────────────────
type RetryableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

const AUTH_ROUTES = ['/auth/login', '/auth/register', '/auth/refresh-token'];

// ── Interceptor de solicitudes ─────────────────────────────────────────────────
api.interceptors.request.use((config) => {
  const token = tokenStorage.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  config.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
  config.headers['Pragma'] = 'no-cache';
  return config;
});

// ── Interceptor de respuestas ─────────────────────────────────────────────────
// Desempaqueta el wrapper del servidor { success, timestamp, data: T }
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

    const isAuthRoute = AUTH_ROUTES.some((url) => original.url?.includes(url));
    if (isAuthRoute) return Promise.reject(error);

    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error);
    }

    // Si ya hay un refresh en curso, encolar esta request
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        refreshQueue.push({
          resolve: (token: string) => {
            original.headers.Authorization = `Bearer ${token}`;
            original._retry = true;
            resolve(api(original));
          },
          reject,
        });
      });
    }

    original._retry = true;
    isRefreshing = true;

    try {
      const refreshToken = tokenStorage.getRefreshToken();
      if (!refreshToken) throw new Error('No refresh token');

      const { data: refreshRaw } = await axios.post<ApiResponse<AuthResponse>>(
        `${API_URL}/auth/refresh-token`,
        { refreshToken },
      );
      const refreshed = refreshRaw.data;

      await tokenStorage.save(refreshed.accessToken, refreshed.refreshToken);

      resolveRefreshQueue(refreshed.accessToken);

      original.headers.Authorization = `Bearer ${refreshed.accessToken}`;
      return api(original);
    } catch (refreshError) {
      rejectRefreshQueue(refreshError);

      const status = (refreshError as any)?.response?.status;
      if (status === 401 || status === 403) {
        await tokenStorage.clear();
        tokenStorage.triggerForceLogout();
      }

      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

export default api;
