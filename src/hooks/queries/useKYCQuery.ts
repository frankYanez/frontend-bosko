import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/core/query/queryKeys';
import {
  getKYCStatus,
  startVerification,
  retryVerification,
} from '@/features/kyc/services/kyc.service';
import { startVerification as diditStartVerification } from '@didit-protocol/sdk-react-native';
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

async function launchDidit(sessionToken: string): Promise<void> {
  const result = await diditStartVerification(sessionToken, {
    languageCode: 'es',
    showCloseButton: true,
    showExitConfirmation: true,
    closeOnComplete: true,
  });

  if (result.type === 'failed') {
    if (result.error.type !== 'sessionExpired') {
      throw new Error(result.error.message ?? 'Error en la verificación');
    }
  }
  // 'completed' y 'cancelled' se resuelven normalmente —
  // el estado final llega por webhook al backend
}

export function useStartKYC() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { sessionToken } = await startVerification();
      if (!sessionToken) throw new Error('No se recibió token de verificación del servidor');
      await launchDidit(sessionToken);
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
      const { sessionToken } = await retryVerification();
      if (!sessionToken) throw new Error('No se recibió token de verificación del servidor');
      await launchDidit(sessionToken);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.kycStatus });
    },
  });
}
