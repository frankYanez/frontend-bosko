import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/core/query/queryKeys';
import {
  getReelsFeed,
  toggleLikeReel,
  createReel,
  type CreateReelPayload,
} from '@/features/reels/services/reels.service';

const REELS_KEY = ['reels'] as const;

export function useReelsFeed() {
  return useInfiniteQuery({
    queryKey: REELS_KEY,
    queryFn: ({ pageParam = 1 }) => getReelsFeed(pageParam as number, 10),
    initialPageParam: 1,
    getNextPageParam: (lastPage: any[], allPages) =>
      lastPage.length === 10 ? allPages.length + 1 : undefined,
  });
}

export function useToggleLikeReel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (reelId: string) => toggleLikeReel(reelId),
    onMutate: async (reelId) => {
      await qc.cancelQueries({ queryKey: REELS_KEY });
      const previous = qc.getQueryData(REELS_KEY);

      qc.setQueryData(REELS_KEY, (old: any) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page: any[]) =>
            page.map((reel: any) =>
              reel.id === reelId
                ? {
                    ...reel,
                    isLiked: !reel.isLiked,
                    likes: reel.isLiked ? reel.likes - 1 : reel.likes + 1,
                  }
                : reel,
            ),
          ),
        };
      });

      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      qc.setQueryData(REELS_KEY, ctx?.previous);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: REELS_KEY });
    },
  });
}

export function useCreateReel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateReelPayload) => createReel(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: REELS_KEY });
    },
  });
}
