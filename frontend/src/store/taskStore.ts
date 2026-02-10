//frontend/src/store/taskStore.ts
// this file is used to manage task-related state such as task list, job codes, selected date, loading status, etc.
import { create } from 'zustand';
import { taskService } from '../services/task.service';
import { jobCodeService } from '../services/jobCode.service';
import type { Task, JobCode, CreateTaskPayload } from '../types/task.types';

//interface defining the shape of the task store state
interface TaskState {
  tasks: Task[];
  jobCodes: JobCode[];
  selectedDate: Date;
  isLoading: boolean;
  
  // Actions
  setDate: (date: Date) => void;
  fetchTasks: (userId: string) => Promise<void>;
  fetchJobCodes: (deptId: string) => Promise<void>;
  saveTask: (payload: CreateTaskPayload) => Promise<void>;
  deleteTask: (taskId: string, userId: string) => Promise<void>;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  jobCodes: [],
  selectedDate: new Date(),
  isLoading: false,

  //function to set the selected date
  setDate: (date) => set({ selectedDate: date }),

  //function to fetch tasks for a given user and selected date
  fetchTasks: async (userId) => {
    set({ isLoading: true });
    try {
      const dateStr = get().selectedDate.toISOString().split('T')[0];
      const data = await taskService.getByDate(dateStr, userId);
      set({ tasks: data || [], isLoading: false });
    } catch (err) {
      set({ isLoading: false });
      console.error(err);
    }
  },

  //function to fetch job codes for a given department
  fetchJobCodes: async (deptId) => {
    try {
      const data = await jobCodeService.getByDept(deptId);
      set({ jobCodes: data || [] });
    } catch (err) {
      console.error(err);
    }
  },

  //function to save a new task
  saveTask: async (payload) => {
    set({ isLoading: true });
    try {
      await taskService.save(payload);
      await get().fetchTasks(payload.userId);
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  //function to delete a task by its ID
  deleteTask: async (taskId, userId) => {
    try {
      await taskService.delete(taskId, userId);
      set((state) => ({
        tasks: state.tasks.filter(t => t.task_id !== taskId)
      }));
    } catch (err) {
      throw err;
    }
  }
}));