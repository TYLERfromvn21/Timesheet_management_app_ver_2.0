//frontend/src/services/jobCode.service.ts
//this file contains functions to interact with the job code related API endpoints
// and perform CRUD operations on job codes.
import apiClient from './api.client';
import type { JobCode } from '../types/task.types';
import type { ApiResponse } from '../types/api.types';

export const jobCodeService = {
  // GET /jobs/:dept -> retrieve job codes by department ID
  getByDept: async (deptId: string): Promise<JobCode[]> => {
    // if no deptId is provided, return an empty array
    if (!deptId) return [];
    const response = await apiClient.get<JobCode[]>(`/job-codes/${deptId}`);
    return response.data;
  },

  // POST /jobs/save -> create a new job code
  create: async (data: { department: string, job_code: string, task_description: string }) => {
    const response = await apiClient.post<ApiResponse<JobCode>>('/job-codes/save', data);
    return response.data;
  },
 
  // POST /jobs/delete -> delete a job code by ID
  delete: async (jobId: string) => {
    const response = await apiClient.post<ApiResponse<void>>('/job-codes/delete', { job_id: jobId });
    return response.data;
  }
};