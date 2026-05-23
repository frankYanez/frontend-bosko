import React, { createContext, useCallback, useContext, useState, useEffect } from "react";
import {
  getCurrentUserProfile,
  toggleAvailabilityService,
  UpdateProfilePayload,
  updateUserProfile,
  UserProfile,
} from "../../servicesUser/services/profile";
import { useAuth } from "@/features/auth/state/AuthContext";

interface ProfileContextType {
  profile: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  refreshProfile: () => Promise<void>;
  updateProfile: (payload: UpdateProfilePayload) => Promise<void>;
  toggleAvailability: () => Promise<void>;
  clearError: () => void;
}

const ProfileContext = createContext<ProfileContextType | null>(null);

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error("useProfile must be used within a ProfileProvider");
  }
  return context;
};

export const ProfileProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { authState } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshProfile = useCallback(async () => {
    if (!authState.token) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await getCurrentUserProfile();
      setProfile(data);
    } catch (err: any) {
      const message =
        err?.response?.data?.message || "Error al cargar el perfil";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [authState.token]);

  const updateProfile = useCallback(async (payload: UpdateProfilePayload) => {
    setIsLoading(true);
    setError(null);

    try {
      const updatedProfile = await updateUserProfile(payload);
      setProfile(updatedProfile);
    } catch (err: any) {
      const message =
        err?.response?.data?.message || "Error al actualizar el perfil";
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const toggleAvailability = useCallback(async () => {
    const next = !(profile?.isAvailable ?? true);
    setProfile(prev => prev ? { ...prev, isAvailable: next } : prev);
    try {
      const updated = await toggleAvailabilityService(next);
      setProfile(updated);
    } catch {
      setProfile(prev => prev ? { ...prev, isAvailable: !next } : prev);
    }
  }, [profile?.isAvailable]);

  const clearError = () => setError(null);

  useEffect(() => {
    if (authState.token) {
      refreshProfile();
    } else {
      setProfile(null);
    }
  }, [authState.token, refreshProfile]);

  return (
    <ProfileContext.Provider
      value={{
        profile,
        isLoading,
        error,
        refreshProfile,
        updateProfile,
        toggleAvailability,
        clearError,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
};
