import React, {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import { useQueryClient } from "@tanstack/react-query";

import type {
  AddReviewPayload,
  Category,
  ProviderProfile,
  Review,
  ServiceSummary,
} from "@/types/services";

import { useAuth } from "@/features/auth/state/AuthContext";
import {
  getMyServices,
  createService,
  updateService,
  deleteService,
  PlanType,
  Service,
  ServicePayload,
} from "../services/service";
import { fetchAllServices, fetchServiceById } from "../services/services";
import {
  fetchCategoriesService,
  fetchProviderProfileService,
  fetchServiceReviewsService,
  fetchServicesByCategoryService,
} from "../services/catalog";
import { createReview } from "@/features/reviews/services/review.service";
import { QUERY_KEYS } from "@/core/query/queryKeys";

// ── Resource state helpers ──────────────────────────────────────────────────

interface ResourceState {
  loading: boolean;
  loaded: boolean;
  error: string | null;
}

const createResourceState = (overrides?: Partial<ResourceState>): ResourceState => ({
  loading: false,
  loaded: false,
  error: null,
  ...overrides,
});

const mergeStatus = (current: ResourceState | undefined, patch: Partial<ResourceState>): ResourceState => ({
  loading: patch.loading ?? current?.loading ?? false,
  loaded: patch.loaded ?? current?.loaded ?? false,
  error: patch.error !== undefined ? patch.error ?? null : current?.error ?? null,
});

// ── Reducer ─────────────────────────────────────────────────────────────────

type MarketplaceState = {
  categories: Category[];
  categoriesStatus: ResourceState;
  servicesByCategory: Record<string, ServiceSummary[]>;
  servicesById: Record<string, ServiceSummary>;
  servicesStatus: Record<string, ResourceState>;
  providers: Record<string, ProviderProfile>;
  providersStatus: Record<string, ResourceState>;
  reviewsByService: Record<string, Review[]>;
  reviewsStatus: Record<string, ResourceState>;
  providerRatings: Record<string, { averageRating: number; reviewsCount: number }>;
  purchasesByUser: Record<string, string[]>;
  eligibility: Record<string, Record<string, boolean>>;
};

type MarketplaceAction =
  | { type: "SET_CATEGORIES"; payload: Category[] }
  | { type: "SET_CATEGORIES_STATUS"; payload: Partial<ResourceState> }
  | { type: "SET_SERVICES"; payload: { categoryId: string; services: ServiceSummary[] } }
  | { type: "APPEND_SERVICES"; payload: { categoryId: string; services: ServiceSummary[] } }
  | { type: "SET_SERVICES_STATUS"; payload: { categoryId: string; status: Partial<ResourceState> } }
  | { type: "SET_PROVIDER"; payload: ProviderProfile }
  | { type: "SET_PROVIDER_STATUS"; payload: { providerId: string; status: Partial<ResourceState> } }
  | { type: "SET_REVIEWS"; payload: { serviceId: string; reviews: Review[] } }
  | { type: "SET_REVIEWS_STATUS"; payload: { serviceId: string; status: Partial<ResourceState> } }
  | { type: "UPDATE_SERVICE_METRICS"; payload: { serviceId: string; averageRating: number; reviewsCount: number } }
  | { type: "SET_PROVIDER_RATING"; payload: { providerId: string; averageRating: number; reviewsCount: number } }
  | { type: "SET_USER_PURCHASES"; payload: { userId: string; serviceIds: string[] } }
  | { type: "SET_REVIEW_ELIGIBILITY"; payload: { serviceId: string; userId: string; canReview: boolean } };

const initialMarketplaceState: MarketplaceState = {
  categories: [],
  categoriesStatus: createResourceState(),
  servicesByCategory: {},
  servicesById: {},
  servicesStatus: {},
  providers: {},
  providersStatus: {},
  reviewsByService: {},
  reviewsStatus: {},
  providerRatings: {},
  purchasesByUser: {},
  eligibility: {},
};

const marketplaceReducer = (state: MarketplaceState, action: MarketplaceAction): MarketplaceState => {
  switch (action.type) {
    case "SET_CATEGORIES":
      return { ...state, categories: action.payload };
    case "SET_CATEGORIES_STATUS":
      return { ...state, categoriesStatus: mergeStatus(state.categoriesStatus, action.payload) };
    case "SET_SERVICES": {
      const { categoryId, services } = action.payload;
      const servicesById = { ...state.servicesById };
      services.forEach((s) => { servicesById[s.id] = s; });
      return {
        ...state,
        servicesByCategory: { ...state.servicesByCategory, [categoryId]: services },
        servicesById,
      };
    }
    case "SET_SERVICES_STATUS": {
      const { categoryId, status } = action.payload;
      return {
        ...state,
        servicesStatus: {
          ...state.servicesStatus,
          [categoryId]: mergeStatus(state.servicesStatus[categoryId], status),
        },
      };
    }
    case "APPEND_SERVICES": {
      const { categoryId, services } = action.payload;
      const servicesById = { ...state.servicesById };
      services.forEach((s) => { servicesById[s.id] = s; });
      return {
        ...state,
        servicesByCategory: {
          ...state.servicesByCategory,
          [categoryId]: [...(state.servicesByCategory[categoryId] ?? []), ...services],
        },
        servicesById,
      };
    }
    case "SET_PROVIDER": {
      const provider = action.payload;
      return {
        ...state,
        providers: { ...state.providers, [provider.id]: provider },
        providerRatings: {
          ...state.providerRatings,
          [provider.id]: { averageRating: provider.averageRating, reviewsCount: provider.reviewsCount },
        },
      };
    }
    case "SET_PROVIDER_STATUS": {
      const { providerId, status } = action.payload;
      return {
        ...state,
        providersStatus: {
          ...state.providersStatus,
          [providerId]: mergeStatus(state.providersStatus[providerId], status),
        },
      };
    }
    case "SET_REVIEWS": {
      const { serviceId, reviews } = action.payload;
      return { ...state, reviewsByService: { ...state.reviewsByService, [serviceId]: reviews } };
    }
    case "SET_REVIEWS_STATUS": {
      const { serviceId, status } = action.payload;
      return {
        ...state,
        reviewsStatus: {
          ...state.reviewsStatus,
          [serviceId]: mergeStatus(state.reviewsStatus[serviceId], status),
        },
      };
    }
    case "UPDATE_SERVICE_METRICS": {
      const { serviceId, averageRating, reviewsCount } = action.payload;
      const service = state.servicesById[serviceId];
      if (!service) return state;
      const updatedService: ServiceSummary = { ...service, averageRating, reviewsCount };
      const categoryServices = state.servicesByCategory[service.categoryId];
      return {
        ...state,
        servicesById: { ...state.servicesById, [serviceId]: updatedService },
        servicesByCategory: categoryServices
          ? {
              ...state.servicesByCategory,
              [service.categoryId]: categoryServices.map((item) =>
                item.id === serviceId ? updatedService : item,
              ),
            }
          : state.servicesByCategory,
      };
    }
    case "SET_PROVIDER_RATING": {
      const { providerId, averageRating, reviewsCount } = action.payload;
      const provider = state.providers[providerId];
      return {
        ...state,
        providerRatings: { ...state.providerRatings, [providerId]: { averageRating, reviewsCount } },
        providers: provider
          ? { ...state.providers, [providerId]: { ...provider, averageRating, reviewsCount } }
          : state.providers,
      };
    }
    case "SET_USER_PURCHASES": {
      const { userId, serviceIds } = action.payload;
      return { ...state, purchasesByUser: { ...state.purchasesByUser, [userId]: serviceIds } };
    }
    case "SET_REVIEW_ELIGIBILITY": {
      const { serviceId, userId, canReview } = action.payload;
      return {
        ...state,
        eligibility: {
          ...state.eligibility,
          [serviceId]: { ...(state.eligibility[serviceId] ?? {}), [userId]: canReview },
        },
      };
    }
    default:
      return state;
  }
};

// ── Context interface ────────────────────────────────────────────────────────

interface ServicesContextValue {
  services: Service[];
  myServices: Service[];
  loading: boolean;
  myServicesLoading: boolean;
  currentPlan: PlanType;
  loadServices: (filters?: Record<string, unknown>) => Promise<void>;
  loadMyServices: () => Promise<void>;
  getService: (id: string) => Promise<Service | undefined>;
  addService: (service: ServicePayload) => Promise<Service>;
  editService: (id: string, updates: Partial<ServicePayload>) => Promise<Service>;
  removeService: (id: string) => Promise<void>;
  categories: Category[];
  categoriesStatus: ResourceState;
  servicesStatus: Record<string, ResourceState>;
  providersStatus: Record<string, ResourceState>;
  reviewsStatus: Record<string, ResourceState>;
  servicesHasMore: Record<string, boolean>;
  servicesLoadingMore: Record<string, boolean>;
  fetchCategories: () => Promise<void>;
  fetchServicesByCategory: (categoryId: string) => Promise<ServiceSummary[]>;
  loadMoreServicesByCategory: (categoryId: string) => Promise<void>;
  fetchProviderProfile: (providerId: string) => Promise<ProviderProfile | undefined>;
  fetchServiceReviews: (serviceId: string) => Promise<Review[]>;
  addReviewWithRating: (payload: AddReviewPayload) => Promise<void>;
  getServicesForCategory: (categoryId: string) => ServiceSummary[];
  selectServiceById: (serviceId: string) => ServiceSummary | undefined;
  selectServiceByProvider: (providerId: string) => ServiceSummary | undefined;
  getProviderById: (providerId: string) => ProviderProfile | undefined;
  getProviderRating: (providerId: string) => { averageRating: number; reviewsCount: number };
  getReviewsForService: (serviceId: string) => Review[];
}

const ServicesContext = createContext<ServicesContextValue | undefined>(undefined);

// ── Helpers ──────────────────────────────────────────────────────────────────

function normalizePlan(plan: unknown): PlanType {
  if (!plan || typeof plan !== "string") return "FREE";
  const v = plan.toLowerCase();
  if (v.includes("plus") || v.includes("premium") || v === "pro") return "PLUS";
  return "FREE";
}

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error !== null && "message" in error) {
    return (error as any).message as string;
  }
  return fallback;
};

// ── Provider ─────────────────────────────────────────────────────────────────

export const ServicesProvider = ({ children }: { children: ReactNode }) => {
  const qc = useQueryClient();
  const { authState } = useAuth();
  const [state, dispatch] = useReducer(marketplaceReducer, initialMarketplaceState);
  const [services, setServices] = useState<Service[]>([]);
  const [myServices, setMyServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [myServicesLoading, setMyServicesLoading] = useState<boolean>(false);
  const [servicesHasMore, setServicesHasMore] = useState<Record<string, boolean>>({});
  const [servicesLoadingMore, setServicesLoadingMore] = useState<Record<string, boolean>>({});
  const categoryPageRef = useRef<Record<string, number>>({});

  const currentPlan = useMemo<PlanType>(() => {
    const userPlan =
      (authState?.user as any)?.plan ??
      (authState?.user as any)?.subscriptionPlan ??
      (authState?.user as any)?.subscription?.plan ??
      (authState?.user as any)?.membership?.name ??
      (authState?.user as any)?.planType;
    return normalizePlan(userPlan);
  }, [authState?.user]);

  // ── Categories ─────────────────────────────────────────────────────────────

  const fetchCategories = useCallback(async () => {
    if (state.categoriesStatus.loading) return;
    dispatch({ type: "SET_CATEGORIES_STATUS", payload: { loading: true, error: null } });
    try {
      const data = await qc.fetchQuery({
        queryKey: QUERY_KEYS.categories,
        queryFn: fetchCategoriesService,
        staleTime: 30 * 60 * 1000,
      });
      dispatch({ type: "SET_CATEGORIES", payload: data as Category[] });
      dispatch({ type: "SET_CATEGORIES_STATUS", payload: { loading: false, loaded: true, error: null } });
    } catch (error) {
      dispatch({
        type: "SET_CATEGORIES_STATUS",
        payload: { loading: false, error: getErrorMessage(error, "No se pudieron cargar las categorías") },
      });
      throw error;
    }
  }, [qc, state.categoriesStatus]);

  // ── Services by category ───────────────────────────────────────────────────

  const fetchServicesByCategory = useCallback(
    async (categoryId: string) => {
      const status = state.servicesStatus[categoryId];
      if (status?.loading) return state.servicesByCategory[categoryId] ?? [];

      categoryPageRef.current[categoryId] = 1;
      dispatch({ type: "SET_SERVICES_STATUS", payload: { categoryId, status: { loading: true, error: null } } });
      try {
        const result = await qc.fetchQuery({
          queryKey: QUERY_KEYS.services(categoryId, 1),
          queryFn: () => fetchServicesByCategoryService(categoryId, 1),
        });
        dispatch({ type: "SET_SERVICES", payload: { categoryId, services: result.data } });
        dispatch({ type: "SET_SERVICES_STATUS", payload: { categoryId, status: { loading: false, loaded: true, error: null } } });
        setServicesHasMore((prev) => ({ ...prev, [categoryId]: result.hasMore }));
        return result.data;
      } catch (error) {
        const message = getErrorMessage(error, "No se pudieron cargar los servicios");
        dispatch({ type: "SET_SERVICES_STATUS", payload: { categoryId, status: { loading: false, error: message } } });
        throw error;
      }
    },
    [qc, state.servicesByCategory, state.servicesStatus],
  );

  const loadMoreServicesByCategory = useCallback(
    async (categoryId: string) => {
      if (servicesLoadingMore[categoryId] || !servicesHasMore[categoryId]) return;

      const nextPage = (categoryPageRef.current[categoryId] ?? 1) + 1;
      setServicesLoadingMore((prev) => ({ ...prev, [categoryId]: true }));
      try {
        const result = await qc.fetchQuery({
          queryKey: QUERY_KEYS.services(categoryId, nextPage),
          queryFn: () => fetchServicesByCategoryService(categoryId, nextPage),
        });
        if (result.data.length > 0) {
          dispatch({ type: "APPEND_SERVICES", payload: { categoryId, services: result.data } });
          categoryPageRef.current[categoryId] = nextPage;
        }
        setServicesHasMore((prev) => ({ ...prev, [categoryId]: result.hasMore }));
      } catch {
        // silently ignore — user can scroll up and retry
      } finally {
        setServicesLoadingMore((prev) => ({ ...prev, [categoryId]: false }));
      }
    },
    [qc, servicesHasMore, servicesLoadingMore],
  );

  // ── Provider profiles ──────────────────────────────────────────────────────

  const fetchProviderProfile = useCallback(
    async (providerId: string) => {
      const status = state.providersStatus[providerId];
      if (status?.loading) return state.providers[providerId];

      dispatch({ type: "SET_PROVIDER_STATUS", payload: { providerId, status: { loading: true, error: null } } });
      try {
        const data = await qc.fetchQuery({
          queryKey: QUERY_KEYS.providerProfile(providerId),
          queryFn: () => fetchProviderProfileService(providerId),
          staleTime: 10 * 60 * 1000,
        });
        dispatch({ type: "SET_PROVIDER", payload: data });
        dispatch({ type: "SET_PROVIDER_STATUS", payload: { providerId, status: { loading: false, loaded: true, error: null } } });
        return data;
      } catch (error) {
        const message = getErrorMessage(error, "No se pudo cargar el perfil del prestador");
        dispatch({ type: "SET_PROVIDER_STATUS", payload: { providerId, status: { loading: false, error: message } } });
        throw error;
      }
    },
    [qc, state.providers, state.providersStatus],
  );

  // ── Reviews ────────────────────────────────────────────────────────────────

  const applyReviewAggregates = useCallback(
    (serviceId: string, reviews: Review[]) => {
      const service = state.servicesById[serviceId];
      const count = reviews.length;
      const average =
        count > 0
          ? Number((reviews.reduce((acc, r) => acc + r.rating, 0) / count).toFixed(2))
          : service?.averageRating ?? 0;
      const reviewsCount = count > 0 ? count : (service?.reviewsCount ?? 0);
      dispatch({ type: "UPDATE_SERVICE_METRICS", payload: { serviceId, averageRating: average, reviewsCount } });
      const providerId =
        service?.providerId ||
        Object.values(state.providers).find((p) => p.serviceId === serviceId)?.id;
      if (providerId) {
        dispatch({ type: "SET_PROVIDER_RATING", payload: { providerId, averageRating: average, reviewsCount } });
      }
    },
    [state.providers, state.servicesById],
  );

  const fetchServiceReviews = useCallback(
    async (serviceId: string) => {
      const status = state.reviewsStatus[serviceId];
      if (status?.loading) return state.reviewsByService[serviceId] ?? [];

      dispatch({ type: "SET_REVIEWS_STATUS", payload: { serviceId, status: { loading: true, error: null } } });
      try {
        const providerId = state.servicesById[serviceId]?.providerId ?? serviceId;
        const data = await qc.fetchQuery({
          queryKey: QUERY_KEYS.serviceReviews(providerId),
          queryFn: () => fetchServiceReviewsService(providerId),
        });
        dispatch({ type: "SET_REVIEWS", payload: { serviceId, reviews: data } });
        dispatch({ type: "SET_REVIEWS_STATUS", payload: { serviceId, status: { loading: false, loaded: true, error: null } } });
        applyReviewAggregates(serviceId, data);
        return data;
      } catch (error) {
        const message = getErrorMessage(error, "No se pudieron cargar las reseñas");
        dispatch({ type: "SET_REVIEWS_STATUS", payload: { serviceId, status: { loading: false, error: message } } });
        throw error;
      }
    },
    [qc, applyReviewAggregates, state.reviewsByService, state.reviewsStatus, state.servicesById],
  );

  const addReviewWithRating = useCallback(async (payload: AddReviewPayload) => {
    const { orderId, rating, comment } = payload;
    if (rating < 1 || rating > 5) throw new Error("La calificación debe estar entre 1 y 5");
    await createReview({ orderId, rating, comment });
  }, []);

  // ── My services / CRUD ─────────────────────────────────────────────────────

  const loadServices = useCallback(async (filters?: Record<string, unknown>) => {
    setLoading(true);
    try {
      const data = await fetchAllServices(filters);
      setServices(data);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMyServices = useCallback(async () => {
    setMyServicesLoading(true);
    try {
      const data = await qc.fetchQuery({
        queryKey: QUERY_KEYS.myServices,
        queryFn: getMyServices,
      });
      setMyServices(data);
    } finally {
      setMyServicesLoading(false);
    }
  }, [qc]);

  const getService = useCallback(async (id: string) => {
    try {
      return await qc.fetchQuery({
        queryKey: QUERY_KEYS.serviceById(id),
        queryFn: () => fetchServiceById(id),
      });
    } catch {
      return undefined;
    }
  }, [qc]);

  const addService = useCallback(
    async (service: ServicePayload) => {
      if (currentPlan === "FREE" && myServices.length >= 1) {
        throw new Error("PLAN_LIMIT_REACHED");
      }
      const newService = await createService(service);
      setMyServices((prev) => [...prev, newService]);
      qc.invalidateQueries({ queryKey: QUERY_KEYS.myServices });
      return newService;
    },
    [qc, currentPlan, myServices.length],
  );

  const editService = useCallback(async (id: string, updates: Partial<ServicePayload>) => {
    const updated = await updateService(id, updates);
    setMyServices((prev) => prev.map((s) => (s.id === id ? updated : s)));
    qc.setQueryData(QUERY_KEYS.myServices, (old: Service[] | undefined) =>
      old ? old.map((s) => (s.id === id ? updated : s)) : old,
    );
    return updated;
  }, [qc]);

  const removeService = useCallback(async (id: string) => {
    await deleteService(id);
    setMyServices((prev) => prev.filter((s) => s.id !== id));
    qc.setQueryData(QUERY_KEYS.myServices, (old: Service[] | undefined) =>
      old ? old.filter((s) => s.id !== id) : old,
    );
  }, [qc]);

  // ── Selectors ──────────────────────────────────────────────────────────────

  const getServicesForCategory = useCallback(
    (categoryId: string) => state.servicesByCategory[categoryId] ?? [],
    [state.servicesByCategory],
  );

  const selectServiceById = useCallback(
    (serviceId: string) => state.servicesById[serviceId],
    [state.servicesById],
  );

  const selectServiceByProvider = useCallback(
    (providerId: string) =>
      Object.values(state.servicesById).find((s) => s.providerId === providerId),
    [state.servicesById],
  );

  const getProviderById = useCallback(
    (providerId: string) => state.providers[providerId],
    [state.providers],
  );

  const getProviderRating = useCallback(
    (providerId: string) => {
      const rating = state.providerRatings[providerId];
      if (rating) return rating;
      const provider = state.providers[providerId];
      if (provider) return { averageRating: provider.averageRating, reviewsCount: provider.reviewsCount };
      const service = selectServiceByProvider(providerId);
      if (service) return { averageRating: service.averageRating, reviewsCount: service.reviewsCount };
      return { averageRating: 0, reviewsCount: 0 };
    },
    [selectServiceByProvider, state.providerRatings, state.providers],
  );

  const getReviewsForService = useCallback(
    (serviceId: string) => state.reviewsByService[serviceId] ?? [],
    [state.reviewsByService],
  );

  // ── Context value ──────────────────────────────────────────────────────────

  const value = useMemo<ServicesContextValue>(
    () => ({
      services,
      myServices,
      loading,
      myServicesLoading,
      currentPlan,
      loadServices,
      loadMyServices,
      getService,
      addService,
      editService,
      removeService,
      categories: state.categories,
      categoriesStatus: state.categoriesStatus,
      servicesStatus: state.servicesStatus,
      servicesHasMore,
      servicesLoadingMore,
      providersStatus: state.providersStatus,
      reviewsStatus: state.reviewsStatus,
      fetchCategories,
      fetchServicesByCategory,
      loadMoreServicesByCategory,
      fetchProviderProfile,
      fetchServiceReviews,
      addReviewWithRating,
      getServicesForCategory,
      selectServiceById,
      selectServiceByProvider,
      getProviderById,
      getProviderRating,
      getReviewsForService,
    }),
    [
      addReviewWithRating,
      addService,
      currentPlan,
      editService,
      fetchCategories,
      fetchProviderProfile,
      fetchServiceReviews,
      fetchServicesByCategory,
      loadMoreServicesByCategory,
      servicesHasMore,
      servicesLoadingMore,
      getProviderById,
      getProviderRating,
      getReviewsForService,
      getService,
      getServicesForCategory,
      loadMyServices,
      loadServices,
      loading,
      myServices,
      myServicesLoading,
      removeService,
      selectServiceById,
      selectServiceByProvider,
      services,
      state.categories,
      state.categoriesStatus,
      state.providersStatus,
      state.reviewsStatus,
      state.servicesStatus,
    ],
  );

  return <ServicesContext.Provider value={value}>{children}</ServicesContext.Provider>;
};

export const useServices = () => {
  const context = useContext(ServicesContext);
  if (context === undefined) {
    throw new Error("useServices must be used within a ServicesProvider");
  }
  return context;
};
