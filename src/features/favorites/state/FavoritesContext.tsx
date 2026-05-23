import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { ServiceSummary } from '@/types/services';
import {
  loadFavorites,
  addFavorite,
  removeFavorite,
} from '../services/favorites.service';
import { useAuth } from '@/features/auth/state/AuthContext';

interface FavoritesContextValue {
  favorites: ServiceSummary[];
  count: number;
  isFavorite: (serviceId: string) => boolean;
  toggle: (service: ServiceSummary) => Promise<void>;
  loading: boolean;
}

const FavoritesContext = createContext<FavoritesContextValue | undefined>(undefined);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [favorites, setFavorites] = useState<ServiceSummary[]>([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      setFavorites([]);
      setLoading(false);
      return;
    }
    loadFavorites()
      .then(setFavorites)
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  const isFavorite = useCallback(
    (serviceId: string) => favorites.some(s => s.id === serviceId),
    [favorites],
  );

  const toggle = useCallback(async (service: ServiceSummary) => {
    if (isFavorite(service.id)) {
      const updated = await removeFavorite(service.id);
      setFavorites(updated);
    } else {
      const updated = await addFavorite(service);
      setFavorites(updated);
    }
  }, [isFavorite]);

  return (
    <FavoritesContext.Provider value={{ favorites, count: favorites.length, isFavorite, toggle, loading }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavorites debe usarse dentro de FavoritesProvider');
  return ctx;
}
