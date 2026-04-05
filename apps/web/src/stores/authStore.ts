/**
 * WARZONE — Auth Store (Zustand)
 * Manages JWT, user profile, and auth state transitions.
 * Persists token AND user data in localStorage for session survival.
 */

import { create } from 'zustand';

interface User {
  id: string;
  username: string;
  rank: string;
  totalWarPoints: string;
  favoriteArmyId?: string;
  army: { id: string; name: string; colorHex: string };
  // Extended rank info (populated from profile endpoint)
  rank?: {
    level: number;
    shortCode: string;
    color: string;
    icon: string;
  };
  profilePictureUrl?: string | null;
  bio?: string | null;
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
    localStorage.setItem('wz_user', JSON.stringify(user));
    set({ token, user, isAuthenticated: true });
  },

  setUser: (user) => {
    localStorage.setItem('wz_user', JSON.stringify(user));
    set({ user });
  },

  logout: () => {
    localStorage.removeItem('wz_token');
    localStorage.removeItem('wz_user');
    set({ token: null, user: null, isAuthenticated: false });
  },

  hydrate: () => {
    const token = localStorage.getItem('wz_token');
    const userStr = localStorage.getItem('wz_user');
    if (token) {
      let user = null;
      try { user = userStr ? JSON.parse(userStr) : null; } catch {}
      set({ token, user, isAuthenticated: true });
    }
  },
}));
