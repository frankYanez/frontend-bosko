import React from 'react';
import {
  useProfile as useProfileQuery,
  useUpdateProfile,
  useToggleAvailability,
} from '@/hooks/queries/useProfileQuery';
import type { UpdateProfilePayload } from '@/features/servicesUser/services/profile';

export const ProfileProvider = ({ children }: { children: React.ReactNode }) => (
  <>{children}</>
);

export const useProfile = () => {
  const query = useProfileQuery();
  const updateMutation = useUpdateProfile();
  const toggleMutation = useToggleAvailability();

  return {
    profile: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error?.message ?? null,
    refreshProfile: async () => { await query.refetch(); },
    updateProfile: async (payload: UpdateProfilePayload) => {
      await updateMutation.mutateAsync(payload);
    },
    toggleAvailability: async () => {
      await toggleMutation.mutateAsync(!(query.data?.isAvailable ?? true));
    },
    clearError: () => {},
  };
};
