// frontend/src/store/userStore.ts
// this file uses Zustand for state management of users and departments
// and provides actions to fetch, add, update, and delete users.
import { create } from 'zustand';
import { userService } from '../services/user.service';
import { departmentService } from '../services/department.service';
import type { User, Department } from '../types/user.types';

interface UserState {
  users: User[];
  departments: Department[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchUsers: () => Promise<void>;
  fetchDepartments: () => Promise<void>;
  addUser: (userData: any) => Promise<void>;
  updateUser: (id: string, userData: any) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
}

export const useUserStore = create<UserState>((set, get) => ({
  users: [],
  departments: [],
  isLoading: false,
  error: null,

  // functions to fetch users
  fetchUsers: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await userService.getAll();
      set({ users: data || [], isLoading: false });
    } catch (err: any) {
      set({ isLoading: false, error: err.message || 'Lỗi tải danh sách user' });
    }
  },

  //function to fetch departments
  fetchDepartments: async () => {
    try {
      const data = await departmentService.getAll();
      set({ departments: data || [] });
    } catch (err) {
      console.error("Lỗi tải phòng ban", err);
    }
  },

  //function to add a new user
  addUser: async (userData) => {
    set({ isLoading: true, error: null });
    try {
      const res = await userService.create(userData);
      if (res.success) {
        // if user is returned, add to state
        if (res.user) {
          set((state) => ({ users: [...state.users, res.user!], isLoading: false }));
        } else {
          // Otherwise, just refetch the list
          await get().fetchUsers();
          set({ isLoading: false });
        }
      } else {
         throw new Error(res.message);
      }
    } catch (err: any) {
      set({ isLoading: false, error: err.message });
      throw err;
    }
  },

  //function to update a user
  updateUser: async (id, userData) => {
    set({ isLoading: true, error: null });
    try {
      await userService.update(id, userData);
      await get().fetchUsers(); // Reload list
      set({ isLoading: false });
    } catch (err: any) {
      set({ isLoading: false, error: err.message });
      throw err;
    }
  },

  //function to delete a user
  deleteUser: async (id) => {
    set({ isLoading: true });
    try {
      await userService.delete(id);
      set((state) => ({ 
        users: state.users.filter(u => u.id !== id),
        isLoading: false 
      }));
    } catch (err: any) {
      set({ isLoading: false, error: err.message });
      throw err;
    }
  }
}));