import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import {
  fetchAllServices,
  fetchServiceById,
  createService,
  updateService,
  deleteService,
  Service,
} from "../services/services";

/**
 * ServicesContext
 *
 * Holds and manages the list of services available to the current user.
 * It exposes functions to refresh the list, as well as CRUD operations
 * that are synced with the backend. Components consuming this context
 * will automatically re-render when the services state changes.
 */

interface ServicesState {
  services: Service[];
  loading: boolean;
  loadServices: (filters?: Record<string, any>) => Promise<void>;
  getService: (id: string) => Promise<Service | undefined>;
  addService: (service: Service) => Promise<Service>;
  editService: (id: string, updates: Partial<Service>) => Promise<Service>;
  removeService: (id: string) => Promise<void>;
}

const ServicesContext = createContext<ServicesState | undefined>(undefined);

export const ServicesProvider = ({ children }: { children: ReactNode }) => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const loadServices = async (filters?: Record<string, any>) => {
    setLoading(true);
    try {
      const data = await fetchAllServices(filters);
      setServices(data);
    } finally {
      setLoading(false);
    }
  };

  const getService = async (id: string) => {
    try {
      const service = await fetchServiceById(id);
      return service;
    } catch (err) {
      console.error("Failed to fetch service", err);
      return undefined;
    }
  };

  const addService = async (service: Service) => {
    const newService = await createService(service);
    setServices((prev) => [...prev, newService]);
    return newService;
  };

  const editService = async (id: string, updates: Partial<Service>) => {
    const updated = await updateService(id, updates);
    setServices((prev) => prev.map((s) => (s.id === id ? updated : s)));
    return updated;
  };

  const removeService = async (id: string) => {
    await deleteService(id);
    setServices((prev) => prev.filter((s) => s.id !== id));
  };

  // Initial load of services when provider mounts
  // useEffect(() => {
  //   loadServices().catch((err) => console.error(err));
  // }, []);

  const value: ServicesState = {
    services,
    loading,
    loadServices,
    getService,
    addService,
    editService,
    removeService,
  };

  return (
    <ServicesContext.Provider value={value}>
      {children}
    </ServicesContext.Provider>
  );
};

export const useServices = () => {
  const context = useContext(ServicesContext);
  if (context === undefined) {
    throw new Error("useServices must be used within a ServicesProvider");
  }
  return context;
};
