import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ServiceSummary } from '@/types/services';

interface FavoritesState {
  favorites: ServiceSummary[];
  isFavorite: (serviceId: string) => boolean;
  toggle: (service: ServiceSummary) => void;
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favorites: [],

      isFavorite: (serviceId: string) =>
        get().favorites.some((s) => s.id === serviceId),

      toggle: (service: ServiceSummary) => {
        const current = get().favorites;
        const exists = current.some((s) => s.id === service.id);
        set({
          favorites: exists
            ? current.filter((s) => s.id !== service.id)
            : [service, ...current],
        });
      },
    }),
    {
      name: 'BOSKO_FAVORITES_v2',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ favorites: state.favorites }),
    },
  ),
);

export const useFavoritesList = () => useFavoritesStore((s) => s.favorites);
export const useIsFavorite = (id: string) =>
  useFavoritesStore((s) => s.isFavorite(id));
export const useFavoritesCount = () => useFavoritesStore((s) => s.favorites.length);
