import type {
  Category,
  ProviderProfile,
  Review,
  ServiceSummary,
} from "@/types/services";
import api from "@/core/api/axiosinstance";

export async function fetchCategoriesService(): Promise<Category[]> {
  const { data } = await api.get<Category[]>("/categories");
  return data;
}

export async function fetchServicesByCategoryService(
  categoryId: string
): Promise<ServiceSummary[]> {
  const { data } = await api.get<ServiceSummary[]>(`/services`, {
    params: { categoryId },
  });
  return data;
}

/** Perfil público de un proveedor — GET /users/:id/public */
export async function fetchProviderProfileService(
  providerId: string
): Promise<ProviderProfile> {
  const { data } = await api.get<ProviderProfile>(`/users/${providerId}/public`);
  return data;
}

/** Reseñas de un proveedor — GET /reviews/providers/:id/reviews */
export async function fetchServiceReviewsService(providerId: string): Promise<Review[]> {
  const { data } = await api.get<{ data: Review[] }>(
    `/reviews/providers/${providerId}/reviews`,
  );
  return data.data;
}
