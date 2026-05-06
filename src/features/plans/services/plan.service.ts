/**
 * Servicio de planes y suscripciones.
 * GET /plans, /plans/my-plan, POST/DELETE /subscriptions, GET /subscriptions/history
 */

import api from '@/core/api/axiosinstance';

export interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  features: string[];
  highlighted?: boolean;
}

export interface MyPlan {
  plan: Plan;
  status: 'active' | 'cancelled' | 'expired';
  currentPeriodEnd: string;
}

export interface Subscription {
  id: string;
  planId: string;
  status: string;
  createdAt: string;
  currentPeriodEnd: string;
  cancelledAt?: string;
  plan?: Plan;
}

export interface PaginatedSubscriptions {
  data: Subscription[];
  total: number;
  page: number;
  limit: number;
}

/** Listar planes disponibles — GET /plans */
export async function fetchPlans(): Promise<Plan[]> {
  const { data } = await api.get<Plan[]>('/plans');
  return data;
}

/** Plan actual del usuario — GET /plans/my-plan */
export async function fetchMyPlan(): Promise<MyPlan> {
  const { data } = await api.get<MyPlan>('/plans/my-plan');
  return data;
}

/** Suscribirse a un plan — POST /subscriptions */
export async function subscribe(planId: string): Promise<Subscription> {
  const { data } = await api.post<Subscription>('/subscriptions', { planId });
  return data;
}

/** Cancelar suscripción — DELETE /subscriptions */
export async function cancelSubscription(): Promise<void> {
  await api.delete('/subscriptions');
}

/** Historial de suscripciones — GET /subscriptions/history */
export async function fetchSubscriptionHistory(
  page = 1,
  limit = 20,
): Promise<PaginatedSubscriptions> {
  const { data } = await api.get<PaginatedSubscriptions>('/subscriptions/history', {
    params: { page, limit },
  });
  return data;
}
