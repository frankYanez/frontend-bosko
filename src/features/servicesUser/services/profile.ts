import api from "@/core/api/axiosinstance";


export interface UserProfile {
    id: string;
    email: string;
    username: string;
    firstName: string;
    lastName?: string;
    phone?: string;
    bio?: string;
    avatarUrl?: string;
    bannerUrl?: string;
    location?: string;
    isVerified: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface UpdateProfilePayload {
    firstName?: string;
    lastName?: string;
    bio?: string;
    avatarUrl?: string;
    bannerUrl?: string;
    location?: string;
}

/**
 * Get current user profile
 * GET /auth/me
 */
export async function getCurrentUserProfile(): Promise<UserProfile> {
    const { data } = await api.get<UserProfile>("/users/me");
    return data;
}

/**
 * Update current user profile
 * PUT /user
 */
export async function updateUserProfile(
    payload: UpdateProfilePayload
): Promise<UserProfile> {
    const { data } = await api.patch<UserProfile>("/users/me", payload);
    return data;
}

/** Subir avatar — POST /users/me/avatar */
export async function uploadAvatar(fileUri: string): Promise<{ avatarUrl: string }> {
    const formData = new FormData();
    formData.append('avatar', { uri: fileUri, type: 'image/jpeg', name: 'avatar.jpg' } as any);

    const { data } = await api.post<{ avatarUrl: string }>("/users/me/avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
}

/** Obtener estadísticas del perfil — GET /users/me/stats */
export interface UserStats {
    servicesCount: number;
    reviewsCount: number;
    averageRating: number;
    completedOrders: number;
}

export async function getUserStats(): Promise<UserStats> {
    const { data } = await api.get<UserStats>("/users/me/stats");
    return data;
}
