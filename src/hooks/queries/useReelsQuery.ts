import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getReelsFeed,
  toggleLikeReel,
  createReel,
  type CreateReelPayload,
} from '@/features/reels/services/reels.service';

export function useReelsFeed() {
  return useInfiniteQuery({
    queryKey: ['reels'],
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
      await qc.cancelQueries({ queryKey: ['reels'] });
      const previous = qc.getQueryData(['reels']);

      qc.setQueryData(['reels'], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page: any[]) =>
            page.map((reel) =>
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
      qc.setQueryData(['reels'], ctx?.previous);
    },
  });
}

export function useCreateReel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateReelPayload) => createReel(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reels'] });
    },
  });
}
