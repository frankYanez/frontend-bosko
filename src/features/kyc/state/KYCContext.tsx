/**
 * KYCContext
 *
 * Estado global para la verificación de identidad.
 * Se carga automáticamente al iniciar sesión y se actualiza cuando el usuario
 * completa o reintenta el proceso de KYC.
 */

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { getKYCStatus, submitKYC, retryKYC } from '../services/kyc.service';
import { KYCVerification, SubmitKYCPayload } from '../types/kyc.types';
import { useAuth } from '@/features/auth/state/AuthContext';

interface KYCContextValue {
  verification: KYCVerification | null;
  loading: boolean;
  error: string | null;
  isVerified: boolean;           // Shortcut: status === 'approved'
  needsKYC: boolean;             // Para mostrar CTA en el perfil
  refresh: () => Promise<void>;
  submit: (payload: SubmitKYCPayload) => Promise<void>;
  retry: () => Promise<void>;
  clearError: () => void;
}

const KYCContext = createContext<KYCContextValue | undefined>(undefined);

export const KYCProvider = ({ children }: { children: ReactNode }) => {
  const { authState } = useAuth();
  const [verification, setVerification] = useState<KYCVerification | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!authState.token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getKYCStatus();
      setVerification(data);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Error al cargar estado KYC');
    } finally {
      setLoading(false);
    }
  }, [authState.token]);

  // Cargar estado KYC cuando el usuario se autentica
  useEffect(() => {
    if (authState.token) refresh();
    else setVerification(null);
  }, [authState.token, refresh]);

  const submit = useCallback(async (payload: SubmitKYCPayload) => {
    setLoading(true);
    setError(null);
    try {
      const data = await submitKYC(payload);
      setVerification(data);
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Error al enviar documentos';
      setError(Array.isArray(msg) ? msg.join('. ') : msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const retry = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await retryKYC();
      setVerification(data);
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Error al reintentar verificación';
      setError(Array.isArray(msg) ? msg.join('. ') : msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <KYCContext.Provider
      value={{
        verification,
        loading,
        error,
        isVerified: verification?.status === 'approved',
        needsKYC: !verification || verification.status !== 'approved',
        refresh,
        submit,
        retry,
        clearError: () => setError(null),
      }}
    >
      {children}
    </KYCContext.Provider>
  );
};

export const useKYC = () => {
  const ctx = useContext(KYCContext);
  if (!ctx) throw new Error('useKYC debe usarse dentro de KYCProvider');
  return ctx;
};
