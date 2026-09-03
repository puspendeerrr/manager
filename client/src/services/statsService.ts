import { apiClient } from './api';
import { SonamDashboardSummary } from '@sonam/shared';

export const statsService = {
  async getDashboardSummary(): Promise<SonamDashboardSummary> {
    return apiClient.get('/stats/dashboard-summary');
  },
};
