import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Role, LoginResponse } from '@/types';

/** The user shape stored in auth — matches the login response (subset of User) */
type AuthUser = LoginResponse['user'];

interface AuthStore {
  user: AuthUser | null;
  token: string | null;
  setAuth: (user: AuthUser, token: string) => void;
  clearAuth: () => void;
  isRole: (...roles: Role[]) => boolean;
  isAdmin: () => boolean;
  isFaculty: () => boolean;
  isStudent: () => boolean;
  isDeveloper: () => boolean;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,

      setAuth: (user, token) => {
        sessionStorage.setItem('ums_token', token);
        set({ user, token });
      },

      clearAuth: () => {
        sessionStorage.removeItem('ums_token');
        set({ user: null, token: null });
      },

      isRole: (...roles) => {
        const { user } = get();
        return !!user && roles.includes(user.role);
      },

      isAdmin: () => get().isRole('ADMIN', 'DEVELOPER'),
      isFaculty: () => get().isRole('FACULTY'),
      isStudent: () => get().isRole('STUDENT'),
      isDeveloper: () => get().isRole('DEVELOPER'),
    }),
    {
      name: 'ums-auth',
      partialize: (state) => ({ user: state.user, token: state.token }),
    }
  )
);
