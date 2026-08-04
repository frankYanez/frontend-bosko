import api from "@/core/api/axiosinstance";

export interface PublicUser {
  id: string;
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

/** Seguir a un usuario — POST /users/:id/follow */
export async function followUser(id: string): Promise<void> {
  await api.post(`/users/${id}/follow`);
}

/** Dejar de seguir a un usuario — DELETE /users/:id/follow */
export async function unfollowUser(id: string): Promise<void> {
  await api.delete(`/users/${id}/follow`);
}
