# Migración Completa: Zustand + TanStack Query

> Documento generado tras revisión exhaustiva del codebase. Cubre los **16 providers** actuales,
> código concreto listo para copiar, y un plan de migración incremental sin romper nada.

---

## Índice

1. [Diagnóstico del estado actual](#1-diagnóstico-del-estado-actual)
2. [Instalación](#2-instalación)
3. [Configuración base](#3-configuración-base)
4. [Stores Zustand](#4-stores-zustand)
5. [Hooks TanStack Query](#5-hooks-tanstack-query)
6. [Migración context por context](#6-migración-context-por-context)
7. [Nuevo `_layout.tsx`](#7-nuevo-_layouttsx)
8. [Plan de migración por fases](#8-plan-de-migración-por-fases)
9. [Tabla de equivalencias rápida](#9-tabla-de-equivalencias-rápida)

---

## 1. Diagnóstico del estado actual

### 1.1 Los 16 providers activos

| # | Provider | Archivo | Líneas | Problema principal |
|---|---|---|---|---|
| 1 | `AuthProvider` | `features/auth/state/AuthContext.tsx` | 209 | ✅ **Queda como Context** (router + tokenStorage singleton) |
| 2 | `ProfileProvider` | `features/profile/state/ProfileContext.tsx` | 113 | `useState` manual, loading/error duplicado |
| 3 | `UsersProvider` | `contexts/UsersContext.tsx` | 119 | Lista de users admin, rara vez usada globalmente |
| 4 | `CategoriesProvider` | `contexts/CategoriesContext.tsx` | 134 | Fetch en mount, sin cache |
| 5 | `ProvidersProvider` | `contexts/ProvidersContext.tsx` | 127 | Array mutable con comentarios de "¿cómo evitar refetch?" |
| 6 | `ServicesProvider` | `features/servicesUser/state/ServicesContext.tsx` | **831** | El más crítico: `useReducer` casero, todo mezclado |
| 7 | `SearchProvider` | `contexts/SearchContext.tsx` | 56 | **Duplicado** — hay otro en `features/search/state/` |
| 8 | `PaymentsProvider` | `features/payments/state/PaymentContext.tsx` | 102 | Paginación manual |
| 9 | `OrdersProvider` | `features/orders/state/OrdersContext.tsx` | 174 | `useState` + callbacks, sin cache |
| 10 | `PostsProvider` | `features/servicesUser/state/PostsContext.tsx` | 107 | Scoped a `serviceId` pero montado globalmente con `serviceId="global"` |
| 11 | `ReviewsProvider` | `features/servicesUser/state/ReviewsContext.tsx` | 44 | Scoped a `providerId` pero montado globalmente con `providerId="global"` |
| 12 | `KYCProvider` | `features/kyc/state/KYCContext.tsx` | 124 | Fetch en mount |
| 13 | `NotificationsProvider` | `features/notifications/state/NotificationsContext.tsx` | 186 | Push token + listeners nativos (side effects complejos) |
| 14 | `FavoritesProvider` | `features/favorites/state/FavoritesContext.tsx` | 63 | Usa AsyncStorage — perfecto para Zustand persist |
| 15 | `ConversationsProvider` | `features/chat/state/ConversationsContext.tsx` | 37 | Estado en tiempo real + socket |
| 16 | `UnreadProvider` | `features/chat/state/UnreadContext.tsx` | 13 | Solo `total` y `setTotal` — 13 líneas de provider innecesario |

### 1.2 Problemas concretos encontrados

**Re-renders sin control:**
```tsx
// OrdersContext — el objeto value se recrea en cada render
// Cualquier cambio (ej: loading) → todos los consumidores re-renderizan
<OrdersContext.Provider value={{
  clientOrders, providerOrders, loading, error, // <-- objeto nuevo siempre
  loadClientOrders, loadProviderOrders, ...
}}>
```

**Estado del servidor mezclado con estado UI:**
```tsx
// ProfileContext mezcla datos del servidor con lógica de loading/error
const [profile, setProfile]   = useState<UserProfile | null>(null);
const [isLoading, setIsLoading] = useState(false);   // → TanStack Query
const [error, setError]        = useState<string | null>(null); // → TanStack Query
```

**Providers scoped montados globalmente (workaround con prop ficticia):**
```tsx
// _layout.tsx — PostsProvider y ReviewsProvider tienen un prop requerido
// que no tiene sentido en este nivel
<PostsProvider serviceId="global">    // ← "global" no existe en la API
  <ReviewsProvider providerId="global"> // ← ídem
```

**Duplicado de SearchContext:**
- `src/contexts/SearchContext.tsx` — importa de rutas internas de features
- `src/features/search/state/SearchContext.tsx` — versión diferente con imports distintos

---

## 2. Instalación

```bash
# TanStack Query para React Native
npm install @tanstack/react-query

# Zustand
npm install zustand

# DevTools (solo desarrollo)
npm install --save-dev @tanstack/react-query-devtools
```

No se necesita `immer` por separado — Zustand lo incluye como middleware.

---

## 3. Configuración base

### 3.1 QueryClient — `src/core/query/queryClient.ts`

```ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Datos considerados frescos por 2 minutos — no refetch innecesario
      staleTime: 2 * 60 * 1000,
      // Cache se mantiene 5 minutos después de que el último observer se desmonta
      gcTime: 5 * 60 * 1000,
      // Reintentos reducidos — la app mobile no debería spammear si no hay red
      retry: 1,
      // Refetch al enfocar la app (útil en mobile cuando el usuario vuelve)
      refetchOnWindowFocus: true,
    },
    mutations: {
      retry: 0,
    },
  },
});
```

### 3.2 Query Keys — `src/core/query/queryKeys.ts`

Centralizar las keys evita inconsistencias y facilita invalidaciones.

```ts
export const QUERY_KEYS = {
  // Auth / Perfil
  profile:        ['profile']                          as const,
  profileStats:   ['profile', 'stats']                 as const,
  publicUser:     (id: string) => ['users', id]        as const,

  // Marketplace
  categories:     ['categories']                        as const,
  services:       (categoryId: string, page = 1) =>
                    ['services', categoryId, page]       as const,
  featuredServices: ['services', 'featured']            as const,
  myServices:     ['services', 'me']                   as const,
  serviceById:    (id: string) => ['services', id]      as const,
  providerProfile:(id: string) => ['providers', id]    as const,
  serviceReviews: (id: string) => ['reviews', 'service', id] as const,
  servicePosts:   (id: string) => ['posts', id]         as const,

  // Órdenes
  clientOrders:   ['orders', 'client']                 as const,
  providerOrders: ['orders', 'provider']               as const,
  orderById:      (id: string) => ['orders', id]        as const,

  // Pagos
  paymentHistory: (page = 1) => ['payments', 'history', page] as const,
  earnings:       (page = 1) => ['payments', 'earnings', page] as const,
  orderPayment:   (orderId: string) => ['payments', 'order', orderId] as const,

  // Chat
  conversations:  ['conversations']                    as const,
  messages:       (convId: string, page = 1) =>
                    ['messages', convId, page]           as const,

  // Notificaciones
  notifications:  (page = 1) => ['notifications', page] as const,
  unreadCount:    ['notifications', 'unread']          as const,

  // KYC
  kycStatus:      ['kyc', 'status']                    as const,

  // Reels
  reelsFeed:      (page = 1) => ['reels', page]         as const,

  // Search
  search:         (query: string) => ['search', query]  as const,
} as const;
```

---

## 4. Stores Zustand

### 4.1 Chat Store — `src/stores/chat.store.ts`

Reemplaza `ConversationsContext` + `UnreadContext`. Gestiona el estado en tiempo real
que el socket.io actualiza fuera del ciclo de React.

```ts
import { create } from 'zustand';
import type { Conversation } from '@/features/chat/services/chat.service';

interface ChatState {
  // Conversaciones (lista para ConversationsListScreen)
  conversations: Conversation[];
  setConversations: (convs: Conversation[]) => void;
  updateLastMessage: (convId: string, content: string, senderId: string) => void;

  // Contador de no leídos (badge en tab bar)
  unreadTotal: number;
  setUnreadTotal: (n: number) => void;
  incrementUnread: () => void;

  // Estado del socket
  socketReady: boolean;
  setSocketReady: (ready: boolean) => void;

  // Typing indicators por conversación
  typingUsers: Record<string, boolean>; // convId → isTyping
  setTyping: (convId: string, isTyping: boolean) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  conversations: [],
  setConversations: (conversations) => set({ conversations }),

  updateLastMessage: (convId, content, senderId) =>
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === convId
          ? { ...c, lastMessage: { content, senderId, createdAt: new Date().toISOString() } }
          : c,
      ),
    })),

  unreadTotal: 0,
  setUnreadTotal: (unreadTotal) => set({ unreadTotal }),
  incrementUnread: () => set((state) => ({ unreadTotal: state.unreadTotal + 1 })),

  socketReady: false,
  setSocketReady: (socketReady) => set({ socketReady }),

  typingUsers: {},
  setTyping: (convId, isTyping) =>
    set((state) => ({
      typingUsers: { ...state.typingUsers, [convId]: isTyping },
    })),
}));

// Selectores granulares — componentes solo re-renderizan cuando su slice cambia
export const useUnreadTotal = () => useChatStore((s) => s.unreadTotal);
export const useConversations = () => useChatStore((s) => s.conversations);
export const useSocketReady = () => useChatStore((s) => s.socketReady);
export const useIsTyping = (convId: string) =>
  useChatStore((s) => s.typingUsers[convId] ?? false);
```

### 4.2 Favorites Store — `src/stores/favorites.store.ts`

Reemplaza `FavoritesContext`. Con `persist` + AsyncStorage, la hidratación es automática.

```ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ServiceSummary } from '@/types/services';

interface FavoritesState {
  favorites: ServiceSummary[];
  isFavorite: (serviceId: string) => boolean;
  toggle: (service: ServiceSummary) => void;
  count: number;
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

      get count() {
        return get().favorites.length;
      },
    }),
    {
      name: 'BOSKO_FAVORITES_v2',
      storage: createJSONStorage(() => AsyncStorage),
      // Solo persistir la lista — isFavorite y count son derivados
      partialize: (state) => ({ favorites: state.favorites }),
    },
  ),
);

// Selectores
export const useFavoritesList = () => useFavoritesStore((s) => s.favorites);
export const useIsFavorite = (id: string) =>
  useFavoritesStore((s) => s.isFavorite(id));
export const useFavoritesCount = () => useFavoritesStore((s) => s.favorites.length);
```

### 4.3 Marketplace UI Store — `src/stores/marketplace.store.ts`

Solo estado de UI del marketplace (filtros activos, categoría seleccionada).
Los datos reales vienen de TanStack Query.

```ts
import { create } from 'zustand';

interface MarketplaceUIState {
  selectedCategoryId: string | null;
  activeFilters: Record<string, any>;
  searchQuery: string;
  debouncedQuery: string;

  setCategory: (id: string | null) => void;
  setFilter: (key: string, value: any) => void;
  clearFilters: () => void;
  setSearchQuery: (q: string) => void;
  setDebouncedQuery: (q: string) => void;
}

export const useMarketplaceStore = create<MarketplaceUIState>((set) => ({
  selectedCategoryId: null,
  activeFilters: {},
  searchQuery: '',
  debouncedQuery: '',

  setCategory: (selectedCategoryId) => set({ selectedCategoryId }),
  setFilter: (key, value) =>
    set((state) => ({ activeFilters: { ...state.activeFilters, [key]: value } })),
  clearFilters: () => set({ activeFilters: {}, selectedCategoryId: null }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setDebouncedQuery: (debouncedQuery) => set({ debouncedQuery }),
}));
```

---

## 5. Hooks TanStack Query

Todos los hooks viven en `src/hooks/queries/` y `src/hooks/mutations/`.

### 5.1 Profile — `src/hooks/queries/useProfileQuery.ts`

```ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/core/query/queryKeys';
import {
  getCurrentUserProfile,
  updateUserProfile,
  uploadAvatar,
  toggleAvailabilityService,
  getUserStats,
  type UpdateProfilePayload,
} from '@/features/servicesUser/services/profile';
import { useAuth } from '@/features/auth/state/AuthContext';

/** Perfil del usuario autenticado */
export function useProfile() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: QUERY_KEYS.profile,
    queryFn: getCurrentUserProfile,
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });
}

/** Stats del perfil */
export function useProfileStats() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: QUERY_KEYS.profileStats,
    queryFn: getUserStats,
    enabled: isAuthenticated,
  });
}

/** Actualizar perfil */
export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateProfilePayload) => updateUserProfile(payload),
    onSuccess: (updated) => {
      // Actualiza el cache directamente — sin refetch
      qc.setQueryData(QUERY_KEYS.profile, updated);
    },
  });
}

/** Toggle disponibilidad (optimistic update) */
export function useToggleAvailability() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (isAvailable: boolean) => toggleAvailabilityService(isAvailable),
    onMutate: async (isAvailable) => {
      await qc.cancelQueries({ queryKey: QUERY_KEYS.profile });
      const previous = qc.getQueryData(QUERY_KEYS.profile);
      qc.setQueryData(QUERY_KEYS.profile, (old: any) =>
        old ? { ...old, isAvailable } : old
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      qc.setQueryData(QUERY_KEYS.profile, context?.previous);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.profile });
    },
  });
}

/** Subir avatar */
export function useUploadAvatar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (fileUri: string) => uploadAvatar(fileUri),
    onSuccess: ({ avatarUrl }) => {
      qc.setQueryData(QUERY_KEYS.profile, (old: any) =>
        old ? { ...old, avatarUrl } : old
      );
    },
  });
}

/** Perfil público de otro usuario */
export function usePublicUser(userId: string | undefined) {
  return useQuery({
    queryKey: QUERY_KEYS.publicUser(userId!),
    queryFn: () =>
      import('@/features/users/services/users').then((m) =>
        m.fetchUserById(userId!)
      ),
    enabled: !!userId,
    staleTime: 10 * 60 * 1000,
  });
}
```

### 5.2 Marketplace — `src/hooks/queries/useMarketplaceQuery.ts`

```ts
import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/core/query/queryKeys';
import {
  fetchCategoriesService,
  fetchServicesByCategoryService,
  fetchProviderProfileService,
  fetchServiceReviewsService,
} from '@/features/servicesUser/services/catalog';
import {
  getMyServices,
  createService,
  updateService,
  deleteService,
  fetchFeaturedServices,
  type ServicePayload,
} from '@/features/servicesUser/services/service';
import { fetchPostsByService, createPost, likePost, commentOnPost } from '@/features/servicesUser/services/posts';

/** Lista de categorías */
export function useCategories() {
  return useQuery({
    queryKey: QUERY_KEYS.categories,
    queryFn: fetchCategoriesService,
    staleTime: 30 * 60 * 1000, // Las categorías cambian poco
  });
}

/** Servicios de una categoría — paginados con infinite scroll */
export function useServicesByCategory(categoryId: string | null) {
  return useInfiniteQuery({
    queryKey: ['services', categoryId],
    queryFn: ({ pageParam = 1 }) =>
      fetchServicesByCategoryService(categoryId!, pageParam, 10),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.hasMore ? allPages.length + 1 : undefined,
    enabled: !!categoryId,
  });
}

/** Perfil público de un proveedor */
export function useProviderProfile(providerId: string | undefined) {
  return useQuery({
    queryKey: QUERY_KEYS.providerProfile(providerId!),
    queryFn: () => fetchProviderProfileService(providerId!),
    enabled: !!providerId,
    staleTime: 10 * 60 * 1000,
  });
}

/** Reseñas de un proveedor */
export function useServiceReviews(serviceId: string | undefined) {
  return useQuery({
    queryKey: QUERY_KEYS.serviceReviews(serviceId!),
    queryFn: () => fetchServiceReviewsService(serviceId!),
    enabled: !!serviceId,
  });
}

/** Servicios destacados */
export function useFeaturedServices() {
  return useQuery({
    queryKey: QUERY_KEYS.featuredServices,
    queryFn: fetchFeaturedServices,
    staleTime: 15 * 60 * 1000,
  });
}

/** Mis servicios (proveedor) */
export function useMyServices() {
  return useQuery({
    queryKey: QUERY_KEYS.myServices,
    queryFn: getMyServices,
  });
}

/** Crear servicio */
export function useCreateService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ServicePayload) => createService(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.myServices });
    },
  });
}

/** Actualizar servicio */
export function useUpdateService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<ServicePayload> }) =>
      updateService(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.myServices });
    },
  });
}

/** Eliminar servicio */
export function useDeleteService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteService(id),
    onSuccess: (_, id) => {
      qc.setQueryData(QUERY_KEYS.myServices, (old: any[]) =>
        old ? old.filter((s) => s.id !== id) : []
      );
    },
  });
}

/** Posts de un servicio */
export function useServicePosts(serviceId: string | undefined) {
  return useQuery({
    queryKey: QUERY_KEYS.servicePosts(serviceId!),
    queryFn: () => fetchPostsByService(serviceId!),
    enabled: !!serviceId,
  });
}

/** Like en un post (optimistic) */
export function useLikePost(serviceId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (postId: string) => likePost(postId),
    onMutate: async (postId) => {
      await qc.cancelQueries({ queryKey: QUERY_KEYS.servicePosts(serviceId) });
      const previous = qc.getQueryData(QUERY_KEYS.servicePosts(serviceId));
      qc.setQueryData(QUERY_KEYS.servicePosts(serviceId), (old: any[]) =>
        old?.map((p) => p.id === postId ? { ...p, likes: (p.likes ?? 0) + 1 } : p)
      );
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      qc.setQueryData(QUERY_KEYS.servicePosts(serviceId), ctx?.previous);
    },
  });
}
```

### 5.3 Órdenes — `src/hooks/queries/useOrdersQuery.ts`

```ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/core/query/queryKeys';
import {
  fetchOrdersAsClient,
  fetchOrdersAsProvider,
  fetchOrderById,
  createOrder,
  acceptOrder,
  rejectOrder,
  startOrder,
  completeOrder,
  cancelOrder,
  disputeOrder,
} from '@/features/orders/services/orders.service';
import type {
  CreateOrderPayload,
  RejectOrderPayload,
  DisputeOrderPayload,
} from '@/features/orders/types/orders.types';

/** Órdenes como cliente */
export function useClientOrders() {
  return useQuery({
    queryKey: QUERY_KEYS.clientOrders,
    queryFn: fetchOrdersAsClient,
  });
}

/** Órdenes como proveedor */
export function useProviderOrders() {
  return useQuery({
    queryKey: QUERY_KEYS.providerOrders,
    queryFn: fetchOrdersAsProvider,
  });
}

/** Detalle de una orden */
export function useOrder(id: string | undefined) {
  return useQuery({
    queryKey: QUERY_KEYS.orderById(id!),
    queryFn: () => fetchOrderById(id!),
    enabled: !!id,
  });
}

/** Crear orden */
export function useCreateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateOrderPayload) => createOrder(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.clientOrders });
    },
  });
}

// Helper interno para mutar estado de una orden
function makeOrderMutation(
  mutationFn: (id: string, ...args: any[]) => Promise<any>,
  extraArgs?: any,
) {
  return { mutationFn, extraArgs };
}

/** Aceptar orden */
export function useAcceptOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => acceptOrder(id),
    onSuccess: (updated) => {
      qc.setQueryData(QUERY_KEYS.orderById(updated.id), updated);
      qc.invalidateQueries({ queryKey: QUERY_KEYS.providerOrders });
    },
  });
}

/** Rechazar orden */
export function useRejectOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: RejectOrderPayload }) =>
      rejectOrder(id, payload),
    onSuccess: (updated) => {
      qc.setQueryData(QUERY_KEYS.orderById(updated.id), updated);
      qc.invalidateQueries({ queryKey: QUERY_KEYS.providerOrders });
    },
  });
}

/** Iniciar orden */
export function useStartOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => startOrder(id),
    onSuccess: (updated) => {
      qc.setQueryData(QUERY_KEYS.orderById(updated.id), updated);
      qc.invalidateQueries({ queryKey: QUERY_KEYS.providerOrders });
    },
  });
}

/** Completar orden */
export function useCompleteOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => completeOrder(id),
    onSuccess: (updated) => {
      qc.setQueryData(QUERY_KEYS.orderById(updated.id), updated);
      // Invalidar ambas listas — puede aparecer en las dos
      qc.invalidateQueries({ queryKey: QUERY_KEYS.clientOrders });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.providerOrders });
    },
  });
}

/** Cancelar orden */
export function useCancelOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: RejectOrderPayload }) =>
      cancelOrder(id, payload),
    onSuccess: (updated) => {
      qc.setQueryData(QUERY_KEYS.orderById(updated.id), updated);
      qc.invalidateQueries({ queryKey: QUERY_KEYS.clientOrders });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.providerOrders });
    },
  });
}

/** Disputar orden */
export function useDisputeOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: DisputeOrderPayload }) =>
      disputeOrder(id, payload),
    onSuccess: (updated) => {
      qc.setQueryData(QUERY_KEYS.orderById(updated.id), updated);
    },
  });
}
```

### 5.4 Pagos — `src/hooks/queries/usePaymentsQuery.ts`

```ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/core/query/queryKeys';
import {
  initiatePayment,
  getOrderPayment,
  fetchPaymentHistory,
  fetchEarnings,
} from '@/features/payments/services/payments';

export function useOrderPayment(orderId: string | undefined) {
  return useQuery({
    queryKey: QUERY_KEYS.orderPayment(orderId!),
    queryFn: () => getOrderPayment(orderId!),
    enabled: !!orderId,
  });
}

export function usePaymentHistory(page = 1) {
  return useQuery({
    queryKey: QUERY_KEYS.paymentHistory(page),
    queryFn: () => fetchPaymentHistory(page),
  });
}

export function useEarnings(page = 1) {
  return useQuery({
    queryKey: QUERY_KEYS.earnings(page),
    queryFn: () => fetchEarnings(page),
  });
}

export function useInitiatePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (orderId: string) => initiatePayment(orderId),
    onSuccess: (payment) => {
      qc.setQueryData(QUERY_KEYS.orderPayment(payment.orderId), payment);
    },
  });
}
```

### 5.5 KYC — `src/hooks/queries/useKYCQuery.ts`

```ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/core/query/queryKeys';
import { getKYCStatus, startVerification, retryVerification } from '@/features/kyc/services/kyc.service';
import * as WebBrowser from 'expo-web-browser';
import { useAuth } from '@/features/auth/state/AuthContext';

export function useKYCStatus() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: QUERY_KEYS.kycStatus,
    queryFn: getKYCStatus,
    enabled: isAuthenticated,
    select: (data) => {
      if (!data) return null;
      return { ...data, status: data.status?.toLowerCase() as any };
    },
  });
}

export function useStartKYC() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const response = await startVerification();
      const { sessionToken, verificationUrl, inquiryId } = response;
      const url = verificationUrl || (inquiryId && sessionToken
        ? `https://withpersona.com/verify?inquiry-id=${inquiryId}&session-token=${sessionToken}`
        : null);
      if (!url) throw new Error('No se recibió URL de verificación del servidor');
      await WebBrowser.openBrowserAsync(url);
    },
    onSettled: () => {
      // Refrescar estado KYC después de que el usuario vuelva del browser
      qc.invalidateQueries({ queryKey: QUERY_KEYS.kycStatus });
    },
  });
}

export function useRetryKYC() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { sessionToken, verificationUrl } = await retryVerification();
      await WebBrowser.openBrowserAsync(verificationUrl);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.kycStatus });
    },
  });
}
```

### 5.6 Notificaciones — `src/hooks/queries/useNotificationsQuery.ts`

```ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/core/query/queryKeys';
import {
  fetchNotifications,
  fetchUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  clearAllNotifications,
} from '@/features/notifications/services/notifications.service';

export function useNotificationsQuery(page = 1) {
  return useQuery({
    queryKey: QUERY_KEYS.notifications(page),
    queryFn: () => fetchNotifications(page),
  });
}

export function useUnreadNotificationsCount() {
  return useQuery({
    queryKey: QUERY_KEYS.unreadCount,
    queryFn: fetchUnreadCount,
    refetchInterval: 60_000, // polling cada 1 min como fallback
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onMutate: async (id) => {
      // Optimistic: marcar localmente sin esperar al servidor
      qc.setQueryData(QUERY_KEYS.notifications(1), (old: any) => {
        if (!old) return old;
        return {
          ...old,
          data: old.data.map((n: any) => n.id === id ? { ...n, read: true } : n),
        };
      });
      qc.setQueryData(QUERY_KEYS.unreadCount, (old: number) =>
        Math.max(0, (old ?? 0) - 1)
      );
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.unreadCount });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      qc.setQueryData(QUERY_KEYS.unreadCount, 0);
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useDeleteNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteNotification(id),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}
```

### 5.7 Chat — `src/hooks/queries/useChatQuery.ts`

```ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/core/query/queryKeys';
import {
  fetchConversations,
  fetchConversationByOrder,
  fetchMessages,
  sendMessage,
  sendMedia,
  sendAudio,
  markAsRead,
} from '@/features/chat/services/chat.service';
import { useChatStore } from '@/stores/chat.store';

/** Lista de conversaciones — carga inicial, luego Zustand gestiona updates en tiempo real */
export function useConversationsQuery() {
  const setConversations = useChatStore((s) => s.setConversations);

  return useQuery({
    queryKey: QUERY_KEYS.conversations,
    queryFn: async () => {
      const data = await fetchConversations();
      // Sincronizar con el store para que updates de socket sean reflejados
      setConversations(data);
      return data;
    },
    staleTime: 30_000,
  });
}

/** Conversación de una orden específica */
export function useConversationByOrder(orderId: string | undefined) {
  return useQuery({
    queryKey: ['conversations', 'order', orderId],
    queryFn: () => fetchConversationByOrder(orderId!),
    enabled: !!orderId,
  });
}

/** Mensajes de una conversación */
export function useMessages(conversationId: string | undefined, page = 1) {
  return useQuery({
    queryKey: QUERY_KEYS.messages(conversationId!, page),
    queryFn: () => fetchMessages(conversationId!, { page, limit: 50 }),
    enabled: !!conversationId,
    staleTime: 0, // Los mensajes siempre son frescos (socket los actualiza)
  });
}

/** Enviar mensaje de texto */
export function useSendMessage(conversationId: string) {
  const qc = useQueryClient();
  const updateLastMessage = useChatStore((s) => s.updateLastMessage);

  return useMutation({
    mutationFn: (content: string) => sendMessage(conversationId, content),
    onSuccess: (message) => {
      // Actualizar cache de mensajes
      qc.setQueryData(
        QUERY_KEYS.messages(conversationId, 1),
        (old: any) => old
          ? { ...old, messages: [...old.messages, message] }
          : { messages: [message], total: 1, hasMore: false },
      );
      // Actualizar preview en lista de conversaciones
      updateLastMessage(conversationId, message.content, message.senderId);
    },
  });
}

/** Marcar como leída */
export function useMarkAsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (conversationId: string) => markAsRead(conversationId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.conversations });
    },
  });
}
```

### 5.8 Reels — `src/hooks/queries/useReelsQuery.ts`

```ts
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/core/query/queryKeys';
import {
  getReelsFeed,
  toggleLikeReel,
  commentOnReel,
  createReel,
  type CreateReelPayload,
} from '@/features/reels/services/reels.service';

/** Feed de reels — infinite scroll */
export function useReelsFeed() {
  return useInfiniteQuery({
    queryKey: ['reels'],
    queryFn: ({ pageParam = 1 }) => getReelsFeed(pageParam, 10),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length === 10 ? allPages.length + 1 : undefined,
  });
}

/** Toggle like (optimistic) */
export function useToggleLikeReel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (reelId: string) => toggleLikeReel(reelId),
    onMutate: async (reelId) => {
      await qc.cancelQueries({ queryKey: ['reels'] });
      const previous = qc.getQueryData(['reels']);

      qc.setQueryData(['reels'], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page: any[]) =>
            page.map((reel) =>
              reel.id === reelId
                ? {
                    ...reel,
                    isLiked: !reel.isLiked,
                    likes: reel.isLiked ? reel.likes - 1 : reel.likes + 1,
                  }
                : reel,
            ),
          ),
        };
      });

      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      qc.setQueryData(['reels'], ctx?.previous);
    },
  });
}

/** Crear reel */
export function useCreateReel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateReelPayload) => createReel(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reels'] });
    },
  });
}
```

### 5.9 Search — `src/hooks/queries/useSearchQuery.ts`

```ts
import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/core/query/queryKeys';
import { search } from '@/features/search/services/search.service';
import { useMarketplaceStore } from '@/stores/marketplace.store';
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue';

/** Hook de búsqueda con debounce */
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
```

### 5.10 Reviews — `src/hooks/mutations/useReviewMutations.ts`

```ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/core/query/queryKeys';
import {
  createReview,
  replyToReview,
  type ReviewPayload,
} from '@/features/reviews/services/review.service';

export function useCreateReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ReviewPayload) => createReview(payload),
    onSuccess: (review) => {
      // Invalidar reseñas del proveedor
      qc.invalidateQueries({ queryKey: QUERY_KEYS.serviceReviews(review.providerId) });
      // Invalidar la orden (ya no puede dejar reseña)
      qc.invalidateQueries({ queryKey: QUERY_KEYS.orderById(review.orderId) });
    },
  });
}

export function useReplyToReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ reviewId, reply }: { reviewId: string; reply: string }) =>
      replyToReview(reviewId, reply),
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.serviceReviews(updated.providerId) });
    },
  });
}
```

---

## 6. Migración context por context

### 6.1 AuthContext — **No se migra**

```
✅ Queda exactamente igual.
```

**Razones:**
- Usa `router.replace('/login')` de expo-router en el callback de force logout — no se puede hacer desde fuera de React
- `tokenStorage.setForceLogoutCallback()` es un singleton que se registra una sola vez en el mount del provider
- No tiene datos del servidor — es estado de sesión puro

### 6.2 ProfileContext → `useProfile()` + `useUpdateProfile()`

**Antes:**
```tsx
// Cualquier pantalla que necesite el perfil
const { profile, isLoading, error, refreshProfile, updateProfile } = useProfile();
```

**Después:**
```tsx
import { useProfile, useUpdateProfile } from '@/hooks/queries/useProfileQuery';

const { data: profile, isLoading, error, refetch: refreshProfile } = useProfile();
const updateProfile = useUpdateProfile();

// Para actualizar:
await updateProfile.mutateAsync({ firstName: 'Juan' });
```

**Diferencia clave:** TanStack Query hace el fetch automáticamente cuando el usuario está autenticado (via `enabled: isAuthenticated`), sin necesitar llamar a `refreshProfile()` manualmente desde el `useEffect`.

### 6.3 UsersContext → `usePublicUser()` + queries ad-hoc

**Antes:**
```tsx
const { getUser } = useUsers();
const user = await getUser(userId);
```

**Después:**
```tsx
const { data: user } = usePublicUser(userId);
```

Este context es el caso más claro: no tenía estado real, solo era un wrapper de función async. `usePublicUser` hace lo mismo con cache gratis.

### 6.4 CategoriesContext → `useCategories()`

**Antes:**
```tsx
const { categories, loading, loadCategories } = useCategories();
useEffect(() => { loadCategories(); }, []);
```

**Después:**
```tsx
const { data: categories = [], isLoading } = useCategories();
// Sin useEffect — TanStack Query hace el fetch automáticamente
```

**Win específico:** El contexto actual hace `loadCategories()` en el mount del provider (línea 57 de CategoriesContext.tsx). Con TanStack Query, si dos pantallas piden `useCategories()` al mismo tiempo, solo se hace **una** llamada a la API.

### 6.5 ProvidersContext → `useProviderProfile(id)`

**Antes:** Array mutable con lógica ad-hoc para evitar re-fetches (ver los comentarios en el código):
```tsx
// ProvidersContext.tsx líneas 51-58 — hay un comentario que dice textualmente:
// "Actually, checking state inside setState callback doesn't help avoid the fetch call itself."
// El context no podía resolver este problema limpiamente.
const { fetchProvider } = useProviders();
const provider = await fetchProvider(providerId);
```

**Después:**
```tsx
const { data: provider, isLoading } = useProviderProfile(providerId);
// TanStack Query deduplica automáticamente — si el provider ya está en cache, no hay fetch
```

### 6.6 ServicesContext (831 líneas) → Queries separadas + `useMarketplaceStore`

Este es el cambio más grande. El `ServicesContext` hacía demasiado:
- Categorías (ahora → `useCategories()`)
- Servicios por categoría (ahora → `useServicesByCategory()`)
- Perfiles de proveedores (ahora → `useProviderProfile()`)
- Reseñas (ahora → `useServiceReviews()`)
- Mis servicios (ahora → `useMyServices()`)
- Estado de UI como categoría seleccionada (ahora → `useMarketplaceStore`)

**Antes (en ServicesScreen):**
```tsx
const { categories, categoriesStatus, loadCategories, fetchServicesByCategory, ... } = useServices();
```

**Después (en ServicesScreen):**
```tsx
const { data: categories, isLoading: loadingCats } = useCategories();
const selectedCategoryId = useMarketplaceStore((s) => s.selectedCategoryId);
const { data, fetchNextPage, hasNextPage } = useServicesByCategory(selectedCategoryId);
```

### 6.7 SearchContext (duplicado) → `useSearch()`

Había **dos** SearchContext:
- `src/contexts/SearchContext.tsx`
- `src/features/search/state/SearchContext.tsx`

**Ambos se eliminan.** Se reemplaza por el hook `useSearch()` del punto 5.9.

### 6.8 PaymentsContext → Queries de pago

**Antes:**
```tsx
const { history, loadHistory, earnings, loadEarnings, loading } = usePayments();
useEffect(() => { loadHistory(); }, []);
```

**Después:**
```tsx
const { data: history, isLoading } = usePaymentHistory(1);
// Se puede paginar incrementando el page param
```

### 6.9 OrdersContext → Hooks de órdenes

**Antes:**
```tsx
const { clientOrders, providerOrders, loading, loadClientOrders, acceptOrder } = useOrders();
```

**Después:**
```tsx
const { data: clientOrders = [], isLoading } = useClientOrders();
const accept = useAcceptOrder();

// Para aceptar:
await accept.mutateAsync(orderId);
// Cache se actualiza automáticamente — sin llamar a loadProviderOrders()
```

**Win específico:** En `OrdersContext`, después de `acceptOrder()` era necesario llamar manualmente a `loadProviderOrders()` para refrescar la lista. Con `useMutation` + `onSuccess: qc.invalidateQueries(...)`, eso es automático.

### 6.10 PostsContext y ReviewsContext — Eliminados del árbol global

**Antes (en `_layout.tsx`):**
```tsx
// Montados con props ficticias que no corresponden a ningún servicio/proveedor real
<PostsProvider serviceId="global">
  <ReviewsProvider providerId="global">
```

**Después:**
Estas pantallas consumen directamente el hook con el ID correcto:
```tsx
// En ProviderProfileScreen.tsx
const { data: posts } = useServicePosts(serviceId);
const { data: reviews } = useServiceReviews(providerId);
```

### 6.11 KYCContext → `useKYCStatus()` + mutations

**Antes:**
```tsx
const { verification, loading, start, retry } = useKYC();
```

**Después:**
```tsx
const { data: kyc, isLoading } = useKYCStatus();
const startKYC = useStartKYC();
const retryKYC = useRetryKYC();
```

### 6.12 NotificationsContext → Queries + Push token en hook propio

El `NotificationsContext` mezclaba dos responsabilidades muy distintas:
1. **Datos de notificaciones** (fetch, mark read, delete) → TanStack Query
2. **Registro de push token nativo** → Hook separado

**Nuevo hook de setup push — `src/hooks/usePushNotificationSetup.ts`:**
```ts
import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { registerPushToken } from '@/features/notifications/services/notifications.service';
import { useAuth } from '@/features/auth/state/AuthContext';

const isExpoGo = Constants.appOwnership === 'expo';

/** Registrar el dispositivo para notificaciones push. Se llama una sola vez en _layout.tsx */
export function usePushNotificationSetup() {
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated || isExpoGo || !Device.isDevice) return;

    (async () => {
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Bosko',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#850021',
          sound: 'default',
          enableVibrate: true,
          showBadge: true,
        });
      }

      const { status: existing } = await Notifications.getPermissionsAsync();
      let finalStatus = existing;
      if (existing !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') return;

      const projectId =
        Constants.expoConfig?.extra?.eas?.projectId ??
        (Constants as any).easConfig?.projectId;
      if (!projectId) return;

      const { data: pushToken } = await Notifications.getExpoPushTokenAsync({ projectId });
      await registerPushToken(pushToken, Platform.OS as 'ios' | 'android');
    })();
  }, [isAuthenticated]);
}
```

**Antes en componente:**
```tsx
const { notifications, load, markRead, unreadCount } = useNotifications();
```

**Después:**
```tsx
const { data: result, isLoading } = useNotificationsQuery(1);
const notifications = result?.data ?? [];
const { data: unreadCount = 0 } = useUnreadNotificationsCount();
const markRead = useMarkNotificationRead();
```

### 6.13 FavoritesContext → `useFavoritesStore`

**Antes:**
```tsx
const { favorites, toggle, isFavorite, loading } = useFavorites();
```

**Después:**
```tsx
import { useFavoritesStore, useIsFavorite } from '@/stores/favorites.store';

const toggle = useFavoritesStore((s) => s.toggle);
const isFav = useIsFavorite(serviceId); // Solo re-renderiza si cambia este ID
```

**Win:** Con el selector granular `useIsFavorite(id)`, un cambio en otro favorito no re-renderiza este componente. Con el Context anterior, cualquier cambio en el array completo re-renderizaba todos los componentes que usaban `useFavorites()`.

**Nota:** El servicio `favorites.service.ts` (que usa AsyncStorage directamente) ya no hace falta — Zustand persist hace eso automáticamente.

### 6.14 ConversationsContext + UnreadContext → `useChatStore`

**Antes (en `ConversationsListScreen`):**
```tsx
const { conversations, updateLastMessage } = useConversations();
const { total, setTotal } = useUnread();
```

**Después:**
```tsx
import { useConversations, useUnreadTotal, useChatStore } from '@/stores/chat.store';

const conversations = useConversations();
const unreadTotal = useUnreadTotal();
const updateLastMessage = useChatStore((s) => s.updateLastMessage);
```

**En `CustomTabBar.tsx`** (badge de no leídos):
```tsx
// Antes:
const { total } = useUnread();

// Después:
const total = useUnreadTotal();
```

---

## 7. Nuevo `_layout.tsx`

```tsx
import React, { useEffect, useRef } from 'react';
import { Stack, router } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/core/query/queryClient';
import { AuthProvider } from '@/features/auth/state/AuthContext';
import { ToastRoot } from '@/core/components/Toast';
import { usePushNotificationSetup } from '@/hooks/usePushNotificationSetup';

// Navega a la pantalla correcta según el payload de la notificación
function useNotificationNavigation() {
  const responseListener = useRef<Notifications.EventSubscription | null>(null);
  useEffect(() => {
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) handleNotificationResponse(response);
    });
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      handleNotificationResponse,
    );
    return () => responseListener.current?.remove();
  }, []);
}

function handleNotificationResponse(response: Notifications.NotificationResponse) {
  const data = response.notification.request.content.data as Record<string, string> | undefined;
  if (!data) return;
  try {
    if (data.type === 'order' && data.orderId) {
      router.push({ pathname: '/(tabs)/orders/[id]', params: { id: data.orderId } });
    } else if (data.type === 'chat' && data.orderId) {
      router.push({ pathname: '/chat/[id]', params: { id: data.orderId } });
    } else if (data.type === 'review' && data.orderId) {
      router.push({ pathname: '/(tabs)/orders/[id]', params: { id: data.orderId } });
    } else {
      router.push('/(tabs)/profile/Notifications' as any);
    }
  } catch {}
}

function RootLayoutNav() {
  useNotificationNavigation();
  usePushNotificationSetup(); // ← movido desde NotificationsProvider

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="login" />
      <Stack.Screen name="auth" options={{ headerShown: false }} />
      <Stack.Screen name="chat" options={{ headerShown: false }} />
      <Stack.Screen name="service-form" options={{ presentation: 'modal', headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    // De 13 providers anidados a 2
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RootLayoutNav />
        <ToastRoot />
      </AuthProvider>
    </QueryClientProvider>
  );
}
```

Y `app/(tabs)/_layout.tsx` ya no necesita `ConversationsProvider` ni `UnreadProvider`.

---

## 8. Plan de migración por fases

### Fase 0 — Setup (sin romper nada) ⏱ ~2h
```
1. npm install @tanstack/react-query zustand
2. Crear src/core/query/queryClient.ts
3. Crear src/core/query/queryKeys.ts
4. Agregar <QueryClientProvider> en _layout.tsx (solo envolver, no quitar nada)
5. Crear los stores Zustand (chat.store.ts, favorites.store.ts, marketplace.store.ts)
```

### Fase 1 — Providers triviales ⏱ ~3h
Estos 5 se pueden reemplazar sin tocar las pantallas que los consumen:

```
6.  UnreadContext → useChatStore.unreadTotal
    - Cambiar CustomTabBar.tsx para importar del store
    - Quitar UnreadProvider del tabs _layout.tsx

7.  FavoritesContext → useFavoritesStore
    - Actualizar CategoryServicesScreen y cualquier componente con favoritos
    - Quitar FavoritesProvider de _layout.tsx

8.  UsersContext (features/users/state) → usePublicUser()
    - Crear el hook
    - Actualizar consumidores
    - Quitar UserProvider si existía

9.  ReviewsContext (scoped) → useServiceReviews(id)
    - Eliminar ReviewsProvider del _layout.tsx
    - Las pantallas usan useServiceReviews() con el ID real

10. PostsContext (scoped) → useServicePosts(id)
    - Eliminar PostsProvider del _layout.tsx
    - Las pantallas usan useServicePosts() con el ID real
```

### Fase 2 — Providers de datos simples ⏱ ~4h
```
11. CategoriesContext → useCategories()
    - Quitar CategoriesProvider del _layout.tsx

12. ProvidersContext → useProviderProfile(id)
    - Quitar ProvidersProvider del _layout.tsx

13. SearchContext (ambos duplicados) → useSearch()
    - Eliminar src/contexts/SearchContext.tsx
    - Eliminar src/features/search/state/SearchContext.tsx
    - Actualizar SearchPage.tsx

14. ConversationsContext → useChatStore
    - Actualizar ConversationsListScreen y ChatScreen
    - Quitar ConversationsProvider del tabs _layout.tsx
```

### Fase 3 — Providers de dominio ⏱ ~6h
```
15. PaymentContext → usePaymentHistory() + useEarnings() + useInitiatePayment()
    - Quitar PaymentsProvider del _layout.tsx

16. KYCContext → useKYCStatus() + useStartKYC() + useRetryKYC()
    - Quitar KYCProvider del _layout.tsx

17. NotificationsContext → useNotificationsQuery() + usePushNotificationSetup()
    - Mover lógica de push token al hook
    - Quitar NotificationsProvider del _layout.tsx

18. UsersContext (contexts/UsersContext) → queries de admin
    - Quitar UsersProvider del _layout.tsx

19. OrdersContext → useClientOrders() + useProviderOrders() + mutations
    - Actualizar OrdersListScreen, OrderDetailScreen, QuoteRequestScreen, CheckoutScreen
    - Quitar OrdersProvider del _layout.tsx
```

### Fase 4 — El grande: ServicesContext ⏱ ~8h
```
20. ServicesContext (831 líneas) → múltiples hooks + useMarketplaceStore
    - Separar en:
      * useCategories() (ya creado en Fase 2)
      * useServicesByCategory() con useInfiniteQuery
      * useProviderProfile() (ya creado en Fase 2)
      * useServiceReviews() (ya creado en Fase 1)
      * useMyServices() + mutations CRUD
      * useMarketplaceStore para estado de UI
    - Actualizar ServicesScreen, CategoryServicesScreen, DashboardScreen
    - Quitar ServicesProvider del _layout.tsx
```

### Fase 5 — ProfileContext ⏱ ~3h
```
21. ProfileContext → useProfile() + mutations
    - Actualizar ProfileScreen, EditProfileModal, EditProfileScreen
    - Quitar ProfileProvider del _layout.tsx
```

### Resultado final del árbol de providers:
```
<QueryClientProvider>
  <AuthProvider>           ← el único context que queda
    <RootLayoutNav />
    <ToastRoot />
  </AuthProvider>
</QueryClientProvider>
```

---

## 9. Tabla de equivalencias rápida

| Antes | Después | Notas |
|---|---|---|
| `useProfile().profile` | `useProfile().data` | Auto-fetch al autenticarse |
| `useProfile().refreshProfile()` | `useProfile().refetch()` | O se hace automático |
| `useProfile().updateProfile(p)` | `useUpdateProfile().mutateAsync(p)` | Cache actualizado sin refetch |
| `useOrders().clientOrders` | `useClientOrders().data ?? []` | Cache con staleTime |
| `useOrders().loadClientOrders()` | Automático | Sin useEffect manual |
| `useOrders().acceptOrder(id)` | `useAcceptOrder().mutateAsync(id)` | Invalida cache automáticamente |
| `useServices().categories` | `useCategories().data ?? []` | Cache 30 min |
| `useServices().fetchProviderProfile(id)` | `useProviderProfile(id).data` | Dedup + cache |
| `useProviders().fetchProvider(id)` | `useProviderProfile(id).data` | Sin array global |
| `useCategories().categories` | `useCategories().data ?? []` | — |
| `useConversations().conversations` | `useConversations()` (del store) | Zustand granular |
| `useUnread().total` | `useUnreadTotal()` | Selector granular |
| `useFavorites().isFavorite(id)` | `useIsFavorite(id)` | Solo re-render si cambia este ID |
| `useFavorites().toggle(s)` | `useFavoritesStore(s => s.toggle)(service)` | Persist automático |
| `usePayments().loadHistory()` | `usePaymentHistory().data` | Paginación con `page` param |
| `useKYC().start()` | `useStartKYC().mutate()` | Invalida kycStatus al volver |
| `useNotifications().load()` | `useNotificationsQuery()` | Auto-fetch |
| `useNotifications().unreadCount` | `useUnreadNotificationsCount().data` | Polling cada 1 min |
| `usePosts().loadPosts()` | `useServicePosts(id)` | Con ID real, no "global" |
| `useReviews().loadReviews()` | `useServiceReviews(id)` | Con ID real, no "global" |

---

## Notas finales

### ¿Qué NO hace falta migrar?
- **`src/features/chat/services/socket.service.ts`** — El singleton de socket.io no cambia. Sigue funcionando igual. Solo cambia quién consume sus callbacks: ahora es el Zustand store en lugar del Context.
- **Todos los servicios de API** (`orders.service.ts`, `catalog.ts`, etc.) — No cambian en absoluto. TanStack Query los llama directamente.

### Convivencia durante la migración
Durante las fases, el Context viejo y el nuevo hook pueden coexistir. No es necesario migrar todo de golpe. Estrategia recomendada: en cada pantalla que tocás por otra razón, migrás esa pantalla. En 2-3 sprints la migración está completa sin una PR gigante.

### DevTools en desarrollo
```tsx
// Agregar temporalmente en _layout.tsx para debug
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// Dentro del QueryClientProvider:
{__DEV__ && <ReactQueryDevtools initialIsOpen={false} />}
```
