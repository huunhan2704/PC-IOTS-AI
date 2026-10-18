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
    }),
    {
      name: 'linhkien-auth',
    }
  )
);
