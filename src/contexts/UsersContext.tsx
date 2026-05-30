import React from 'react';
import { extractApiError } from '../lib/errors';
import type { Id } from '../interfaces/common';
import type { UpdateUserDto, User } from '../interfaces/user';
import {
  deleteUser as deleteUserApi,
  getUser as getUserApi,
  listUserReviewsReceived,
  listUserReviewsWritten,
  listUsers,
  updateUser as updateUserApi,
} from '../services/users.service';

interface UsersState {
  users: User[];
  loading: boolean;
  error: string | null;
  loadUsers: (filters?: Record<string, any>) => Promise<void>;
  getUser: (id: Id) => Promise<User | null>;
  updateUser: (id: Id, payload: UpdateUserDto) => Promise<User | null>;
  removeUser: (id: Id) => Promise<void>;
  loadUserReviewsWritten: (id: Id) => Promise<any>;
  loadUserReviewsReceived: (id: Id) => Promise<any>;
}

export const UsersProvider: React.FC<React.PropsWithChildren> = ({ children }) => (
  <>{children}</>
);

export const useUsers = (): UsersState => {
  return {
    users: [],
    loading: false,
    error: null,

    loadUsers: async (filters?: Record<string, any>) => {
      try { await listUsers(filters); } catch {}
    },
    getUser: async (id: Id) => {
      try { return await getUserApi(id); } catch { return null; }
    },
    updateUser: async (id: Id, payload: UpdateUserDto) => {
      try { return await updateUserApi(id, payload); } catch { return null; }
    },
    removeUser: async (id: Id) => {
      try { await deleteUserApi(id); } catch {}
    },
    loadUserReviewsWritten: async (id: Id) => {
      try { return await listUserReviewsWritten(id); } catch { return null; }
    },
    loadUserReviewsReceived: async (id: Id) => {
      try { return await listUserReviewsReceived(id); } catch { return null; }
    },
  };
};
