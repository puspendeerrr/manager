import { Request, Response, NextFunction } from 'express';
import { projectService } from '../services/projectService';
import { sendSuccess, sendError } from '../utils/response';

const DEFAULT_USER_ID = process.env.DEFAULT_USER_ID || 'user_dev_01';

export async function getProjects(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req.headers['x-user-id'] as string) || DEFAULT_USER_ID;
    const projects = await projectService.getProjects(userId);
    return sendSuccess(res, projects);
  } catch (err) {
    return next(err);
  }
}

export async function getProjectById(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req.headers['x-user-id'] as string) || DEFAULT_USER_ID;
    const { id } = req.params;

    const project = await projectService.getProjectById(id, userId);
    if (!project) {
      return sendError(res, 'Project not found', 404, 'NOT_FOUND');
    }

    return sendSuccess(res, project);
  } catch (err) {
    return next(err);
  }
}

export async function createProject(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req.headers['x-user-id'] as string) || DEFAULT_USER_ID;
    const project = await projectService.createProject(userId, req.body);
    return sendSuccess(res, project, 201);
  } catch (err) {
    return next(err);
  }
}

export async function updateProject(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req.headers['x-user-id'] as string) || DEFAULT_USER_ID;
    const { id } = req.params;

    const project = await projectService.updateProject(id, userId, req.body);
    return sendSuccess(res, project);
  } catch (err) {
    return next(err);
  }
}

export async function deleteProject(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req.headers['x-user-id'] as string) || DEFAULT_USER_ID;
    const { id } = req.params;

    await projectService.deleteProject(id, userId);
    return sendSuccess(res, { message: 'Project deleted successfully' });
  } catch (err) {
    return next(err);
  }
}
