/**
 * Auth Store - Syncs with better-auth session state
 * 
 * SECURITY: No token storage in Zustand/localStorage
 * Authentication state is derived from better-auth useSession hook
 * This store only caches the session state for convenient access
 */

import { create } from 'zustand';

interface User {
  id: string;
  email: string;
  name?: string;
  image?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setSession: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  setSession: (user) => set({ 
    user, 
    isAuthenticated: !!user,
    isLoading: false,
  }),
  setLoading: (loading) => set({ isLoading: loading }),
  clearSession: () => set({ 
    user: null, 
    isAuthenticated: false,
    isLoading: false,
  }),
}));
