import { Request, Response, NextFunction } from 'express';
import { taskService } from '../services/taskService';
import { sendSuccess, sendError } from '../utils/response';

const DEFAULT_USER_ID = process.env.DEFAULT_USER_ID || 'user_dev_01';

export async function getTasks(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req.headers['x-user-id'] as string) || DEFAULT_USER_ID;
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

export async function getTaskById(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req.headers['x-user-id'] as string) || DEFAULT_USER_ID;
    const { id } = req.params;

    const task = await taskService.getTaskById(id, userId);
    if (!task) {
      return sendError(res, 'Task not found', 404, 'NOT_FOUND');
    }

    return sendSuccess(res, task);
  } catch (err) {
    return next(err);
  }
}

export async function createTask(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req.headers['x-user-id'] as string) || DEFAULT_USER_ID;
    const task = await taskService.createTask(userId, req.body);
    return sendSuccess(res, task, 201);
  } catch (err) {
    return next(err);
  }
}

export async function updateTask(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req.headers['x-user-id'] as string) || DEFAULT_USER_ID;
    const { id } = req.params;

    const task = await taskService.updateTask(id, userId, req.body);
    return sendSuccess(res, task);
  } catch (err) {
    return next(err);
  }
}

export async function deleteTask(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req.headers['x-user-id'] as string) || DEFAULT_USER_ID;
    const { id } = req.params;

    await taskService.deleteTask(id, userId);
    return sendSuccess(res, { message: 'Task deleted successfully' });
  } catch (err) {
    return next(err);
  }
}

export async function completeTask(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req.headers['x-user-id'] as string) || DEFAULT_USER_ID;
    const { id } = req.params;

    const task = await taskService.completeTask(id, userId);
    return sendSuccess(res, task);
  } catch (err) {
    return next(err);
  }
}

export async function snoozeTask(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req.headers['x-user-id'] as string) || DEFAULT_USER_ID;
    const { id } = req.params;

    const task = await taskService.snoozeTask(id, userId, req.body);
    return sendSuccess(res, task);
  } catch (err) {
    return next(err);
  }
}

export async function rescheduleTask(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req.headers['x-user-id'] as string) || DEFAULT_USER_ID;
    const { id } = req.params;

    const task = await taskService.rescheduleTask(id, userId, req.body);
    return sendSuccess(res, task);
  } catch (err) {
    return next(err);
  }
}
