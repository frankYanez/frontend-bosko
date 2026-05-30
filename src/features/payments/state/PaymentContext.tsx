import React from 'react';
import { initiatePayment, getOrderPayment } from '../services/payments';
import type { Payment, PaymentHistoryItem, EarningsItem } from '../services/payments';
import {
  usePaymentHistory,
  useEarnings,
  useInitiatePayment,
} from '@/hooks/queries/usePaymentsQuery';

export function PaymentsProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function usePayments() {
  const historyQ = usePaymentHistory(1);
  const earningsQ = useEarnings(1);
  const initiateM = useInitiatePayment();

  return {
    orderPayment: null as Payment | null,
    history: (historyQ.data?.data ?? []) as PaymentHistoryItem[],
    earnings: (earningsQ.data?.data ?? []) as EarningsItem[],
    loading: historyQ.isLoading || earningsQ.isLoading || initiateM.isPending,
    error: historyQ.error?.message ?? earningsQ.error?.message ?? '',

    initiate: (orderId: string): Promise<Payment> =>
      initiateM.mutateAsync(orderId),
    loadOrderPayment: async (orderId: string) => {
      await getOrderPayment(orderId);
    },
    loadHistory: async () => { await historyQ.refetch(); },
    loadEarnings: async () => { await earningsQ.refetch(); },
    clearError: () => {},
  };
}
