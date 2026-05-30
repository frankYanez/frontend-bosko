import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/core/query/queryKeys';
import {
  fetchOrdersAsClient,
  fetchOrdersAsProvider,
  fetchOrderById,
  createOrder,
  acceptOrder,
  rejectOrder,
  startOrder,
  completeOrder,
  cancelOrder,
  disputeOrder,
} from '@/features/orders/services/orders.service';
import type {
  CreateOrderPayload,
  RejectOrderPayload,
  DisputeOrderPayload,
} from '@/features/orders/types/orders.types';

export function useClientOrders() {
  return useQuery({
    queryKey: QUERY_KEYS.clientOrders,
    queryFn: () => fetchOrdersAsClient(),
  });
}

export function useProviderOrders() {
  return useQuery({
    queryKey: QUERY_KEYS.providerOrders,
    queryFn: () => fetchOrdersAsProvider(),
  });
}

export function useOrder(id: string | undefined) {
  return useQuery({
    queryKey: QUERY_KEYS.orderById(id!),
    queryFn: () => fetchOrderById(id!),
    enabled: !!id,
  });
}

export function useCreateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateOrderPayload) => createOrder(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.clientOrders });
    },
  });
}

export function useAcceptOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => acceptOrder(id),
    onSuccess: (updated) => {
      qc.setQueryData(QUERY_KEYS.orderById(updated.id), updated);
      qc.invalidateQueries({ queryKey: QUERY_KEYS.providerOrders });
    },
  });
}

export function useRejectOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: RejectOrderPayload }) =>
      rejectOrder(id, payload),
    onSuccess: (updated) => {
      qc.setQueryData(QUERY_KEYS.orderById(updated.id), updated);
      qc.invalidateQueries({ queryKey: QUERY_KEYS.providerOrders });
    },
  });
}

export function useStartOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => startOrder(id),
    onSuccess: (updated) => {
      qc.setQueryData(QUERY_KEYS.orderById(updated.id), updated);
      qc.invalidateQueries({ queryKey: QUERY_KEYS.providerOrders });
    },
  });
}

export function useCompleteOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => completeOrder(id),
    onSuccess: (updated) => {
      qc.setQueryData(QUERY_KEYS.orderById(updated.id), updated);
      qc.invalidateQueries({ queryKey: QUERY_KEYS.clientOrders });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.providerOrders });
    },
  });
}

export function useCancelOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: RejectOrderPayload }) =>
      cancelOrder(id, payload),
    onSuccess: (updated) => {
      qc.setQueryData(QUERY_KEYS.orderById(updated.id), updated);
      qc.invalidateQueries({ queryKey: QUERY_KEYS.clientOrders });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.providerOrders });
    },
  });
}

export function useDisputeOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: DisputeOrderPayload }) =>
      disputeOrder(id, payload),
    onSuccess: (updated) => {
      qc.setQueryData(QUERY_KEYS.orderById(updated.id), updated);
    },
  });
}
