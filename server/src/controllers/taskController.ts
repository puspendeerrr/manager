import { Response, NextFunction } from 'express';
import { taskService } from '../services/taskService';
import { sendSuccess, sendError } from '../utils/response';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

function getUserId(req: AuthenticatedRequest): string {
  if (req.user && req.user.id) {
    return req.user.id;
  }
  const headerId = req.headers['x-user-id'] as string;
  if (headerId) return headerId;
  return 'user_dev_01';
}

export async function getTasks(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const userId = getUserId(req);
    const { status, priority, projectId, search } = req.query;

    const tasks = await taskService.getTasks(userId, {
      status: status as any,
      priority: priority as any,
      projectId: projectId as string,
      search: search as string,
    });

    return sendSuccess(res, tasks);
  } catch (err) {
    return next(err);
  }
}

export async function getTaskById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const userId = getUserId(req);
    const { id } = req.params;

    const task = await taskService.getTaskById(id, userId);
    if (!task) {
      return sendError(res, 'Task not found or access denied', 404, 'NOT_FOUND');
    }

    return sendSuccess(res, task);
  } catch (err) {
    return next(err);
  }
}

export async function createTask(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const userId = getUserId(req);
    const task = await taskService.createTask(userId, req.body);
    return sendSuccess(res, task, 201);
  } catch (err) {
    return next(err);
  }
}

export async function updateTask(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const userId = getUserId(req);
    const { id } = req.params;

    const task = await taskService.updateTask(id, userId, req.body);
    return sendSuccess(res, task);
  } catch (err) {
    return next(err);
  }
}

export async function deleteTask(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const userId = getUserId(req);
    const { id } = req.params;

    await taskService.deleteTask(id, userId);
    return sendSuccess(res, { message: 'Task deleted successfully' });
  } catch (err) {
    return next(err);
  }
}

export async function completeTask(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const userId = getUserId(req);
    const { id } = req.params;

    const task = await taskService.completeTask(id, userId);
    return sendSuccess(res, task);
  } catch (err) {
    return next(err);
  }
}

export async function snoozeTask(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const userId = getUserId(req);
    const { id } = req.params;

    const task = await taskService.snoozeTask(id, userId, req.body);
    return sendSuccess(res, task);
  } catch (err) {
    return next(err);
  }
}

export async function rescheduleTask(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const userId = getUserId(req);
    const { id } = req.params;

    const task = await taskService.rescheduleTask(id, userId, req.body);
    return sendSuccess(res, task);
  } catch (err) {
    return next(err);
  }
}
