import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import * as WebBrowser from 'expo-web-browser';
import { getKYCStatus, startVerification, retryVerification } from '../services/kyc.service';
import { DocumentType, KYCVerification } from '../types/kyc.types';
import { useAuth } from '@/features/auth/state/AuthContext';

interface SubmitDocumentsPayload {
  documentType: DocumentType;
  documentFront: string;
  documentBack: string;
  selfie: string;
}

interface KYCContextValue {
  verification: KYCVerification | null;
  kyc: KYCVerification | null;
  loading: boolean;
  error: string | null;
  isVerified: boolean;
  refresh: () => Promise<void>;
  start: () => Promise<void>;
  retry: () => Promise<void>;
  submit: (payload: SubmitDocumentsPayload) => Promise<void>;
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
      if (data) data.status = data.status?.toLowerCase() as any;
      setVerification(data);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Error al cargar estado de verificación');
    } finally {
      setLoading(false);
    }
  }, [authState.token]);

  useEffect(() => {
    if (authState.token) refresh();
    else setVerification(null);
  }, [authState.token, refresh]);

  const openPersona = async (sessionToken: string, verificationUrl: string) => {
    // Cuando el SDK nativo esté instalado, reemplazar por:
    // const Persona = require('@persona-kyc/react-native-persona').default;
    // Persona.start({ sessionToken, onSuccess: ..., onFailed: ..., onCancelled: ... });
    await WebBrowser.openBrowserAsync(verificationUrl);
    // Refrescar estado después de que el usuario vuelva del browser
    await refresh();
  };

  const start = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await startVerification();
      const { sessionToken, verificationUrl, inquiryId } = response;
      const url = verificationUrl || (inquiryId && sessionToken
        ? `https://withpersona.com/verify?inquiry-id=${inquiryId}&session-token=${sessionToken}`
        : null);
      if (!url) throw new Error('No se recibió URL de verificación del servidor');
      await openPersona(sessionToken, url);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'No se pudo iniciar la verificación. Intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  }, [refresh]);

  const retry = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { sessionToken, verificationUrl } = await retryVerification();
      await openPersona(sessionToken, verificationUrl);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'No se pudo reiniciar la verificación.');
    } finally {
      setLoading(false);
    }
  }, [refresh]);

  const submit = useCallback(async (_payload: SubmitDocumentsPayload) => {
    await start();
  }, [start]);

  return (
    <KYCContext.Provider
      value={{
        verification,
        kyc: verification,
        loading,
        error,
        isVerified: verification?.isVerified ?? false,
        refresh,
        start,
        retry,
        submit,
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
