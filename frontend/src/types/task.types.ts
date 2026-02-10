// frontend/src/types/task.types.ts
// this file defines TypeScript interfaces for task-related data structures
// and is used across the frontend application for type safety and consistency
export interface JobCode {
  id: string;
  department: string;
  job_code: string;
  task_description: string;
}

// Interface for Task entity
export interface Task {
  id: string;
  task_id: string;       
  department: string;
  job_code: string;
  task_description: string;
  start_time: string;     
  end_time: string;       
  date: string;          
  userId?: string;
}

//interface for creating or updating a Task
export interface CreateTaskPayload {
  taskId?: string;
  department: string;
  jobCode: string;
  taskDescription: string;
  startTime: Date;
  endTime: Date;
  date: Date;
  userId: string;
}