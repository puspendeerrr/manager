import { Request, Response, NextFunction } from 'express';
import { statsService } from '../services/statsService';
import { sendSuccess } from '../utils/response';

const DEFAULT_USER_ID = process.env.DEFAULT_USER_ID || 'user_dev_01';

export async function getDashboardSummary(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req.headers['x-user-id'] as string) || DEFAULT_USER_ID;
    const summary = await statsService.getDashboardSummary(userId);
    return sendSuccess(res, summary);
  } catch (err) {
    return next(err);
  }
}
