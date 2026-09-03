import { apiClient } from './api';
import { User, UpdateSettingsDTO } from '@sonam/shared';

export const settingsService = {
  async getUserSettings(): Promise<User> {
    return apiClient.get('/settings');
  },

  async updateUserSettings(dto: UpdateSettingsDTO): Promise<User> {
    return apiClient.patch('/settings', dto);
  },
};
