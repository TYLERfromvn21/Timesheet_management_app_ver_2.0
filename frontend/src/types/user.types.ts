// frontend/src/types/user.types.ts
// this file defines types related to user and authentication

export type UserRole = 'admin_total' | 'admin_dept' | 'user';

// interface for Department object
export interface Department {
  id: string;
  name: string;
  code: string;
}

//interface for User object
export interface User {
  id: string;
  username: string;
  role: UserRole;
  department?: Department | string | null; // can be object, id string, or null
  departmentId?: string;
}

//interface for Login Response
export interface LoginResponse {
  user: User;
  token: string;
}