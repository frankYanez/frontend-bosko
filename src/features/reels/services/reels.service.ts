import api from '@/core/api/axiosinstance';

export interface ReelUser {
  id: string;
  name: string;
  username: string;
  avatar: string | null;
}

export interface Reel {
  id: string;
  videoUrl: string;
  user: ReelUser;
  description: string | null;
  tags: string[];
  music: string | null;
  likes: number;
  comments: number;
  isLiked: boolean;
  createdAt: string;
}

export interface CreateReelPayload {
  videoUrl: string;
  description?: string;
  tags?: string[];
  music?: string;
}

/** GET /reels?page=1&limit=10 */
export async function getReelsFeed(page = 1, limit = 10): Promise<Reel[]> {
  const res = await api.get<Reel[]>('/reels', { params: { page, limit } });
  return res.data;
}

/** POST /reels */
export async function createReel(payload: CreateReelPayload): Promise<Reel> {
  const res = await api.post<Reel>('/reels', payload);
  return res.data;
}

/** POST /reels/:id/like  → toggle */
export async function toggleLikeReel(
  reelId: string,
): Promise<{ likes: number; isLiked: boolean }> {
  const res = await api.post<{ likes: number; isLiked: boolean }>(`/reels/${reelId}/like`);
  return res.data;
}

/** POST /reels/:id/comments */
export async function commentOnReel(
  reelId: string,
  comment: string,
): Promise<{ commentsCount: number }> {
  const res = await api.post<{ commentsCount: number }>(`/reels/${reelId}/comments`, { comment });
  return res.data;
}
