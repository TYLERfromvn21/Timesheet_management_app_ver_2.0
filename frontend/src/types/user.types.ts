// frontend/src/types/user.types.ts
// this file defines types related to user and authentication
export interface User {
  id: string;
  username: string;
  role: 'admin_total' | 'admin_dept' | 'user';
  department?: string;
}

export interface LoginResponse {
  user: User;
  token: string;
}