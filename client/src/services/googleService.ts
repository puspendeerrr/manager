import { apiClient } from './api';
import { GoogleOAuthStatus } from '@sonam/shared';

export const googleService = {
  async getStatus(): Promise<GoogleOAuthStatus> {
    return apiClient.get('/google/status');
  },

  async getAuthUrl(): Promise<{ authUrl: string }> {
    return apiClient.get('/google/auth-url');
  },

  async disconnect(): Promise<{ message: string }> {
    return apiClient.post('/google/disconnect');
  },
};
