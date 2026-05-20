import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  getCurrentUserProfile,
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
    if (!authState.token) {
      return;
    }

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

  const updateProfile = async (payload: UpdateProfilePayload) => {
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
  };

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
        clearError,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
};
