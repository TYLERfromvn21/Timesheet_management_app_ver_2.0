//frontend/src/types/api.types.ts
//this file contains types related to API responses
// api response type with generic data
export interface ApiResponse<T> {
  success?: boolean;
  message?: string;
  data?: T;
  error?: string;
}