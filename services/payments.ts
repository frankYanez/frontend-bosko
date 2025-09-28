import axios from "axios";

/**
 * Payment and subscription related API calls.
 *
 * This module provides helper functions for managing payment
 * methods, subscribing to the Bosko Pro plan and handling
 * invoices. Depending on your backend, you may need to integrate
 * with a payment provider (e.g. Stripe) which often returns a
 * client secret or URL to a checkout session.
 */

export interface PaymentMethod {
  id?: string;
  type: string;
  last4?: string;
  expiryMonth?: string;
  expiryYear?: string;
}

/**
 * fetchPaymentMethods
 *
 * GET `/payments/methods`
 *
 * Retrieve saved payment methods for the current user.
 */
export async function fetchPaymentMethods(): Promise<PaymentMethod[]> {
  const { data } = await axios.get<PaymentMethod[]>('/payments/methods');
  return data;
}

/**
 * addPaymentMethod
 *
 * POST `/payments/methods`
 *
 * Add a new payment method. The payload structure depends on the
 * payment provider you use (e.g. Stripe token). Here we assume
 * a generic object. Adjust the type as necessary.
 */
export async function addPaymentMethod(payload: any): Promise<PaymentMethod> {
  const { data } = await axios.post<PaymentMethod>('/payments/methods', payload);
  return data;
}

/**
 * removePaymentMethod
 *
 * DELETE `/payments/methods/{id}`
 */
export async function removePaymentMethod(id: string): Promise<{ message: string }> {
  const { data } = await axios.delete(`/payments/methods/${id}`);
  return data;
}

/**
 * subscribeToPro
 *
 * POST `/payments/subscribe`
 *
 * Initiates the Bosko Pro subscription. The backend should
 * orchestrate the payment provider integration and return a
 * confirmation or client secret.
 */
export async function subscribeToPro(): Promise<{ status: string; clientSecret?: string }> {
  const { data } = await axios.post('/payments/subscribe');
  return data;
}

/**
 * fetchInvoices
 *
 * GET `/payments/invoices`
 *
 * Fetch past invoices for the user. Useful for a billing history
 * screen.
 */
export async function fetchInvoices(): Promise<any[]> {
  const { data } = await axios.get<any[]>('/payments/invoices');
  return data;
}