// frontend/src/store/authStore.ts
// This file defines a Zustand store for managing authentication state
import { create } from 'zustand';

import type { User } from '../types/user.types'; 
import { authService } from '../services/auth.service';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  isLoading: false,

  login: async (username, password) => {
    set({ isLoading: true });
    try {
        const response = await authService.login(username, password);
        
        localStorage.setItem('token', response.token);
        
        set({ user: response.user, token: response.token, isLoading: false });
    } catch (error) {
        set({ isLoading: false });
        console.error("Login error:", error);
        throw error; 
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null });
  },
}));