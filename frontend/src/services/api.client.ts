//frontend/src/services/api.client.ts
//this file sets up the Axios instance to interact with the backend API
//includes backup server mechanism with automatic fallback to Koyeb
import axios from 'axios';

// declare primary and backup server URLs
const SERVER_RENDER = 'https://timesheet-management-app-7iqb.onrender.com/api';
const SERVER_KOYEB = 'https://tvac-api.koyeb.app/api';
const envURL = import.meta.env.VITE_API_URL;

// use environment variable if available, otherwise use Render as primary
const baseURL = envURL || SERVER_RENDER;

console.log(' API Base URL đang dùng:', baseURL); 

const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 8000, // 8 second timeout for Render server
});

// add interceptors for request and response
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// catch 401 errors globally and implement backup server fallback
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // if 401 error, remove token and redirect to login
    if (error.response?.status === 401) {
      console.warn("Token hết hạn hoặc không hợp lệ. Đang đăng xuất...");
      localStorage.removeItem('token');
      localStorage.removeItem('tempAuth');
      
      // redirect to login page if not already there
      if (window.location.pathname !== '/login' && window.location.pathname !== '/admin-auth') {
         window.location.href = '/login';
      }
      return Promise.reject(error);
    }

    // if timeout or network error, try fallback to Koyeb server
    if ((error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK' || !error.response) && !originalRequest._retry) {
      console.warn('Render server is down or sleeping! Switching to Koyeb backup...');
      originalRequest._retry = true;

      // replace baseURL with Koyeb and retry the request
      originalRequest.baseURL = SERVER_KOYEB;
      return axios(originalRequest);
    }

    return Promise.reject(error);
  }
);

export default apiClient;