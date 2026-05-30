import { useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/core/query/queryKeys';
import {
  createReview,
  replyToReview,
  type ReviewPayload,
} from '@/features/reviews/services/review.service';

export function useCreateReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ReviewPayload) => createReview(payload),
    onSuccess: (review) => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.serviceReviews(review.providerId) });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.orderById(review.orderId) });
    },
  });
}

export function useReplyToReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ reviewId, reply }: { reviewId: string; reply: string }) =>
      replyToReview(reviewId, reply),
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.serviceReviews(updated.providerId) });
    },
  });
}
