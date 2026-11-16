import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UserDto } from '@/types';

interface AuthState {
  token: string | null;
  user: UserDto | null;
  login: (token: string, user: UserDto) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
  isAdmin: () => boolean;
  isWarehouse: () => boolean;
  isTechnician: () => boolean;
  canAccessAdminPanel: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      login: (token, user) => set({ token, user }),
      logout: () => set({ token: null, user: null }),
      isAuthenticated: () => !!get().token,
      isAdmin: () => get().user?.role === 'ROLE_ADMIN',
      isWarehouse: () => get().user?.role === 'ROLE_WAREHOUSE',
      isTechnician: () => get().user?.role === 'ROLE_TECHNICIAN',
      canAccessAdminPanel: () =>
        ['ROLE_ADMIN', 'ROLE_WAREHOUSE', 'ROLE_TECHNICIAN'].includes(get().user?.role || ''),
    }),
    {
      name: 'linhkien-auth',
    }
  )
);
