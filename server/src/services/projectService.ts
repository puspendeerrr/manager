import { prisma } from '../utils/prisma';
import { CreateProjectDTO, TaskStatus } from '@sonam/shared';

export class ProjectService {
  async getProjects(userId: string) {
    const projects = await prisma.project.findMany({
      where: { userId },
      include: {
        tasks: {
          select: {
            id: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return projects.map((p: any) => {
      const totalTasks = p.tasks.length;
      const completedTasks = p.tasks.filter((t: any) => t.status === TaskStatus.COMPLETED).length;
      return {
        id: p.id,
        name: p.name,
        description: p.description,
        color: p.color,
        userId: p.userId,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
        totalTasks,
        completedTasks,
      };
    });
  }

  async getProjectById(projectId: string, userId: string) {
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId },
      include: {
        tasks: {
          include: {
            project: true,
          },
          orderBy: [
            { priority: 'desc' },
            { deadline: 'asc' },
          ],
        },
      },
    });

    if (!project) return null;

    const totalTasks = project.tasks.length;
    const completedTasks = project.tasks.filter((t: any) => t.status === TaskStatus.COMPLETED).length;

    return {
      ...project,
      totalTasks,
      completedTasks,
    };
  }

  async createProject(userId: string, data: CreateProjectDTO) {
    return prisma.project.create({
      data: {
        name: data.name,
        description: data.description,
        color: data.color || '#1890ff',
        userId,
      },
    });
  }

  async updateProject(projectId: string, userId: string, data: { name?: string; description?: string; color?: string }) {
    const project = await prisma.project.findFirst({ where: { id: projectId, userId } });
    if (!project) throw new Error('Project not found');

    return prisma.project.update({
      where: { id: projectId },
      data,
    });
  }

  async deleteProject(projectId: string, userId: string) {
    const project = await prisma.project.findFirst({ where: { id: projectId, userId } });
    if (!project) throw new Error('Project not found');

    return prisma.project.delete({
      where: { id: projectId },
    });
  }
}

export const projectService = new ProjectService();
