
import api from "@/core/api/axiosinstance";
import { Id } from "../interfaces/common";
import { Provider, ProviderServicePayload } from "../interfaces/provider";
import { Service } from "../interfaces/service";

export async function listProviders(params?: Record<string, any>): Promise<Provider[]> {
  const { data } = await api.get<Provider[]>("/provider", { params });
  return data;
}

export async function getProvider(id: Id): Promise<Provider> {
  const { data } = await api.get<any>(`/users/${id}/public`);
  return {
    id: data.id,
    name: [data.firstName, data.lastName].filter(Boolean).join(' ') || data.username || data.name || '',
    title: data.title || '',
    summary: data.summary || data.bio || '',
    bio: data.bio || '',
    avatar: data.avatar || '',
    photo: data.avatar || '',
    heroImage: data.heroImage || data.coverImage || '',
    location: data.location || '',
    rating: data.rating ?? data.averageRating ?? 0,
    reviews: data.reviewsCount ?? data.reviews ?? 0,
    reviewsCount: data.reviewsCount ?? 0,
    categoryId: data.categoryId,
    rate: data.rate,
    tags: data.tags || [],
  };
}

export async function listProviderServices(_id: Id): Promise<Service[]> {
  return [];
}

export async function createProviderService(
  id: Id,
  payload: ProviderServicePayload
): Promise<Service> {
  const { data } = await api.post<Service>(`/provider/${id}/services`, payload);
  return data;
}
