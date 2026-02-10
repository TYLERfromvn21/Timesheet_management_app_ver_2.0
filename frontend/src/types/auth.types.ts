//frontend/src/types/auth.types.ts
//this file contains types related to authentication state
// and user information
import type { User } from './user.types';

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}