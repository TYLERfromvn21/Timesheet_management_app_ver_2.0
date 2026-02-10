//frontend/src/services/auth.service.ts
//this file contains functions to interact with the authentication related API endpoints
// such as login, admin login, and fetching user profile.
import apiClient from './api.client';
import type { LoginResponse, User } from '../types/user.types';
import type { ApiResponse } from '../types/api.types';

export const AuthService = {
  // 1. Login Function
  login: async (username: string, pass: string): Promise<LoginResponse> => {
    try {
      console.log("🚀 Đang gửi API Login:", { username, pass });
      
      const response = await apiClient.post<ApiResponse<LoginResponse>>('/auth/login', { 
        username, 
        password: pass 
      });

      console.log("✅ Server phản hồi:", response.data);

      // Backend returns data in a nested structure
      if (response.data && response.data.data) {
          return response.data.data; 
      } else {
          console.error("❌ Cấu trúc data sai:", response.data);
          throw new Error('Dữ liệu phản hồi từ server không hợp lệ');
      }
    } catch (error: any) {
      console.error("❌ Lỗi API Login:", error);
      throw error.response?.data?.message || error.message || "Lỗi kết nối Server";
    }
  },

  // 2. Admin Login
  adminLogin: async (username: string, pass: string): Promise<LoginResponse> => {
    try {
      const response = await apiClient.post<ApiResponse<LoginResponse>>('/auth/admin-login', { 
        username, 
        password: pass 
      });
      
      if (response.data && response.data.data) {
          return response.data.data;
      }
      throw new Error('Không nhận được dữ liệu Admin');
    } catch (error: any) {
      throw error.response?.data?.error || "Lỗi đăng nhập Admin";
    }
  },

  // 3. Get Profile
  getProfile: async (): Promise<User> => {
    const { data } = await apiClient.get<User>('/auth/me');
    return data;
  }
};