import React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/core/query/queryKeys';
import { extractApiError } from '../lib/errors';
import type { Id } from '../interfaces/common';
import type { Provider, ProviderServicePayload } from '../interfaces/provider';
import type { Service } from '../interfaces/service';
import {
  listProviders,
  listProviderServices,
  createProviderService,
} from '../services/providers.service';
import { useProviderProfile } from '@/hooks/queries/useMarketplaceQuery';

interface ProvidersState {
  providers: Provider[];
  loading: boolean;
  error: string | null;
  loadProviders: (filters?: Record<string, any>) => Promise<void>;
  findProvider: (id: Id) => Provider | undefined;
  fetchProvider: (id: Id) => Promise<Provider | null>;
  loadProviderServices: (id: Id) => Promise<Service[] | null>;
  addProviderService: (id: Id, payload: ProviderServicePayload) => Promise<Service | null>;
}

export const ProvidersProvider: React.FC<React.PropsWithChildren> = ({ children }) => (
  <>{children}</>
);

export const useProviders = (): ProvidersState => {
  const qc = useQueryClient();

  return {
    providers: [],
    loading: false,
    error: null,

    loadProviders: async (filters?: Record<string, any>) => {
      try {
        await listProviders(filters);
      } catch {}
    },

    findProvider: (_id: Id) => undefined,

    fetchProvider: async (id: Id) => {
      try {
        const data = await qc.fetchQuery({
          queryKey: QUERY_KEYS.providerProfile(String(id)),
          queryFn: async () => {
            const { fetchProviderProfileService } = await import(
              '@/features/servicesUser/services/catalog'
            );
            return fetchProviderProfileService(String(id));
          },
          staleTime: 10 * 60 * 1000,
        });
        return data as unknown as Provider;
      } catch {
        return null;
      }
    },

    loadProviderServices: async (id: Id) => {
      try {
        return await listProviderServices(id);
      } catch {
        return null;
      }
    },

    addProviderService: async (id: Id, payload: ProviderServicePayload) => {
      try {
        return await createProviderService(id, payload);
      } catch {
        return null;
      }
    },
  };
};
