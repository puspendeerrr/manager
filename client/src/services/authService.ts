import { apiClient } from './api';

export interface User {
  id: string;
  username: string;
  name?: string;
}

export const authService = {
  async signup(data: { username?: string; password?: string; confirmPassword?: string }) {
    const res: any = await apiClient.post('/auth/signup', data);
    if (res && res.token) {
      localStorage.setItem('sonam_auth_token', res.token);
    }
    return res;
  },

  async login(data: { username?: string; password?: string }) {
    const res: any = await apiClient.post('/auth/login', data);
    if (res && res.token) {
      localStorage.setItem('sonam_auth_token', res.token);
    }
    return res;
  },

  async logout() {
    try {
      await apiClient.post('/auth/logout');
    } catch (err) {
      // Ignore network errors on logout
    } finally {
      localStorage.removeItem('sonam_auth_token');
    }
  },

  async getMe() {
    const res: any = await apiClient.get('/auth/me');
    return res.user as User;
  },
};
