import axios from "axios";

/**
 * Reviews (ratings and comments) related API calls.
 *
 * After a job is completed, clients can leave a rating and comment
 * for the pro. The average of all ratings typically appears on the
 * service card. These endpoints allow fetching reviews for a
 * service and posting new reviews.
 */

export interface Review {
  id?: string;
  serviceId: string;
  userId: string;
  rating: number;
  comment: string;
  createdAt?: string;
}

/**
 * fetchReviewsByService
 *
 * GET `/services/{id}/reviews`
 *
 * Retrieve all reviews for a specific service.
 */
export async function fetchReviewsByService(serviceId: string): Promise<Review[]> {
  const { data } = await axios.get<Review[]>(`/services/${serviceId}/reviews`);
  return data;
}

/**
 * createReview
 *
 * POST `/services/{id}/reviews`
 *
 * Submit a new review for a service. The backend will attach the
 * current user ID from the auth token.
 */
export async function createReview(serviceId: string, payload: Omit<Review, 'id' | 'serviceId' | 'userId' | 'createdAt'>): Promise<Review> {
  const { data } = await axios.post<Review>(`/services/${serviceId}/reviews`, payload);
  return data;
}