/**
 * Servicio KYC.
 * Encapsula las llamadas al backend para verificación de identidad.
 * Documentado en endpoints.md sección 9.
 */

import api from '@/core/api/axiosinstance';
import { KYCVerification, SubmitKYCPayload } from '../types/kyc.types';

/**
 * Obtener el estado actual del KYC del usuario autenticado.
 * Si no tiene KYC iniciado, el backend retorna el estado actual (puede ser 'pending').
 */
export async function getKYCStatus(): Promise<KYCVerification | null> {
  try {
    const { data } = await api.get<KYCVerification>('/kyc/status');
    return data;
  } catch (error: any) {
    // Si el usuario nunca inició KYC, retornamos null en lugar de propagar error
    if (error.response?.status === 404) return null;
    throw error;
  }
}

/**
 * Enviar verificación KYC con documentos.
 * Usa multipart/form-data para subir imágenes.
 * Máximo 3 intentos totales.
 */
export async function submitKYC(payload: SubmitKYCPayload): Promise<KYCVerification> {
  const formData = new FormData();
  formData.append('documentType', payload.documentType);

  // Construir los objetos de archivo para React Native
  const buildFile = (uri: string, name: string) => ({
    uri,
    type: 'image/jpeg',
    name,
  } as any);

  formData.append('documentFront', buildFile(payload.documentFront, 'document_front.jpg'));
  formData.append('documentBack', buildFile(payload.documentBack, 'document_back.jpg'));
  formData.append('selfie', buildFile(payload.selfie, 'selfie.jpg'));

  const { data } = await api.post<KYCVerification>('/kyc/submit', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

/**
 * Reintentar la verificación KYC.
 * Solo disponible si el estado es 'rejected' y no se alcanzaron los 3 intentos.
 */
export async function retryKYC(): Promise<KYCVerification> {
  const { data } = await api.post<KYCVerification>('/kyc/retry');
  return data;
}
