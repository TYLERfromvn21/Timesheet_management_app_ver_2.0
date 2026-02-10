// frontend/src/store/authStore.ts
// this file is used to manage authentication state using Zustand
// and includes fixes for AdminLoginForm and AdminCreatePage issues
import { create } from 'zustand';
import { AuthService } from '../services/auth.service';
import type { User } from '../types/user.types';

// initial state and actions for authentication
interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean; 

  // Actions
  login: (username: string, pass: string) => Promise<void>;
  adminLogin: (username: string, pass: string) => Promise<void>; 
  logout: () => void;
  checkAuth: () => Promise<void>; 
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  isLoading: false,

  // functions to handle authentication
  login: async (username, pass) => {
    set({ isLoading: true });
    try {
      const { user, token } = await AuthService.login(username, pass);
      localStorage.setItem('token', token);
      set({ user, token, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  // function specifically for admin login during setup flow
  adminLogin: async (username, pass) => {
    set({ isLoading: true });
    try {
      const { user, token } = await AuthService.adminLogin(username, pass);
      localStorage.setItem('token', token);
      localStorage.setItem('tempAuth', 'true'); // flag for setup flow
      set({ user, token, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  // function to handle logout
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('tempAuth');
    set({ user: null, token: null, isAuthenticated: false });
  },

  // function to check authentication status
  checkAuth: async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const user = await AuthService.getProfile();
      set({ user, isAuthenticated: true });
    } catch (error) {
      localStorage.removeItem('token');
      set({ user: null, token: null, isAuthenticated: false });
    }
  }
}));