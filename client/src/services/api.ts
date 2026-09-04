import axios from 'axios';
import { ApiResponse } from '@sonam/shared';

const getApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (!envUrl) return '/api';
  
  let clean = envUrl.trim().replace(/\/+$/, '');
  if (clean.startsWith('http') && !clean.endsWith('/api')) {
    clean = `${clean}/api`;
  }
  return clean;
};

export const apiClient = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
  timeout: 30000, // 30s timeout to allow Render free tier wake up
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('sonam_auth_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    // Return inner envelope data if standard API response format
    const resData: ApiResponse = response.data;
    if (resData && typeof resData.success === 'boolean') {
      if (!resData.success) {
        return Promise.reject(new Error(resData.error?.message || 'API request failed'));
      }
      return resData.data;
    }
    return response.data;
  },
  (error) => {
    let message = error.response?.data?.error?.message || error.message || 'An unexpected network error occurred';
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout') || error.response?.status === 502 || error.response?.status === 503) {
      message = 'Sonam server is waking up (Render free instance). Please retry in a few seconds.';
    }
    return Promise.reject(new Error(message));
  }
);
