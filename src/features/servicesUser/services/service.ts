import api from "@/core/api/axiosinstance";

export type PlanType = "FREE" | "PLUS";

export interface Service {
  id?: string;
  title: string;
  description: string;
  price: number;
  category: string | { id: string; name: string };
  image?: string | null;
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ServicePayload {
  title: string;
  description: string;
  price: number;
  category: string;
  image?: string | null;
}

export async function getMyServices(): Promise<Service[]> {
  const { data } = await api.get<{ data: Service[] }>("/services/me");
  return data.data;
}

export async function createService(payload: ServicePayload): Promise<Service> {
  const { data } = await api.post<Service>("/services", payload);
  return data;
}

export async function updateService(
  id: string,
  payload: Partial<ServicePayload>
): Promise<Service> {
  const { data } = await api.patch<Service>(`/services/${id}`, payload);
  return data;
}

export async function deleteService(id: string): Promise<void> {
  await api.delete(`/services/${id}`);
}

/** Subir imágenes a un servicio — POST /services/:id/images (multipart, max 5) */
export async function uploadServiceImages(
  serviceId: string,
  imageUris: string[],
): Promise<{ images: string[] }> {
  const formData = new FormData();
  imageUris.forEach((uri, i) => {
    formData.append('images', {
      uri,
      type: 'image/jpeg',
      name: `service-image-${i}.jpg`,
    } as any);
  });

  const { data } = await api.post<{ images: string[] }>(
    `/services/${serviceId}/images`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );
  return data;
}
