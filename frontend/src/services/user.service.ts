//frontend/src/services/user.service.ts
// this file is used to interact with the backend API for user-related operations
// and perform CRUD actions on user data
import apiClient from './api.client';
import type { User } from '../types/user.types';
import type { ApiResponse } from '../types/api.types';

//initialize the response type for creating a user
interface CreateUserResponse extends ApiResponse<User> {
  user?: User; 
}

export const userService = {
  // fetch all users returning a promise that resolves to an array of User objects
  getAll: async (): Promise<User[]> => {
    const response = await apiClient.get<User[]>('/users/all');
    return response.data;
  },

  // POST /users/create -> returns { message, user }
  create: async (userData: Partial<User> & { password?: string, type?: string }) => {
    const response = await apiClient.post<CreateUserResponse>('/users/create', userData);
    return response.data;
  },

  // POST /users/update -> returns { message }
  update: async (id: string, userData: Partial<User>) => {
    const response = await apiClient.post<ApiResponse<void>>('/users/update', { id, ...userData });
    return response.data;
  },

  // POST /users/delete -> returns { message }
  delete: async (id: string) => {
    const response = await apiClient.post<ApiResponse<void>>('/users/delete', { id });
    return response.data;
  }
};