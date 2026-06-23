import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/core/query/queryKeys';
import { search } from '@/features/search/services/search.service';
import { useMarketplaceStore } from '@/stores/marketplace.store';
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue';

export function useSearch() {
  const query = useMarketplaceStore((s) => s.searchQuery);
  const debouncedQuery = useDebouncedValue(query, 400);

  const result = useQuery({
    queryKey: QUERY_KEYS.search(debouncedQuery),
    queryFn: () => search(debouncedQuery),
    enabled: debouncedQuery.length >= 2,
    staleTime: 5 * 60 * 1000,
  });

  return {
    ...result,
    query,
    setQuery: useMarketplaceStore.getState().setSearchQuery,
  };
}
