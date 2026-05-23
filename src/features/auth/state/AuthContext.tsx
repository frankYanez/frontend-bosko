/**
 * AuthContext — Estado global de autenticación.
 *
 * Responsabilidades:
 *  - Restaurar la sesión desde SecureStore al iniciar la app
 *  - Exponer login, register y logout al árbol de componentes
 *  - Registrar el callback de logout forzado para el interceptor de axios
 *  - Indicar si la sesión ya fue comprobada (authLoaded) para que las
 *    pantallas protejan el acceso mientras se carga
 *
 * NO gestiona el perfil del usuario (eso lo hace ProfileContext).
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { router } from 'expo-router';
import { tokenStorage } from '@/core/auth/tokenStorage';
import {
  loginService,
  registerUserService,
  checkUsernameAvailabilityService,
} from '../services/auth';
import api from '@/core/api/axiosinstance';
import type {
  AuthContextType,
  AuthResponse,
  AuthState,
  AuthUser,
  Credentials,
  RegisterUserPayload,
} from '../types';

// ── Estado vacío reutilizable ────────────────────────────────────────────────
const EMPTY_STATE: AuthState = {
  token: null,
  refreshToken: null,
  userEmail: null,
  user: null,
};

// ── Contexto ─────────────────────────────────────────────────────────────────
const AuthContext = createContext<AuthContextType | null>(null);

/**
 * Hook para consumir el contexto.
 * Lanza un error descriptivo si se usa fuera del provider.
 */
export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}

// ── Provider ─────────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>(EMPTY_STATE);
  const [authLoaded, setAuthLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Logout forzado desde axios ─────────────────────────────────────────
  // Registrar una sola vez: cuando el interceptor detecta refresh token
  // expirado, limpia el estado y redirige al login sin importar la pantalla actual.
  useEffect(() => {
    tokenStorage.setForceLogoutCallback(() => {
      setAuthState(EMPTY_STATE);
      router.replace('/login');
    });
  }, []);

  // ── Restaurar sesión al arrancar ──────────────────────────────────────
  useEffect(() => {

    (async () => {
      try {
        // Hidratar el cache en memoria con los tokens guardados en SecureStore
        await tokenStorage.hydrate();

        const token = tokenStorage.getAccessToken();
        const refreshToken = tokenStorage.getRefreshToken();
        const userEmail = tokenStorage.getUserEmail();

        if (token && refreshToken) {
          // Sesión válida encontrada: restaurar estado
          setAuthState({ token, refreshToken, userEmail, user: null });
        }
      } catch (err) {
        // Si falla la lectura, dejamos la sesión en blanco (usuario deberá re-loguearse)
        console.error('[AuthContext] Error al restaurar sesión:', err);
        await tokenStorage.clear();
      } finally {
        // Señal para que las pantallas sepan que la verificación inicial terminó
        setAuthLoaded(true);
      }
    })();
  }, []);

  // ── Login ──────────────────────────────────────────────────────────────
  const login = useCallback(async (credentials: Credentials): Promise<AuthResponse> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await loginService(credentials);

      await tokenStorage.save(
        response.accessToken,
        response.refreshToken,
        credentials.email,
      );

      setAuthState({
        token: response.accessToken,
        refreshToken: response.refreshToken,
        userEmail: credentials.email,
        user: response.user ?? null,
      });

      return response;
    } catch (err: any) {
      const raw = err?.response?.data?.message ?? 'Error al iniciar sesión';
      const msg = Array.isArray(raw) ? raw.join(', ') : raw;
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── Registro ───────────────────────────────────────────────────────────
  const registerUser = useCallback(
    async (data: RegisterUserPayload): Promise<AuthResponse> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await registerUserService(data);

        // Persistimos los tokens para que la verificación de email y el acceso
        // posterior a las tabs no requieran volver a hacer login.
        // El backend valida el email en endpoints protegidos si lo requiere.
        await tokenStorage.save(
          response.accessToken,
          response.refreshToken,
          data.email,
        );

        setAuthState({
          token: response.accessToken,
          refreshToken: response.refreshToken,
          userEmail: data.email,
          user: response.user ?? null,
        });

        return response;
      } catch (err: any) {
        const raw = err?.response?.data?.message ?? 'Error al registrar usuario';
        const msg = Array.isArray(raw) ? raw.join(', ') : raw;
        setError(msg);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  // ── Verificar disponibilidad de username ───────────────────────────────
  const checkUsernameAvailability = useCallback(
    async (username: string): Promise<boolean> => {
      try {
        return await checkUsernameAvailabilityService(username);
      } catch (err: any) {
        const msg = err?.response?.data?.message ?? 'No se pudo verificar el usuario';
        setError(msg);
        throw new Error(msg);
      }
    },
    [],
  );

  // ── Logout ─────────────────────────────────────────────────────────────
  const logout = useCallback(async (): Promise<void> => {
    const refreshToken = tokenStorage.getRefreshToken();
    try {
      await api.post('/auth/logout', { refreshToken });
    } catch {
      // Si falla el servidor igual limpiamos localmente
    }
    await tokenStorage.clear();
    setAuthState(EMPTY_STATE);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  // `isAuthenticated` es un booleano derivado, más cómodo para las guardas
  const isAuthenticated = !!authState.token;

  return (
    <AuthContext.Provider
      value={{
        authState,
        authLoaded,
        isAuthenticated,
        isLoading,
        error,
        login,
        registerUser,
        checkUsernameAvailability,
        logout,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export default AuthProvider;
