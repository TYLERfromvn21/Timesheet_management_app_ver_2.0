//frontend/src/services/department.service.ts
//this file contains functions to interact with the department related API endpoints
// and perform CRUD operations on departments.
import apiClient from './api.client';
import type { Department } from '../types/user.types';
import type { ApiResponse } from '../types/api.types';

export const departmentService = {
  // GET /departments/ -> retrieve all departments
  getAll: async (): Promise<Department[]> => {
    const response = await apiClient.get<Department[]>('/departments/');
    return response.data;
  },

  // POST /departments/add -> create a new department
  create: async (name: string, code?: string) => {
    const response = await apiClient.post<ApiResponse<Department>>('/departments/add', { name, code });
    return response.data;
  },

  // POST /departments/update -> update a department
  update: async (id: string, name: string) => {
    const response = await apiClient.post<ApiResponse<void>>('/departments/update', { id, name });
    return response.data;
  },

  // POST /departments/delete -> delete a department
  delete: async (id: string) => {
    const response = await apiClient.post<ApiResponse<void>>('/departments/delete', { id });
    return response.data;
  }
};