/**
 * Tipos de dominio para el módulo de órdenes.
 * Reflejan exactamente el contrato del backend (ver endpoints.md).
 */

export type OrderStatus =
  | 'pending'       // Esperando respuesta del proveedor
  | 'accepted'      // Proveedor aceptó
  | 'in_progress'   // Trabajo en curso
  | 'completed'     // Trabajo terminado
  | 'cancelled'     // Cancelado por cliente o proveedor
  | 'disputed';     // En disputa

export type PaymentStatus = 'pending' | 'paid' | 'released' | 'refunded';

export interface OrderUser {
  id: string;
  firstName: string;
  lastName?: string;
  avatarUrl?: string;
}

export interface OrderService {
  id: string;
  title: string;
  thumbnail?: string;
}

export interface Order {
  id: string;
  clientId: string;
  providerId: string;
  serviceId: string;
  status: OrderStatus;
  title: string;
  clientMessage: string;
  agreedPrice?: number;
  scheduledDate?: string;
  address?: string;
  paymentStatus: PaymentStatus;
  cancellationReason?: string;
  cancelledBy?: string;
  disputeReason?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  // Datos populados
  client?: OrderUser;
  provider?: OrderUser;
  service?: OrderService;
}

/** Payload para crear una nueva orden (POST /orders) */
export interface CreateOrderPayload {
  serviceId: string;
  message: string;
  scheduledDate?: string;
  address?: string;
}

/** Payload para rechazar o cancelar con motivo */
export interface RejectOrderPayload {
  reason: string;
}

export interface DisputeOrderPayload {
  reason: string;
}

/** Respuesta paginada genérica */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
