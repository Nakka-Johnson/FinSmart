import { create } from 'zustand';

interface AuthState {
  token: string | null;
  email: string | null;
  setAuth: (token: string, email: string) => void;
  clearAuth: () => void;
  isAuthenticated: () => boolean;
}

const TOKEN_KEY = 'finsmart_token';
const EMAIL_KEY = 'finsmart_email';

export const useAuthStore = create<AuthState>(set => ({
  token: sessionStorage.getItem(TOKEN_KEY),
  email: sessionStorage.getItem(EMAIL_KEY),

  setAuth: (token: string, email: string) => {
    sessionStorage.setItem(TOKEN_KEY, token);
    sessionStorage.setItem(EMAIL_KEY, email);
    set({ token, email });
  },

  clearAuth: () => {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(EMAIL_KEY);
    set({ token: null, email: null });
  },

  isAuthenticated: () => {
    const token = sessionStorage.getItem(TOKEN_KEY);
    return !!token;
  },
}));
