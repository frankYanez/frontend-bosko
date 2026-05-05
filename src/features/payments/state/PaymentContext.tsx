/**
 * PaymentContext — Estado global de pagos.
 * Expone historial de pagos y ganancias del proveedor.
 */

import React, { createContext, useContext, useState, ReactNode } from 'react';
import {
  initiatePayment,
  getOrderPayment,
  fetchPaymentHistory,
  fetchEarnings,
  Payment,
  PaymentHistoryItem,
  EarningsItem,
} from '../services/payments';

interface PaymentsState {
  orderPayment: Payment | null;
  history: PaymentHistoryItem[];
  earnings: EarningsItem[];
  loading: boolean;
  error: string;
  initiate: (orderId: string) => Promise<Payment>;
  loadOrderPayment: (orderId: string) => Promise<void>;
  loadHistory: (page?: number) => Promise<void>;
  loadEarnings: (page?: number) => Promise<void>;
  clearError: () => void;
}

const PaymentsContext = createContext<PaymentsState | undefined>(undefined);

export function PaymentsProvider({ children }: { children: ReactNode }) {
  const [orderPayment, setOrderPayment] = useState<Payment | null>(null);
  const [history, setHistory] = useState<PaymentHistoryItem[]>([]);
  const [earnings, setEarnings] = useState<EarningsItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const withLoading = async <T,>(fn: () => Promise<T>): Promise<T> => {
    setLoading(true);
    setError('');
    try {
      return await fn();
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Error inesperado.';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const initiate = (orderId: string) =>
    withLoading(() => initiatePayment(orderId));

  const loadOrderPayment = async (orderId: string) => {
    await withLoading(async () => {
      const p = await getOrderPayment(orderId);
      setOrderPayment(p);
    });
  };

  const loadHistory = async (page = 1) => {
    await withLoading(async () => {
      const res = await fetchPaymentHistory(page);
      setHistory(page === 1 ? res.data : prev => [...prev, ...res.data]);
    });
  };

  const loadEarnings = async (page = 1) => {
    await withLoading(async () => {
      const res = await fetchEarnings(page);
      setEarnings(page === 1 ? res.data : prev => [...prev, ...res.data]);
    });
  };

  return (
    <PaymentsContext.Provider
      value={{
        orderPayment,
        history,
        earnings,
        loading,
        error,
        initiate,
        loadOrderPayment,
        loadHistory,
        loadEarnings,
        clearError: () => setError(''),
      }}
    >
      {children}
    </PaymentsContext.Provider>
  );
}

export function usePayments() {
  const ctx = useContext(PaymentsContext);
  if (!ctx) throw new Error('usePayments must be used within PaymentsProvider');
  return ctx;
}
