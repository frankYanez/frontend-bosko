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
import { useQueryClient } from '@tanstack/react-query';
import { tokenStorage } from '@/core/auth/tokenStorage';
import {
  loginService,
  loginWithGoogleService,
  registerUserService,
  verifyEmailService,
} from '../services/auth';
import api from '@/core/api/axiosinstance';
import { getUserErrorMessage } from '@/lib/errors';
import type {
  AuthContextType,
  AuthResponse,
  AuthState,
  AuthUser,
  Credentials,
  RegisterResponse,
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
  const qc = useQueryClient();
  const [authState, setAuthState] = useState<AuthState>(EMPTY_STATE);
  const [authLoaded, setAuthLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Logout forzado desde axios ─────────────────────────────────────────
  // Registrar una sola vez: cuando el interceptor detecta refresh token
  // expirado, limpia el estado y redirige al login sin importar la pantalla actual.
  useEffect(() => {
    tokenStorage.setForceLogoutCallback(() => {
      qc.clear();
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
      setError(getUserErrorMessage(err));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── Registro ───────────────────────────────────────────────────────────
  // POST /auth/register solo crea la cuenta y envía el OTP de verificación.
  // No devuelve tokens — el login real ocurre recién en verifyEmail().
  const registerUser = useCallback(
    async (data: RegisterUserPayload): Promise<RegisterResponse> => {
      setIsLoading(true);
      setError(null);

      try {
        return await registerUserService(data);
      } catch (err: any) {
        setError(getUserErrorMessage(err));
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  // ── Verificación de email ─────────────────────────────────────────────
  // Completa el registro: valida el OTP y devuelve los tokens de sesión.
  const verifyEmail = useCallback(async (email: string, code: string): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await verifyEmailService(email, code);

      await tokenStorage.save(response.accessToken, response.refreshToken, email);

      setAuthState({
        token: response.accessToken,
        refreshToken: response.refreshToken,
        userEmail: email,
        user: response.user ?? null,
      });
    } catch (err: any) {
      setError(getUserErrorMessage(err));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── Login con Google ──────────────────────────────────────────────────
  // Recibe el idToken de Firebase (ya autenticado con Google en el cliente,
  // ver handleGoogleSignIn en LogInView) y lo intercambia por la sesión propia.
  const loginWithGoogle = useCallback(async (firebaseIdToken: string): Promise<AuthResponse> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await loginWithGoogleService(firebaseIdToken);

      await tokenStorage.save(response.accessToken, response.refreshToken, response.user?.email);

      setAuthState({
        token: response.accessToken,
        refreshToken: response.refreshToken,
        userEmail: response.user?.email ?? null,
        user: response.user ?? null,
      });

      return response;
    } catch (err: any) {
      setError(getUserErrorMessage(err));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── Logout ─────────────────────────────────────────────────────────────
  const logout = useCallback(async (): Promise<void> => {
    const refreshToken = tokenStorage.getRefreshToken();
    try {
      await api.post('/auth/logout', { refreshToken });
    } catch {
      // Si falla el servidor igual limpiamos localmente
    }
    await tokenStorage.clear();
    qc.clear();
    setAuthState(EMPTY_STATE);
  }, [qc]);

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
        verifyEmail,
        loginWithGoogle,
        logout,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export default AuthProvider;
