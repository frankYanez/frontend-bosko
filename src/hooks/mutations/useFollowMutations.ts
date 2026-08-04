import { useMutation } from '@tanstack/react-query';
import { followUser, unfollowUser } from '@/features/users/services/users';

export function useFollowUser() {
  return useMutation({
    mutationFn: (userId: string) => followUser(userId),
  });
}

export function useUnfollowUser() {
  return useMutation({
    mutationFn: (userId: string) => unfollowUser(userId),
  });
}
