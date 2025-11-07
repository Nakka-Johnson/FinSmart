import { create } from 'zustand';
import { authApi } from '@/api/endpoints';
import type { UserResponse } from '@/api/types';

interface AuthState {
  token: string | null;
  user: UserResponse | null;
  setAuth: (token: string, user: UserResponse) => void;
  clearAuth: () => void;
  isAuthenticated: () => boolean;
  fetchUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: sessionStorage.getItem('token'),
  user: JSON.parse(sessionStorage.getItem('user') || 'null'),

  setAuth: (token: string, user: UserResponse) => {
    sessionStorage.setItem('token', token);
    sessionStorage.setItem('user', JSON.stringify(user));
    set({ token, user });
  },

  clearAuth: () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    set({ token: null, user: null });
  },

  isAuthenticated: () => {
    const state = get();
    return !!state.token && !!state.user;
  },

  fetchUser: async () => {
    const { token } = get();
    if (!token) return;

    try {
      const user = await authApi.me(token);
      sessionStorage.setItem('user', JSON.stringify(user));
      set({ user });
    } catch (error) {
      console.error('Failed to fetch user:', error);
      get().clearAuth();
    }
  },
}));
