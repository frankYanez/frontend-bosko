import api from "@/core/api/axiosinstance";

export interface Review {
  id: string;
  orderId: string;
  reviewerId: string;
  providerId: string;
  rating: number;
  comment: string;
  reply?: string;
  createdAt: string;
}

export interface PaginatedReviews {
  data: Review[];
  total: number;
  page: number;
  limit: number;
}

/** Reseñas de un proveedor — GET /reviews/providers/:id/reviews */
export async function fetchReviewsByProvider(
  providerId: string,
  page = 1,
  limit = 20,
): Promise<PaginatedReviews> {
  const { data } = await api.get<PaginatedReviews>(
    `/reviews/providers/${providerId}/reviews`,
    { params: { page, limit } },
  );
  return data;
}

/** Rating promedio de un proveedor — GET /reviews/providers/:id/rating */
export async function fetchProviderRating(
  providerId: string,
): Promise<{ rating: number; count: number }> {
  const { data } = await api.get<{ rating: number; count: number }>(
    `/reviews/providers/${providerId}/rating`,
  );
  return data;
}
