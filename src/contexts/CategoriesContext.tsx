import React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/core/query/queryKeys';
import { getUserErrorMessage } from '../lib/errors';
import type { Id } from '../interfaces/common';
import type { Category } from '../interfaces/category';
import {
  listCategories,
  getCategory,
  updateCategory,
  deleteCategory,
} from '../services/categories.service';
import { useCategories as useCategoriesQuery } from '@/hooks/queries/useMarketplaceQuery';

interface CategoriesState {
  categories: Category[];
  loading: boolean;
  error: string | null;
  loadCategories: () => Promise<void>;
  findCategory: (id: Id) => Category | undefined;
  refreshCategory: (id: Id) => Promise<Category | null>;
  editCategory: (id: Id, payload: Partial<Category>) => Promise<Category | null>;
  removeCategory: (id: Id) => Promise<void>;
}

export const CategoriesProvider: React.FC<React.PropsWithChildren> = ({ children }) => (
  <>{children}</>
);

export const useCategories = (): CategoriesState => {
  const qc = useQueryClient();
  const query = useCategoriesQuery();

  const categories = (query.data ?? []) as Category[];

  return {
    categories,
    loading: query.isLoading,
    error: query.error?.message ?? null,

    loadCategories: async () => {
      await query.refetch();
    },

    findCategory: (id: Id) => categories.find((c) => c.id === id),

    refreshCategory: async (id: Id) => {
      try {
        const data = await getCategory(id);
        qc.setQueryData(QUERY_KEYS.categories, (old: Category[] | undefined) => {
          if (!old) return [data];
          const exists = old.some((c) => c.id === id);
          return exists ? old.map((c) => (c.id === id ? data : c)) : [...old, data];
        });
        return data;
      } catch (err) {
        return null;
      }
    },

    editCategory: async (id: Id, payload: Partial<Category>) => {
      try {
        const updated = await updateCategory(id, payload);
        qc.setQueryData(QUERY_KEYS.categories, (old: Category[] | undefined) =>
          old ? old.map((c) => (c.id === id ? updated : c)) : old,
        );
        return updated;
      } catch {
        return null;
      }
    },

    removeCategory: async (id: Id) => {
      try {
        await deleteCategory(id);
        qc.setQueryData(QUERY_KEYS.categories, (old: Category[] | undefined) =>
          old ? old.filter((c) => c.id !== id) : old,
        );
      } catch {}
    },
  };
};
