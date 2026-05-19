import api from "@/core/api/axiosinstance";

export interface PublicUser {
  id: string;
  username: string;
  firstName: string;
  lastName?: string;
  avatarUrl?: string;
  bio?: string;
  isVerified: boolean;
  role: string;
  rating?: number;
  reviewsCount?: number;
}

/** Perfil público de otro usuario — GET /users/:id/public */
export async function fetchUserById(id: string): Promise<PublicUser> {
  const { data } = await api.get<PublicUser>(`/users/${id}/public`);
  return data;
}
