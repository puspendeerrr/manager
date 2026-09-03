import { Request, Response } from 'express';
import { notificationService } from '../services/notificationService';
import { sendSuccess, sendError } from '../utils/response';

const DEFAULT_USER_ID = process.env.DEFAULT_USER_ID || 'user_dev_01';

export async function handleGetNotifications(req: Request, res: Response) {
  try {
    const status = req.query.status as any;
    const list = await notificationService.getNotifications(DEFAULT_USER_ID, status);
    return sendSuccess(res, list);
  } catch (err: any) {
    return sendError(res, err.message || 'Failed to fetch notifications');
  }
}

export async function handleSubscribePush(req: Request, res: Response) {
  try {
    const subscription = req.body;
    const result = await notificationService.saveSubscription(DEFAULT_USER_ID, subscription);
    return sendSuccess(res, result);
  } catch (err: any) {
    return sendError(res, err.message || 'Failed to subscribe to Web Push');
  }
}

export async function handleMarkNotificationRead(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const updated = await notificationService.markRead(id, DEFAULT_USER_ID);
    return sendSuccess(res, updated);
  } catch (err: any) {
    return sendError(res, err.message || 'Failed to mark notification read');
  }
}

export async function handleDismissNotification(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const updated = await notificationService.dismiss(id, DEFAULT_USER_ID);
    return sendSuccess(res, updated);
  } catch (err: any) {
    return sendError(res, err.message || 'Failed to dismiss notification');
  }
}
