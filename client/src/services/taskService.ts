import { apiClient } from './api';
import {
  Task,
  CreateTaskDTO,
  UpdateTaskDTO,
  SnoozeTaskDTO,
  RescheduleTaskDTO,
  TaskStatus,
  TaskPriority,
} from '@sonam/shared';

export interface TaskFilters {
  status?: TaskStatus;
  priority?: TaskPriority;
  projectId?: string;
  search?: string;
}

export const taskService = {
  async getTasks(filters?: TaskFilters): Promise<Task[]> {
    return apiClient.get('/tasks', { params: filters });
  },

  async getTaskById(id: string): Promise<Task> {
    return apiClient.get(`/tasks/${id}`);
  },

  async createTask(dto: CreateTaskDTO): Promise<Task> {
    return apiClient.post('/tasks', dto);
  },

  async updateTask(id: string, dto: UpdateTaskDTO): Promise<Task> {
    return apiClient.patch(`/tasks/${id}`, dto);
  },

  async deleteTask(id: string): Promise<{ message: string }> {
    return apiClient.delete(`/tasks/${id}`);
  },

  async completeTask(id: string): Promise<Task> {
    return apiClient.post(`/tasks/${id}/complete`);
  },

  async snoozeTask(id: string, dto: SnoozeTaskDTO): Promise<Task> {
    return apiClient.post(`/tasks/${id}/snooze`, dto);
  },

  async rescheduleTask(id: string, dto: RescheduleTaskDTO): Promise<Task> {
    return apiClient.post(`/tasks/${id}/reschedule`, dto);
  },
};
