import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/core/query/queryKeys';
import {
  initiatePayment,
  getOrderPayment,
  fetchPaymentHistory,
  fetchEarnings,
} from '@/features/payments/services/payments';

export function useOrderPayment(orderId: string | undefined) {
  return useQuery({
    queryKey: QUERY_KEYS.orderPayment(orderId!),
    queryFn: () => getOrderPayment(orderId!),
    enabled: !!orderId,
  });
}

export function usePaymentHistory(page = 1) {
  return useQuery({
    queryKey: QUERY_KEYS.paymentHistory(page),
    queryFn: () => fetchPaymentHistory(page),
  });
}

export function useEarnings(page = 1) {
  return useQuery({
    queryKey: QUERY_KEYS.earnings(page),
    queryFn: () => fetchEarnings(page),
  });
}

export function useInitiatePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (orderId: string) => initiatePayment(orderId),
    onSuccess: (payment) => {
      qc.setQueryData(QUERY_KEYS.orderPayment(payment.orderId), payment);
    },
  });
}
