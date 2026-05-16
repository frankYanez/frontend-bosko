import type {
  Category,
  ProviderProfile,
  Review,
  ServiceSummary,
} from "@/types/services";
import api from "@/core/api/axiosinstance";

function mapService(s: any): ServiceSummary {
  return {
    id: s.id,
    categoryId: s.category?.id ?? s.categoryId ?? '',
    providerId: s.provider?.id ?? s.providerId ?? '',
    name: [s.provider?.firstName, s.provider?.lastName].filter(Boolean).join(' ') || s.provider?.username || '',
    title: s.title ?? '',
    summary: s.description ?? '',
    thumbnail: s.images?.[0] ?? s.image ?? undefined,
    images: s.images,
    location: s.provider?.location ?? s.location ?? '',
    rate: {
      amount: parseFloat(s.price?.amount ?? String(s.price ?? 0)) || 0,
      currency: s.price?.currency ?? s.currency ?? 'ARS',
      unit: s.price?.unit ?? 'hora',
    },
    averageRating: s.provider?.rating ?? s.averageRating ?? 0,
    reviewsCount: s.provider?.reviewsCount ?? s.reviewsCount ?? 0,
  };
}

export async function fetchCategoriesService(): Promise<Category[]> {
  const { data } = await api.get<any>('/services', { params: { limit: 100 } });
  const services: any[] = (data as any)?.data ?? [];
  const seen = new Set<string>();
  const categories: Category[] = [];
  for (const s of services) {
    const cat = s.category;
    if (cat?.id && !seen.has(cat.id)) {
      seen.add(cat.id);
      categories.push({
        id: cat.id,
        name: cat.name ?? '',
        description: cat.description ?? '',
        icon: cat.icon ?? '🔧',
        accent: cat.accent ?? '#850021',
      });
    }
  }
  return categories;
}

export async function fetchServicesByCategoryService(
  categoryId: string
): Promise<ServiceSummary[]> {
  const { data } = await api.get<any>('/services', { params: { categoryId } });
  const services: any[] = (data as any)?.data ?? [];
  return services.map(mapService);
}

export async function fetchProviderProfileService(
  providerId: string
): Promise<ProviderProfile> {
  const { data } = await api.get<any>(`/users/${providerId}/public`);
  return {
    id: data.id,
    serviceId: data.serviceId ?? '',
    categoryId: data.categoryId ?? '',
    name: [data.firstName, data.lastName].filter(Boolean).join(' ') || data.username || data.name || '',
    title: data.title ?? '',
    summary: data.summary ?? data.bio ?? '',
    bio: data.bio ?? '',
    avatar: data.avatar ?? '',
    heroImage: data.heroImage ?? data.coverImage ?? '',
    location: data.location ?? '',
    tags: data.tags ?? [],
    recentWorks: data.recentWorks ?? [],
    averageRating: data.rating ?? data.averageRating ?? 0,
    reviewsCount: data.reviewsCount ?? 0,
    rate: data.rate ?? { amount: 0, currency: 'ARS', unit: 'hora' },
  };
}

export async function fetchServiceReviewsService(providerId: string): Promise<Review[]> {
  try {
    const { data } = await api.get<any>(`/reviews/providers/${providerId}/reviews`);
    return (data as any)?.data ?? (Array.isArray(data) ? data : []);
  } catch {
    return [];
  }
}
