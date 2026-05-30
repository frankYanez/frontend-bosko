import React from 'react';
import type { ServiceSummary } from '@/types/services';
import { useFavoritesStore } from '@/stores/favorites.store';

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function useFavorites() {
  const store = useFavoritesStore();

  return {
    favorites: store.favorites,
    count: store.favorites.length,
    isFavorite: (serviceId: string) => store.isFavorite(serviceId),
    toggle: async (service: ServiceSummary) => { store.toggle(service); },
    loading: false,
  };
}
