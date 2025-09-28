import axios from 'axios';

/**
 * Service related API calls.
 *
 * The service endpoints represent jobs or offerings created by
 * professionals. Functions in this module allow the client to
 * fetch available services, create new ones, update existing
 * services and remove those no longer offered.
 */

export interface Service {
  id?: string;
  title: string;
  description: string;
  category: string;
  price: number;
  keywords?: string[];
  images?: string[];
  rating?: number;
}

/**
 * fetchAllServices
 *
 * GET `/services`
 *
 * Retrieves a list of all services available on the platform. This
 * endpoint may optionally accept query parameters for filtering by
 * category, location, or keywords. Adjust the signature as needed
 * when you know the exact shape of the Swagger definition.
 */
export async function fetchAllServices(params?: Record<string, any>): Promise<Service[]> {
  const { data } = await axios.get<Service[]>('/services', { params });
  return data;
}

/**
 * fetchServiceById
 *
 * GET `/services/{id}`
 *
 * Retrieve detailed information about a single service by its ID.
 */
export async function fetchServiceById(id: string): Promise<Service> {
  const { data } = await axios.get<Service>(`/services/${id}`);
  return data;
}

/**
 * createService
 *
 * POST `/services`
 *
 * Create a new service. The backend is expected to return the
 * newly created service including its generated ID.
 */
export async function createService(payload: Service): Promise<Service> {
  const { data } = await axios.post<Service>('/services', payload);
  return data;
}

/**
 * updateService
 *
 * PUT `/services/{id}`
 *
 * Update an existing service. The backend should return the
 * updated service object.
 */
export async function updateService(id: string, payload: Partial<Service>): Promise<Service> {
  const { data } = await axios.put<Service>(`/services/${id}`, payload);
  return data;
}

/**
 * deleteService
 *
 * DELETE `/services/{id}`
 *
 * Remove a service. The backend often returns a confirmation
 * message or the deleted entity. Adjust the return type as your
 * swagger dictates.
 */
export async function deleteService(id: string): Promise<{ message: string }> {
  const { data } = await axios.delete(`/services/${id}`);
  return data;
}