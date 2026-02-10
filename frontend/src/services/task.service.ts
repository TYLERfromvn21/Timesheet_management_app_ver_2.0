//frontend/src/services/task.service.ts
// this file is used to interact with the backend API for task-related operations
// and perform CRUD actions on task data
import apiClient from './api.client';
import type { Task, CreateTaskPayload } from '../types/task.types';
import type { ApiResponse } from '../types/api.types';

export const taskService = {
  // GET /tasks/:date?userId -> returns Task[]
  getByDate: async (dateStr: string, userId: string): Promise<Task[]> => {
    const response = await apiClient.get<Task[]>(`/tasks/${dateStr}`, {
      params: { userId }
    });
    return response.data;
  },

  // POST /tasks/save -> returns { message }
  save: async (payload: CreateTaskPayload) => {
    const response = await apiClient.post<ApiResponse<void>>('/tasks/save', payload);
    return response.data;
  },

  // POST /tasks/delete -> returns { message }
  delete: async (taskId: string, userId: string) => {
    const response = await apiClient.post<ApiResponse<void>>('/tasks/delete', { task_id: taskId, userId });
    return response.data;
  }
};