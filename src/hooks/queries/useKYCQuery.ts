import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/core/query/queryKeys';
import {
  getKYCStatus,
  startVerification,
  retryVerification,
} from '@/features/kyc/services/kyc.service';
import * as WebBrowser from 'expo-web-browser';
import { useAuth } from '@/features/auth/state/AuthContext';

export function useKYCStatus() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: QUERY_KEYS.kycStatus,
    queryFn: getKYCStatus,
    enabled: isAuthenticated,
    select: (data) => {
      if (!data) return null;
      return { ...data, status: data.status?.toLowerCase() };
    },
  });
}

export function useStartKYC() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { verificationUrl } = await startVerification();
      if (!verificationUrl) throw new Error('No se recibió URL de verificación del servidor');
      await WebBrowser.openBrowserAsync(verificationUrl);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.kycStatus });
    },
  });
}

export function useRetryKYC() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { verificationUrl } = await retryVerification();
      if (!verificationUrl) throw new Error('No se recibió URL de verificación del servidor');
      await WebBrowser.openBrowserAsync(verificationUrl);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.kycStatus });
    },
  });
}
