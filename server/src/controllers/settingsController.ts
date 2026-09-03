import { Request, Response, NextFunction } from 'express';
import { settingsService } from '../services/settingsService';
import { sendSuccess } from '../utils/response';

const DEFAULT_USER_ID = process.env.DEFAULT_USER_ID || 'user_dev_01';

export async function getUserSettings(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req.headers['x-user-id'] as string) || DEFAULT_USER_ID;
    const settings = await settingsService.getUserSettings(userId);
    return sendSuccess(res, settings);
  } catch (err) {
    return next(err);
  }
}

export async function updateUserSettings(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req.headers['x-user-id'] as string) || DEFAULT_USER_ID;
    const settings = await settingsService.updateUserSettings(userId, req.body);
    return sendSuccess(res, settings);
  } catch (err) {
    return next(err);
  }
}
