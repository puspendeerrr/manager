import { apiClient } from './api';
import { Project, CreateProjectDTO } from '@sonam/shared';

export const projectService = {
  async getProjects(): Promise<Project[]> {
    return apiClient.get('/projects');
  },

  async getProjectById(id: string): Promise<Project> {
    return apiClient.get(`/projects/${id}`);
  },

  async createProject(dto: CreateProjectDTO): Promise<Project> {
    return apiClient.post('/projects', dto);
  },

  async updateProject(id: string, data: Partial<CreateProjectDTO>): Promise<Project> {
    return apiClient.patch(`/projects/${id}`, data);
  },

  async deleteProject(id: string): Promise<{ message: string }> {
    return apiClient.delete(`/projects/${id}`);
  },
};
