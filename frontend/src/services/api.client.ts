//frontend/src/services/api.client.ts
//this file sets up the Axios instance to interact with the backend API
import axios from 'axios';

// create an Axios instance
const envURL = import.meta.env.VITE_API_URL;
const baseURL = envURL || 'http://localhost:3000/api';

console.log('🔌 API Base URL đang dùng:', baseURL); 

const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
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

// catch 401 errors globally
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // if 401 error, remove token and redirect to login
    if (error.response?.status === 401) {
      console.warn("⚠️ Token hết hạn hoặc không hợp lệ. Đang đăng xuất...");
      localStorage.removeItem('token');
      localStorage.removeItem('tempAuth');
      
      // redirect to login page if not already there
      if (window.location.pathname !== '/login' && window.location.pathname !== '/admin-auth') {
         window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;