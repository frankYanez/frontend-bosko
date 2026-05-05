/**
 * OrdersContext
 *
 * Estado global para el módulo de órdenes. Maneja órdenes como cliente
 * y como proveedor. Expone acciones para cada transición de estado posible.
 */

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import {
  fetchOrders,
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
} from '../services/orders.service';
import {
  Order,
  CreateOrderPayload,
  RejectOrderPayload,
  DisputeOrderPayload,
} from '../types/orders.types';

interface OrdersContextValue {
  // Estado
  clientOrders: Order[];
  providerOrders: Order[];
  loading: boolean;
  error: string | null;

  // Carga
  loadClientOrders: () => Promise<void>;
  loadProviderOrders: () => Promise<void>;
  getOrder: (id: string) => Promise<Order | undefined>;

  // Creación
  addOrder: (payload: CreateOrderPayload) => Promise<Order>;

  // Transiciones de estado
  acceptOrder: (id: string) => Promise<void>;
  rejectOrder: (id: string, payload: RejectOrderPayload) => Promise<void>;
  startOrder: (id: string) => Promise<void>;
  completeOrder: (id: string) => Promise<void>;
  cancelOrder: (id: string, payload: RejectOrderPayload) => Promise<void>;
  disputeOrder: (id: string, payload: DisputeOrderPayload) => Promise<void>;

  clearError: () => void;
}

const OrdersContext = createContext<OrdersContextValue | undefined>(undefined);

export const OrdersProvider = ({ children }: { children: ReactNode }) => {
  const [clientOrders, setClientOrders] = useState<Order[]>([]);
  const [providerOrders, setProviderOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Actualiza una orden en el array local correspondiente
  const syncOrderUpdate = useCallback((updatedOrder: Order) => {
    setClientOrders(prev =>
      prev.map(o => (o.id === updatedOrder.id ? updatedOrder : o))
    );
    setProviderOrders(prev =>
      prev.map(o => (o.id === updatedOrder.id ? updatedOrder : o))
    );
  }, []);

  const loadClientOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchOrdersAsClient();
      setClientOrders(data);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Error al cargar órdenes');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadProviderOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchOrdersAsProvider();
      setProviderOrders(data);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Error al cargar órdenes');
    } finally {
      setLoading(false);
    }
  }, []);

  const getOrder = useCallback(async (id: string) => {
    try {
      return await fetchOrderById(id);
    } catch (err) {
      console.error('No se pudo obtener la orden', err);
      return undefined;
    }
  }, []);

  const addOrder = useCallback(async (payload: CreateOrderPayload) => {
    const newOrder = await createOrder(payload);
    setClientOrders(prev => [newOrder, ...prev]);
    return newOrder;
  }, []);

  const handleAccept = useCallback(async (id: string) => {
    const updated = await acceptOrder(id);
    syncOrderUpdate(updated);
  }, [syncOrderUpdate]);

  const handleReject = useCallback(async (id: string, payload: RejectOrderPayload) => {
    const updated = await rejectOrder(id, payload);
    syncOrderUpdate(updated);
  }, [syncOrderUpdate]);

  const handleStart = useCallback(async (id: string) => {
    const updated = await startOrder(id);
    syncOrderUpdate(updated);
  }, [syncOrderUpdate]);

  const handleComplete = useCallback(async (id: string) => {
    const updated = await completeOrder(id);
    syncOrderUpdate(updated);
  }, [syncOrderUpdate]);

  const handleCancel = useCallback(async (id: string, payload: RejectOrderPayload) => {
    const updated = await cancelOrder(id, payload);
    syncOrderUpdate(updated);
  }, [syncOrderUpdate]);

  const handleDispute = useCallback(async (id: string, payload: DisputeOrderPayload) => {
    const updated = await disputeOrder(id, payload);
    syncOrderUpdate(updated);
  }, [syncOrderUpdate]);

  return (
    <OrdersContext.Provider
      value={{
        clientOrders,
        providerOrders,
        loading,
        error,
        loadClientOrders,
        loadProviderOrders,
        getOrder,
        addOrder,
        acceptOrder: handleAccept,
        rejectOrder: handleReject,
        startOrder: handleStart,
        completeOrder: handleComplete,
        cancelOrder: handleCancel,
        disputeOrder: handleDispute,
        clearError: () => setError(null),
      }}
    >
      {children}
    </OrdersContext.Provider>
  );
};

export const useOrders = () => {
  const ctx = useContext(OrdersContext);
  if (!ctx) throw new Error('useOrders debe usarse dentro de OrdersProvider');
  return ctx;
};
