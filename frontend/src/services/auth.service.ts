// frontend/src/services/auth.service.ts
// This file contains authentication-related services
import type { LoginResponse } from '../types/user.types';


const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const authService = {
  //function to handle user login
  login: async (username: string, password: string): Promise<LoginResponse> => {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      throw new Error('Login failed');
    }

    return response.json();
  },
};