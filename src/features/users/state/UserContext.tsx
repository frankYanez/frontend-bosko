import React, { createContext, useContext, ReactNode } from "react";
import { fetchUserById, PublicUser } from "../services/users";

interface UsersState {
  getUser: (id: string) => Promise<PublicUser | undefined>;
}

const UserContext = createContext<UsersState | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const getUser = async (id: string): Promise<PublicUser | undefined> => {
    try {
      return await fetchUserById(id);
    } catch {
      return undefined;
    }
  };

  return (
    <UserContext.Provider value={{ getUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUsers = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error("useUsers must be used within a UserProvider");
  return context;
};
