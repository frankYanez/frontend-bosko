/**
 * payments.ts — Servicio de pagos.
 * Conectado a los endpoints reales de /payments/*.
 */

import api from '@/core/api/axiosinstance';

export type PaymentStatus = 'pending' | 'paid' | 'released' | 'refunded' | 'failed';

export interface Payment {
  id: string;
  orderId: string;
  clientId: string;
  providerId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  externalId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentHistoryItem extends Payment {
  order?: {
    id: string;
    title: string;
    status: string;
  };
}

export interface EarningsItem extends Payment {
  order?: {
    id: string;
    title: string;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

/** Iniciar pago de una orden — POST /payments/initiate */
export async function initiatePayment(orderId: string): Promise<Payment> {
  const { data } = await api.post<Payment>('/payments/initiate', { orderId });
  return data;
}

/** Estado del pago de una orden — GET /payments/order/:orderId */
export async function getOrderPayment(orderId: string): Promise<Payment> {
  const { data } = await api.get<Payment>(`/payments/order/${orderId}`);
  return data;
}

/** Historial de pagos del usuario — GET /payments/history */
export async function fetchPaymentHistory(
  page = 1,
  limit = 20
): Promise<PaginatedResponse<PaymentHistoryItem>> {
  const { data } = await api.get<PaginatedResponse<PaymentHistoryItem>>('/payments/history', {
    params: { page, limit },
  });
  return data;
}

/** Ganancias del proveedor autenticado — GET /payments/providers/me/earnings */
export async function fetchEarnings(
  page = 1,
  limit = 20
): Promise<PaginatedResponse<EarningsItem>> {
  const { data } = await api.get<PaginatedResponse<EarningsItem>>('/payments/providers/me/earnings', {
    params: { page, limit },
  });
  return data;
}
