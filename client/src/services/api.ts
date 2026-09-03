import axios from 'axios';
import { ApiResponse } from '@sonam/shared';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'x-user-id': 'user_dev_01', // Default dev user
  },
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
    const message =
      error.response?.data?.error?.message || error.message || 'An unexpected network error occurred';
    return Promise.reject(new Error(message));
  }
);
