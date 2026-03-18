/**
 * WARZONE — Auth Store (Zustand)
 * Manages JWT, user profile, and auth state transitions.
 */

import { create } from 'zustand';

interface User {
  id: string;
  username: string;
  rank: string;
  totalWarPoints: string;
  favoriteArmyId?: string;
  army: { id: string; name: string; colorHex: string };
}

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  setAuth: (token: string, user: User) => void;
  setUser: (user: User) => void;
  logout: () => void;
  hydrate: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  isAuthenticated: false,

  setAuth: (token, user) => {
    localStorage.setItem('wz_token', token);
    set({ token, user, isAuthenticated: true });
  },

  setUser: (user) => {
    set({ user });
  },

  logout: () => {
    localStorage.removeItem('wz_token');
    set({ token: null, user: null, isAuthenticated: false });
  },

  hydrate: () => {
    const token = localStorage.getItem('wz_token');
    if (token) {
      set({ token, isAuthenticated: true });
    }
  },
}));
